import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('vscode', () => ({
  commands: {
    executeCommand: vi.fn().mockResolvedValue(undefined),
  },
}));

import * as vscode from 'vscode';
import { runQuickAction } from '../../view/welcomeViewActions';

describe('runQuickAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute known quick action commands', async () => {
    await runQuickAction('init');
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('devstories.init');
  });

  it('should no-op for unknown actions', async () => {
    await runQuickAction('unknown');
    expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
  });
});
