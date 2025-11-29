import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigService } from '../../core/configService';

suite('ConfigService Integration Test', () => {
	const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const devstoriesDir = path.join(workspaceRoot, '.devstories');
	const configFile = path.join(devstoriesDir, 'config.yaml');
	const templatesDir = path.join(devstoriesDir, 'templates');
	const templateFile = path.join(templatesDir, 'test-template.md');

	let originalConfig: string | undefined;
	let configService: ConfigService;

	setup(async () => {
		// Save original config if exists
		if (fs.existsSync(configFile)) {
			originalConfig = fs.readFileSync(configFile, 'utf8');
		}

		// Ensure directories exist
		if (!fs.existsSync(devstoriesDir)) {
			fs.mkdirSync(devstoriesDir, { recursive: true });
		}
		if (!fs.existsSync(templatesDir)) {
			fs.mkdirSync(templatesDir, { recursive: true });
		}

		// Write test config
		const testConfig = `
version: 1
project: "Test Project"
id_prefix:
  epic: "EPIC"
  story: "STORY"
statuses:
  - id: todo
    label: "To Do"
  - id: in_progress
    label: "In Progress"
  - id: done
    label: "Done"
sprints:
  current: "sprint-1"
sizes: ["XS", "S", "M", "L", "XL"]
`;
		fs.writeFileSync(configFile, testConfig);

		configService = new ConfigService();
		await configService.initialize();
	});

	teardown(() => {
		configService.dispose();

		// Restore original config
		if (originalConfig) {
			fs.writeFileSync(configFile, originalConfig);
		}

		// Clean up test template
		if (fs.existsSync(templateFile)) {
			fs.unlinkSync(templateFile);
		}
	});

	test('should load config on initialize', async () => {
		const config = configService.config;

		assert.strictEqual(config.epicPrefix, 'EPIC');
		assert.strictEqual(config.storyPrefix, 'STORY');
		assert.strictEqual(config.currentSprint, 'sprint-1');
		assert.strictEqual(config.statuses.length, 3);
		assert.strictEqual(config.statuses[0].id, 'todo');
		assert.strictEqual(config.statuses[1].id, 'in_progress');
		assert.strictEqual(config.statuses[2].id, 'done');
	});

	test('should fire onDidConfigChange when config changes', async () => {
		// Wait for any initial watcher events to settle
		await new Promise(resolve => setTimeout(resolve, 200));

		const changePromise = new Promise<void>((resolve) => {
			const disposable = configService.onDidConfigChange(() => {
				disposable.dispose();
				resolve();
			});
		});

		// Update config with new status
		const updatedConfig = `
version: 1
project: "Updated Project"
id_prefix:
  epic: "EPIC"
  story: "STORY"
statuses:
  - id: todo
    label: "To Do"
  - id: in_progress
    label: "In Progress"
  - id: review
    label: "Review"
  - id: done
    label: "Done"
sprints:
  current: "sprint-2"
sizes: ["XS", "S", "M", "L", "XL"]
`;
		fs.writeFileSync(configFile, updatedConfig);

		await changePromise;

		const config = configService.config;
		assert.strictEqual(config.statuses.length, 4);
		assert.strictEqual(config.currentSprint, 'sprint-2');
	});

	test('should load templates from templates folder', async () => {
		// Write a test template
		const templateContent = `---
title: Test Template
description: A test template
types: [feature, task]
---

## Template Content
- [ ] Step 1
- [ ] Step 2
`;
		fs.writeFileSync(templateFile, templateContent);

		// Re-initialize to pick up template
		configService.dispose();
		configService = new ConfigService();
		await configService.initialize();

		const templates = configService.templates;
		const testTemplate = templates.find(t => t.name === 'test-template');

		assert.ok(testTemplate, 'Template should be loaded');
		assert.strictEqual(testTemplate?.displayName, 'Test Template');
		assert.strictEqual(testTemplate?.description, 'A test template');
		assert.deepStrictEqual(testTemplate?.types, ['feature', 'task']);
		assert.ok(testTemplate?.content.includes('Step 1'), 'Content should include template body');
	});

	test('should use defaults when config has invalid YAML', async () => {
		// Wait for initial setup
		await new Promise(resolve => setTimeout(resolve, 200));

		const errorPromise = new Promise<void>((resolve) => {
			const disposable = configService.onParseError(() => {
				disposable.dispose();
				resolve();
			});
		});

		// Write invalid YAML
		fs.writeFileSync(configFile, '{ invalid yaml [');

		await errorPromise;

		// Config should still have values (either defaults or last-known-good)
		const config = configService.config;
		assert.ok(config.statuses.length > 0, 'Should have statuses from defaults or last-known-good');
	});

	test('should provide synchronous access to config', () => {
		// This should not require await
		const config = configService.config;
		assert.ok(config, 'Config should be available synchronously');
		assert.ok(config.statuses, 'Statuses should be available');
	});
});
