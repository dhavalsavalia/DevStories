import { describe, it, expect } from 'vitest';
import {
  getStatusIndicator,
  getTypeIcon,
  formatHoverCard,
  findLinkAtPosition,
} from '../../providers/storyHoverProviderUtils';
import { Story, StoryType } from '../../types/story';
import { Epic } from '../../types/epic';

describe('storyHoverProviderUtils', () => {
  describe('getStatusIndicator', () => {
    it('should return empty circle for todo', () => {
      expect(getStatusIndicator('todo')).toBe('○');
    });

    it('should return half circle for in_progress', () => {
      expect(getStatusIndicator('in_progress')).toBe('◐');
    });

    it('should return three-quarter circle for review', () => {
      expect(getStatusIndicator('review')).toBe('◑');
    });

    it('should return filled circle for done', () => {
      expect(getStatusIndicator('done')).toBe('●');
    });

    it('should return diamond for unknown status', () => {
      expect(getStatusIndicator('blocked')).toBe('◇');
      expect(getStatusIndicator('custom_status')).toBe('◇');
    });
  });

  describe('getTypeIcon', () => {
    it('should return lightbulb for feature', () => {
      expect(getTypeIcon('feature')).toBe('✨');
    });

    it('should return bug icon for bug', () => {
      expect(getTypeIcon('bug')).toBe('🐛');
    });

    it('should return checklist for task', () => {
      expect(getTypeIcon('task')).toBe('📋');
    });

    it('should return wrench for chore', () => {
      expect(getTypeIcon('chore')).toBe('🔧');
    });

    it('should return folder for epic', () => {
      expect(getTypeIcon('epic')).toBe('📁');
    });

    it('should return default for unknown type', () => {
      expect(getTypeIcon('unknown' as StoryType)).toBe('📄');
    });
  });

  describe('formatHoverCard', () => {
    const mockStory: Story = {
      id: 'DS-001',
      title: 'Project Scaffolding',
      type: 'feature',
      epic: 'EPIC-001',
      status: 'done',
      size: 'M',
      created: new Date('2025-01-15'),
      content: 'Some content',
    };

    const mockEpic: Epic = {
      id: 'EPIC-001',
      title: 'Phase 1: Foundation',
      status: 'in_progress',
      created: new Date('2025-01-15'),
      content: 'Epic content',
    };

    it('should format story hover card with all fields', () => {
      const result = formatHoverCard(mockStory, 'story');

      expect(result).toContain('### ✨ DS-001: Project Scaffolding');
      expect(result).toContain('**Status:** ● done');
      expect(result).toContain('**Type:** Feature');
      expect(result).toContain('**Size:** M');
      expect(result).toContain('**Epic:** EPIC-001');
      // Each line should end with two spaces for markdown line breaks
      expect(result).toMatch(/\*\*Status:\*\* .+  \n/);
    });

    it('should format epic hover card', () => {
      const result = formatHoverCard(mockEpic, 'epic');

      expect(result).toContain('### 📁 EPIC-001: Phase 1: Foundation');
      expect(result).toContain('**Status:** ◐ in_progress');
      expect(result).not.toContain('**Type:**');
      expect(result).not.toContain('**Size:**');
    });

    it('should include sprint if present', () => {
      const storyWithSprint: Story = { ...mockStory, sprint: 'sprint-1' };
      const result = formatHoverCard(storyWithSprint, 'story');

      expect(result).toContain('**Sprint:** sprint-1');
    });

    it('should not include sprint if absent', () => {
      const result = formatHoverCard(mockStory, 'story');
      expect(result).not.toContain('**Sprint:**');
    });

    it('should capitalize type name', () => {
      const bugStory: Story = { ...mockStory, type: 'bug' };
      const result = formatHoverCard(bugStory, 'story');

      expect(result).toContain('**Type:** Bug');
    });

    it('should include epic progress if provided', () => {
      const result = formatHoverCard(mockEpic, 'epic', { done: 3, total: 5 });

      expect(result).toContain('**Progress:** 3/5 stories done');
    });

    it('should not include progress if not provided', () => {
      const result = formatHoverCard(mockEpic, 'epic');

      expect(result).not.toContain('**Progress:**');
    });
  });

  describe('findLinkAtPosition', () => {
    it('should find link when cursor is inside brackets', () => {
      const text = 'See [[DS-001]] for details';
      const result = findLinkAtPosition(text, 8); // Inside DS-001

      expect(result).toEqual({
        id: 'DS-001',
        start: 4,
        end: 14,
      });
    });

    it('should find link when cursor is on opening brackets', () => {
      const text = 'See [[DS-001]] for details';
      const result = findLinkAtPosition(text, 4); // On first [

      expect(result).toEqual({
        id: 'DS-001',
        start: 4,
        end: 14,
      });
    });

    it('should find link when cursor is on closing brackets', () => {
      const text = 'See [[DS-001]] for details';
      const result = findLinkAtPosition(text, 13); // On last ]

      expect(result).toEqual({
        id: 'DS-001',
        start: 4,
        end: 14,
      });
    });

    it('should return null when cursor is outside link', () => {
      const text = 'See [[DS-001]] for details';
      const result = findLinkAtPosition(text, 0);

      expect(result).toBeNull();
    });

    it('should return null when cursor is after link', () => {
      const text = 'See [[DS-001]] for details';
      const result = findLinkAtPosition(text, 20);

      expect(result).toBeNull();
    });

    it('should handle multiple links', () => {
      const text = 'Links: [[DS-001]] and [[EPIC-002]]';

      // First link
      expect(findLinkAtPosition(text, 10)).toEqual({
        id: 'DS-001',
        start: 7,
        end: 17,
      });

      // Second link
      expect(findLinkAtPosition(text, 27)).toEqual({
        id: 'EPIC-002',
        start: 22,
        end: 34,
      });
    });

    it('should handle epic IDs', () => {
      const text = 'See [[EPIC-001]] for epic';
      const result = findLinkAtPosition(text, 8);

      expect(result).toEqual({
        id: 'EPIC-001',
        start: 4,
        end: 16,
      });
    });

    it('should handle custom prefixes', () => {
      const text = 'See [[FEAT-123]] for feature';
      const result = findLinkAtPosition(text, 8);

      expect(result).toEqual({
        id: 'FEAT-123',
        start: 4,
        end: 16,
      });
    });

    it('should return null for text without links', () => {
      const text = 'No links here';
      const result = findLinkAtPosition(text, 5);

      expect(result).toBeNull();
    });

    it('should handle link at start of text', () => {
      const text = '[[DS-001]] at start';
      const result = findLinkAtPosition(text, 5);

      expect(result).toEqual({
        id: 'DS-001',
        start: 0,
        end: 10,
      });
    });

    it('should handle link at end of text', () => {
      const text = 'At end [[DS-001]]';
      const result = findLinkAtPosition(text, 12);

      expect(result).toEqual({
        id: 'DS-001',
        start: 7,
        end: 17,
      });
    });

    it('should handle EPIC-INBOX special case', () => {
      const text = 'See [[EPIC-INBOX]] for inbox';
      const result = findLinkAtPosition(text, 10);

      expect(result).toEqual({
        id: 'EPIC-INBOX',
        start: 4,
        end: 18,
      });
    });
  });
});
