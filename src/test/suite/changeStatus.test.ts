import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('ChangeStatus Command Integration Test', () => {
	let testWorkspaceRoot: string;
	let storiesDir: string;
	let epicsDir: string;

	suiteSetup(async () => {
		// Get workspace root
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			throw new Error('No workspace folder found');
		}
		testWorkspaceRoot = workspaceFolders[0].uri.fsPath;
		storiesDir = path.join(testWorkspaceRoot, '.devstories', 'stories');
		epicsDir = path.join(testWorkspaceRoot, '.devstories', 'epics');
	});

	test('should have changeStatus command registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('devstories.changeStatus'), 'devstories.changeStatus command should be registered');
	});

	test('parseStatusesFromConfig should return statuses from config', async () => {
		const { parseStatusesFromConfig } = await import('../../commands/changeStatusUtils');

		const configContent = JSON.stringify({
			statuses: [
				{ id: 'backlog', label: 'Backlog' },
				{ id: 'active', label: 'Active' },
				{ id: 'complete', label: 'Complete' },
			],
		});
		const statuses = parseStatusesFromConfig(configContent);
		assert.deepStrictEqual(statuses, ['backlog', 'active', 'complete']);
	});

	test('parseStatusesFromConfig should return defaults for empty config', async () => {
		const { parseStatusesFromConfig } = await import('../../commands/changeStatusUtils');

		const statuses = parseStatusesFromConfig('');
		assert.deepStrictEqual(statuses, ['todo', 'in_progress', 'review', 'done']);
	});

	test('getNextWorkflowStatus should cycle through statuses', async () => {
		const { getNextWorkflowStatus } = await import('../../commands/changeStatusUtils');

		const statuses = ['todo', 'in_progress', 'review', 'done'];

		assert.strictEqual(getNextWorkflowStatus('todo', statuses), 'in_progress');
		assert.strictEqual(getNextWorkflowStatus('in_progress', statuses), 'review');
		assert.strictEqual(getNextWorkflowStatus('review', statuses), 'done');
		assert.strictEqual(getNextWorkflowStatus('done', statuses), 'todo'); // Cycle back
	});

	test('updateStoryStatus should update status field', async () => {
		const { updateStoryStatus } = await import('../../commands/changeStatusUtils');

		const storyContent = `---
id: TEST-001
title: "Test Story"
type: feature
epic: EPIC-001
status: todo
sprint: sprint-1
size: M
assignee: ""
dependencies:
created: 2025-01-15
updated: 2025-01-15
---

# Test Story

Content here.
`;
		const result = updateStoryStatus(storyContent, 'in_progress');

		assert.ok(result.includes('status: in_progress'), 'Should update status to in_progress');
		assert.ok(!result.includes('status: todo'), 'Should not contain old status');
		assert.ok(result.includes('# Test Story'), 'Should preserve markdown content');
	});

	test('updateEpicStatus should update status field', async () => {
		const { updateEpicStatus } = await import('../../commands/changeStatusUtils');

		const epicContent = `---
id: EPIC-001
title: "Test Epic"
status: todo
sprint: sprint-1
created: 2025-01-15
updated: 2025-01-15
---

# Test Epic

## Stories
`;
		const result = updateEpicStatus(epicContent, 'done');

		assert.ok(result.includes('status: done'), 'Should update status to done');
		assert.ok(!result.includes('status: todo'), 'Should not contain old status');
		assert.ok(result.includes('## Stories'), 'Should preserve Stories section');
	});
});
