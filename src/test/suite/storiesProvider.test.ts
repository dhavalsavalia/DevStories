import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Store } from '../../core/store';
import { Watcher } from '../../core/watcher';
import { StoriesProvider } from '../../view/storiesProvider';

suite('StoriesProvider Test Suite', () => {
	const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const storiesDir = path.join(workspaceRoot, '.devstories', 'stories');
	const epicsDir = path.join(workspaceRoot, '.devstories', 'epics');
	
	const epicFile = path.join(epicsDir, 'EPIC-VIEW.md');
	const storyFile = path.join(storiesDir, 'STORY-VIEW.md');

	let watcher: Watcher;
	let store: Store;
    let provider: StoriesProvider;

	setup(async () => {
		// Ensure directories exist
		if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir, { recursive: true });
		if (!fs.existsSync(epicsDir)) fs.mkdirSync(epicsDir, { recursive: true });

		// Create sample files
		fs.writeFileSync(epicFile, `---
id: EPIC-VIEW
title: View Epic
status: todo
created: 2025-01-01
---
# View Epic`);

		fs.writeFileSync(storyFile, `---
id: STORY-VIEW
title: View Story
type: feature
epic: EPIC-VIEW
status: todo
size: S
created: 2025-01-01
---
# View Story`);

		watcher = new Watcher();
		store = new Store(watcher);
        provider = new StoriesProvider(store);
        await store.load();
	});

	teardown(() => {
		watcher.dispose();
		if (fs.existsSync(epicFile)) fs.unlinkSync(epicFile);
		if (fs.existsSync(storyFile)) fs.unlinkSync(storyFile);
	});

	test('should return epics as root children', async () => {
		const children = await provider.getChildren();
        const epic = children.find(c => c.id === 'EPIC-VIEW');
		assert.ok(epic, 'Epic should be found in root children');
	});

    test('should return stories as children of epic', async () => {
        const epics = await provider.getChildren();
        const epic = epics.find(c => c.id === 'EPIC-VIEW');
        assert.ok(epic, 'Epic should be found');

        if (epic) {
            const stories = await provider.getChildren(epic);
            const story = stories.find(s => s.id === 'STORY-VIEW');
            assert.ok(story, 'Story should be found in epic children');
        }
    });

    test('should return correct tree item for epic', async () => {
        const epics = await provider.getChildren();
        const epic = epics.find(c => c.id === 'EPIC-VIEW');
        
        if (epic) {
            const treeItem = provider.getTreeItem(epic);
            assert.strictEqual(treeItem.label, 'EPIC-VIEW: View Epic');
            assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
            assert.strictEqual(treeItem.contextValue, 'epic');
        }
    });

    test('should return correct tree item for story', async () => {
        const epics = await provider.getChildren();
        const epic = epics.find(c => c.id === 'EPIC-VIEW');
        
        if (epic) {
            const stories = await provider.getChildren(epic);
            const story = stories.find(s => s.id === 'STORY-VIEW');
            
            if (story) {
                const treeItem = provider.getTreeItem(story);
                assert.strictEqual(treeItem.label, 'STORY-VIEW: View Story');
                assert.strictEqual(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
                assert.strictEqual(treeItem.contextValue, 'story');
                assert.ok(treeItem.command, 'Story should have a command');
                assert.strictEqual(treeItem.command?.command, 'vscode.open');
            }
        }
    });
});
