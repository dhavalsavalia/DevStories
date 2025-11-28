import * as vscode from 'vscode';
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
	let disposable = vscode.commands.registerCommand('devstories.init', () => {
		vscode.window.showInformationMessage('DevStories: Init command triggered');
	});

	context.subscriptions.push(watcher, autoTimestamp, statusBarController, disposable);
}

export function deactivate() {}
