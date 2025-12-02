/**
 * Create Story Menu Command
 * Unified entry point for story creation - shows QuickPick to choose between
 * quick capture and full story creation.
 */

import * as vscode from 'vscode';
import { CREATE_STORY_MENU_OPTIONS, CreateStoryMenuOption } from './createStoryMenuUtils';

/**
 * Execute the create story menu command.
 * Shows a QuickPick with options for quick capture vs full story creation.
 */
export async function executeCreateStoryMenu(): Promise<void> {
	const selected = await vscode.window.showQuickPick<CreateStoryMenuOption>(
		CREATE_STORY_MENU_OPTIONS,
		{
			placeHolder: 'How would you like to create a story?',
			title: 'Create Story'
		}
	);

	if (selected) {
		await vscode.commands.executeCommand(selected.command);
	}
}
