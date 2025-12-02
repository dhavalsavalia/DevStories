import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  CONTEXT_KEY_HAS_DEVSTORIES_FOLDER,
  CONTEXT_KEY_HAS_EPICS,
  WelcomeState,
  determineWelcomeState
} from '../../core/welcomeContext';

suite('Welcome Context Integration Test', () => {
  test('CONTEXT_KEY_HAS_DEVSTORIES_FOLDER should be correct', () => {
    assert.strictEqual(CONTEXT_KEY_HAS_DEVSTORIES_FOLDER, 'devstories:hasDevstoriesFolder');
  });

  test('CONTEXT_KEY_HAS_EPICS should be correct', () => {
    assert.strictEqual(CONTEXT_KEY_HAS_EPICS, 'devstories:hasEpics');
  });

  test('determineWelcomeState should return NoFolder when no folder', () => {
    const state = determineWelcomeState(false, 0);
    assert.strictEqual(state, WelcomeState.NoFolder);
  });

  test('determineWelcomeState should return NoEpics when folder but no epics', () => {
    const state = determineWelcomeState(true, 0);
    assert.strictEqual(state, WelcomeState.NoEpics);
  });

  test('determineWelcomeState should return HasContent when has epics', () => {
    const state = determineWelcomeState(true, 3);
    assert.strictEqual(state, WelcomeState.HasContent);
  });

  test('viewsWelcome should be defined in package.json', async () => {
    // Get extension
    const extension = vscode.extensions.getExtension('devstories.devstories');
    assert.ok(extension, 'Extension should be installed');

    const packageJson = extension.packageJSON;
    assert.ok(packageJson.contributes.viewsWelcome, 'viewsWelcome should be defined');
    assert.ok(Array.isArray(packageJson.contributes.viewsWelcome), 'viewsWelcome should be array');
    assert.strictEqual(packageJson.contributes.viewsWelcome.length, 2, 'Should have 2 welcome items');
  });

  test('first welcome item should be for no folder state', async () => {
    const extension = vscode.extensions.getExtension('devstories.devstories');
    assert.ok(extension);

    const welcome = extension.packageJSON.contributes.viewsWelcome[0];
    assert.strictEqual(welcome.view, 'devstories.views.explorer');
    assert.ok(welcome.contents.includes('markdown files'));
    assert.ok(welcome.contents.includes('Initialize DevStories'));
    assert.strictEqual(welcome.when, '!devstories:hasDevstoriesFolder');
  });

  test('second welcome item should be for no epics state', async () => {
    const extension = vscode.extensions.getExtension('devstories.devstories');
    assert.ok(extension);

    const welcome = extension.packageJSON.contributes.viewsWelcome[1];
    assert.strictEqual(welcome.view, 'devstories.views.explorer');
    assert.ok(welcome.contents.includes('Create Your First Epic'));
    assert.strictEqual(welcome.when, 'devstories:hasDevstoriesFolder && !devstories:hasEpics');
  });
});
