/**
 * Pure utility functions for ConfigService - no VS Code dependencies
 * These can be unit tested with Vitest
 */

import { StoryType, StorySize } from '../types/story';
import { CadenceConfig, parseCadenceConfig, DEFAULT_CADENCE_CONFIG } from './cadenceServiceUtils';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const matter = require('gray-matter');

export { CadenceConfig };

/**
 * Status definition from config.yaml
 */
export interface StatusDef {
  id: string;
  label: string;
}

/**
 * Template data parsed from .devstories/templates/ files
 */
export interface TemplateData {
  name: string;           // Filename without .md (e.g., "api-endpoint")
  displayName: string;    // From frontmatter title or fallback to name
  description?: string;   // From frontmatter description
  types?: StoryType[];    // Filter by story type (if specified)
  content: string;        // Template body (without frontmatter)
}

/**
 * Config data parsed from config.yaml
 */
export interface ConfigData {
  epicPrefix: string;
  storyPrefix: string;
  currentSprint?: string;
  sprintSequence: string[];
  statuses: StatusDef[];
  sizes: StorySize[];
  inlineTemplates?: Partial<Record<StoryType, string>>;
  cadence: CadenceConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ConfigData = {
  epicPrefix: 'EPIC',
  storyPrefix: 'STORY',
  sprintSequence: [],
  statuses: [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' },
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL'] as StorySize[],
  cadence: DEFAULT_CADENCE_CONFIG,
};

/**
 * Parse config.yaml content into ConfigData
 * Returns partial data - use mergeConfigWithDefaults to fill in missing fields
 */
export function parseConfigYamlContent(content: string): Partial<ConfigData> {
  if (!content.trim()) {
    return {};
  }

  try {
    const parsed = matter.engines.yaml.parse(content);
    if (!parsed) {
      return {};
    }

    const result: Partial<ConfigData> = {};

    // ID prefixes
    if (parsed.id_prefix?.epic) {
      result.epicPrefix = parsed.id_prefix.epic;
    }
    if (parsed.id_prefix?.story) {
      result.storyPrefix = parsed.id_prefix.story;
    }

    // Sprint
    if (parsed.sprints?.current) {
      result.currentSprint = parsed.sprints.current;
    }
    if (Array.isArray(parsed.sprints?.sequence)) {
      result.sprintSequence = parsed.sprints.sequence;
    }

    // Statuses
    if (Array.isArray(parsed.statuses)) {
      result.statuses = parsed.statuses.map((s: { id: string; label?: string }) => ({
        id: s.id,
        label: s.label ?? s.id,
      }));
    }

    // Sizes
    if (Array.isArray(parsed.sizes)) {
      result.sizes = parsed.sizes;
    }

    // Inline templates
    if (parsed.templates) {
      result.inlineTemplates = {
        feature: parsed.templates.feature,
        bug: parsed.templates.bug,
        task: parsed.templates.task,
        chore: parsed.templates.chore,
      };
    }

    // Cadence reminders
    if (parsed.cadence) {
      result.cadence = parseCadenceConfig(parsed);
    }

    return result;
  } catch {
    return {};
  }
}

/**
 * Parse a template file into TemplateData
 */
export function parseTemplateFile(filename: string, content: string): TemplateData {
  const name = filename.replace(/\.md$/, '');
  const parsed = matter(content);

  return {
    name,
    displayName: parsed.data?.title ?? name,
    description: parsed.data?.description,
    types: parsed.data?.types,
    content: parsed.content.trim(),
  };
}

/**
 * Merge parsed config with defaults
 */
export function mergeConfigWithDefaults(parsed: Partial<ConfigData>): ConfigData {
  return {
    epicPrefix: parsed.epicPrefix ?? DEFAULT_CONFIG.epicPrefix,
    storyPrefix: parsed.storyPrefix ?? DEFAULT_CONFIG.storyPrefix,
    currentSprint: parsed.currentSprint,
    sprintSequence: parsed.sprintSequence ?? DEFAULT_CONFIG.sprintSequence,
    statuses: parsed.statuses ?? DEFAULT_CONFIG.statuses,
    sizes: parsed.sizes ?? DEFAULT_CONFIG.sizes,
    inlineTemplates: parsed.inlineTemplates,
    cadence: parsed.cadence ?? DEFAULT_CONFIG.cadence,
  };
}

/**
 * Get the index of a sprint in the sequence.
 * Returns Infinity for sprints not in sequence (sorts to end).
 */
export function getSprintIndex(sprintName: string | undefined, sequence: string[]): number {
  if (!sprintName) {
    return Infinity;
  }
  const index = sequence.indexOf(sprintName);
  return index === -1 ? Infinity : index;
}

/**
 * Generic debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
