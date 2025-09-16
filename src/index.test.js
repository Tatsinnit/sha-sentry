const ShaSentry = require('./index');

// Mock GitHub Actions core and github modules
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  setFailed: jest.fn(),
  getInput: jest.fn(),
  setOutput: jest.fn(),
  summary: {
    addRaw: jest.fn(),
    write: jest.fn()
  }
}));

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(),
  context: {
    repo: { owner: 'test-owner', repo: 'test-repo' },
    ref: 'refs/heads/main'
  }
}));

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

jest.mock('glob', () => ({
  glob: jest.fn()
}));

jest.mock('yaml', () => ({
  parseDocument: jest.fn()
}));

describe('ShaSentry', () => {
  let mockOctokit;
  let core;
  let mockGlob;
  let mockYaml;
  let mockFs;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    core = require('@actions/core');
    mockGlob = require('glob').glob;
    mockYaml = require('yaml');
    mockFs = require('fs').promises;
    
    // Mock octokit
    mockOctokit = {
      rest: {
        repos: {
          listTags: jest.fn(),
          getBranch: jest.fn()
        }
      }
    };
    
    require('@actions/github').getOctokit.mockReturnValue(mockOctokit);
    
    // Default input mocking
    core.getInput.mockImplementation((input) => {
      const inputs = {
        'github_token': 'fake-token',
        'exclude_patterns': ''
      };
      return inputs[input] || '';
    });
  });

  describe('Workflow file scanning', () => {
    it('should scan workflow files and report unpinned actions', async () => {
      // Mock file discovery to return only our test file
      mockGlob.mockImplementation((pattern) => {
        if (pattern === '.github/workflows/*.yml') {
          return Promise.resolve(['/test/.github/workflows/ci.yml']);
        }
        return Promise.resolve([]);
      });
      
      // Mock file content
      const workflowContent = `name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      `;
      
      mockFs.readFile.mockResolvedValue(workflowContent);
      
      // Mock YAML parsing - create a structure that findUsesStatements can traverse
      const mockYamlContents = {
        name: 'CI',
        jobs: {
          test: {
            'runs-on': 'ubuntu-latest',
            steps: [
              { uses: 'actions/checkout@v4' },
              { 
                uses: 'actions/setup-node@v4',
                with: { 'node-version': '20' }
              }
            ]
          }
        }
      };
      mockYaml.parseDocument.mockReturnValue({ contents: mockYamlContents });
      
      // Mock GitHub API responses for SHA resolution
      mockOctokit.rest.repos.listTags.mockResolvedValue({
        data: [
          { name: 'v4', commit: { sha: '8aca7672a9e6a874d8faa6b8f98a5212554c65cd' } }
        ]
      });
      
      const shaSentry = new ShaSentry();
      await shaSentry.run();
      
      // Verify outputs were set correctly
      expect(core.setOutput).toHaveBeenCalledWith('files_scanned', '1');
      expect(core.setOutput).toHaveBeenCalledWith('unpinned_actions_found', '2');
      expect(core.setOutput).toHaveBeenCalledWith('total_actions', '2');
      
      // Verify a report was generated (should be called because we found unpinned actions)
      expect(core.summary.addRaw).toHaveBeenCalled();
      expect(core.summary.write).toHaveBeenCalled();
      
      // Check that findings were logged
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Found unpinned action: actions/checkout@v4'));
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('Found unpinned action: actions/setup-node@v4'));
    });

    it('should report no issues when all actions are SHA-pinned', async () => {
      mockGlob.mockImplementation((pattern) => {
        if (pattern === '.github/workflows/*.yml') {
          return Promise.resolve(['/test/.github/workflows/secure.yml']);
        }
        return Promise.resolve([]);
      });
      
      const secureWorkflowContent = `
name: Secure CI  
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@8aca7672a9e6a874d8faa6b8f98a5212554c65cd  # v4
      `;
      
      mockFs.readFile.mockResolvedValue(secureWorkflowContent);
      
      const mockYamlContents = {
        jobs: {
          test: {
            steps: [
              { uses: 'actions/checkout@8aca7672a9e6a874d8faa6b8f98a5212554c65cd' }
            ]
          }
        }
      };
      mockYaml.parseDocument.mockReturnValue({ contents: mockYamlContents });
      
      const shaSentry = new ShaSentry();
      await shaSentry.run();
      
      // Should find no unpinned actions
      expect(core.setOutput).toHaveBeenCalledWith('unpinned_actions_found', '0');
      expect(core.setOutput).toHaveBeenCalledWith('total_actions', '1');
      expect(core.info).toHaveBeenCalledWith('✅ Already pinned: actions/checkout@8aca7672a9e6a874d8faa6b8f98a5212554c65cd');
      expect(core.info).toHaveBeenCalledWith(expect.stringContaining('🎉 Excellent! All actions are already SHA-pinned!'));
    });
  });

  describe('File pattern exclusion', () => {
    it('should exclude files matching exclude patterns', async () => {
      core.getInput.mockImplementation((input) => {
        if (input === 'exclude_patterns') return '.github/workflows/experimental';
        return input === 'github_token' ? 'fake-token' : '';
      });
      
      // Mock glob to return specific files based on pattern
      mockGlob.mockImplementation((pattern) => {
        if (pattern === '.github/workflows/*.yml') {
          return Promise.resolve([
            '/test/.github/workflows/ci.yml',
            '/test/.github/workflows/experimental.yml'
          ]);
        }
        return Promise.resolve([]);
      });
      
      const shaSentry = new ShaSentry();
      const files = await shaSentry.findWorkflowFiles();
      
      // Should exclude the experimental workflow
      expect(files).toEqual(['/test/.github/workflows/ci.yml']);
    });

    it('should handle multiple exclude patterns', async () => {
      core.getInput.mockImplementation((input) => {
        if (input === 'exclude_patterns') return 'experimental,test-';
        return input === 'github_token' ? 'fake-token' : '';
      });
      
      mockGlob.mockImplementation((pattern) => {
        if (pattern === '.github/workflows/*.yml') {
          return Promise.resolve([
            '/test/.github/workflows/ci.yml',
            '/test/.github/workflows/experimental.yml',
            '/test/.github/workflows/test-workflow.yml'
          ]);
        }
        return Promise.resolve([]);
      });
      
      const shaSentry = new ShaSentry();
      const files = await shaSentry.findWorkflowFiles();
      
      // Should only include ci.yml
      expect(files).toEqual(['/test/.github/workflows/ci.yml']);
    });
  });

  describe('Action detection logic', () => {
    it('should correctly identify unpinned actions', () => {
      const shaSentry = new ShaSentry();
      
      // Unpinned actions (using tags/branches)
      expect(shaSentry.isAlreadyPinned('actions/checkout@v4')).toBe(false);
      expect(shaSentry.isAlreadyPinned('actions/setup-node@main')).toBe(false);
      expect(shaSentry.isAlreadyPinned('docker/build-push-action@v5.0.0')).toBe(false);
      
      // SHA-pinned actions
      expect(shaSentry.isAlreadyPinned('actions/checkout@8aca7672a9e6a874d8faa6b8f98a5212554c65cd')).toBe(true);
      expect(shaSentry.isAlreadyPinned('actions/setup-node@60edb5dd545a775178f52524783378180af0d1f8')).toBe(true);
    });

    it('should skip local and Docker actions', () => {
      const shaSentry = new ShaSentry();
      
      // Local actions should be skipped
      expect(shaSentry.shouldSkipAction('./local-action')).toBe(true);
      expect(shaSentry.shouldSkipAction('../parent-action')).toBe(true);
      
      // Docker actions should be skipped
      expect(shaSentry.shouldSkipAction('docker://alpine:latest')).toBe(true);

      // GitHub actions should not be skipped
      expect(shaSentry.shouldSkipAction('actions/checkout@v4')).toBe(false);
    });
  });

  describe('SHA resolution', () => {
    it('should resolve action tags to SHA commits', async () => {
      mockOctokit.rest.repos.listTags.mockResolvedValue({
        data: [
          { name: 'v4', commit: { sha: '8aca7672a9e6a874d8faa6b8f98a5212554c65cd' } },
          { name: 'v3', commit: { sha: '1234567890abcdef1234567890abcdef12345678' } }
        ]
      });
      
      const shaSentry = new ShaSentry();
      const sha = await shaSentry.resolveActionToSha('actions/checkout@v4');
      
      expect(sha).toBe('8aca7672a9e6a874d8faa6b8f98a5212554c65cd');
      expect(mockOctokit.rest.repos.listTags).toHaveBeenCalledWith({
        owner: 'actions',
        repo: 'checkout',
        per_page: 100
      });
    });

    it('should fallback to branches when tags are not found', async () => {
      // No matching tags
      mockOctokit.rest.repos.listTags.mockResolvedValue({ data: [] });
      
      // Mock branch resolution
      mockOctokit.rest.repos.getBranch.mockResolvedValue({
        data: { commit: { sha: 'branch123456789abcdef123456789abcdef12345678' } }
      });
      
      const shaSentry = new ShaSentry();
      const sha = await shaSentry.resolveActionToSha('actions/checkout@main');
      
      expect(sha).toBe('branch123456789abcdef123456789abcdef12345678');
      expect(mockOctokit.rest.repos.getBranch).toHaveBeenCalledWith({
        owner: 'actions',
        repo: 'checkout',
        branch: 'main'
      });
    });

    it('should handle API errors gracefully', async () => {
      mockOctokit.rest.repos.listTags.mockRejectedValue(new Error('API rate limit exceeded'));
      
      const shaSentry = new ShaSentry();
      const sha = await shaSentry.resolveActionToSha('actions/checkout@v4');
      
      expect(sha).toBe(null);
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Error resolving actions/checkout@v4'));
    });
  });

  describe('Error handling', () => {
    it('should handle file reading errors', async () => {
      mockGlob.mockResolvedValue(['/test/.github/workflows/ci.yml']);
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      const shaSentry = new ShaSentry();
      await shaSentry.run();
      
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Error processing'));
      // Should still complete successfully even with file errors
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('should handle YAML parsing errors', async () => {
      mockGlob.mockResolvedValue(['/test/.github/workflows/invalid.yml']);
      mockFs.readFile.mockResolvedValue('invalid: yaml: content: [');
      mockYaml.parseDocument.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });
      
      const shaSentry = new ShaSentry();
      await shaSentry.run();
      
      expect(core.warning).toHaveBeenCalledWith(expect.stringContaining('Error processing'));
    });

    it('should set failed status on unhandled errors', async () => {
      // Mock an error in the findWorkflowFiles method
      const shaSentry = new ShaSentry();
      jest.spyOn(shaSentry, 'findWorkflowFiles').mockRejectedValue(new Error('Unexpected error'));
      
      await shaSentry.run();
      
      expect(core.setFailed).toHaveBeenCalledWith('SHA Sentry failed: Unexpected error');
    });
  });
});