import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Watcher } from '../../core/watcher';

suite('Watcher Integration Test', () => {
	const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const storiesDir = path.join(workspaceRoot, '.devstories', 'stories');
	const testFile = path.join(storiesDir, 'TEST-001.md');

	setup(async () => {
		// Ensure directory exists
		if (!fs.existsSync(storiesDir)) {
			fs.mkdirSync(storiesDir, { recursive: true });
		}
	});

	teardown(() => {
		if (fs.existsSync(testFile)) {
			fs.unlinkSync(testFile);
		}
	});

	test('should detect file creation', async () => {
		const watcher = new Watcher();
		
		const createdPromise = new Promise<vscode.Uri>(resolve => {
			watcher.onDidCreate((uri: vscode.Uri) => resolve(uri));
		});

		fs.writeFileSync(testFile, '# Test Story');

		const uri = await createdPromise;
		assert.strictEqual(uri.fsPath, testFile);
		watcher.dispose();
	});

	test('should detect file change', async () => {
		fs.writeFileSync(testFile, '# Initial Content');
		const watcher = new Watcher();

		const changedPromise = new Promise<vscode.Uri>(resolve => {
			watcher.onDidChange((uri: vscode.Uri) => resolve(uri));
		});

		// Wait a bit to ensure watcher is ready and file system settles
		await new Promise(r => setTimeout(r, 500));

		fs.writeFileSync(testFile, '# Updated Content');

		const uri = await changedPromise;
		assert.strictEqual(uri.fsPath, testFile);
		watcher.dispose();
	});

	test('should detect file deletion', async () => {
		fs.writeFileSync(testFile, '# To Delete');
		const watcher = new Watcher();

		const deletedPromise = new Promise<vscode.Uri>(resolve => {
			watcher.onDidDelete((uri: vscode.Uri) => resolve(uri));
		});

		// Wait a bit
		await new Promise(r => setTimeout(r, 500));

		fs.unlinkSync(testFile);

		const uri = await deletedPromise;
		assert.strictEqual(uri.fsPath, testFile);
		watcher.dispose();
	});
});
