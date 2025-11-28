import * as vscode from 'vscode';
import { executeInit } from './commands/init';
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

	context.subscriptions.push(watcher, autoTimestamp, statusBarController, initCommand);
}

export function deactivate() {}
