import * as assert from 'assert';
import * as vscode from 'vscode';

suite('CreateStory Command Integration Test', () => {
	// Note: Full createStory command testing requires mocking user input
	// These tests verify the utility functions work in VS Code context

	test('should have createStory command registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('devstories.createStory'), 'devstories.createStory command should be registered');
	});

	test('parseConfigYaml should parse templates', async () => {
		const { parseConfigYaml } = await import('../../commands/createStoryUtils');

		const yaml = `
version: 1
project: "TestProject"
id_prefix:
  epic: "PROJ"
  story: "FEAT"
templates:
  feature: |
    Custom feature template
  bug: |
    Custom bug template
`;
		const config = parseConfigYaml(yaml);

		assert.strictEqual(config.storyPrefix, 'FEAT');
		assert.ok(config.templates.feature.includes('Custom feature template'));
		assert.ok(config.templates.bug.includes('Custom bug template'));
	});

	test('findNextStoryId should find correct next ID', async () => {
		const { findNextStoryId } = await import('../../commands/createStoryUtils');

		const existingIds = ['STORY-001', 'STORY-002', 'STORY-010'];
		const nextId = findNextStoryId(existingIds, 'STORY');

		assert.strictEqual(nextId, 11, 'Should return 11 as highest is 10');
	});

	test('generateStoryMarkdown should create valid story markdown', async () => {
		const { generateStoryMarkdown, DEFAULT_TEMPLATES } = await import('../../commands/createStoryUtils');

		const markdown = generateStoryMarkdown(
			{
				id: 'STORY-001',
				title: 'Add login form',
				type: 'feature',
				epic: 'EPIC-001',
				sprint: 'sprint-1',
				size: 'M',
			},
			DEFAULT_TEMPLATES.feature
		);

		assert.ok(markdown.includes('id: STORY-001'), 'Should have story ID');
		assert.ok(markdown.includes('title: "Add login form"'), 'Should have title');
		assert.ok(markdown.includes('type: feature'), 'Should have type');
		assert.ok(markdown.includes('epic: EPIC-001'), 'Should link to epic');
		assert.ok(markdown.includes('status: todo'), 'Should default to todo');
		assert.ok(markdown.includes('size: M'), 'Should have size');
		assert.ok(markdown.includes('# Add login form'), 'Should have markdown heading');
		assert.ok(markdown.includes('## User Story'), 'Should include feature template');
	});

	test('generateStoryMarkdown should include dependencies', async () => {
		const { generateStoryMarkdown, DEFAULT_TEMPLATES } = await import('../../commands/createStoryUtils');

		const markdown = generateStoryMarkdown(
			{
				id: 'STORY-003',
				title: 'Dependent story',
				type: 'task',
				epic: 'EPIC-001',
				sprint: 'sprint-1',
				size: 'M',
				dependencies: ['STORY-001', 'STORY-002'],
			},
			DEFAULT_TEMPLATES.task
		);

		assert.ok(markdown.includes('dependencies:'), 'Should have dependencies section');
		assert.ok(markdown.includes('- STORY-001'), 'Should include first dependency');
		assert.ok(markdown.includes('- STORY-002'), 'Should include second dependency');
	});

	test('getSuggestedSize should return correct suggestions', async () => {
		const { getSuggestedSize } = await import('../../commands/createStoryUtils');

		assert.strictEqual(getSuggestedSize('bug'), 'S');
		assert.strictEqual(getSuggestedSize('feature'), 'M');
		assert.strictEqual(getSuggestedSize('task'), 'M');
		assert.strictEqual(getSuggestedSize('chore'), 'S');
	});

	test('appendStoryToEpic should add link to Stories section', async () => {
		const { appendStoryToEpic, generateStoryLink } = await import('../../commands/createStoryUtils');

		const epicContent = `---
id: EPIC-001
title: "Test Epic"
---

# Test Epic

## Description

## Stories

## Notes
`;
		const storyLink = generateStoryLink('STORY-001', 'New feature');
		const result = appendStoryToEpic(epicContent, storyLink);

		assert.ok(result.includes('- [[STORY-001]] New feature'), 'Should include story link');
		assert.ok(result.includes('## Notes'), 'Should preserve existing sections');
	});
});
