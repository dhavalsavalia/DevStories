import * as assert from 'assert';
import * as vscode from 'vscode';

suite('StartRitual Command Integration Test', () => {
  test('should have startRitual command registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('devstories.startRitual'),
      'devstories.startRitual command should be registered'
    );
  });
});
