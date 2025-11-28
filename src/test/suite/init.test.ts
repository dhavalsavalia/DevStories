import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

suite('Init Command Integration Test', () => {
	const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const devstoriesDir = path.join(workspaceRoot, '.devstories');
	const configPath = path.join(devstoriesDir, 'config.yaml');
	const storiesDir = path.join(devstoriesDir, 'stories');
	const epicsDir = path.join(devstoriesDir, 'epics');

	// Note: Full init command testing requires mocking user input
	// These tests verify the utility functions work in VS Code context

	test('should have init command registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('devstories.init'), 'devstories.init command should be registered');
	});

	test('generateConfigYaml should produce valid yaml structure', async () => {
		// Import the utility function
		const { generateConfigYaml } = await import('../../commands/initUtils');

		const config = {
			projectName: 'test-project',
			epicPrefix: 'EPIC',
			storyPrefix: 'DS',
			sprint: 'sprint-1',
		};

		const yaml = generateConfigYaml(config);

		// Verify structure
		assert.ok(yaml.includes('version: 1'), 'Should include version');
		assert.ok(yaml.includes('project: "test-project"'), 'Should include project name');
		assert.ok(yaml.includes('epic: "EPIC"'), 'Should include epic prefix');
		assert.ok(yaml.includes('story: "DS"'), 'Should include story prefix');
		assert.ok(yaml.includes('id: todo'), 'Should include todo status');
		assert.ok(yaml.includes('id: in_progress'), 'Should include in_progress status');
		assert.ok(yaml.includes('id: review'), 'Should include review status');
		assert.ok(yaml.includes('id: done'), 'Should include done status');
		assert.ok(yaml.includes('current: "sprint-1"'), 'Should include sprint');
		assert.ok(yaml.includes('sizes: ["XS", "S", "M", "L", "XL"]'), 'Should include sizes');
	});

	test('detectProjectName should work with package.json', async () => {
		const { detectProjectName } = await import('../../commands/initUtils');

		const files = new Map([
			['package.json', '{"name": "my-test-package"}'],
		]);

		const name = detectProjectName(files);
		assert.strictEqual(name, 'my-test-package');
	});

	test('generateSampleEpic should create valid epic', async () => {
		const { generateSampleEpic } = await import('../../commands/initUtils');

		const epic = generateSampleEpic('sprint-1', 'DS');

		assert.ok(epic.includes('id: EPIC-001'), 'Should have epic ID');
		assert.ok(epic.includes('title: Sample Epic'), 'Should have title');
		assert.ok(epic.includes('status: todo'), 'Should have status');
		assert.ok(epic.includes('sprint: sprint-1'), 'Should have sprint');
		assert.ok(epic.includes('[[DS-001]]'), 'Should link to sample story');
	});

	test('generateSampleStory should create valid story', async () => {
		const { generateSampleStory } = await import('../../commands/initUtils');

		const story = generateSampleStory('sprint-1', 'DS');

		assert.ok(story.includes('id: DS-001'), 'Should have story ID');
		assert.ok(story.includes('title: Sample Story'), 'Should have title');
		assert.ok(story.includes('type: feature'), 'Should have type');
		assert.ok(story.includes('epic: EPIC-001'), 'Should reference epic');
		assert.ok(story.includes('status: todo'), 'Should have status');
		assert.ok(story.includes('sprint: sprint-1'), 'Should have sprint');
		assert.ok(story.includes('size: S'), 'Should have size');
	});
});
