import * as vscode from 'vscode';
import { executeChangeStatus } from './commands/changeStatus';
import { executeCreateEpic } from './commands/createEpic';
import { executeCreateStory } from './commands/createStory';
import { executeInit } from './commands/init';
import { executePickSprint } from './commands/pickSprint';
import { executeQuickCapture } from './commands/quickCapture';
import { executeSaveAsTemplate } from './commands/saveAsTemplate';
import { executeStartRitual } from './commands/startRitual';
import { AutoTimestamp } from './core/autoTimestamp';
import { CadenceService } from './core/cadenceService';
import { ConfigService } from './core/configService';
import { initializeLogger, disposeLogger, getLogger } from './core/logger';
import { SprintFilterService } from './core/sprintFilterService';
import { Store } from './core/store';
import { Watcher } from './core/watcher';
import { StoryHoverProvider } from './providers/storyHoverProvider';
import { StoryLinkProvider } from './providers/storyLinkProvider';
import { BoardViewProvider } from './view/boardView';
import { RitualStatusBarController } from './view/ritualStatusBar';
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
	const cadenceService = new CadenceService(configService);
	const storiesProvider = new StoriesProvider(store, context.extensionPath, configService, sprintFilterService);
	const statusBarController = new StatusBarController(store, configService, sprintFilterService);
	const ritualStatusBarController = new RitualStatusBarController(cadenceService);
	const autoTimestamp = new AutoTimestamp();

	// Initialize config service (loads config and starts watching)
	await configService.initialize();

	// Register Tree Data Provider
	vscode.window.registerTreeDataProvider('devstories.views.explorer', storiesProvider);

	// Register Board View Provider (Webview)
	const boardViewProvider = new BoardViewProvider(context.extensionUri, store, configService, sprintFilterService);
	const boardViewDisposable = vscode.window.registerWebviewViewProvider(
		BoardViewProvider.viewId,
		boardViewProvider
	);

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

	const saveAsTemplateCommand = vscode.commands.registerCommand('devstories.saveAsTemplate', async (story) => {
		await executeSaveAsTemplate(story);
	});

	const changeStatusCommand = vscode.commands.registerCommand('devstories.changeStatus', async (item) => {
		if (item) {
			// Called from context menu with tree item
			const story = store.getStory(item.id);
			const epic = store.getEpic(item.id);
			const target = story || epic;
			if (target) {
				await executeChangeStatus(store, target, configService);
			}
		}
	});

	const pickSprintCommand = vscode.commands.registerCommand('devstories.pickSprint', async () => {
		await executePickSprint(store, sprintFilterService, configService);
	});

	const startRitualCommand = vscode.commands.registerCommand('devstories.startRitual', async () => {
		await executeStartRitual(store, cadenceService);
	});

	const openEpicCommand = vscode.commands.registerCommand('devstories.openEpic', async (item) => {
		if (item) {
			const epic = store.getEpic(item.id);
			if (epic?.filePath) {
				await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(epic.filePath));
			}
		}
	});

	context.subscriptions.push(
		watcher,
		configService,
		sprintFilterService,
		cadenceService,
		autoTimestamp,
		statusBarController,
		ritualStatusBarController,
		boardViewDisposable,
		linkProviderDisposable,
		hoverProviderDisposable,
		initCommand,
		createEpicCommand,
		createStoryCommand,
		quickCaptureCommand,
		saveAsTemplateCommand,
		changeStatusCommand,
		pickSprintCommand,
		startRitualCommand,
		openEpicCommand
	);
}

export function deactivate() {
	disposeLogger();
}
