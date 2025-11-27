import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Store } from '../../core/store';
import { Watcher } from '../../core/watcher';

// Helper for visible delays
const delay = (ms: number, msg: string) => {
	console.log(`\n⏳ ${msg}...`);
	return new Promise(resolve => setTimeout(resolve, ms));
};

suite('Store Integration Test', () => {
	const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const storiesDir = path.join(workspaceRoot, '.devstories', 'stories');
	const epicsDir = path.join(workspaceRoot, '.devstories', 'epics');

	const epicFile = path.join(epicsDir, 'EPIC-TEST.md');
	const storyFile = path.join(storiesDir, 'STORY-TEST.md');

	let watcher: Watcher;
	let store: Store;

	setup(async () => {
		console.log('\n🔧 SETUP: Creating test fixtures...');

		// Ensure directories exist
		if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir, { recursive: true });
		if (!fs.existsSync(epicsDir)) fs.mkdirSync(epicsDir, { recursive: true });
		console.log(`   📁 Directories: ${storiesDir}`);
		console.log(`   📁 Directories: ${epicsDir}`);

		await delay(1000, 'Creating epic file');
		// Create sample files
		fs.writeFileSync(epicFile, `---
id: EPIC-TEST
title: Test Epic
status: todo
created: 2025-01-01
---
# Test Epic`);
		console.log(`   ✅ Created: ${epicFile}`);

		await delay(1000, 'Creating story file');
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
		console.log(`   ✅ Created: ${storyFile}`);

		await delay(500, 'Initializing Watcher and Store');
		watcher = new Watcher();
		store = new Store(watcher);
		console.log('   ✅ Watcher and Store initialized');
	});

	teardown(async () => {
		console.log('\n🧹 TEARDOWN: Cleaning up...');
		watcher.dispose();
		if (fs.existsSync(epicFile)) {
			fs.unlinkSync(epicFile);
			console.log(`   🗑️  Deleted: ${epicFile}`);
		}
		if (fs.existsSync(storyFile)) {
			fs.unlinkSync(storyFile);
			console.log(`   🗑️  Deleted: ${storyFile}`);
		}
		await delay(500, 'Cleanup complete');
	});

	test('should load stories and epics', async () => {
		console.log('\n📋 TEST: should load stories and epics');

		await delay(1000, 'Calling store.load()');
		await store.load();
		console.log('   ✅ store.load() completed');

		await delay(1000, 'Checking if epic was loaded');
		const epic = store.getEpic('EPIC-TEST');
		console.log(`   📖 Epic found: ${epic ? 'YES' : 'NO'}`);
		console.log(`   📖 Epic title: "${epic?.title}"`);
		assert.ok(epic, 'Epic should be loaded');
		assert.strictEqual(epic?.title, 'Test Epic');
		console.log('   ✅ Epic assertions passed');

		await delay(1000, 'Checking if story was loaded');
		const story = store.getStory('STORY-TEST');
		console.log(`   📖 Story found: ${story ? 'YES' : 'NO'}`);
		console.log(`   📖 Story title: "${story?.title}"`);
		console.log(`   📖 Story epic: "${story?.epic}"`);
		assert.ok(story, 'Story should be loaded');
		assert.strictEqual(story?.title, 'Test Story');
		assert.strictEqual(story?.epic, 'EPIC-TEST');
		console.log('   ✅ Story assertions passed');
	});

	test('should get stories by epic', async () => {
		console.log('\n📋 TEST: should get stories by epic');

		await delay(1000, 'Loading store');
		await store.load();

		await delay(1000, 'Querying stories by epic ID: EPIC-TEST');
		const stories = store.getStoriesByEpic('EPIC-TEST');
		console.log(`   📖 Stories found: ${stories.length}`);
		stories.forEach(s => console.log(`      - ${s.id}: ${s.title}`));

		assert.strictEqual(stories.length, 1);
		assert.strictEqual(stories[0].id, 'STORY-TEST');
		console.log('   ✅ Assertions passed');
	});

	test('should update on file change', async () => {
		console.log('\n📋 TEST: should update on file change');

		await delay(1000, 'Loading store initially');
		await store.load();
		const storyBefore = store.getStory('STORY-TEST');
		console.log(`   📖 Story title BEFORE: "${storyBefore?.title}"`);

		await delay(2000, 'Waiting for watcher to settle');

		console.log('   👂 Setting up listener for store update event...');
		const updatePromise = new Promise<void>(resolve => {
			const disposable = store.onDidUpdate(() => {
				console.log('   🔔 Store update event received!');
				disposable.dispose();
				resolve();
			});
		});

		await delay(1500, 'Writing updated content to file');
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
		console.log('   ✅ File written with new title: "Updated Story"');

		await delay(500, 'Waiting for update event');
		await updatePromise;

		await delay(1000, 'Verifying store was updated');
		const story = store.getStory('STORY-TEST');
		console.log(`   📖 Story title AFTER: "${story?.title}"`);
		assert.strictEqual(story?.title, 'Updated Story');
		console.log('   ✅ Title changed from "Test Story" to "Updated Story"');
	});
});
