import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	CREATE_STORY_MENU_OPTIONS,
	QUICK_CAPTURE_OPTION,
	FULL_STORY_OPTION
} from '../../commands/createStoryMenuUtils';

suite('CreateStoryMenu Command Integration Test', () => {
	test('should have createStoryMenu command registered', async () => {
		const commands = await vscode.commands.getCommands();
		assert.ok(
			commands.includes('devstories.createStoryMenu'),
			'Command devstories.createStoryMenu should be registered'
		);
	});

	test('CREATE_STORY_MENU_OPTIONS should have two options', () => {
		assert.strictEqual(CREATE_STORY_MENU_OPTIONS.length, 2);
	});

	test('QUICK_CAPTURE_OPTION should reference correct command', () => {
		assert.strictEqual(QUICK_CAPTURE_OPTION.command, 'devstories.quickCapture');
	});

	test('FULL_STORY_OPTION should reference correct command', () => {
		assert.strictEqual(FULL_STORY_OPTION.command, 'devstories.createStory');
	});

	test('options should have labels with icons', () => {
		assert.ok(QUICK_CAPTURE_OPTION.label.includes('$(zap)'));
		assert.ok(FULL_STORY_OPTION.label.includes('$(file-add)'));
	});

	test('options should have descriptions', () => {
		assert.ok(QUICK_CAPTURE_OPTION.description.length > 0);
		assert.ok(FULL_STORY_OPTION.description.length > 0);
	});
});
