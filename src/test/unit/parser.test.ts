import { describe, expect, it } from 'vitest';
import { Parser } from '../../core/parser';

describe('Parser', () => {
  describe('parseStory', () => {
    it('should parse a valid story', () => {
      const content = `---
id: DS-001
title: Test Story
type: feature
epic: EPIC-001
status: todo
sprint: sprint-1
size: M
assignee: user
dependencies:
  - DS-002
created: 2025-01-01
updated: 2025-01-02
---

# Test Story
This is the content.`;

      const story = Parser.parseStory(content, '/path/to/DS-001.md');

      expect(story.id).toBe('DS-001');
      expect(story.title).toBe('Test Story');
      expect(story.type).toBe('feature');
      expect(story.epic).toBe('EPIC-001');
      expect(story.status).toBe('todo');
      expect(story.sprint).toBe('sprint-1');
      expect(story.size).toBe('M');
      expect(story.assignee).toBe('user');
      expect(story.dependencies).toEqual(['DS-002']);
      expect(story.created).toBeInstanceOf(Date);
      expect(story.created.toISOString().startsWith('2025-01-01')).toBe(true);
      expect(story.updated).toBeInstanceOf(Date);
      expect(story.content.trim()).toBe('# Test Story\nThis is the content.');
      expect(story.filePath).toBe('/path/to/DS-001.md');
    });

    it('should throw error if frontmatter is missing', () => {
      const content = `# Just Markdown`;
      expect(() => Parser.parseStory(content)).toThrow('Invalid frontmatter');
    });

    it('should throw error if required fields are missing', () => {
      const content = `---
id: DS-001
---
# Content`;
      expect(() => Parser.parseStory(content)).toThrow('Missing required fields');
    });

    it('should handle missing optional fields', () => {
      const content = `---
id: DS-001
title: Minimal Story
type: task
epic: EPIC-001
status: todo
size: S
created: 2025-01-01
---
Content`;
      const story = Parser.parseStory(content);
      expect(story.assignee).toBeUndefined();
      expect(story.dependencies).toEqual([]);
      expect(story.updated).toBeUndefined();
    });
  });

  describe('parseEpic', () => {
    it('should parse a valid epic', () => {
      const content = `---
id: EPIC-001
title: Test Epic
status: in_progress
sprint: sprint-1
created: 2025-01-01
---
# Epic Content`;

      const epic = Parser.parseEpic(content, '/path/to/EPIC-001.md');

      expect(epic.id).toBe('EPIC-001');
      expect(epic.title).toBe('Test Epic');
      expect(epic.status).toBe('in_progress');
      expect(epic.created).toBeInstanceOf(Date);
      expect(epic.content.trim()).toBe('# Epic Content');
    });
  });
});
