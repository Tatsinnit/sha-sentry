const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs').promises;
const { glob } = require('glob');
const yaml = require('yaml');

class ShaSentry {
  constructor() {
    this.token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    this.excludePatterns = (core.getInput('exclude_patterns') || process.env.EXCLUDE_PATTERNS || '')
      .split(',')
      .map(pattern => pattern.trim())
      .filter(pattern => pattern.length > 0);
    
    this.octokit = github.getOctokit(this.token);
    this.context = github.context;
    
    this.findings = [];
    this.stats = {
      filesScanned: 0,
      unpinnedActionsFound: 0,
      totalActions: 0
    };
  }

  async run() {
    try {
      core.info('🔍 Starting SHA Sentry - scanning for unpinned actions...');
      
      const workflowFiles = await this.findWorkflowFiles();
      core.info(`📁 Found ${workflowFiles.length} workflow files to scan`);
      
      for (const file of workflowFiles) {
        await this.scanWorkflowFile(file);
        this.stats.filesScanned++;
      }
      
      await this.generateReport();
      this.setOutputs();
      
    } catch (error) {
      core.setFailed(`SHA Sentry failed: ${error.message}`);
    }
  }

  async findWorkflowFiles() {
    try {
      // Find all YAML files in .github/workflows and other common locations
      const patterns = [
        '.github/workflows/*.yml',
        '.github/workflows/*.yaml',
        'action.yml',
        'action.yaml'
      ];
      
      let allFiles = [];
      for (const pattern of patterns) {
        const files = await glob(pattern, { 
          dot: true,
          absolute: true 
        });
        allFiles = allFiles.concat(files);
      }
      
      // Filter out excluded patterns
      const filteredFiles = allFiles.filter(file => {
        return !this.excludePatterns.some(pattern => {
          const relativePath = file.replace(process.cwd() + '/', '');
          return relativePath.includes(pattern);
        });
      });
      
      return filteredFiles;
    } catch (error) {
      core.warning(`Error finding workflow files: ${error.message}`);
      return [];
    }
  }

  async scanWorkflowFile(filePath) {
    try {
      core.info(`🔍 Scanning: ${filePath.replace(process.cwd() + '/', '')}`);
      
      const content = await fs.readFile(filePath, 'utf8');
      const doc = yaml.parseDocument(content);
      
      // Track line numbers for better reporting
      const lines = content.split('\n');
      const fileFindings = [];
      
      // Find all 'uses' statements in the YAML
      await this.findUsesStatements(doc.contents, lines, filePath, fileFindings);
      
      if (fileFindings.length > 0) {
        this.findings.push({
          file: filePath.replace(process.cwd() + '/', ''),
          actions: fileFindings
        });
      }
      
    } catch (error) {
      core.warning(`Error processing ${filePath}: ${error.message}`);
    }
  }

  async findUsesStatements(node, lines, filePath, findings, path = []) {
    if (!node) return;
    
    if (typeof node === 'object') {
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          await this.findUsesStatements(node[i], lines, filePath, findings, [...path, i]);
        }
      } else {
        for (const key of Object.keys(node)) {
          if (key === 'uses' && typeof node[key] === 'string') {
            await this.processUsesStatement(node[key], lines, filePath, findings, path);
            this.stats.totalActions++;
          } else {
            await this.findUsesStatements(node[key], lines, filePath, findings, [...path, key]);
          }
        }
      }
    }
  }

  async processUsesStatement(actionRef, lines, filePath, findings, path) {
    try {
      if (this.shouldSkipAction(actionRef)) {
        return;
      }
      
      if (this.isAlreadyPinned(actionRef)) {
        core.info(`✅ Already pinned: ${actionRef}`);
        return;
      }
      
      core.info(`🔍 Found unpinned action: ${actionRef}`);
      
      // Resolve the action to its SHA
      const sha = await this.resolveActionToSha(actionRef);
      if (sha) {
        findings.push({
          current: actionRef,
          recommended: `${actionRef.split('@')[0]}@${sha}`,
          sha: sha,
          line: this.findLineNumber(lines, actionRef),
          path: path.join(' → ')
        });
        this.stats.unpinnedActionsFound++;
        core.info(`🎯 Resolved to SHA: ${sha}`);
      } else {
        core.warning(`⚠️ Could not resolve SHA for: ${actionRef}`);
      }
      
    } catch (error) {
      core.warning(`Error processing action ${actionRef}: ${error.message}`);
    }
  }

  shouldSkipAction(actionRef) {
    // Skip local actions (relative paths)
    if (actionRef.startsWith('./') || actionRef.startsWith('../')) {
      return true;
    }
    
    // Skip Docker actions
    if (actionRef.startsWith('docker://')) {
      return true;
    }

    return false;
  }

  isAlreadyPinned(actionRef) {
    // Check if it's already a SHA (40 character hex string after @)
    const parts = actionRef.split('@');
    if (parts.length === 2) {
      const ref = parts[1];
      return /^[a-f0-9]{40}$/i.test(ref);
    }
    return false;
  }

  async resolveActionToSha(actionRef) {
    try {
      const [owner, repo, ref] = this.parseActionRef(actionRef);
      
      const response = await this.octokit.rest.repos.listTags({
        owner,
        repo,
        per_page: 100
      });
      
      // Find the tag that matches our reference
      const tag = response.data.find(t => t.name === ref || t.name === `v${ref}`);
      
      if (tag) {
        return tag.commit.sha;
      }
      
      // If not found in tags, try branches
      try {
        const branchResponse = await this.octokit.rest.repos.getBranch({
          owner,
          repo,
          branch: ref
        });
        return branchResponse.data.commit.sha;
      } catch (branchError) {
        core.warning(`Could not find reference '${ref}' in ${owner}/${repo}`);
        return null;
      }
      
    } catch (error) {
      core.warning(`Error resolving ${actionRef}: ${error.message}`);
      return null;
    }
  }

  parseActionRef(actionRef) {
    const [repoPath, ref] = actionRef.split('@');
    const [owner, repo] = repoPath.split('/');
    return [owner, repo, ref];
  }

  findLineNumber(lines, searchText) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1; // Line numbers are 1-indexed
      }
    }
    return null;
  }

  async generateReport() {
    if (this.findings.length === 0) {
      core.info('🎉 Excellent! All actions are already SHA-pinned!');
      core.info(`📊 Scanned ${this.stats.filesScanned} files with ${this.stats.totalActions} actions`);
      return;
    }
    
    core.info('📋 SHA Sentry Report');
    core.info('===================');
    core.info(`📁 Files scanned: ${this.stats.filesScanned}`);
    core.info(`🎯 Total actions found: ${this.stats.totalActions}`);
    core.info(`⚠️  Unpinned actions found: ${this.stats.unpinnedActionsFound}`);
    core.info('');
    
    let reportMarkdown = '# 🛡️ SHA Sentry Report\n\n';
    reportMarkdown += `**Summary:** Found ${this.stats.unpinnedActionsFound} unpinned actions across ${this.findings.length} files\n\n`;
    
    for (const fileResult of this.findings) {
      core.info(`📄 File: ${fileResult.file}`);
      reportMarkdown += `## 📄 ${fileResult.file}\n\n`;
      
      for (const action of fileResult.actions) {
        const line = action.line ? ` (line ${action.line})` : '';
        core.info(`  ⚠️  ${action.current} → ${action.recommended}${line}`);
        
        reportMarkdown += `### ⚠️ Action at line ${action.line || 'unknown'}\n`;
        reportMarkdown += '**Current (unpinned):**\n';
        reportMarkdown += `\`\`\`yaml\nuses: ${action.current}\n\`\`\`\n\n`;
        reportMarkdown += '**Recommended (SHA-pinned):**\n';
        reportMarkdown += `\`\`\`yaml\nuses: ${action.recommended}  # ${action.current}\n\`\`\`\n\n`;
        reportMarkdown += `**SHA:** \`${action.sha}\`\n\n`;
        reportMarkdown += '---\n\n';
      }
    }
    
    // Write detailed report to step summary
    core.summary.addRaw(reportMarkdown);
    await core.summary.write();
    
    core.info('');
    core.info('💡 Next Steps:');
    core.info('  1. Review the actions above');
    core.info('  2. Manually update your workflow files with the SHA-pinned versions');
    core.info('  3. Add comments to preserve the original version references');
    core.info('  4. Test your workflows to ensure they still work correctly');
    core.info('');
    core.info('🔗 View the full report in the Actions summary tab');
  }

  setOutputs() {
    core.setOutput('files_scanned', this.stats.filesScanned.toString());
    core.setOutput('total_actions', this.stats.totalActions.toString());
    core.setOutput('unpinned_actions_found', this.stats.unpinnedActionsFound.toString());
    core.setOutput('findings', JSON.stringify(this.findings));
  }
}

// Main execution
if (require.main === module) {
  const shaSentry = new ShaSentry();
  shaSentry.run();
}

module.exports = ShaSentry;