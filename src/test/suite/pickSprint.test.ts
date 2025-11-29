import * as assert from 'assert';
import * as vscode from 'vscode';
import { SprintFilterService } from '../../core/sprintFilterService';

suite('PickSprint Command Integration Test', () => {
  let sprintFilterService: SprintFilterService;

  setup(() => {
    sprintFilterService = new SprintFilterService();
  });

  teardown(() => {
    sprintFilterService.dispose();
  });

  test('should have pickSprint command registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('devstories.pickSprint'), 'devstories.pickSprint should be registered');
  });

  test('SprintFilterService should start with null sprint', () => {
    assert.strictEqual(sprintFilterService.currentSprint, null, 'Should start with null (all sprints)');
  });

  test('SprintFilterService setSprint should update currentSprint', () => {
    sprintFilterService.setSprint('sprint-1');
    assert.strictEqual(sprintFilterService.currentSprint, 'sprint-1', 'Should update to sprint-1');
  });

  test('SprintFilterService should fire event on change', async () => {
    let eventFired = false;
    let eventValue: string | null = 'not-set';

    const disposable = sprintFilterService.onDidSprintChange((sprint) => {
      eventFired = true;
      eventValue = sprint;
    });

    sprintFilterService.setSprint('sprint-2');

    // Wait for event
    await new Promise(resolve => setTimeout(resolve, 50));

    assert.ok(eventFired, 'Event should fire');
    assert.strictEqual(eventValue, 'sprint-2', 'Event should contain new sprint value');

    disposable.dispose();
  });

  test('SprintFilterService should not fire event if value unchanged', async () => {
    let eventCount = 0;

    const disposable = sprintFilterService.onDidSprintChange(() => {
      eventCount++;
    });

    sprintFilterService.setSprint('sprint-1');
    sprintFilterService.setSprint('sprint-1'); // Same value, should not fire

    // Wait for potential events
    await new Promise(resolve => setTimeout(resolve, 50));

    assert.strictEqual(eventCount, 1, 'Event should only fire once');

    disposable.dispose();
  });

  test('SprintFilterService should handle null (all sprints)', () => {
    sprintFilterService.setSprint('sprint-1');
    assert.strictEqual(sprintFilterService.currentSprint, 'sprint-1');

    sprintFilterService.setSprint(null);
    assert.strictEqual(sprintFilterService.currentSprint, null, 'Should allow setting back to null');
  });

  test('SprintFilterService should handle backlog', () => {
    sprintFilterService.setSprint('backlog');
    assert.strictEqual(sprintFilterService.currentSprint, 'backlog', 'Should allow backlog as sprint filter');
  });
});
