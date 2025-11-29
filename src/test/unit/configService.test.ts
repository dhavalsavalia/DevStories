import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseConfigYamlContent,
  parseTemplateFile,
  mergeConfigWithDefaults,
  ConfigData,
  TemplateData,
  DEFAULT_CONFIG,
  debounce,
  getSprintIndex,
} from '../../core/configServiceUtils';

describe('ConfigService Utils', () => {
  describe('parseConfigYamlContent', () => {
    it('should parse complete config.yaml', () => {
      const yaml = `
version: 1
project: "Test Project"
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
sprints:
  current: "sprint-1"
sizes: ["XS", "S", "M", "L", "XL"]
templates:
  feature: |
    Custom feature template
  bug: |
    Custom bug template
`;
      const result = parseConfigYamlContent(yaml);

      expect(result.epicPrefix).toBe('EPIC');
      expect(result.storyPrefix).toBe('STORY');
      expect(result.currentSprint).toBe('sprint-1');
      expect(result.statuses).toEqual([
        { id: 'todo', label: 'To Do' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'done', label: 'Done' },
      ]);
      expect(result.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL']);
      expect(result.inlineTemplates?.feature).toContain('Custom feature template');
      expect(result.inlineTemplates?.bug).toContain('Custom bug template');
    });

    it('should return partial result for minimal config', () => {
      const yaml = `version: 1`;
      const result = parseConfigYamlContent(yaml);

      expect(result.epicPrefix).toBeUndefined();
      expect(result.storyPrefix).toBeUndefined();
      expect(result.statuses).toBeUndefined();
    });

    it('should return empty object for invalid yaml', () => {
      const result = parseConfigYamlContent('{ invalid yaml [');
      expect(result).toEqual({});
    });

    it('should return empty object for empty string', () => {
      const result = parseConfigYamlContent('');
      expect(result).toEqual({});
    });
  });

  describe('parseTemplateFile', () => {
    it('should parse template with frontmatter', () => {
      const content = `---
title: API Endpoint
description: Create REST endpoint
types: [feature, task]
---

## Endpoint Details
- Method:
- Path:
`;
      const result = parseTemplateFile('api-endpoint.md', content);

      expect(result.name).toBe('api-endpoint');
      expect(result.displayName).toBe('API Endpoint');
      expect(result.description).toBe('Create REST endpoint');
      expect(result.types).toEqual(['feature', 'task']);
      expect(result.content).toContain('## Endpoint Details');
    });

    it('should use filename as displayName if no title', () => {
      const content = `## Just content`;
      const result = parseTemplateFile('my-template.md', content);

      expect(result.name).toBe('my-template');
      expect(result.displayName).toBe('my-template');
      expect(result.content).toBe('## Just content');
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---
Some content`;
      const result = parseTemplateFile('test.md', content);

      expect(result.name).toBe('test');
      expect(result.displayName).toBe('test');
    });
  });

  describe('mergeConfigWithDefaults', () => {
    it('should use parsed values when available', () => {
      const parsed: Partial<ConfigData> = {
        epicPrefix: 'PROJ',
        storyPrefix: 'FEAT',
        statuses: [{ id: 'open', label: 'Open' }],
      };
      const result = mergeConfigWithDefaults(parsed);

      expect(result.epicPrefix).toBe('PROJ');
      expect(result.storyPrefix).toBe('FEAT');
      expect(result.statuses).toEqual([{ id: 'open', label: 'Open' }]);
      // Defaults for missing
      expect(result.sizes).toEqual(DEFAULT_CONFIG.sizes);
    });

    it('should use all defaults when parsed is empty', () => {
      const result = mergeConfigWithDefaults({});

      expect(result.epicPrefix).toBe(DEFAULT_CONFIG.epicPrefix);
      expect(result.storyPrefix).toBe(DEFAULT_CONFIG.storyPrefix);
      expect(result.statuses).toEqual(DEFAULT_CONFIG.statuses);
      expect(result.sizes).toEqual(DEFAULT_CONFIG.sizes);
    });

    it('should preserve templates from parsed', () => {
      const parsed: Partial<ConfigData> = {
        inlineTemplates: { feature: 'Custom feature' },
      };
      const result = mergeConfigWithDefaults(parsed);

      expect(result.inlineTemplates?.feature).toBe('Custom feature');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should cancel previous pending call', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('first');
      vi.advanceTimersByTime(50);
      debounced('second');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('second');
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_CONFIG.epicPrefix).toBe('EPIC');
      expect(DEFAULT_CONFIG.storyPrefix).toBe('STORY');
      expect(DEFAULT_CONFIG.statuses.length).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.sizes.length).toBe(5);
    });

    it('should have required status workflow', () => {
      const statusIds = DEFAULT_CONFIG.statuses.map(s => s.id);
      expect(statusIds).toContain('todo');
      expect(statusIds).toContain('done');
    });

    it('should have cadence config disabled by default', () => {
      expect(DEFAULT_CONFIG.cadence).toBeDefined();
      expect(DEFAULT_CONFIG.cadence.enabled).toBe(false);
    });
  });

  describe('parseConfigYamlContent with cadence', () => {
    it('should parse cadence config when present', () => {
      const yaml = `
version: 1
cadence:
  enabled: true
  reminders:
    planning:
      day: monday
      time: "09:00"
    retro:
      day: friday
      time: "16:00"
  activeHours:
    start: 9
    end: 18
`;
      const result = parseConfigYamlContent(yaml);

      expect(result.cadence).toBeDefined();
      expect(result.cadence?.enabled).toBe(true);
      expect(result.cadence?.reminders.planning?.day).toBe('monday');
      expect(result.cadence?.reminders.planning?.time).toBe('09:00');
      expect(result.cadence?.reminders.retro?.day).toBe('friday');
      expect(result.cadence?.activeHours?.start).toBe(9);
      expect(result.cadence?.activeHours?.end).toBe(18);
    });

    it('should use default cadence when not in config', () => {
      const yaml = `version: 1`;
      const result = parseConfigYamlContent(yaml);
      const merged = mergeConfigWithDefaults(result);

      expect(merged.cadence.enabled).toBe(false);
    });
  });

  describe('parseConfigYamlContent with sprint sequence', () => {
    it('should parse sprint sequence array', () => {
      const yaml = `
version: 1
sprints:
  current: "sprint-2"
  sequence:
    - sprint-1
    - sprint-2
    - sprint-3
    - backlog
`;
      const result = parseConfigYamlContent(yaml);

      expect(result.currentSprint).toBe('sprint-2');
      expect(result.sprintSequence).toEqual(['sprint-1', 'sprint-2', 'sprint-3', 'backlog']);
    });

    it('should handle missing sequence', () => {
      const yaml = `
version: 1
sprints:
  current: "sprint-1"
`;
      const result = parseConfigYamlContent(yaml);
      const merged = mergeConfigWithDefaults(result);

      expect(merged.currentSprint).toBe('sprint-1');
      expect(merged.sprintSequence).toEqual([]);
    });

    it('should handle empty sequence', () => {
      const yaml = `
version: 1
sprints:
  current: "sprint-1"
  sequence: []
`;
      const result = parseConfigYamlContent(yaml);

      expect(result.sprintSequence).toEqual([]);
    });
  });

  describe('getSprintIndex', () => {
    const sequence = ['foundation-1', 'polish-1', 'polish-2', 'launch-1', 'backlog'];

    it('should return index for sprint in sequence', () => {
      expect(getSprintIndex('foundation-1', sequence)).toBe(0);
      expect(getSprintIndex('polish-1', sequence)).toBe(1);
      expect(getSprintIndex('backlog', sequence)).toBe(4);
    });

    it('should return Infinity for sprint not in sequence', () => {
      expect(getSprintIndex('unknown-sprint', sequence)).toBe(Infinity);
    });

    it('should return Infinity for undefined sprint', () => {
      expect(getSprintIndex(undefined, sequence)).toBe(Infinity);
    });

    it('should return Infinity for empty sequence', () => {
      expect(getSprintIndex('sprint-1', [])).toBe(Infinity);
    });

    it('should handle empty string sprint', () => {
      expect(getSprintIndex('', sequence)).toBe(Infinity);
    });
  });
});
