const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs').promises;
const { glob } = require('glob');

class ShaSentry {
  constructor() {
    this.token = core.getInput('github_token') || process.env.GITHUB_TOKEN;
    this.commitMessage = core.getInput('commit_message') || process.env.COMMIT_MESSAGE;
    this.createPr = core.getInput('create_pr') === 'true' || process.env.CREATE_PR === 'true';
    this.prTitle = core.getInput('pr_title') || process.env.PR_TITLE;
    this.prBody = core.getInput('pr_body') || process.env.PR_BODY;
    this.excludePatterns = (core.getInput('exclude_patterns') || process.env.EXCLUDE_PATTERNS || '')
      .split(',')
      .map(pattern => pattern.trim())
      .filter(pattern => pattern.length > 0);
    this.dryRun = core.getInput('dry_run') === 'true' || process.env.DRY_RUN === 'true';
    
    this.octokit = github.getOctokit(this.token);
    this.context = github.context;
    
    this.stats = {
      filesUpdated: 0,
      actionsPinned: 0,
      changesMade: false
    };
  }

  async run() {
    try {
      core.info('🔍 Starting SHA Sentry - searching for workflow files...');
      
      const workflowFiles = await this.findWorkflowFiles();
      core.info(`📁 Found ${workflowFiles.length} workflow files`);
      
      const filesToUpdate = [];
      
      for (const file of workflowFiles) {
        const result = await this.processWorkflowFile(file);
        if (result.hasChanges) {
          filesToUpdate.push(result);
        }
      }
      
      if (filesToUpdate.length === 0) {
        core.info('✅ No changes needed - all actions are already SHA-pinned!');
        this.setOutputs();
        return;
      }
      
      if (this.dryRun) {
        core.info('🔍 DRY RUN - Changes that would be made:');
        for (const file of filesToUpdate) {
          core.info(`  📄 ${file.path}: ${file.actionsPinned} actions would be pinned`);
        }
        this.setOutputs();
        return;
      }
      
      // Write the updated files
      for (const file of filesToUpdate) {
        await fs.writeFile(file.path, file.content, 'utf8');
        this.stats.filesUpdated++;
        this.stats.actionsPinned += file.actionsPinned;
        core.info(`✅ Updated ${file.path} (${file.actionsPinned} actions pinned)`);
      }
      
      this.stats.changesMade = true;
      
      if (this.createPr) {
        await this.createPullRequest(filesToUpdate);
      } else {
        await this.commitChanges(filesToUpdate);
      }
      
      this.setOutputs();
      core.info(`🎉 Successfully processed ${this.stats.filesUpdated} files and pinned ${this.stats.actionsPinned} actions!`);
      
    } catch (error) {
      core.setFailed(`❌ Error: ${error.message}`);
      throw error;
    }
  }

  async findWorkflowFiles() {
    const patterns = [
      '.github/workflows/*.yml',
      '.github/workflows/*.yaml'
    ];
    
    const files = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd: process.cwd() });
      files.push(...matches);
    }
    
    return [...new Set(files)]; // Remove duplicates
  }

  async processWorkflowFile(filePath) {
    core.info(`🔍 Processing ${filePath}...`);
    
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const updatedLines = [];
    let actionsPinned = 0;
    let hasChanges = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const usesMatch = line.match(/^(\s*uses:\s*)([^#\s]+)(.*)$/);
      
      if (usesMatch) {
        const [, prefix, actionRef, suffix] = usesMatch;
        
        if (await this.shouldPinAction(actionRef)) {
          try {
            const shaRef = await this.resolveActionToSha(actionRef);
            if (shaRef && shaRef !== actionRef) {
              const originalComment = suffix.includes('#') ? suffix : ` # ${actionRef}`;
              updatedLines.push(`${prefix}${shaRef}${originalComment}`);
              actionsPinned++;
              hasChanges = true;
              core.info(`  📌 ${actionRef} → ${shaRef}`);
            } else {
              updatedLines.push(line);
            }
          } catch (error) {
            core.warning(`⚠️  Could not resolve ${actionRef}: ${error.message}`);
            updatedLines.push(line);
          }
        } else {
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }
    
    return {
      path: filePath,
      content: updatedLines.join('\n'),
      actionsPinned,
      hasChanges
    };
  }

  async shouldPinAction(actionRef) {
    // Skip if already SHA-pinned (40-character hex string)
    if (/^[a-f0-9]{40}$/i.test(actionRef.split('@')[1])) {
      return false;
    }
    
    // Skip local actions (starting with ./)
    if (actionRef.startsWith('./')) {
      return false;
    }
    
    // Check exclude patterns
    for (const pattern of this.excludePatterns) {
      if (actionRef.includes(pattern)) {
        core.info(`  ⏭️  Skipping ${actionRef} (matches exclude pattern: ${pattern})`);
        return false;
      }
    }
    
    return true;
  }

  async resolveActionToSha(actionRef) {
    const [repoPath, ref] = actionRef.split('@');
    
    if (!ref || !repoPath) {
      throw new Error(`Invalid action reference: ${actionRef}`);
    }
    
    const [owner, repo] = repoPath.split('/');
    
    if (!owner || !repo) {
      throw new Error(`Invalid repository path: ${repoPath}`);
    }
    
    try {
      // Try to get the commit SHA for the ref
      const { data } = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref
      });
      
      return `${repoPath}@${data.sha}`;
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Reference '${ref}' not found in ${repoPath}`);
      }
      throw error;
    }
  }

  async commitChanges(filesToUpdate) {
    const filePaths = filesToUpdate.map(f => f.path);
    
    try {
      // Use git commands to commit changes
      const { execSync } = require('child_process');
      
      // Add files
      for (const filePath of filePaths) {
        execSync(`git add "${filePath}"`, { stdio: 'inherit' });
      }
      
      // Commit
      execSync(`git -c user.name="SHA Sentry" -c user.email="sha-sentry@users.noreply.github.com" commit -m "${this.commitMessage}"`, { stdio: 'inherit' });
      
      core.info('📝 Changes committed successfully');
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error.message}`);
    }
  }

  async createPullRequest(filesToUpdate) {
    try {
      const branchName = `sha-sentry-${Date.now()}`;
      const { execSync } = require('child_process');
      
      // Create and checkout new branch
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      
      // Add and commit changes
      await this.commitChanges(filesToUpdate);
      
      // Push branch
      execSync(`git push origin ${branchName}`, { stdio: 'inherit' });
      
      // Create PR
      const { data: pr } = await this.octokit.rest.pulls.create({
        ...this.context.repo,
        title: this.prTitle,
        body: this.prBody,
        head: branchName,
        base: this.context.ref.replace('refs/heads/', '')
      });
      
      core.info(`📋 Pull request created: #${pr.number}`);
      core.setOutput('pr_number', pr.number.toString());
      
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  setOutputs() {
    core.setOutput('changes_made', this.stats.changesMade.toString());
    core.setOutput('files_updated', this.stats.filesUpdated.toString());
    core.setOutput('actions_pinned', this.stats.actionsPinned.toString());
  }
}

// Main execution
async function main() {
  const shaSentry = new ShaSentry();
  await shaSentry.run();
}

if (require.main === module) {
  main().catch(error => {
    core.setFailed(error.message);
    process.exit(1);
  });
}

module.exports = ShaSentry;