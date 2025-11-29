/**
 * Unit tests for StatusBarController
 * TDD: Test sprint-aware functionality
 */

import { describe, it, expect } from 'vitest';
import {
  getStatsFromStories,
  getFormattedStatusBarText,
  buildProgressBar,
  collectAvailableSprints,
} from '../../view/statusBarUtils';
import { Story } from '../../types/story';

// Helper to create test stories
function createStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'TEST-001',
    title: 'Test Story',
    type: 'feature',
    epic: 'EPIC-001',
    status: 'todo',
    sprint: 'sprint-1',
    size: 'M',
    priority: 500,
    assignee: '',
    dependencies: [],
    created: new Date('2025-01-01'),
    content: '# Test Story',
    ...overrides,
  };
}

describe('statusBarUtils', () => {
  describe('getStatsFromStories', () => {
    it('should count all stories when no sprint filter', () => {
      const stories: Story[] = [
        createStory({ id: 'S-1', status: 'done', sprint: 'sprint-1' }),
        createStory({ id: 'S-2', status: 'done', sprint: 'sprint-2' }),
        createStory({ id: 'S-3', status: 'todo', sprint: 'sprint-1' }),
      ];

      const stats = getStatsFromStories(stories, null);
      expect(stats.total).toBe(3);
      expect(stats.done).toBe(2);
    });

    it('should filter by sprint when sprint provided', () => {
      const stories: Story[] = [
        createStory({ id: 'S-1', status: 'done', sprint: 'sprint-1' }),
        createStory({ id: 'S-2', status: 'done', sprint: 'sprint-2' }),
        createStory({ id: 'S-3', status: 'todo', sprint: 'sprint-1' }),
      ];

      const stats = getStatsFromStories(stories, 'sprint-1');
      expect(stats.total).toBe(2);
      expect(stats.done).toBe(1);
    });

    it('should handle backlog filter (empty/undefined sprint)', () => {
      const stories: Story[] = [
        createStory({ id: 'S-1', status: 'done', sprint: '' }),
        createStory({ id: 'S-2', status: 'done', sprint: undefined }),
        createStory({ id: 'S-3', status: 'todo', sprint: 'sprint-1' }),
        createStory({ id: 'S-4', status: 'todo', sprint: 'backlog' }),
      ];

      const stats = getStatsFromStories(stories, 'backlog');
      expect(stats.total).toBe(3); // empty, undefined, and 'backlog' all count
      expect(stats.done).toBe(2);
    });

    it('should return 0 for empty array', () => {
      const stats = getStatsFromStories([], null);
      expect(stats.total).toBe(0);
      expect(stats.done).toBe(0);
    });
  });

  describe('buildProgressBar', () => {
    it('should build progress bar with correct ratio', () => {
      const bar = buildProgressBar(3, 6, 6);
      expect(bar).toBe('███░░░');
    });

    it('should handle 0% complete', () => {
      const bar = buildProgressBar(0, 5, 6);
      expect(bar).toBe('░░░░░░');
    });

    it('should handle 100% complete', () => {
      const bar = buildProgressBar(5, 5, 6);
      expect(bar).toBe('██████');
    });

    it('should handle 0 total as 100% complete', () => {
      const bar = buildProgressBar(0, 0, 6);
      expect(bar).toBe('██████');
    });

    it('should round down for partial fills', () => {
      // 1/6 = 16.67% of 6 = 1 block
      const bar = buildProgressBar(1, 6, 6);
      expect(bar).toBe('█░░░░░');
    });
  });

  describe('getFormattedStatusBarText', () => {
    it('should show "All Sprints" when no sprint selected', () => {
      const text = getFormattedStatusBarText(2, 4, null);
      expect(text).toContain('All Sprints');
      expect(text).toContain('2/4');
      expect(text).toContain('$(checklist)');
    });

    it('should show sprint name when sprint selected', () => {
      const text = getFormattedStatusBarText(3, 5, 'sprint-2');
      expect(text).toContain('sprint-2');
      expect(text).toContain('3/5');
    });

    it('should show "Backlog" for backlog filter', () => {
      const text = getFormattedStatusBarText(1, 3, 'backlog');
      expect(text).toContain('Backlog');
      expect(text).toContain('1/3');
    });

    it('should show "No stories" when total is 0', () => {
      const text = getFormattedStatusBarText(0, 0, 'sprint-1');
      expect(text).toContain('sprint-1');
      expect(text).toContain('No stories');
    });
  });

  describe('collectAvailableSprints', () => {
    it('should extract unique sprints from stories', () => {
      const stories: Story[] = [
        createStory({ id: 'S-1', sprint: 'sprint-1' }),
        createStory({ id: 'S-2', sprint: 'sprint-2' }),
        createStory({ id: 'S-3', sprint: 'sprint-1' }),
        createStory({ id: 'S-4', sprint: 'sprint-3' }),
      ];

      const sprints = collectAvailableSprints(stories, undefined);
      expect(sprints).toContain('sprint-1');
      expect(sprints).toContain('sprint-2');
      expect(sprints).toContain('sprint-3');
    });

    it('should include current sprint from config even if no stories', () => {
      const stories: Story[] = [
        createStory({ id: 'S-1', sprint: 'sprint-1' }),
      ];

      const sprints = collectAvailableSprints(stories, 'sprint-5');
      expect(sprints).toContain('sprint-1');
      expect(sprints).toContain('sprint-5');
    });

    it('should exclude empty/undefined sprints from list', () => {
      const stories: Story[] = [
        createStory({ id: 'S-1', sprint: '' }),
        createStory({ id: 'S-2', sprint: undefined }),
        createStory({ id: 'S-3', sprint: 'sprint-1' }),
      ];

      const sprints = collectAvailableSprints(stories, undefined);
      expect(sprints).not.toContain('');
      expect(sprints).not.toContain(undefined);
      expect(sprints).toContain('sprint-1');
    });

    it('should exclude backlog from sprint list', () => {
      const stories: Story[] = [
        createStory({ id: 'S-1', sprint: 'backlog' }),
        createStory({ id: 'S-2', sprint: 'sprint-1' }),
      ];

      const sprints = collectAvailableSprints(stories, undefined);
      expect(sprints).not.toContain('backlog');
      expect(sprints).toContain('sprint-1');
    });

    it('should sort sprints alphabetically', () => {
      const stories: Story[] = [
        createStory({ id: 'S-1', sprint: 'sprint-3' }),
        createStory({ id: 'S-2', sprint: 'sprint-1' }),
        createStory({ id: 'S-3', sprint: 'sprint-2' }),
      ];

      const sprints = collectAvailableSprints(stories, undefined);
      expect(sprints).toEqual(['sprint-1', 'sprint-2', 'sprint-3']);
    });

    it('should return empty array for no stories and no config sprint', () => {
      const sprints = collectAvailableSprints([], undefined);
      expect(sprints).toEqual([]);
    });
  });
});
