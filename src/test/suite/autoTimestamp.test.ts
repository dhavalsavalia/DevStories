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
type: feature
epic: EPIC-TEST
status: todo
size: S
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
			editBuilder.insert(new vscode.Position(10, 0), 'New Line\n');
		});

		await doc.save();

		// Read file content from disk
		const content = fs.readFileSync(testFile, 'utf-8');
		const today = new Date().toISOString().split('T')[0];

		// Verify updated field exists
		assert.ok(content.includes(`updated: ${today}`), `Content should contain updated: ${today}`);

		// Verify updated is on its own line (not concatenated with created)
		const lines = content.split('\n');
		const updatedLine = lines.find(line => line.startsWith('updated:'));
		assert.ok(updatedLine, 'Should have a line starting with updated:');
		assert.strictEqual(updatedLine, `updated: ${today}`, 'updated line should be clean');

		// Verify created line is not corrupted
		const createdLine = lines.find(line => line.startsWith('created:'));
		assert.ok(createdLine, 'Should have a line starting with created:');
		assert.ok(!createdLine.includes('updated'), 'created line should not contain updated');
	});
});
