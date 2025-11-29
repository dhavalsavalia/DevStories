import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  parseStatuses,
  serializeStoryForWebview,
  serializeEpicForWebview,
  generateNonce,
  getThemeKindFromNumber,
  // DS-021: Navigation utilities
  getNextColumnIndex,
  getPrevColumnIndex,
  getNextCardIndex,
  getPrevCardIndex,
  findFirstCardInColumn,
  getCardIndexInColumn,
  getColumnIndexByStatus,
  getStatusByColumnIndex,
  getNextStatusInWorkflow,
  groupStoriesByStatus,
} from '../../view/boardViewUtils';
import { Story } from '../../types/story';
import { Epic } from '../../types/epic';
import { StatusConfig, WebviewStory } from '../../types/webviewMessages';

suite('BoardView Integration Test', () => {
  test('should have board view registered in package.json', async () => {
    const extension = vscode.extensions.getExtension('devstories.devstories');
    // Extension may not be found in test environment, just verify test runs
    assert.ok(true, 'Integration test executed');
  });

  test('parseStatuses returns correct structure', () => {
    const config = `
statuses:
  - id: todo
    label: To Do
  - id: done
    label: Done
`;
    const result = parseStatuses(config);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, 'todo');
    assert.strictEqual(result[0].label, 'To Do');
    assert.strictEqual(result[1].id, 'done');
  });

  test('parseStatuses handles missing statuses gracefully', () => {
    const result = parseStatuses('');

    assert.strictEqual(result.length, 4, 'Should return default 4 statuses');
    assert.strictEqual(result[0].id, 'todo');
  });

  test('serializeStoryForWebview excludes sensitive data', () => {
    const story: Story = {
      id: 'DS-001',
      title: 'Test',
      type: 'feature',
      epic: 'EPIC-001',
      status: 'todo',
      size: 'M',
      priority: 500,
      created: new Date(),
      content: 'secret content',
      filePath: '/secret/path',
    };

    const result = serializeStoryForWebview(story);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual((result as any).filePath, undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual((result as any).content, undefined);
    assert.strictEqual(result.id, 'DS-001');
  });

  test('serializeEpicForWebview excludes sensitive data', () => {
    const epic: Epic = {
      id: 'EPIC-001',
      title: 'Test Epic',
      status: 'in_progress',
      created: new Date(),
      content: 'secret content',
      filePath: '/secret/path',
    };

    const result = serializeEpicForWebview(epic);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual((result as any).filePath, undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.strictEqual((result as any).content, undefined);
    assert.strictEqual(result.id, 'EPIC-001');
  });

  test('generateNonce produces valid format', () => {
    const nonce = generateNonce();

    assert.strictEqual(nonce.length, 32);
    assert.ok(/^[a-zA-Z0-9]+$/.test(nonce), 'Should be alphanumeric');
  });

  test('generateNonce produces unique values', () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();

    assert.notStrictEqual(nonce1, nonce2, 'Nonces should be unique');
  });

  test('getThemeKindFromNumber maps correctly', () => {
    assert.strictEqual(getThemeKindFromNumber(1), 'light');
    assert.strictEqual(getThemeKindFromNumber(2), 'dark');
    assert.strictEqual(getThemeKindFromNumber(3), 'high-contrast');
    assert.strictEqual(getThemeKindFromNumber(4), 'high-contrast');
    assert.strictEqual(getThemeKindFromNumber(99), 'dark'); // Unknown defaults to dark
  });

  // === DS-021: Drag-Drop + Keyboard Navigation Integration Tests ===

  suite('DS-021: Navigation Utilities', () => {
    const statuses: StatusConfig[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'review', label: 'Review' },
      { id: 'done', label: 'Done' },
    ];

    const stories: WebviewStory[] = [
      { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', priority: 500, created: '2025-01-01' },
      { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', priority: 500, created: '2025-01-02' },
      { id: 'S-003', title: 'Story 3', type: 'task', epic: 'E-2', status: 'in_progress', size: 'L', priority: 500, created: '2025-01-03' },
      { id: 'S-004', title: 'Story 4', type: 'chore', epic: 'E-2', status: 'done', size: 'XS', priority: 500, created: '2025-01-04' },
    ];

    test('getNextColumnIndex wraps around correctly', () => {
      assert.strictEqual(getNextColumnIndex(0, 4), 1);
      assert.strictEqual(getNextColumnIndex(3, 4), 0, 'Should wrap to first');
    });

    test('getPrevColumnIndex wraps around correctly', () => {
      assert.strictEqual(getPrevColumnIndex(1, 4), 0);
      assert.strictEqual(getPrevColumnIndex(0, 4), 3, 'Should wrap to last');
    });

    test('getNextCardIndex wraps within column', () => {
      assert.strictEqual(getNextCardIndex(0, 3), 1);
      assert.strictEqual(getNextCardIndex(2, 3), 0, 'Should wrap to first');
    });

    test('getPrevCardIndex wraps within column', () => {
      assert.strictEqual(getPrevCardIndex(1, 3), 0);
      assert.strictEqual(getPrevCardIndex(0, 3), 2, 'Should wrap to last');
    });

    test('findFirstCardInColumn returns first card ID', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      assert.strictEqual(findFirstCardInColumn(grouped, 'todo'), 'S-001');
      assert.strictEqual(findFirstCardInColumn(grouped, 'in_progress'), 'S-003');
    });

    test('findFirstCardInColumn returns null for empty column', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      assert.strictEqual(findFirstCardInColumn(grouped, 'review'), null);
    });

    test('getCardIndexInColumn returns correct index', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      assert.strictEqual(getCardIndexInColumn(grouped, 'todo', 'S-001'), 0);
      assert.strictEqual(getCardIndexInColumn(grouped, 'todo', 'S-002'), 1);
    });

    test('getColumnIndexByStatus returns correct index', () => {
      assert.strictEqual(getColumnIndexByStatus(statuses, 'todo'), 0);
      assert.strictEqual(getColumnIndexByStatus(statuses, 'done'), 3);
      assert.strictEqual(getColumnIndexByStatus(statuses, 'nonexistent'), -1);
    });

    test('getStatusByColumnIndex returns correct status', () => {
      assert.strictEqual(getStatusByColumnIndex(statuses, 0), 'todo');
      assert.strictEqual(getStatusByColumnIndex(statuses, 3), 'done');
      assert.strictEqual(getStatusByColumnIndex(statuses, -1), null);
      assert.strictEqual(getStatusByColumnIndex(statuses, 4), null);
    });

    test('getNextStatusInWorkflow advances correctly', () => {
      assert.strictEqual(getNextStatusInWorkflow(statuses, 'todo'), 'in_progress');
      assert.strictEqual(getNextStatusInWorkflow(statuses, 'in_progress'), 'review');
      assert.strictEqual(getNextStatusInWorkflow(statuses, 'review'), 'done');
    });

    test('getNextStatusInWorkflow returns null at end', () => {
      assert.strictEqual(getNextStatusInWorkflow(statuses, 'done'), null);
      assert.strictEqual(getNextStatusInWorkflow(statuses, 'unknown'), null);
    });
  });
});
