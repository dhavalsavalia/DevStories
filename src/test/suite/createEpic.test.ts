import * as assert from 'assert';
import * as vscode from 'vscode';

suite('CreateEpic Command Integration Test', () => {
	// Note: Full createEpic command testing requires mocking user input
	// These tests verify the utility functions work in VS Code context

	test('should have createEpic command registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('devstories.createEpic'), 'devstories.createEpic command should be registered');
	});

	test('parseConfigJson should work in VS Code context', async () => {
		const { parseConfigJson } = await import('../../commands/createEpicUtils');

		const json = JSON.stringify({
			version: 1,
			project: 'TestProject',
			idPrefix: {
				epic: 'PROJ',
				story: 'FEAT',
			},
			sprints: {
				current: 'sprint-5',
			},
			statuses: [
				{ id: 'todo', label: 'To Do' },
				{ id: 'done', label: 'Done' },
			],
		});
		const config = parseConfigJson(json);

		assert.strictEqual(config.epicPrefix, 'PROJ');
		assert.strictEqual(config.storyPrefix, 'FEAT');
		assert.strictEqual(config.currentSprint, 'sprint-5');
		assert.deepStrictEqual(config.statuses, ['todo', 'done']);
	});

	test('findNextEpicId should find correct next ID', async () => {
		const { findNextEpicId } = await import('../../commands/createEpicUtils');

		const existingIds = ['EPIC-001', 'EPIC-002', 'EPIC-005'];
		const nextId = findNextEpicId(existingIds, 'EPIC');

		assert.strictEqual(nextId, 6, 'Should return 6 as highest is 5');
	});

	test('generateEpicMarkdown should create valid epic markdown', async () => {
		const { generateEpicMarkdown } = await import('../../commands/createEpicUtils');

		const markdown = generateEpicMarkdown({
			id: 'EPIC-001',
			title: 'Test Epic',
			goal: 'Build great stuff',
		});

		assert.ok(markdown.includes('id: EPIC-001'), 'Should have epic ID');
		assert.ok(markdown.includes('title: "Test Epic"'), 'Should have title');
		assert.ok(markdown.includes('status: todo'), 'Should default to todo');
		assert.ok(!markdown.includes('sprint:'), 'Should NOT have sprint (epics dont have sprints)');
		assert.ok(markdown.includes('# Test Epic'), 'Should have markdown heading');
		assert.ok(markdown.includes('Build great stuff'), 'Should include goal');
		assert.ok(markdown.includes('## Stories'), 'Should include Stories section');
	});

	test('generateEpicMarkdown should escape quotes in title', async () => {
		const { generateEpicMarkdown } = await import('../../commands/createEpicUtils');

		const markdown = generateEpicMarkdown({
			id: 'EPIC-001',
			title: 'Epic with "quotes"',
		});

		assert.ok(markdown.includes('title: "Epic with \\"quotes\\""'), 'Should escape quotes');
	});
});
