import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import {
  LINK_PATTERN,
  extractLinks,
  isStoryId,
  isEpicId,
  resolveLinkPath,
  validateLinks,
} from '../../utils/linkResolver';

suite('LinkResolver Integration Test', () => {
  test('LINK_PATTERN should match story IDs in document', () => {
    const text = 'This story depends on [[STORY-001]] and [[STORY-002]]';
    const links = extractLinks(text);
    assert.strictEqual(links.length, 2);
    assert.strictEqual(links[0], 'STORY-001');
    assert.strictEqual(links[1], 'STORY-002');
  });

  test('extractLinks should find links in markdown content', () => {
    const content = `
# Story Title

## Dependencies
- [[STORY-001]] - Login functionality
- [[EPIC-001]] - Parent epic

See also [[STORY-003]] for related work.
    `;
    const links = extractLinks(content);
    assert.deepStrictEqual(links, ['STORY-001', 'EPIC-001', 'STORY-003']);
  });

  test('isStoryId should correctly identify story IDs', () => {
    assert.strictEqual(isStoryId('STORY-001'), true);
    assert.strictEqual(isStoryId('DS-001'), true);
    assert.strictEqual(isStoryId('FEAT-001'), true);
    assert.strictEqual(isStoryId('EPIC-001'), false);
  });

  test('isEpicId should correctly identify epic IDs', () => {
    assert.strictEqual(isEpicId('EPIC-001'), true);
    assert.strictEqual(isEpicId('EPIC-INBOX'), true);
    assert.strictEqual(isEpicId('STORY-001'), false);
    assert.strictEqual(isEpicId('DS-001'), false);
  });

  test('resolveLinkPath should build correct paths', () => {
    const basePath = '/workspace/.devstories';

    const storyPath = resolveLinkPath('STORY-001', basePath);
    assert.strictEqual(storyPath, path.join(basePath, 'stories', 'STORY-001.md'));

    const epicPath = resolveLinkPath('EPIC-001', basePath);
    assert.strictEqual(epicPath, path.join(basePath, 'epics', 'EPIC-001.md'));
  });

  test('validateLinks should identify broken links', () => {
    const knownIds = new Set(['STORY-001', 'STORY-002', 'EPIC-001']);
    const links = ['STORY-001', 'STORY-999', 'EPIC-001', 'EPIC-999'];

    const broken = validateLinks(links, knownIds);
    assert.deepStrictEqual(broken, ['STORY-999', 'EPIC-999']);
  });

  test('validateLinks should return empty for all valid links', () => {
    const knownIds = new Set(['STORY-001', 'EPIC-001']);
    const links = ['STORY-001', 'EPIC-001'];

    const broken = validateLinks(links, knownIds);
    assert.deepStrictEqual(broken, []);
  });

  test('LINK_PATTERN should handle EPIC-INBOX', () => {
    const text = 'Quick captures go to [[EPIC-INBOX]]';
    const links = extractLinks(text);
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0], 'EPIC-INBOX');
  });
});
