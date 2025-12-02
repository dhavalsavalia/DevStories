/**
 * Pure utility functions for ConfigService - no VS Code dependencies
 * These can be unit tested with Vitest
 */

import { StoryType, StorySize } from '../types/story';

 
const matter = require('gray-matter');

/**
 * Status definition from config.json
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
 * Config data parsed from config.json
 */
export interface ConfigData {
  epicPrefix: string;
  storyPrefix: string;
  currentSprint?: string;
  sprintSequence: string[];
  statuses: StatusDef[];
  sizes: StorySize[];
  quickCaptureDefaultToCurrentSprint: boolean;
  autoFilterCurrentSprint: boolean;
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
  quickCaptureDefaultToCurrentSprint: false,
  autoFilterCurrentSprint: true,
};

/**
 * Validation result for sprint config
 */
export interface SprintValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that currentSprint exists in sequence (if both are defined)
 */
export function validateSprintConfig(config: ConfigData): SprintValidationResult {
  // No currentSprint set - valid
  if (!config.currentSprint) {
    return { valid: true };
  }

  // Empty sequence - valid (no constraint)
  if (config.sprintSequence.length === 0) {
    return { valid: true };
  }

  // currentSprint must exist in sequence
  if (!config.sprintSequence.includes(config.currentSprint)) {
    return {
      valid: false,
      error: `Sprint "${config.currentSprint}" is not in the sequence`,
    };
  }

  return { valid: true };
}

/**
 * Parse config.json content into ConfigData
 * Returns partial data - use mergeConfigWithDefaults to fill in missing fields
 */
export function parseConfigJsonContent(content: string): Partial<ConfigData> {
  if (!content.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(content);
    if (!parsed) {
      return {};
    }

    const result: Partial<ConfigData> = {};

    // ID prefixes (camelCase in JSON)
    if (parsed.idPrefix?.epic) {
      result.epicPrefix = parsed.idPrefix.epic;
    }
    if (parsed.idPrefix?.story) {
      result.storyPrefix = parsed.idPrefix.story;
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

    // Quick capture options
    if (typeof parsed.quickCapture?.defaultToCurrentSprint === 'boolean') {
      result.quickCaptureDefaultToCurrentSprint = parsed.quickCapture.defaultToCurrentSprint;
    }

    // Auto-filter current sprint (DS-153)
    if (typeof parsed.autoFilterCurrentSprint === 'boolean') {
      result.autoFilterCurrentSprint = parsed.autoFilterCurrentSprint;
    }

    return result;
  } catch {
    // Invalid JSON config - return empty to use defaults
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
    quickCaptureDefaultToCurrentSprint: parsed.quickCaptureDefaultToCurrentSprint ?? DEFAULT_CONFIG.quickCaptureDefaultToCurrentSprint,
    autoFilterCurrentSprint: parsed.autoFilterCurrentSprint ?? DEFAULT_CONFIG.autoFilterCurrentSprint,
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
 * Sort sprints by sequence order.
 * Sprints in sequence appear first (in sequence order).
 * Sprints NOT in sequence appear after, sorted alphabetically.
 */
export function sortSprintsBySequence(sprints: string[], sprintSequence: string[]): string[] {
  return [...sprints].sort((a, b) => {
    const indexA = getSprintIndex(a, sprintSequence);
    const indexB = getSprintIndex(b, sprintSequence);

    // Both in sequence: sort by sequence order
    if (indexA !== Infinity && indexB !== Infinity) {
      return indexA - indexB;
    }

    // One in sequence, one not: sequence first
    if (indexA !== Infinity) { return -1; }
    if (indexB !== Infinity) { return 1; }

    // Neither in sequence: sort alphabetically
    return a.localeCompare(b);
  });
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
