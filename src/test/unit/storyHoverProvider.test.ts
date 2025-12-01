import { describe, it, expect } from 'vitest';
import {
  getStatusIndicator,
  getTypeIcon,
  formatHoverCard,
  findLinkAtPosition,
  findBareIdAtPosition,
  isInFrontmatter,
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
      priority: 500,
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

    it('should include priority if non-default', () => {
      const priorityStory: Story = { ...mockStory, priority: 100 };
      const result = formatHoverCard(priorityStory, 'story');

      expect(result).toContain('**Priority:** 100');
    });

    it('should not include priority if default (500)', () => {
      const result = formatHoverCard(mockStory, 'story');
      expect(result).not.toContain('**Priority:**');
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

  describe('isInFrontmatter', () => {
    it('should return true for line within frontmatter', () => {
      const lines = [
        '---',
        'id: DS-001',
        'epic: EPIC-001',
        '---',
        '# Content',
      ];
      expect(isInFrontmatter(lines, 1)).toBe(true);
      expect(isInFrontmatter(lines, 2)).toBe(true);
    });

    it('should return false for line after frontmatter', () => {
      const lines = [
        '---',
        'id: DS-001',
        '---',
        '# Content',
        'Body text',
      ];
      expect(isInFrontmatter(lines, 3)).toBe(false);
      expect(isInFrontmatter(lines, 4)).toBe(false);
    });

    it('should return false if no opening frontmatter', () => {
      const lines = ['# Just markdown', 'No frontmatter'];
      expect(isInFrontmatter(lines, 0)).toBe(false);
      expect(isInFrontmatter(lines, 1)).toBe(false);
    });

    it('should return false for frontmatter delimiter lines', () => {
      const lines = [
        '---',
        'id: DS-001',
        '---',
      ];
      expect(isInFrontmatter(lines, 0)).toBe(false); // Opening ---
      expect(isInFrontmatter(lines, 2)).toBe(false); // Closing ---
    });

    it('should return true for unclosed frontmatter', () => {
      const lines = [
        '---',
        'id: DS-001',
        'epic: EPIC-001',
      ];
      // If frontmatter is never closed, treat content as frontmatter
      expect(isInFrontmatter(lines, 1)).toBe(true);
      expect(isInFrontmatter(lines, 2)).toBe(true);
    });
  });

  describe('findBareIdAtPosition', () => {
    it('should find bare story ID in dependencies array', () => {
      const text = '  - DS-001';
      const result = findBareIdAtPosition(text, 6);

      expect(result).toEqual({
        id: 'DS-001',
        start: 4,
        end: 10,
      });
    });

    it('should find bare epic ID in epic field', () => {
      const text = 'epic: EPIC-001';
      const result = findBareIdAtPosition(text, 10);

      expect(result).toEqual({
        id: 'EPIC-001',
        start: 6,
        end: 14,
      });
    });

    it('should handle custom prefixes', () => {
      const text = 'epic: FEAT-123';
      const result = findBareIdAtPosition(text, 10);

      expect(result).toEqual({
        id: 'FEAT-123',
        start: 6,
        end: 14,
      });
    });

    it('should return null when cursor is outside ID', () => {
      const text = 'epic: EPIC-001';
      const result = findBareIdAtPosition(text, 2); // On 'ic:'

      expect(result).toBeNull();
    });

    it('should handle multiple IDs on same line', () => {
      const text = '  - DS-001 # depends on DS-002';

      // First ID
      expect(findBareIdAtPosition(text, 6)).toEqual({
        id: 'DS-001',
        start: 4,
        end: 10,
      });

      // Second ID
      expect(findBareIdAtPosition(text, 26)).toEqual({
        id: 'DS-002',
        start: 24,
        end: 30,
      });
    });

    it('should handle EPIC-INBOX special case', () => {
      const text = 'epic: EPIC-INBOX';
      const result = findBareIdAtPosition(text, 10);

      expect(result).toEqual({
        id: 'EPIC-INBOX',
        start: 6,
        end: 16,
      });
    });

    it('should not match partial IDs', () => {
      const text = 'some DS-001X text';
      const result = findBareIdAtPosition(text, 8);

      // Should not match because DS-001X is not a valid ID pattern
      expect(result).toBeNull();
    });

    it('should match ID at start of line', () => {
      const text = 'DS-001';
      const result = findBareIdAtPosition(text, 3);

      expect(result).toEqual({
        id: 'DS-001',
        start: 0,
        end: 6,
      });
    });

    it('should match ID at end of line', () => {
      const text = 'dependency: DS-001';
      const result = findBareIdAtPosition(text, 15);

      expect(result).toEqual({
        id: 'DS-001',
        start: 12,
        end: 18,
      });
    });
  });
});
