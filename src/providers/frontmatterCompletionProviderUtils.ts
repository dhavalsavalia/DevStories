/**
 * Pure utility functions for FrontmatterCompletionProvider - no VS Code dependencies
 * These can be unit tested with Vitest
 */

import { StatusDef } from '../core/configServiceUtils';
import { StorySize } from '../types/story';

/**
 * Completion data returned by utility functions
 * Converted to VS Code CompletionItem in the provider
 */
export interface CompletionData {
  value: string;
  detail?: string;
}

/**
 * Enum fields that support autocomplete
 */
const ENUM_FIELDS = ['status', 'type', 'size', 'sprint'];

/**
 * Size descriptions for display
 */
const SIZE_DESCRIPTIONS: Record<StorySize, string> = {
  XS: 'Extra Small',
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  XL: 'Extra Large',
};

/**
 * Type descriptions for display
 */
const TYPE_DESCRIPTIONS: Record<string, string> = {
  feature: 'New functionality or capability',
  bug: 'Defect or issue to fix',
  task: 'Work item or action',
  chore: 'Maintenance or housekeeping',
};

/**
 * Detect which enum field the cursor is on (if any)
 * @param line The current line text
 * @param charPos The cursor's character position in the line
 * @returns The field name if on an enum field after colon, null otherwise
 */
export function detectFieldAtCursor(line: string, charPos: number): string | null {
  // Empty line
  if (!line.trim()) {
    return null;
  }

  // Find colon position
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }

  // Cursor must be after the colon
  if (charPos <= colonIndex) {
    return null;
  }

  // Extract field name (before colon, trimmed)
  const fieldPart = line.substring(0, colonIndex).trim();

  // Check if it's an enum field
  if (ENUM_FIELDS.includes(fieldPart)) {
    return fieldPart;
  }

  return null;
}

/**
 * Generate completion items for status field
 * @param statuses Status definitions from config
 * @returns Completion data array
 */
export function getStatusCompletions(statuses: StatusDef[]): CompletionData[] {
  return statuses.map(status => ({
    value: status.id,
    detail: status.label,
  }));
}

/**
 * Generate completion items for type field
 * @returns Completion data array with fixed story types
 */
export function getTypeCompletions(): CompletionData[] {
  return ['feature', 'bug', 'task', 'chore'].map(type => ({
    value: type,
    detail: TYPE_DESCRIPTIONS[type],
  }));
}

/**
 * Generate completion items for size field
 * @param sizes Size values from config
 * @returns Completion data array
 */
export function getSizeCompletions(sizes: StorySize[]): CompletionData[] {
  return sizes.map(size => ({
    value: size,
    detail: SIZE_DESCRIPTIONS[size],
  }));
}

/**
 * Generate completion items for sprint field
 * @param sprints Sprint sequence from config
 * @returns Completion data array
 */
export function getSprintCompletions(sprints: string[]): CompletionData[] {
  return sprints.map(sprint => ({
    value: sprint,
  }));
}
