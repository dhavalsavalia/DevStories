/**
 * Unit tests for boardView utilities
 * TDD: Write tests first, then implement
 */

import { describe, it, expect } from 'vitest';
import {
  parseStatuses,
  serializeStoryForWebview,
  serializeEpicForWebview,
  generateNonce,
  formatDate,
  getTypeIcon,
  groupStoriesByStatus,
  getStoriesForColumn,
} from '../../view/boardViewUtils';
import { Story } from '../../types/story';
import { Epic } from '../../types/epic';
import { WebviewStory, StatusConfig } from '../../types/webviewMessages';

describe('boardViewUtils', () => {
  describe('parseStatuses', () => {
    it('should parse statuses from config yaml content', () => {
      const config = `
statuses:
  - id: todo
    label: To Do
  - id: done
    label: Done
`;
      const result = parseStatuses(config);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'todo', label: 'To Do' });
      expect(result[1]).toEqual({ id: 'done', label: 'Done' });
    });

    it('should include optional color field', () => {
      const config = `
statuses:
  - id: todo
    label: To Do
    color: "#3B82F6"
`;
      const result = parseStatuses(config);
      expect(result[0].color).toBe('#3B82F6');
    });

    it('should return default statuses if parsing fails', () => {
      const result = parseStatuses('invalid yaml {{{{');
      expect(result).toHaveLength(4);
      expect(result.map(s => s.id)).toEqual(['todo', 'in_progress', 'review', 'done']);
    });

    it('should return default statuses if statuses array missing', () => {
      const config = `
project: Test
id_prefix:
  story: DS
`;
      const result = parseStatuses(config);
      expect(result).toHaveLength(4);
      expect(result[0].id).toBe('todo');
    });

    it('should return default statuses for empty string', () => {
      const result = parseStatuses('');
      expect(result).toHaveLength(4);
    });

    it('should handle statuses with missing label', () => {
      const config = `
statuses:
  - id: todo
  - id: done
    label: Done
`;
      const result = parseStatuses(config);
      expect(result).toHaveLength(2);
      // Missing label uses id as label
      expect(result[0].label).toBe('todo');
      expect(result[1].label).toBe('Done');
    });
  });

  describe('serializeStoryForWebview', () => {
    const baseStory: Story = {
      id: 'DS-001',
      title: 'Test Story',
      type: 'feature',
      epic: 'EPIC-001',
      status: 'todo',
      size: 'M',
      created: new Date('2025-01-15'),
      content: 'Some markdown content',
    };

    it('should exclude filePath from serialization', () => {
      const story: Story = { ...baseStory, filePath: '/secret/path/DS-001.md' };
      const result = serializeStoryForWebview(story);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).filePath).toBeUndefined();
    });

    it('should exclude content from serialization', () => {
      const result = serializeStoryForWebview(baseStory);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).content).toBeUndefined();
    });

    it('should serialize dates as ISO date strings (YYYY-MM-DD)', () => {
      const result = serializeStoryForWebview(baseStory);
      expect(result.created).toBe('2025-01-15');
    });

    it('should include updated date if present', () => {
      const story: Story = { ...baseStory, updated: new Date('2025-01-20') };
      const result = serializeStoryForWebview(story);
      expect(result.updated).toBe('2025-01-20');
    });

    it('should not include updated if not present', () => {
      const result = serializeStoryForWebview(baseStory);
      expect(result.updated).toBeUndefined();
    });

    it('should include sprint if present', () => {
      const story: Story = { ...baseStory, sprint: 'sprint-1' };
      const result = serializeStoryForWebview(story);
      expect(result.sprint).toBe('sprint-1');
    });

    it('should include assignee if present', () => {
      const story: Story = { ...baseStory, assignee: 'john' };
      const result = serializeStoryForWebview(story);
      expect(result.assignee).toBe('john');
    });

    it('should include dependencies if present', () => {
      const story: Story = { ...baseStory, dependencies: ['DS-002', 'DS-003'] };
      const result = serializeStoryForWebview(story);
      expect(result.dependencies).toEqual(['DS-002', 'DS-003']);
    });

    it('should preserve all required fields', () => {
      const result = serializeStoryForWebview(baseStory);
      expect(result.id).toBe('DS-001');
      expect(result.title).toBe('Test Story');
      expect(result.type).toBe('feature');
      expect(result.epic).toBe('EPIC-001');
      expect(result.status).toBe('todo');
      expect(result.size).toBe('M');
    });
  });

  describe('serializeEpicForWebview', () => {
    const baseEpic: Epic = {
      id: 'EPIC-001',
      title: 'Test Epic',
      status: 'in_progress',
      created: new Date('2025-01-15'),
      content: 'Epic content here',
    };

    it('should exclude filePath from serialization', () => {
      const epic: Epic = { ...baseEpic, filePath: '/secret/path/EPIC-001.md' };
      const result = serializeEpicForWebview(epic);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).filePath).toBeUndefined();
    });

    it('should exclude content from serialization', () => {
      const result = serializeEpicForWebview(baseEpic);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any).content).toBeUndefined();
    });

    it('should include sprint if present', () => {
      const epic: Epic = { ...baseEpic, sprint: 'sprint-1' };
      const result = serializeEpicForWebview(epic);
      expect(result.sprint).toBe('sprint-1');
    });

    it('should preserve all required fields', () => {
      const result = serializeEpicForWebview(baseEpic);
      expect(result.id).toBe('EPIC-001');
      expect(result.title).toBe('Test Epic');
      expect(result.status).toBe('in_progress');
    });
  });

  describe('generateNonce', () => {
    it('should generate 32-character string', () => {
      const nonce = generateNonce();
      expect(nonce).toHaveLength(32);
    });

    it('should generate alphanumeric string only', () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^[a-zA-Z0-9]{32}$/);
    });

    it('should generate unique values on each call', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      const nonce3 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce2).not.toBe(nonce3);
      expect(nonce1).not.toBe(nonce3);
    });
  });

  describe('formatDate', () => {
    it('should format Date to YYYY-MM-DD string', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('2025-01-15');
    });

    it('should handle dates at year boundary', () => {
      const date = new Date('2024-12-31T23:59:59Z');
      const result = formatDate(date);
      expect(result).toBe('2024-12-31');
    });

    it('should handle dates at start of year', () => {
      const date = new Date('2025-01-01T00:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('2025-01-01');
    });
  });

  describe('getTypeIcon', () => {
    it('should return sparkles for feature', () => {
      expect(getTypeIcon('feature')).toBe('✨');
    });

    it('should return bug for bug', () => {
      expect(getTypeIcon('bug')).toBe('🐛');
    });

    it('should return wrench for task', () => {
      expect(getTypeIcon('task')).toBe('🔧');
    });

    it('should return broom for chore', () => {
      expect(getTypeIcon('chore')).toBe('🧹');
    });

    it('should return document for unknown type', () => {
      expect(getTypeIcon('unknown')).toBe('📄');
    });
  });

  describe('groupStoriesByStatus', () => {
    const statuses: StatusConfig[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'done', label: 'Done' },
    ];

    const stories: WebviewStory[] = [
      { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01' },
      { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02' },
      { id: 'S-003', title: 'Story 3', type: 'task', epic: 'E-2', status: 'in_progress', size: 'L', created: '2025-01-03' },
      { id: 'S-004', title: 'Story 4', type: 'chore', epic: 'E-2', status: 'done', size: 'XS', created: '2025-01-04' },
    ];

    it('should group stories by status id', () => {
      const result = groupStoriesByStatus(stories, statuses);
      expect(Object.keys(result)).toHaveLength(3);
      expect(result.todo).toHaveLength(2);
      expect(result.in_progress).toHaveLength(1);
      expect(result.done).toHaveLength(1);
    });

    it('should create empty arrays for statuses with no stories', () => {
      const emptyStories: WebviewStory[] = [];
      const result = groupStoriesByStatus(emptyStories, statuses);
      expect(result.todo).toEqual([]);
      expect(result.in_progress).toEqual([]);
      expect(result.done).toEqual([]);
    });

    it('should ignore stories with unknown status', () => {
      const storiesWithUnknown: WebviewStory[] = [
        { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'unknown_status', size: 'M', created: '2025-01-01' },
        { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02' },
      ];
      const result = groupStoriesByStatus(storiesWithUnknown, statuses);
      expect(result.todo).toHaveLength(1);
      expect(result.unknown_status).toBeUndefined();
    });

    it('should handle empty statuses array', () => {
      const result = groupStoriesByStatus(stories, []);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('getStoriesForColumn', () => {
    const statuses: StatusConfig[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'done', label: 'Done' },
    ];

    const stories: WebviewStory[] = [
      { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01' },
      { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02' },
      { id: 'S-003', title: 'Story 3', type: 'task', epic: 'E-2', status: 'in_progress', size: 'L', created: '2025-01-03' },
      { id: 'S-004', title: 'Story 4', type: 'chore', epic: 'E-2', status: 'done', size: 'XS', created: '2025-01-04' },
    ];

    it('should return stories for specified status', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      expect(getStoriesForColumn(grouped, 'todo')).toHaveLength(2);
      expect(getStoriesForColumn(grouped, 'in_progress')).toHaveLength(1);
      expect(getStoriesForColumn(grouped, 'done')).toHaveLength(1);
    });

    it('should return empty array for non-existent status', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      expect(getStoriesForColumn(grouped, 'nonexistent')).toEqual([]);
    });
  });
});
