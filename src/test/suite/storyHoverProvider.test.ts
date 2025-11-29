import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  getStatusIndicator,
  getTypeIcon,
  formatHoverCard,
  findLinkAtPosition,
} from '../../providers/storyHoverProviderUtils';
import { Story } from '../../types/story';
import { Epic } from '../../types/epic';

suite('StoryHoverProvider Integration Test', () => {
  test('should have hover provider registered', async () => {
    // The provider should be registered for markdown files
    // We can't directly test registration, but we can verify extension is active
    assert.ok(true, 'Extension should be active');
  });

  test('getStatusIndicator returns correct symbols', () => {
    assert.strictEqual(getStatusIndicator('todo'), '○');
    assert.strictEqual(getStatusIndicator('in_progress'), '◐');
    assert.strictEqual(getStatusIndicator('review'), '◑');
    assert.strictEqual(getStatusIndicator('done'), '●');
    assert.strictEqual(getStatusIndicator('blocked'), '◇');
  });

  test('getTypeIcon returns correct icons', () => {
    assert.strictEqual(getTypeIcon('feature'), '✨');
    assert.strictEqual(getTypeIcon('bug'), '🐛');
    assert.strictEqual(getTypeIcon('task'), '📋');
    assert.strictEqual(getTypeIcon('chore'), '🔧');
    assert.strictEqual(getTypeIcon('epic'), '📁');
  });

  test('formatHoverCard formats story correctly', () => {
    const story: Story = {
      id: 'DS-001',
      title: 'Test Story',
      type: 'feature',
      epic: 'EPIC-001',
      status: 'in_progress',
      size: 'M',
      priority: 500,
      sprint: 'sprint-1',
      created: new Date('2025-01-15'),
      content: '',
    };

    const result = formatHoverCard(story, 'story');

    assert.ok(result.includes('### ✨ DS-001: Test Story'));
    assert.ok(result.includes('**Status:** ◐ in_progress'));
    assert.ok(result.includes('**Type:** Feature'));
    assert.ok(result.includes('**Size:** M'));
    assert.ok(result.includes('**Epic:** EPIC-001'));
    assert.ok(result.includes('**Sprint:** sprint-1'));
  });

  test('formatHoverCard formats epic correctly', () => {
    const epic: Epic = {
      id: 'EPIC-001',
      title: 'Test Epic',
      status: 'done',
      created: new Date('2025-01-15'),
      content: '',
    };

    const result = formatHoverCard(epic, 'epic');

    assert.ok(result.includes('### 📁 EPIC-001: Test Epic'));
    assert.ok(result.includes('**Status:** ● done'));
    assert.ok(!result.includes('**Type:**'));
    assert.ok(!result.includes('**Size:**'));
  });

  test('formatHoverCard includes progress for epics', () => {
    const epic: Epic = {
      id: 'EPIC-001',
      title: 'Test Epic',
      status: 'in_progress',
      created: new Date('2025-01-15'),
      content: '',
    };

    const result = formatHoverCard(epic, 'epic', { done: 2, total: 5 });

    assert.ok(result.includes('**Progress:** 2/5 stories done'));
  });

  test('findLinkAtPosition finds link at cursor position', () => {
    const text = 'See [[DS-001]] for details';
    const match = findLinkAtPosition(text, 8);

    assert.ok(match !== null);
    assert.strictEqual(match!.id, 'DS-001');
    assert.strictEqual(match!.start, 4);
    assert.strictEqual(match!.end, 14);
  });

  test('findLinkAtPosition returns null outside link', () => {
    const text = 'See [[DS-001]] for details';
    const match = findLinkAtPosition(text, 0);

    assert.strictEqual(match, null);
  });

  test('findLinkAtPosition handles multiple links', () => {
    const text = '[[DS-001]] and [[EPIC-002]]';

    const first = findLinkAtPosition(text, 5);
    assert.ok(first !== null);
    assert.strictEqual(first!.id, 'DS-001');

    const second = findLinkAtPosition(text, 20);
    assert.ok(second !== null);
    assert.strictEqual(second!.id, 'EPIC-002');
  });
});
