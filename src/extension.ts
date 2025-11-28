import * as vscode from 'vscode';
import { executeCreateEpic } from './commands/createEpic';
import { executeCreateStory } from './commands/createStory';
import { executeInit } from './commands/init';
import { executeQuickCapture } from './commands/quickCapture';
import { AutoTimestamp } from './core/autoTimestamp';
import { Store } from './core/store';
import { Watcher } from './core/watcher';
import { StatusBarController } from './view/statusBar';
import { StoriesProvider } from './view/storiesProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('DevStories is now active!');

	// Initialize Core Components
	const watcher = new Watcher();
	const store = new Store(watcher);
	const storiesProvider = new StoriesProvider(store, context.extensionPath);
	const statusBarController = new StatusBarController(store);
	const autoTimestamp = new AutoTimestamp();

	// Register Tree Data Provider
	vscode.window.registerTreeDataProvider('devstories.views.explorer', storiesProvider);

	// Load initial data
	store.load();

	// Register Commands
	const initCommand = vscode.commands.registerCommand('devstories.init', async () => {
		const success = await executeInit();
		if (success) {
			// Reload store to pick up new files
			await store.load();
		}
	});

	const createEpicCommand = vscode.commands.registerCommand('devstories.createEpic', async () => {
		await executeCreateEpic(store);
	});

	const createStoryCommand = vscode.commands.registerCommand('devstories.createStory', async () => {
		await executeCreateStory(store);
	});

	const quickCaptureCommand = vscode.commands.registerCommand('devstories.quickCapture', async () => {
		await executeQuickCapture(store);
	});

	context.subscriptions.push(watcher, autoTimestamp, statusBarController, initCommand, createEpicCommand, createStoryCommand, quickCaptureCommand);
}

export function deactivate() {}
