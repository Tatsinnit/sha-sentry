const ShaSentry = require('../src/index');

// Mock GitHub Actions core and github modules
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  warning: jest.fn(),
  setFailed: jest.fn(),
  getInput: jest.fn(),
  setOutput: jest.fn(),
}));

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(),
  context: {
    repo: { owner: 'test-owner', repo: 'test-repo' },
    ref: 'refs/heads/main'
  }
}));

describe('ShaSentry', () => {
  let mockOctokit;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock octokit
    mockOctokit = {
      rest: {
        repos: {
          getCommit: jest.fn()
        }
      }
    };
    
    require('@actions/github').getOctokit.mockReturnValue(mockOctokit);
    require('@actions/core').getInput.mockImplementation((input) => {
      const inputs = {
        'github_token': 'fake-token',
        'commit_message': 'test commit',
        'create_pr': 'false',
        'dry_run': 'true'
      };
      return inputs[input] || '';
    });
  });

  test('should identify non-SHA-pinned actions', async () => {
    const shaSentry = new ShaSentry();
    
    // Test various action reference formats
    expect(await shaSentry.shouldPinAction('actions/checkout@v4')).toBe(true);
    expect(await shaSentry.shouldPinAction('actions/setup-node@main')).toBe(true);
    expect(await shaSentry.shouldPinAction('docker/build-push-action@v5')).toBe(true);
    
    // Should not pin already SHA-pinned actions
    expect(await shaSentry.shouldPinAction('actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608')).toBe(false);
    
    // Should not pin local actions
    expect(await shaSentry.shouldPinAction('./local-action')).toBe(false);
  });

  test('should resolve action to SHA', async () => {
    const shaSentry = new ShaSentry();
    
    mockOctokit.rest.repos.getCommit.mockResolvedValue({
      data: { sha: '8ade135a41bc03ea155e62e844d188df1ea18608' }
    });
    
    const result = await shaSentry.resolveActionToSha('actions/checkout@v4');
    expect(result).toBe('actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608');
    
    expect(mockOctokit.rest.repos.getCommit).toHaveBeenCalledWith({
      owner: 'actions',
      repo: 'checkout',
      ref: 'v4'
    });
  });

  test('should handle invalid action references', async () => {
    const shaSentry = new ShaSentry();
    
    await expect(shaSentry.resolveActionToSha('invalid-ref')).rejects.toThrow();
    await expect(shaSentry.resolveActionToSha('owner@ref')).rejects.toThrow();
  });
});