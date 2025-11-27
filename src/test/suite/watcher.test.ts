import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Watcher } from '../../core/watcher';

// Helper for visible delays
const delay = (ms: number, msg: string) => {
	console.log(`\n⏳ ${msg}...`);
	return new Promise(resolve => setTimeout(resolve, ms));
};

suite('Watcher Integration Test', () => {
	const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const storiesDir = path.join(workspaceRoot, '.devstories', 'stories');
	const testFile = path.join(storiesDir, 'TEST-001.md');

	setup(async () => {
		console.log('\n🔧 SETUP: Ensuring directories exist...');
		if (!fs.existsSync(storiesDir)) {
			fs.mkdirSync(storiesDir, { recursive: true });
		}
		console.log(`   📁 Directory ready: ${storiesDir}`);
	});

	teardown(async () => {
		console.log('\n🧹 TEARDOWN...');
		if (fs.existsSync(testFile)) {
			fs.unlinkSync(testFile);
			console.log(`   🗑️  Deleted: ${testFile}`);
		}
	});

	test('should detect file creation', async () => {
		console.log('\n📋 TEST: should detect file creation');

		await delay(1000, 'Creating watcher');
		const watcher = new Watcher();
		console.log('   ✅ Watcher created');

		console.log('   👂 Setting up onCreate listener...');
		const createdPromise = new Promise<vscode.Uri>(resolve => {
			watcher.onDidCreate((uri: vscode.Uri) => {
				console.log(`   🔔 onCreate event fired! Path: ${uri.fsPath}`);
				resolve(uri);
			});
		});

		await delay(1500, 'Writing new file to trigger creation event');
		console.log(`   📝 Writing to: ${testFile}`);
		fs.writeFileSync(testFile, '# Test Story');
		console.log('   ✅ File written');

		await delay(500, 'Waiting for creation event');
		const uri = await createdPromise;

		console.log(`   📖 Event URI: ${uri.fsPath}`);
		console.log(`   📖 Expected:  ${testFile}`);
		assert.strictEqual(uri.fsPath, testFile);
		console.log('   ✅ Paths match!');

		watcher.dispose();
	});

	test('should detect file change', async () => {
		console.log('\n📋 TEST: should detect file change');

		await delay(1000, 'Creating initial file');
		fs.writeFileSync(testFile, '# Initial Content');
		console.log(`   ✅ Initial file created: ${testFile}`);

		await delay(1000, 'Creating watcher');
		const watcher = new Watcher();
		console.log('   ✅ Watcher created');

		console.log('   👂 Setting up onChange listener...');
		const changedPromise = new Promise<vscode.Uri>(resolve => {
			watcher.onDidChange((uri: vscode.Uri) => {
				console.log(`   🔔 onChange event fired! Path: ${uri.fsPath}`);
				resolve(uri);
			});
		});

		await delay(1500, 'Letting watcher settle');

		await delay(1500, 'Modifying file to trigger change event');
		console.log('   📝 Updating content: "# Initial Content" -> "# Updated Content"');
		fs.writeFileSync(testFile, '# Updated Content');
		console.log('   ✅ File updated');

		await delay(500, 'Waiting for change event');
		const uri = await changedPromise;

		console.log(`   📖 Event URI: ${uri.fsPath}`);
		assert.strictEqual(uri.fsPath, testFile);
		console.log('   ✅ Change detected correctly!');

		watcher.dispose();
	});

	test('should detect file deletion', async () => {
		console.log('\n📋 TEST: should detect file deletion');

		await delay(1000, 'Creating file to be deleted');
		fs.writeFileSync(testFile, '# To Delete');
		console.log(`   ✅ File created: ${testFile}`);

		await delay(1000, 'Creating watcher');
		const watcher = new Watcher();
		console.log('   ✅ Watcher created');

		console.log('   👂 Setting up onDelete listener...');
		const deletedPromise = new Promise<vscode.Uri>(resolve => {
			watcher.onDidDelete((uri: vscode.Uri) => {
				console.log(`   🔔 onDelete event fired! Path: ${uri.fsPath}`);
				resolve(uri);
			});
		});

		await delay(1500, 'Letting watcher settle');

		await delay(1500, 'Deleting file to trigger deletion event');
		console.log(`   🗑️  Deleting: ${testFile}`);
		fs.unlinkSync(testFile);
		console.log('   ✅ File deleted');

		await delay(500, 'Waiting for deletion event');
		const uri = await deletedPromise;

		console.log(`   📖 Event URI: ${uri.fsPath}`);
		assert.strictEqual(uri.fsPath, testFile);
		console.log('   ✅ Deletion detected correctly!');

		watcher.dispose();
	});
});
