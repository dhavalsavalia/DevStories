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
  // DS-021: Drag-Drop + Keyboard Navigation
  getNextColumnIndex,
  getPrevColumnIndex,
  getNextCardIndex,
  getPrevCardIndex,
  findFirstCardInColumn,
  getCardIndexInColumn,
  getColumnIndexByStatus,
  getStatusByColumnIndex,
  getNextStatusInWorkflow,
  // DS-023: Filter Utilities
  DEFAULT_FILTER_STATE,
  extractSprints,
  extractAssignees,
  filterStories,
  hasActiveFilters,
  countActiveFilters,
} from '../../view/boardViewUtils';
import { Story } from '../../types/story';
import { Epic } from '../../types/epic';
import { WebviewStory, WebviewEpic, StatusConfig, FilterState } from '../../types/webviewMessages';

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

  // === DS-021: Drag-Drop + Keyboard Navigation Tests ===

  describe('getNextColumnIndex', () => {
    it('should return next column index', () => {
      expect(getNextColumnIndex(0, 4)).toBe(1);
      expect(getNextColumnIndex(1, 4)).toBe(2);
    });

    it('should wrap around to first column at end', () => {
      expect(getNextColumnIndex(3, 4)).toBe(0);
    });

    it('should handle single column', () => {
      expect(getNextColumnIndex(0, 1)).toBe(0);
    });
  });

  describe('getPrevColumnIndex', () => {
    it('should return previous column index', () => {
      expect(getPrevColumnIndex(1, 4)).toBe(0);
      expect(getPrevColumnIndex(3, 4)).toBe(2);
    });

    it('should wrap around to last column at start', () => {
      expect(getPrevColumnIndex(0, 4)).toBe(3);
    });

    it('should handle single column', () => {
      expect(getPrevColumnIndex(0, 1)).toBe(0);
    });
  });

  describe('getNextCardIndex', () => {
    it('should return next card index within column', () => {
      expect(getNextCardIndex(0, 3)).toBe(1);
      expect(getNextCardIndex(1, 3)).toBe(2);
    });

    it('should wrap around to first card at end', () => {
      expect(getNextCardIndex(2, 3)).toBe(0);
    });

    it('should return 0 for empty column', () => {
      expect(getNextCardIndex(0, 0)).toBe(0);
    });
  });

  describe('getPrevCardIndex', () => {
    it('should return previous card index within column', () => {
      expect(getPrevCardIndex(1, 3)).toBe(0);
      expect(getPrevCardIndex(2, 3)).toBe(1);
    });

    it('should wrap around to last card at start', () => {
      expect(getPrevCardIndex(0, 3)).toBe(2);
    });

    it('should return 0 for empty column', () => {
      expect(getPrevCardIndex(0, 0)).toBe(0);
    });
  });

  describe('findFirstCardInColumn', () => {
    const statuses: StatusConfig[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'done', label: 'Done' },
    ];

    const stories: WebviewStory[] = [
      { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01' },
      { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'in_progress', size: 'S', created: '2025-01-02' },
    ];

    it('should return first card ID in column', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      expect(findFirstCardInColumn(grouped, 'todo')).toBe('S-001');
      expect(findFirstCardInColumn(grouped, 'in_progress')).toBe('S-002');
    });

    it('should return null for empty column', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      expect(findFirstCardInColumn(grouped, 'done')).toBeNull();
    });

    it('should return null for non-existent status', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      expect(findFirstCardInColumn(grouped, 'nonexistent')).toBeNull();
    });
  });

  describe('getCardIndexInColumn', () => {
    const statuses: StatusConfig[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
    ];

    const stories: WebviewStory[] = [
      { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01' },
      { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02' },
      { id: 'S-003', title: 'Story 3', type: 'task', epic: 'E-2', status: 'in_progress', size: 'L', created: '2025-01-03' },
    ];

    it('should return index of card in column', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      expect(getCardIndexInColumn(grouped, 'todo', 'S-001')).toBe(0);
      expect(getCardIndexInColumn(grouped, 'todo', 'S-002')).toBe(1);
      expect(getCardIndexInColumn(grouped, 'in_progress', 'S-003')).toBe(0);
    });

    it('should return -1 for card not in column', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      expect(getCardIndexInColumn(grouped, 'todo', 'S-003')).toBe(-1);
    });

    it('should return -1 for non-existent status', () => {
      const grouped = groupStoriesByStatus(stories, statuses);
      expect(getCardIndexInColumn(grouped, 'nonexistent', 'S-001')).toBe(-1);
    });
  });

  describe('getColumnIndexByStatus', () => {
    const statuses: StatusConfig[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'review', label: 'Review' },
      { id: 'done', label: 'Done' },
    ];

    it('should return index of column by status id', () => {
      expect(getColumnIndexByStatus(statuses, 'todo')).toBe(0);
      expect(getColumnIndexByStatus(statuses, 'in_progress')).toBe(1);
      expect(getColumnIndexByStatus(statuses, 'review')).toBe(2);
      expect(getColumnIndexByStatus(statuses, 'done')).toBe(3);
    });

    it('should return -1 for non-existent status', () => {
      expect(getColumnIndexByStatus(statuses, 'nonexistent')).toBe(-1);
    });
  });

  describe('getStatusByColumnIndex', () => {
    const statuses: StatusConfig[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'review', label: 'Review' },
      { id: 'done', label: 'Done' },
    ];

    it('should return status id by column index', () => {
      expect(getStatusByColumnIndex(statuses, 0)).toBe('todo');
      expect(getStatusByColumnIndex(statuses, 1)).toBe('in_progress');
      expect(getStatusByColumnIndex(statuses, 2)).toBe('review');
      expect(getStatusByColumnIndex(statuses, 3)).toBe('done');
    });

    it('should return null for out of bounds index', () => {
      expect(getStatusByColumnIndex(statuses, -1)).toBeNull();
      expect(getStatusByColumnIndex(statuses, 4)).toBeNull();
    });
  });

  describe('getNextStatusInWorkflow', () => {
    const statuses: StatusConfig[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'review', label: 'Review' },
      { id: 'done', label: 'Done' },
    ];

    it('should return next status in workflow', () => {
      expect(getNextStatusInWorkflow(statuses, 'todo')).toBe('in_progress');
      expect(getNextStatusInWorkflow(statuses, 'in_progress')).toBe('review');
      expect(getNextStatusInWorkflow(statuses, 'review')).toBe('done');
    });

    it('should return null at end of workflow', () => {
      expect(getNextStatusInWorkflow(statuses, 'done')).toBeNull();
    });

    it('should return null for unknown status', () => {
      expect(getNextStatusInWorkflow(statuses, 'unknown')).toBeNull();
    });
  });

  // === DS-023: Filter Utilities Tests ===

  describe('DEFAULT_FILTER_STATE', () => {
    it('should have all filters set to null/empty', () => {
      expect(DEFAULT_FILTER_STATE.sprint).toBeNull();
      expect(DEFAULT_FILTER_STATE.epic).toBeNull();
      expect(DEFAULT_FILTER_STATE.type).toBeNull();
      expect(DEFAULT_FILTER_STATE.assignee).toBeNull();
      expect(DEFAULT_FILTER_STATE.search).toBe('');
    });
  });

  describe('extractSprints', () => {
    it('should extract unique sprints from stories', () => {
      const stories: WebviewStory[] = [
        { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01', sprint: 'sprint-1' },
        { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02', sprint: 'sprint-2' },
        { id: 'S-003', title: 'Story 3', type: 'task', epic: 'E-2', status: 'done', size: 'L', created: '2025-01-03', sprint: 'sprint-1' },
      ];
      const epics: WebviewEpic[] = [];
      const result = extractSprints(stories, epics);
      expect(result).toEqual(['sprint-1', 'sprint-2']);
    });

    it('should extract sprints from epics', () => {
      const stories: WebviewStory[] = [];
      const epics: WebviewEpic[] = [
        { id: 'EPIC-001', title: 'Epic 1', status: 'in_progress', sprint: 'sprint-3' },
        { id: 'EPIC-002', title: 'Epic 2', status: 'todo', sprint: 'sprint-4' },
      ];
      const result = extractSprints(stories, epics);
      expect(result).toEqual(['sprint-3', 'sprint-4']);
    });

    it('should combine sprints from both stories and epics', () => {
      const stories: WebviewStory[] = [
        { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01', sprint: 'sprint-1' },
      ];
      const epics: WebviewEpic[] = [
        { id: 'EPIC-001', title: 'Epic 1', status: 'in_progress', sprint: 'sprint-2' },
      ];
      const result = extractSprints(stories, epics);
      expect(result).toEqual(['sprint-1', 'sprint-2']);
    });

    it('should return sorted sprints', () => {
      const stories: WebviewStory[] = [
        { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01', sprint: 'z-sprint' },
        { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02', sprint: 'a-sprint' },
      ];
      const result = extractSprints(stories, []);
      expect(result).toEqual(['a-sprint', 'z-sprint']);
    });

    it('should handle stories without sprint', () => {
      const stories: WebviewStory[] = [
        { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01' },
        { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02', sprint: 'sprint-1' },
      ];
      const result = extractSprints(stories, []);
      expect(result).toEqual(['sprint-1']);
    });
  });

  describe('extractAssignees', () => {
    it('should extract unique assignees from stories', () => {
      const stories: WebviewStory[] = [
        { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01', assignee: 'alice' },
        { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02', assignee: 'bob' },
        { id: 'S-003', title: 'Story 3', type: 'task', epic: 'E-2', status: 'done', size: 'L', created: '2025-01-03', assignee: 'alice' },
      ];
      const result = extractAssignees(stories);
      expect(result).toEqual(['alice', 'bob']);
    });

    it('should return sorted assignees', () => {
      const stories: WebviewStory[] = [
        { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01', assignee: 'zara' },
        { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02', assignee: 'alice' },
      ];
      const result = extractAssignees(stories);
      expect(result).toEqual(['alice', 'zara']);
    });

    it('should handle stories without assignee', () => {
      const stories: WebviewStory[] = [
        { id: 'S-001', title: 'Story 1', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01' },
        { id: 'S-002', title: 'Story 2', type: 'bug', epic: 'E-1', status: 'todo', size: 'S', created: '2025-01-02', assignee: 'bob' },
      ];
      const result = extractAssignees(stories);
      expect(result).toEqual(['bob']);
    });
  });

  describe('filterStories', () => {
    const stories: WebviewStory[] = [
      { id: 'S-001', title: 'Login Form', type: 'feature', epic: 'E-1', status: 'todo', size: 'M', created: '2025-01-01', sprint: 'sprint-1', assignee: 'alice' },
      { id: 'S-002', title: 'Fix Bug', type: 'bug', epic: 'E-1', status: 'in_progress', size: 'S', created: '2025-01-02', sprint: 'sprint-1', assignee: 'bob' },
      { id: 'S-003', title: 'Database Task', type: 'task', epic: 'E-2', status: 'done', size: 'L', created: '2025-01-03', sprint: 'sprint-2' },
      { id: 'S-004', title: 'Clean Up', type: 'chore', epic: 'E-2', status: 'todo', size: 'XS', created: '2025-01-04', sprint: 'sprint-2', assignee: 'alice' },
    ];

    it('should return all stories when no filters active', () => {
      const result = filterStories(stories, DEFAULT_FILTER_STATE);
      expect(result).toHaveLength(4);
    });

    it('should filter by sprint', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, sprint: 'sprint-1' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(['S-001', 'S-002']);
    });

    it('should filter by epic', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, epic: 'E-2' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(['S-003', 'S-004']);
    });

    it('should filter by type', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, type: 'bug' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('S-002');
    });

    it('should filter by assignee', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, assignee: 'alice' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(['S-001', 'S-004']);
    });

    it('should filter by unassigned (empty string)', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, assignee: '' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('S-003');
    });

    it('should filter by search (title match)', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, search: 'login' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('S-001');
    });

    it('should filter by search (id match)', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, search: 's-002' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('S-002');
    });

    it('should filter by search case-insensitively', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, search: 'LOGIN' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('S-001');
    });

    it('should combine multiple filters with AND logic', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, sprint: 'sprint-1', type: 'feature' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('S-001');
    });

    it('should return empty array when no stories match', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, sprint: 'sprint-999' };
      const result = filterStories(stories, filters);
      expect(result).toHaveLength(0);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for default filter state', () => {
      expect(hasActiveFilters(DEFAULT_FILTER_STATE)).toBe(false);
    });

    it('should return true when sprint filter is set', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, sprint: 'sprint-1' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when epic filter is set', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, epic: 'E-1' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when type filter is set', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, type: 'bug' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when assignee filter is set', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, assignee: 'alice' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when assignee is empty string (unassigned)', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, assignee: '' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when search is not empty', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, search: 'test' };
      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('countActiveFilters', () => {
    it('should return 0 for default filter state', () => {
      expect(countActiveFilters(DEFAULT_FILTER_STATE)).toBe(0);
    });

    it('should count single active filter', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, sprint: 'sprint-1' };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count multiple active filters', () => {
      const filters: FilterState = {
        sprint: 'sprint-1',
        epic: 'E-1',
        type: 'bug',
        assignee: null,
        search: '',
      };
      expect(countActiveFilters(filters)).toBe(3);
    });

    it('should count all filters when all active', () => {
      const filters: FilterState = {
        sprint: 'sprint-1',
        epic: 'E-1',
        type: 'bug',
        assignee: 'alice',
        search: 'test',
      };
      expect(countActiveFilters(filters)).toBe(5);
    });

    it('should count assignee empty string as active', () => {
      const filters: FilterState = { ...DEFAULT_FILTER_STATE, assignee: '' };
      expect(countActiveFilters(filters)).toBe(1);
    });
  });
});
