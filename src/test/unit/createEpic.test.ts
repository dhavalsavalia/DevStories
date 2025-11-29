import { describe, it, expect } from 'vitest';
import {
  generateEpicMarkdown,
  findNextEpicId,
  parseConfigYaml,
} from '../../commands/createEpicUtils';

describe('createEpic utilities', () => {
  describe('parseConfigYaml', () => {
    it('should parse epic prefix from config', () => {
      const yaml = `
version: 1
project: "TestProject"
id_prefix:
  epic: "EPIC"
  story: "STORY"
`;
      const config = parseConfigYaml(yaml);
      expect(config.epicPrefix).toBe('EPIC');
    });

    it('should parse custom epic prefix', () => {
      const yaml = `
version: 1
project: "TestProject"
id_prefix:
  epic: "PROJ"
  story: "FEAT"
`;
      const config = parseConfigYaml(yaml);
      expect(config.epicPrefix).toBe('PROJ');
    });

    it('should parse current sprint', () => {
      const yaml = `
version: 1
project: "TestProject"
id_prefix:
  epic: "EPIC"
  story: "STORY"
sprints:
  current: "sprint-5"
`;
      const config = parseConfigYaml(yaml);
      expect(config.currentSprint).toBe('sprint-5');
    });

    it('should parse statuses list', () => {
      const yaml = `
version: 1
project: "TestProject"
id_prefix:
  epic: "EPIC"
  story: "STORY"
statuses:
  - id: todo
    label: "To Do"
  - id: in_progress
    label: "In Progress"
  - id: done
    label: "Done"
`;
      const config = parseConfigYaml(yaml);
      expect(config.statuses).toEqual(['todo', 'in_progress', 'done']);
    });
  });

  describe('findNextEpicId', () => {
    it('should return 1 when no epics exist', () => {
      const existingIds: string[] = [];
      const nextId = findNextEpicId(existingIds, 'EPIC');
      expect(nextId).toBe(1);
    });

    it('should return next sequential number', () => {
      const existingIds = ['EPIC-001', 'EPIC-002', 'EPIC-003'];
      const nextId = findNextEpicId(existingIds, 'EPIC');
      expect(nextId).toBe(4);
    });

    it('should find gaps and use highest + 1', () => {
      const existingIds = ['EPIC-001', 'EPIC-005', 'EPIC-003'];
      const nextId = findNextEpicId(existingIds, 'EPIC');
      expect(nextId).toBe(6);
    });

    it('should handle custom prefix', () => {
      const existingIds = ['PROJ-001', 'PROJ-002'];
      const nextId = findNextEpicId(existingIds, 'PROJ');
      expect(nextId).toBe(3);
    });

    it('should ignore non-matching prefixes', () => {
      const existingIds = ['EPIC-001', 'STORY-005', 'EPIC-002'];
      const nextId = findNextEpicId(existingIds, 'EPIC');
      expect(nextId).toBe(3);
    });
  });

  describe('generateEpicMarkdown', () => {
    it('should generate valid epic markdown with all fields', () => {
      const markdown = generateEpicMarkdown({
        id: 'EPIC-001',
        title: 'Test Epic',
        goal: 'Build amazing features',
      });

      expect(markdown).toContain('id: EPIC-001');
      expect(markdown).toContain('title: "Test Epic"');
      expect(markdown).toContain('status: todo');
      expect(markdown).not.toContain('sprint:'); // Epics don't have sprints
      expect(markdown).toContain('# Test Epic');
      expect(markdown).toContain('Build amazing features');
    });

    it('should use placeholder when no goal provided', () => {
      const markdown = generateEpicMarkdown({
        id: 'EPIC-002',
        title: 'Another Epic',
      });

      expect(markdown).toContain('[Add epic description here]');
    });

    it('should escape quotes in title', () => {
      const markdown = generateEpicMarkdown({
        id: 'EPIC-003',
        title: 'Epic with "quotes"',
      });

      expect(markdown).toContain('title: "Epic with \\"quotes\\""');
    });

    it('should include created date as today', () => {
      const today = new Date().toISOString().split('T')[0];
      const markdown = generateEpicMarkdown({
        id: 'EPIC-001',
        title: 'Test Epic',
      });

      expect(markdown).toContain(`created: ${today}`);
    });

    it('should include Stories section placeholder', () => {
      const markdown = generateEpicMarkdown({
        id: 'EPIC-001',
        title: 'Test Epic',
      });

      expect(markdown).toContain('## Stories');
    });
  });
});
