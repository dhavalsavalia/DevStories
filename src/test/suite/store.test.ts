import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Store } from '../../core/store';
import { Watcher } from '../../core/watcher';

suite('Store Integration Test', () => {
	const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const storiesDir = path.join(workspaceRoot, '.devstories', 'stories');
	const epicsDir = path.join(workspaceRoot, '.devstories', 'epics');
	
	const epicFile = path.join(epicsDir, 'EPIC-TEST.md');
	const storyFile = path.join(storiesDir, 'STORY-TEST.md');

	let watcher: Watcher;
	let store: Store;

	setup(async () => {
		// Ensure directories exist
		if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir, { recursive: true });
		if (!fs.existsSync(epicsDir)) fs.mkdirSync(epicsDir, { recursive: true });

		// Create sample files
		fs.writeFileSync(epicFile, `---
id: EPIC-TEST
title: Test Epic
status: todo
created: 2025-01-01
---
# Test Epic`);

		fs.writeFileSync(storyFile, `---
id: STORY-TEST
title: Test Story
type: feature
epic: EPIC-TEST
status: todo
size: S
created: 2025-01-01
---
# Test Story`);

		watcher = new Watcher();
		store = new Store(watcher);
	});

	teardown(() => {
		watcher.dispose();
		if (fs.existsSync(epicFile)) fs.unlinkSync(epicFile);
		if (fs.existsSync(storyFile)) fs.unlinkSync(storyFile);
	});

	test('should load stories and epics', async () => {
		await store.load();

		const epic = store.getEpic('EPIC-TEST');
		assert.ok(epic, 'Epic should be loaded');
		assert.strictEqual(epic?.title, 'Test Epic');

		const story = store.getStory('STORY-TEST');
		assert.ok(story, 'Story should be loaded');
		assert.strictEqual(story?.title, 'Test Story');
		assert.strictEqual(story?.epic, 'EPIC-TEST');
	});

	test('should get stories by epic', async () => {
		await store.load();
		const stories = store.getStoriesByEpic('EPIC-TEST');
		assert.strictEqual(stories.length, 1);
		assert.strictEqual(stories[0].id, 'STORY-TEST');
	});

	test('should update on file change', async () => {
		await store.load();

        // Wait for initial watcher events to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

		const updatePromise = new Promise<void>(resolve => {
            const disposable = store.onDidUpdate(() => {
                disposable.dispose();
                resolve();
            });
		});

		// Update story title
        const newContent = `---
id: STORY-TEST
title: Updated Story
type: feature
epic: EPIC-TEST
status: todo
size: S
created: 2025-01-01
---
# Test Story`;
        await vscode.workspace.fs.writeFile(vscode.Uri.file(storyFile), Buffer.from(newContent));

		await updatePromise;

		const story = store.getStory('STORY-TEST');
		assert.strictEqual(story?.title, 'Updated Story');
	});
});
