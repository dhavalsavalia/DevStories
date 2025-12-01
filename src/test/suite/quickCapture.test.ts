import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  parseQuickInput,
  truncateForTitle,
  cleanSelectionText,
  INBOX_EPIC_ID,
  OPEN_STORY_ACTION,
} from '../../commands/quickCapture';

suite('QuickCapture Command Integration Test', () => {
  test('should have quickCapture command registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('devstories.quickCapture'));
  });

  test('parseQuickInput should parse plain title', () => {
    const result = parseQuickInput('Add dark mode');
    assert.strictEqual(result.title, 'Add dark mode');
    assert.strictEqual(result.type, 'task');
    assert.strictEqual(result.notes, undefined);
  });

  test('parseQuickInput should parse bug: prefix', () => {
    const result = parseQuickInput('bug: Login fails');
    assert.strictEqual(result.title, 'Login fails');
    assert.strictEqual(result.type, 'bug');
  });

  test('parseQuickInput should parse feat: prefix', () => {
    const result = parseQuickInput('feat: Dark mode');
    assert.strictEqual(result.title, 'Dark mode');
    assert.strictEqual(result.type, 'feature');
  });

  test('parseQuickInput should parse pipe syntax for notes', () => {
    const result = parseQuickInput('Fix login | users report 500');
    assert.strictEqual(result.title, 'Fix login');
    assert.strictEqual(result.notes, 'users report 500');
  });

  test('parseQuickInput should parse type prefix with pipe syntax', () => {
    const result = parseQuickInput('bug: Login error | Details here');
    assert.strictEqual(result.title, 'Login error');
    assert.strictEqual(result.type, 'bug');
    assert.strictEqual(result.notes, 'Details here');
  });

  test('truncateForTitle should truncate long text', () => {
    const text = 'This is a very long title that exceeds the limit';
    const result = truncateForTitle(text, 20);
    assert.ok(result.length <= 20);
    assert.ok(result.endsWith('...'));
  });

  test('cleanSelectionText should remove TODO: prefix', () => {
    const result = cleanSelectionText('TODO: implement feature');
    assert.strictEqual(result, 'implement feature');
  });

  test('cleanSelectionText should remove // comment prefix', () => {
    const result = cleanSelectionText('// this is a comment');
    assert.strictEqual(result, 'this is a comment');
  });

  test('INBOX_EPIC_ID should be EPIC-INBOX', () => {
    assert.strictEqual(INBOX_EPIC_ID, 'EPIC-INBOX');
  });

  test('OPEN_STORY_ACTION should be "Open Story"', () => {
    assert.strictEqual(OPEN_STORY_ACTION, 'Open Story');
  });
});
