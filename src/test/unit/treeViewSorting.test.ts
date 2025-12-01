import { describe, it, expect } from 'vitest';
import {
  sortStoriesForTreeView,
  getEarliestStorySprintIndex,
  sortEpicsBySprintOrder,
} from '../../view/storiesProviderUtils';
import { Story, StoryType, StorySize } from '../../types/story';
import { Epic } from '../../types/epic';

// Helper to create mock stories
function createMockStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'STORY-001',
    title: 'Test Story',
    type: 'feature' as StoryType,
    epic: 'EPIC-001',
    status: 'todo',
    size: 'M' as StorySize,
    priority: 500,
    created: new Date('2025-01-15'),
    content: '',
    ...overrides,
  };
}

// Helper to create mock epics
function createMockEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    id: 'EPIC-001',
    title: 'Test Epic',
    status: 'todo',
    created: new Date('2025-01-15'),
    content: '',
    ...overrides,
  };
}

describe('Tree View Sorting Utils', () => {
  const sprintSequence = ['foundation-1', 'polish-1', 'polish-2', 'launch-1'];

  describe('sortStoriesForTreeView', () => {
    it('should sort stories by sprint sequence first', () => {
      const stories = [
        createMockStory({ id: 'S-1', sprint: 'polish-1' }),
        createMockStory({ id: 'S-2', sprint: 'foundation-1' }),
        createMockStory({ id: 'S-3', sprint: 'launch-1' }),
      ];

      const sorted = sortStoriesForTreeView(stories, sprintSequence);

      expect(sorted.map(s => s.id)).toEqual(['S-2', 'S-1', 'S-3']);
    });

    it('should sort by priority within same sprint', () => {
      const stories = [
        createMockStory({ id: 'S-1', sprint: 'polish-1', priority: 200 }),
        createMockStory({ id: 'S-2', sprint: 'polish-1', priority: 100 }),
        createMockStory({ id: 'S-3', sprint: 'polish-1', priority: 300 }),
      ];

      const sorted = sortStoriesForTreeView(stories, sprintSequence);

      expect(sorted.map(s => s.id)).toEqual(['S-2', 'S-1', 'S-3']);
    });

    it('should sort alphabetically by title within same sprint and priority', () => {
      const stories = [
        createMockStory({ id: 'S-1', sprint: 'polish-1', priority: 500, title: 'Zebra feature' }),
        createMockStory({ id: 'S-2', sprint: 'polish-1', priority: 500, title: 'Apple feature' }),
        createMockStory({ id: 'S-3', sprint: 'polish-1', priority: 500, title: 'Mango feature' }),
      ];

      const sorted = sortStoriesForTreeView(stories, sprintSequence);

      expect(sorted.map(s => s.id)).toEqual(['S-2', 'S-3', 'S-1']);
    });

    it('should sort case-insensitively by title', () => {
      const stories = [
        createMockStory({ id: 'S-1', sprint: 'polish-1', priority: 500, title: 'zebra feature' }),
        createMockStory({ id: 'S-2', sprint: 'polish-1', priority: 500, title: 'Apple feature' }),
        createMockStory({ id: 'S-3', sprint: 'polish-1', priority: 500, title: 'mango feature' }),
      ];

      const sorted = sortStoriesForTreeView(stories, sprintSequence);

      expect(sorted.map(s => s.id)).toEqual(['S-2', 'S-3', 'S-1']);
    });

    it('should sort by title for same non-default priority', () => {
      const stories = [
        createMockStory({ id: 'S-1', sprint: 'polish-1', priority: 100, title: 'Update API' }),
        createMockStory({ id: 'S-2', sprint: 'polish-1', priority: 100, title: 'Add tests' }),
        createMockStory({ id: 'S-3', sprint: 'polish-1', priority: 100, title: 'Fix bug' }),
      ];

      const sorted = sortStoriesForTreeView(stories, sprintSequence);

      expect(sorted.map(s => s.id)).toEqual(['S-2', 'S-3', 'S-1']);
    });

    it('should put stories with unknown sprints at the end', () => {
      const stories = [
        createMockStory({ id: 'S-1', sprint: 'unknown-sprint' }),
        createMockStory({ id: 'S-2', sprint: 'foundation-1' }),
        createMockStory({ id: 'S-3', sprint: undefined }),
      ];

      const sorted = sortStoriesForTreeView(stories, sprintSequence);

      expect(sorted.map(s => s.id)).toEqual(['S-2', 'S-1', 'S-3']);
    });

    it('should handle empty sprint sequence gracefully', () => {
      const stories = [
        createMockStory({ id: 'S-1', sprint: 'sprint-1', priority: 200 }),
        createMockStory({ id: 'S-2', sprint: 'sprint-2', priority: 100 }),
      ];

      const sorted = sortStoriesForTreeView(stories, []);

      // Should still sort by priority then created when no sprint sequence
      expect(sorted.map(s => s.id)).toEqual(['S-2', 'S-1']);
    });

    it('should handle empty stories array', () => {
      const sorted = sortStoriesForTreeView([], sprintSequence);
      expect(sorted).toEqual([]);
    });

    it('should apply full sorting chain: sprint → priority → title', () => {
      const stories = [
        createMockStory({ id: 'S-1', sprint: 'polish-1', priority: 100, title: 'Zebra task' }),
        createMockStory({ id: 'S-2', sprint: 'foundation-1', priority: 500, title: 'Beta feature' }),
        createMockStory({ id: 'S-3', sprint: 'polish-1', priority: 100, title: 'Alpha task' }),
        createMockStory({ id: 'S-4', sprint: 'foundation-1', priority: 100, title: 'Alpha feature' }),
      ];

      const sorted = sortStoriesForTreeView(stories, sprintSequence);

      // foundation-1 first (index 0), then polish-1 (index 1)
      // Within foundation-1: S-4 (priority 100) before S-2 (priority 500)
      // Within polish-1 and priority 100: S-3 (Alpha) before S-1 (Zebra)
      expect(sorted.map(s => s.id)).toEqual(['S-4', 'S-2', 'S-3', 'S-1']);
    });
  });

  describe('getEarliestStorySprintIndex', () => {
    it('should return earliest sprint index from epic stories', () => {
      const stories = [
        createMockStory({ sprint: 'polish-1' }),      // index 1
        createMockStory({ sprint: 'foundation-1' }), // index 0
        createMockStory({ sprint: 'launch-1' }),     // index 3
      ];

      const index = getEarliestStorySprintIndex(stories, sprintSequence);

      expect(index).toBe(0); // foundation-1 is earliest
    });

    it('should return Infinity for empty stories array', () => {
      const index = getEarliestStorySprintIndex([], sprintSequence);
      expect(index).toBe(Infinity);
    });

    it('should return Infinity when all stories have unknown sprints', () => {
      const stories = [
        createMockStory({ sprint: 'unknown-1' }),
        createMockStory({ sprint: 'unknown-2' }),
      ];

      const index = getEarliestStorySprintIndex(stories, sprintSequence);
      expect(index).toBe(Infinity);
    });

    it('should handle stories with undefined sprint', () => {
      const stories = [
        createMockStory({ sprint: undefined }),
        createMockStory({ sprint: 'polish-1' }),
      ];

      const index = getEarliestStorySprintIndex(stories, sprintSequence);
      expect(index).toBe(1); // polish-1 is index 1
    });

    it('should handle single story', () => {
      const stories = [createMockStory({ sprint: 'launch-1' })];
      const index = getEarliestStorySprintIndex(stories, sprintSequence);
      expect(index).toBe(3);
    });
  });

  describe('sortEpicsBySprintOrder', () => {
    it('should sort epics by their earliest story sprint', () => {
      const epics = [
        createMockEpic({ id: 'E-1' }),
        createMockEpic({ id: 'E-2' }),
        createMockEpic({ id: 'E-3' }),
      ];

      // E-1 stories start in polish-1 (index 1)
      // E-2 stories start in foundation-1 (index 0)
      // E-3 stories start in launch-1 (index 3)
      const getStoriesByEpic = (epicId: string): Story[] => {
        if (epicId === 'E-1') {
          return [createMockStory({ sprint: 'polish-1' })];
        }
        if (epicId === 'E-2') {
          return [createMockStory({ sprint: 'foundation-1' })];
        }
        if (epicId === 'E-3') {
          return [createMockStory({ sprint: 'launch-1' })];
        }
        return [];
      };

      const sorted = sortEpicsBySprintOrder(epics, sprintSequence, getStoriesByEpic);

      expect(sorted.map(e => e.id)).toEqual(['E-2', 'E-1', 'E-3']);
    });

    it('should put epics with no stories at the end', () => {
      const epics = [
        createMockEpic({ id: 'E-1' }),
        createMockEpic({ id: 'E-2' }),
      ];

      const getStoriesByEpic = (epicId: string): Story[] => {
        if (epicId === 'E-1') {
          return [];
        }
        if (epicId === 'E-2') {
          return [createMockStory({ sprint: 'foundation-1' })];
        }
        return [];
      };

      const sorted = sortEpicsBySprintOrder(epics, sprintSequence, getStoriesByEpic);

      expect(sorted.map(e => e.id)).toEqual(['E-2', 'E-1']);
    });

    it('should sort by epic created date when sprint indices are equal', () => {
      const epics = [
        createMockEpic({ id: 'E-1', created: new Date('2025-01-20') }),
        createMockEpic({ id: 'E-2', created: new Date('2025-01-10') }),
        createMockEpic({ id: 'E-3', created: new Date('2025-01-15') }),
      ];

      // All epics have same earliest sprint
      const getStoriesByEpic = (): Story[] => {
        return [createMockStory({ sprint: 'foundation-1' })];
      };

      const sorted = sortEpicsBySprintOrder(epics, sprintSequence, getStoriesByEpic);

      // All same sprint, so sort by epic created date
      expect(sorted.map(e => e.id)).toEqual(['E-2', 'E-3', 'E-1']);
    });

    it('should handle empty epics array', () => {
      const sorted = sortEpicsBySprintOrder([], sprintSequence, () => []);
      expect(sorted).toEqual([]);
    });

    it('should not mutate original epics array', () => {
      const epics = [
        createMockEpic({ id: 'E-2' }),
        createMockEpic({ id: 'E-1' }),
      ];
      const originalOrder = [...epics.map(e => e.id)];

      const getStoriesByEpic = (epicId: string): Story[] => {
        if (epicId === 'E-1') {
          return [createMockStory({ sprint: 'foundation-1' })];
        }
        if (epicId === 'E-2') {
          return [createMockStory({ sprint: 'polish-1' })];
        }
        return [];
      };

      sortEpicsBySprintOrder(epics, sprintSequence, getStoriesByEpic);

      expect(epics.map(e => e.id)).toEqual(originalOrder);
    });
  });
});
