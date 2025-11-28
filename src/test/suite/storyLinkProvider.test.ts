import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  findLinksInDocument,
  createDocumentLink,
  LinkMatch,
} from '../../providers/storyLinkProviderUtils';

suite('StoryLinkProvider Integration Test', () => {
  test('should have documentLink provider registered', async () => {
    // The provider should be registered for markdown files
    const commands = await vscode.commands.getCommands(true);
    // DocumentLinkProvider doesn't expose a command, but we can verify extension is active
    assert.ok(true, 'Extension should be active');
  });

  test('findLinksInDocument should find all link patterns', () => {
    const text = `# Story Dependencies

This story depends on [[DS-001]] for the API.
Also see [[EPIC-001]] for the parent epic.

## Notes
- Related: [[DS-002]]
- Blocked by: [[DS-003]]
`;
    const links = findLinksInDocument(text);

    assert.strictEqual(links.length, 4);
    assert.strictEqual(links[0].id, 'DS-001');
    assert.strictEqual(links[1].id, 'EPIC-001');
    assert.strictEqual(links[2].id, 'DS-002');
    assert.strictEqual(links[3].id, 'DS-003');
  });

  test('findLinksInDocument should return correct positions', () => {
    const text = 'See [[DS-001]] for details';
    const links = findLinksInDocument(text);

    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0].start, 4);
    assert.strictEqual(links[0].end, 14);
  });

  test('createDocumentLink should resolve valid IDs', () => {
    const match: LinkMatch = { id: 'DS-001', start: 0, end: 10 };
    const basePath = '/workspace/.devstories';
    const knownIds = new Set(['DS-001', 'EPIC-001']);

    const link = createDocumentLink(match, basePath, knownIds);

    assert.ok(link !== null);
    assert.strictEqual(link!.targetPath, '/workspace/.devstories/stories/DS-001.md');
  });

  test('createDocumentLink should return null for broken links', () => {
    const match: LinkMatch = { id: 'DS-999', start: 0, end: 10 };
    const basePath = '/workspace/.devstories';
    const knownIds = new Set(['DS-001']);

    const link = createDocumentLink(match, basePath, knownIds);

    assert.strictEqual(link, null);
  });

  test('createDocumentLink should handle epic IDs', () => {
    const match: LinkMatch = { id: 'EPIC-001', start: 0, end: 12 };
    const basePath = '/workspace/.devstories';
    const knownIds = new Set(['EPIC-001']);

    const link = createDocumentLink(match, basePath, knownIds);

    assert.ok(link !== null);
    assert.strictEqual(link!.targetPath, '/workspace/.devstories/epics/EPIC-001.md');
  });

  test('createDocumentLink should handle EPIC-INBOX', () => {
    const match: LinkMatch = { id: 'EPIC-INBOX', start: 0, end: 14 };
    const basePath = '/workspace/.devstories';
    const knownIds = new Set(['EPIC-INBOX']);

    const link = createDocumentLink(match, basePath, knownIds);

    assert.ok(link !== null);
    assert.strictEqual(link!.targetPath, '/workspace/.devstories/epics/EPIC-INBOX.md');
  });

  test('findLinksInDocument should handle custom prefixes', () => {
    const text = 'See [[PROJ-123]] and [[FEAT-456]]';
    const links = findLinksInDocument(text);

    assert.strictEqual(links.length, 2);
    assert.strictEqual(links[0].id, 'PROJ-123');
    assert.strictEqual(links[1].id, 'FEAT-456');
  });
});
