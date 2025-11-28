import { describe, it, expect } from 'vitest';
import {
  parseConfigYaml,
  findNextStoryId,
  getSuggestedSize,
  calculateTitleSimilarity,
  generateStoryMarkdown,
  generateStoryLink,
  appendStoryToEpic,
  DEFAULT_TEMPLATES,
} from '../../commands/createStoryUtils';

describe('createStory Utils', () => {
  describe('parseConfigYaml', () => {
    it('should parse complete config', () => {
      const yaml = `
version: 1
project: "Test Project"
id_prefix:
  epic: "EPIC"
  story: "STORY"
statuses:
  - id: todo
    label: "To Do"
  - id: done
    label: "Done"
sprints:
  current: "sprint-1"
sizes: ["XS", "S", "M", "L", "XL"]
templates:
  feature: |
    Custom feature template
  bug: |
    Custom bug template
`;
      const config = parseConfigYaml(yaml);

      expect(config.storyPrefix).toBe('STORY');
      expect(config.epicPrefix).toBe('EPIC');
      expect(config.currentSprint).toBe('sprint-1');
      expect(config.statuses).toEqual(['todo', 'done']);
      expect(config.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL']);
      expect(config.templates.feature).toContain('Custom feature template');
    });

    it('should use defaults for missing fields', () => {
      const yaml = `version: 1`;
      const config = parseConfigYaml(yaml);

      expect(config.storyPrefix).toBe('STORY');
      expect(config.epicPrefix).toBe('EPIC');
      expect(config.templates.feature).toBe(DEFAULT_TEMPLATES.feature);
      expect(config.templates.bug).toBe(DEFAULT_TEMPLATES.bug);
    });
  });

  describe('findNextStoryId', () => {
    it('should return 1 for empty list', () => {
      expect(findNextStoryId([], 'STORY')).toBe(1);
    });

    it('should find next sequential ID', () => {
      const existing = ['STORY-001', 'STORY-002', 'STORY-005'];
      expect(findNextStoryId(existing, 'STORY')).toBe(6);
    });

    it('should work with custom prefix', () => {
      const existing = ['DS-001', 'DS-010', 'DS-003'];
      expect(findNextStoryId(existing, 'DS')).toBe(11);
    });

    it('should ignore IDs with different prefix', () => {
      const existing = ['STORY-005', 'EPIC-010', 'OTHER-100'];
      expect(findNextStoryId(existing, 'STORY')).toBe(6);
    });
  });

  describe('getSuggestedSize', () => {
    it('should suggest S for bugs', () => {
      expect(getSuggestedSize('bug')).toBe('S');
    });

    it('should suggest M for features', () => {
      expect(getSuggestedSize('feature')).toBe('M');
    });

    it('should suggest M for tasks', () => {
      expect(getSuggestedSize('task')).toBe('M');
    });

    it('should suggest S for chores', () => {
      expect(getSuggestedSize('chore')).toBe('S');
    });
  });

  describe('calculateTitleSimilarity', () => {
    it('should return 1 for identical titles', () => {
      expect(calculateTitleSimilarity('Add user login', 'Add user login')).toBe(1);
    });

    it('should return 0 for completely different titles', () => {
      expect(calculateTitleSimilarity('Add login', 'Delete database')).toBe(0);
    });

    it('should return partial match for similar titles', () => {
      const similarity = calculateTitleSimilarity('Add user login form', 'User login validation');
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(1);
    });

    it('should be case insensitive', () => {
      expect(calculateTitleSimilarity('Add Login', 'add login')).toBe(1);
    });

    it('should ignore short words', () => {
      // "a" and "to" are < 3 chars, ignored
      expect(calculateTitleSimilarity('a to', 'b in')).toBe(0);
    });
  });

  describe('generateStoryMarkdown', () => {
    it('should generate valid story markdown', () => {
      const data = {
        id: 'STORY-001',
        title: 'Add user login',
        type: 'feature' as const,
        epic: 'EPIC-001',
        sprint: 'sprint-1',
        size: 'M' as const,
      };
      const md = generateStoryMarkdown(data, DEFAULT_TEMPLATES.feature);

      expect(md).toContain('id: STORY-001');
      expect(md).toContain('title: "Add user login"');
      expect(md).toContain('type: feature');
      expect(md).toContain('epic: EPIC-001');
      expect(md).toContain('status: todo');
      expect(md).toContain('sprint: sprint-1');
      expect(md).toContain('size: M');
      expect(md).toContain('# Add user login');
      expect(md).toContain('## User Story');
    });

    it('should escape quotes in title', () => {
      const data = {
        id: 'STORY-001',
        title: 'Fix "broken" thing',
        type: 'bug' as const,
        epic: 'EPIC-001',
        sprint: 'sprint-1',
        size: 'S' as const,
      };
      const md = generateStoryMarkdown(data, DEFAULT_TEMPLATES.bug);

      expect(md).toContain('title: "Fix \\"broken\\" thing"');
    });

    it('should include dependencies when provided', () => {
      const data = {
        id: 'STORY-003',
        title: 'Dependent story',
        type: 'task' as const,
        epic: 'EPIC-001',
        sprint: 'sprint-1',
        size: 'M' as const,
        dependencies: ['STORY-001', 'STORY-002'],
      };
      const md = generateStoryMarkdown(data, DEFAULT_TEMPLATES.task);

      expect(md).toContain('dependencies:');
      expect(md).toContain('- STORY-001');
      expect(md).toContain('- STORY-002');
    });
  });

  describe('generateStoryLink', () => {
    it('should generate correct link format', () => {
      const link = generateStoryLink('STORY-005', 'Add dark mode');
      expect(link).toBe('- [[STORY-005]] Add dark mode');
    });
  });

  describe('appendStoryToEpic', () => {
    it('should append to existing Stories section', () => {
      const epicContent = `---
id: EPIC-001
title: "Test Epic"
---

# Test Epic

## Description
Some description

## Stories
- [[STORY-001]] First story

## Notes
Some notes
`;
      const result = appendStoryToEpic(epicContent, '- [[STORY-002]] Second story');

      expect(result).toContain('- [[STORY-001]] First story');
      expect(result).toContain('- [[STORY-002]] Second story');
      expect(result).toContain('## Notes');
    });

    it('should create Stories section if missing', () => {
      const epicContent = `---
id: EPIC-001
---

# Test Epic

## Description
`;
      const result = appendStoryToEpic(epicContent, '- [[STORY-001]] New story');

      expect(result).toContain('## Stories');
      expect(result).toContain('- [[STORY-001]] New story');
    });

    it('should handle empty Stories section', () => {
      const epicContent = `---
id: EPIC-001
---

# Test Epic

## Stories

## Notes
`;
      const result = appendStoryToEpic(epicContent, '- [[STORY-001]] First story');

      expect(result).toContain('## Stories');
      expect(result).toContain('- [[STORY-001]] First story');
      expect(result).toContain('## Notes');
    });
  });
});
