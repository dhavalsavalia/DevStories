import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { AutoTimestamp } from '../../core/autoTimestamp';

suite('AutoTimestamp Integration Test', () => {
	const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
	const storiesDir = path.join(workspaceRoot, '.devstories', 'stories');
	const testFile = path.join(storiesDir, 'TIMESTAMP-TEST.md');

	let autoTimestamp: AutoTimestamp;

	setup(async () => {
		if (!fs.existsSync(storiesDir)) fs.mkdirSync(storiesDir, { recursive: true });
		
		fs.writeFileSync(testFile, `---
id: TIMESTAMP-TEST
title: Test Story
created: 2025-01-01
---
# Content`);

		autoTimestamp = new AutoTimestamp();
	});

	teardown(async () => {
		autoTimestamp.dispose();
		await vscode.commands.executeCommand('workbench.action.closeAllEditors');
		if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
	});

	test('should update timestamp on save', async () => {
		const doc = await vscode.workspace.openTextDocument(testFile);
		const editor = await vscode.window.showTextDocument(doc);

		// Make a change
		await editor.edit(editBuilder => {
			editBuilder.insert(new vscode.Position(6, 0), 'New Line\n');
		});

		await doc.save();

		// Read file content from disk
		const content = fs.readFileSync(testFile, 'utf-8');
		const today = new Date().toISOString().split('T')[0];
		
		assert.ok(content.includes(`updated: ${today}`), `Content should contain updated: ${today}`);
	});
});
