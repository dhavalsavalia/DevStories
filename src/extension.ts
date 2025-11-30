import * as vscode from 'vscode';
import { executeChangeStatus } from './commands/changeStatus';
import { executeCreateEpic } from './commands/createEpic';
import { executeCreateStory } from './commands/createStory';
import { wrapCommand } from './commands/errorHandler';
import { executeInit } from './commands/init';
import { executePickSprint } from './commands/pickSprint';
import { executeQuickCapture } from './commands/quickCapture';
import { executeSaveAsTemplate } from './commands/saveAsTemplate';
import { AutoTimestamp } from './core/autoTimestamp';
import { ConfigService } from './core/configService';
import { initializeLogger, disposeLogger } from './core/logger';
import { SprintFilterService } from './core/sprintFilterService';
import { Store } from './core/store';
import { Watcher } from './core/watcher';
import { StoryHoverProvider } from './providers/storyHoverProvider';
import { StoryLinkProvider } from './providers/storyLinkProvider';
import { StatusBarController } from './view/statusBar';
import { StoriesProvider } from './view/storiesProvider';

export async function activate(context: vscode.ExtensionContext) {
	// Initialize logger first
	const logger = initializeLogger();
	logger.info('DevStories is now active!');

	// Initialize Core Components
	const watcher = new Watcher();
	const store = new Store(watcher);
	const configService = new ConfigService();
	const sprintFilterService = new SprintFilterService();
	const storiesProvider = new StoriesProvider(store, context.extensionPath, configService, sprintFilterService);
	const statusBarController = new StatusBarController(store, configService, sprintFilterService);
	const autoTimestamp = new AutoTimestamp();

	// Initialize config service (loads config and starts watching)
	await configService.initialize();

	// Register Tree Data Provider
	vscode.window.registerTreeDataProvider('devstories.views.explorer', storiesProvider);

	// Register Document Link Provider for [[ID]] links
	const storyLinkProvider = new StoryLinkProvider(store);
	const linkProviderDisposable = vscode.languages.registerDocumentLinkProvider(
		{ language: 'markdown', scheme: 'file' },
		storyLinkProvider
	);

	// Register Hover Provider for [[ID]] preview
	const storyHoverProvider = new StoryHoverProvider(store);
	const hoverProviderDisposable = vscode.languages.registerHoverProvider(
		{ language: 'markdown', scheme: 'file' },
		storyHoverProvider
	);

	// Load initial data and wait for completion
	await store.load();

	// Register Commands with error handling
	const initCommand = vscode.commands.registerCommand('devstories.init',
		wrapCommand('init', async () => {
			const success = await executeInit();
			if (success) {
				// Reload store to pick up new files
				await store.load();
			}
		})
	);

	const createEpicCommand = vscode.commands.registerCommand('devstories.createEpic',
		wrapCommand('createEpic', async () => {
			await executeCreateEpic(store);
		})
	);

	const createStoryCommand = vscode.commands.registerCommand('devstories.createStory',
		wrapCommand('createStory', async () => {
			await executeCreateStory(store);
		})
	);

	const quickCaptureCommand = vscode.commands.registerCommand('devstories.quickCapture',
		wrapCommand('quickCapture', async () => {
			await executeQuickCapture(store);
		})
	);

	const saveAsTemplateCommand = vscode.commands.registerCommand('devstories.saveAsTemplate',
		wrapCommand('saveAsTemplate', async (story) => {
			await executeSaveAsTemplate(story);
		})
	);

	const changeStatusCommand = vscode.commands.registerCommand('devstories.changeStatus',
		wrapCommand('changeStatus', async (item) => {
			if (item) {
				// Called from context menu with tree item
				const story = store.getStory(item.id);
				const epic = store.getEpic(item.id);
				const target = story || epic;
				if (target) {
					await executeChangeStatus(store, target, configService);
				}
			}
		})
	);

	const pickSprintCommand = vscode.commands.registerCommand('devstories.pickSprint',
		wrapCommand('pickSprint', async () => {
			await executePickSprint(store, sprintFilterService, configService);
		})
	);

	const openEpicCommand = vscode.commands.registerCommand('devstories.openEpic',
		wrapCommand('openEpic', async (item) => {
			if (item) {
				const epic = store.getEpic(item.id);
				if (epic?.filePath) {
					await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(epic.filePath));
				}
			}
		})
	);

	context.subscriptions.push(
		watcher,
		configService,
		sprintFilterService,
		autoTimestamp,
		statusBarController,
		linkProviderDisposable,
		hoverProviderDisposable,
		initCommand,
		createEpicCommand,
		createStoryCommand,
		quickCaptureCommand,
		saveAsTemplateCommand,
		changeStatusCommand,
		pickSprintCommand,
		openEpicCommand
	);
}

export function deactivate() {
	disposeLogger();
}
