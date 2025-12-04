import { describe, it, expect } from 'vitest';
import {
  detectFieldAtCursor,
  getStatusCompletions,
  getTypeCompletions,
  getSizeCompletions,
  getSprintCompletions,
  CompletionData,
} from '../../providers/frontmatterCompletionProviderUtils';
import { StatusDef } from '../../core/configServiceUtils';
import { StorySize } from '../../types/story';

describe('frontmatterCompletionProviderUtils', () => {
  describe('detectFieldAtCursor', () => {
    it('should detect status field', () => {
      expect(detectFieldAtCursor('status: ', 8)).toBe('status');
      expect(detectFieldAtCursor('status:', 7)).toBe('status');
      expect(detectFieldAtCursor('status: todo', 8)).toBe('status');
    });

    it('should detect type field', () => {
      expect(detectFieldAtCursor('type: ', 6)).toBe('type');
      expect(detectFieldAtCursor('type:', 5)).toBe('type');
      expect(detectFieldAtCursor('type: feat', 10)).toBe('type');
    });

    it('should detect size field', () => {
      expect(detectFieldAtCursor('size: ', 6)).toBe('size');
      expect(detectFieldAtCursor('size:', 5)).toBe('size');
      expect(detectFieldAtCursor('size: M', 7)).toBe('size');
    });

    it('should detect sprint field', () => {
      expect(detectFieldAtCursor('sprint: ', 8)).toBe('sprint');
      expect(detectFieldAtCursor('sprint:', 7)).toBe('sprint');
      expect(detectFieldAtCursor('sprint: 1.1.0', 13)).toBe('sprint');
    });

    it('should return null for non-enum fields', () => {
      expect(detectFieldAtCursor('id: DS-001', 10)).toBeNull();
      expect(detectFieldAtCursor('title: My story', 15)).toBeNull();
      expect(detectFieldAtCursor('epic: EPIC-001', 14)).toBeNull();
      expect(detectFieldAtCursor('assignee: john', 14)).toBeNull();
    });

    it('should return null when cursor is before colon', () => {
      expect(detectFieldAtCursor('status: todo', 3)).toBeNull();
      expect(detectFieldAtCursor('type: feature', 2)).toBeNull();
    });

    it('should return null for empty line', () => {
      expect(detectFieldAtCursor('', 0)).toBeNull();
    });

    it('should return null for line without colon', () => {
      expect(detectFieldAtCursor('some text without field', 10)).toBeNull();
    });

    it('should handle indented lines (dependencies array context)', () => {
      // In YAML array context, don't trigger on these
      expect(detectFieldAtCursor('  - DS-001', 10)).toBeNull();
    });
  });

  describe('getStatusCompletions', () => {
    const statuses: StatusDef[] = [
      { id: 'todo', label: 'To Do' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'done', label: 'Done' },
    ];

    it('should return completion for each status', () => {
      const completions = getStatusCompletions(statuses);
      expect(completions).toHaveLength(3);
    });

    it('should use status id as value', () => {
      const completions = getStatusCompletions(statuses);
      expect(completions[0].value).toBe('todo');
      expect(completions[1].value).toBe('in_progress');
      expect(completions[2].value).toBe('done');
    });

    it('should use status label as detail', () => {
      const completions = getStatusCompletions(statuses);
      expect(completions[0].detail).toBe('To Do');
      expect(completions[1].detail).toBe('In Progress');
      expect(completions[2].detail).toBe('Done');
    });

    it('should return empty array for empty statuses', () => {
      const completions = getStatusCompletions([]);
      expect(completions).toHaveLength(0);
    });
  });

  describe('getTypeCompletions', () => {
    it('should return all four story types', () => {
      const completions = getTypeCompletions();
      expect(completions).toHaveLength(4);
    });

    it('should include feature, bug, task, chore', () => {
      const completions = getTypeCompletions();
      const values = completions.map(c => c.value);
      expect(values).toContain('feature');
      expect(values).toContain('bug');
      expect(values).toContain('task');
      expect(values).toContain('chore');
    });

    it('should have descriptions for each type', () => {
      const completions = getTypeCompletions();
      completions.forEach(c => {
        expect(c.detail).toBeDefined();
        expect(c.detail?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getSizeCompletions', () => {
    const sizes: StorySize[] = ['XS', 'S', 'M', 'L', 'XL'];

    it('should return completion for each size', () => {
      const completions = getSizeCompletions(sizes);
      expect(completions).toHaveLength(5);
    });

    it('should use size as value', () => {
      const completions = getSizeCompletions(sizes);
      expect(completions.map(c => c.value)).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    });

    it('should have descriptions for each size', () => {
      const completions = getSizeCompletions(sizes);
      expect(completions[0].detail).toBe('Extra Small');
      expect(completions[1].detail).toBe('Small');
      expect(completions[2].detail).toBe('Medium');
      expect(completions[3].detail).toBe('Large');
      expect(completions[4].detail).toBe('Extra Large');
    });

    it('should return empty array for empty sizes', () => {
      const completions = getSizeCompletions([]);
      expect(completions).toHaveLength(0);
    });
  });

  describe('getSprintCompletions', () => {
    const sprints = ['sprint-1', 'sprint-2', '1.1.0-intellisense'];

    it('should return completion for each sprint', () => {
      const completions = getSprintCompletions(sprints);
      expect(completions).toHaveLength(3);
    });

    it('should use sprint name as value', () => {
      const completions = getSprintCompletions(sprints);
      expect(completions[0].value).toBe('sprint-1');
      expect(completions[1].value).toBe('sprint-2');
      expect(completions[2].value).toBe('1.1.0-intellisense');
    });

    it('should return empty array for empty sprints', () => {
      const completions = getSprintCompletions([]);
      expect(completions).toHaveLength(0);
    });
  });
});
