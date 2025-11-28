/**
 * Pure utility functions for quickCapture command - no VS Code dependencies
 * These can be unit tested with Vitest
 */

import { StoryType } from '../types/story';

/**
 * Fixed ID for the inbox epic where quick captures are routed
 */
export const INBOX_EPIC_ID = 'EPIC-INBOX';

/**
 * Parsed quick capture input
 */
export interface ParsedQuickInput {
  title: string;
  type: StoryType;
  notes?: string;
}

/**
 * Type prefix mapping (case-insensitive)
 */
const TYPE_PREFIXES: Record<string, StoryType> = {
  'bug': 'bug',
  'feat': 'feature',
  'feature': 'feature',
  'chore': 'chore',
  'task': 'task',
};

/**
 * Parse quick capture input with type shorthand and pipe syntax
 *
 * Examples:
 * - "Add feature" → { title: "Add feature", type: "task" }
 * - "bug: Login fails" → { title: "Login fails", type: "bug" }
 * - "Fix login | users report 500" → { title: "Fix login", type: "task", notes: "users report 500" }
 * - "bug: Login error | Details here" → { title: "Login error", type: "bug", notes: "Details here" }
 */
export function parseQuickInput(input: string): ParsedQuickInput {
  let text = input.trim();
  let type: StoryType = 'task';
  let notes: string | undefined;

  // Check for type prefix (case-insensitive)
  const prefixMatch = text.match(/^(\w+):\s*/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1].toLowerCase();
    if (TYPE_PREFIXES[prefix]) {
      type = TYPE_PREFIXES[prefix];
      text = text.slice(prefixMatch[0].length);
    }
  }

  // Check for pipe syntax (split on first pipe)
  const pipeIndex = text.indexOf('|');
  if (pipeIndex !== -1) {
    notes = text.slice(pipeIndex + 1).trim();
    text = text.slice(0, pipeIndex).trim();
  }

  return {
    title: text.trim(),
    type,
    notes: notes || undefined,
  };
}

/**
 * Truncate text for use as a title, respecting word boundaries
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default 100)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateForTitle(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find last space before maxLength - 3 (for "...")
  const cutoff = maxLength - 3;
  const lastSpace = text.lastIndexOf(' ', cutoff);

  if (lastSpace > 0) {
    return text.slice(0, lastSpace) + '...';
  }

  // No space found, hard truncate
  return text.slice(0, cutoff) + '...';
}

/**
 * Clean selected text for use as title
 * Removes common code comment prefixes and normalizes whitespace
 *
 * @param text - Raw selected text
 * @returns Cleaned text suitable for title
 */
export function cleanSelectionText(text: string): string {
  let cleaned = text.trim();

  // Remove comment prefixes
  cleaned = cleaned.replace(/^\/\/\s*/, '');  // // comment
  cleaned = cleaned.replace(/^#\s*/, '');      // # comment

  // Remove TODO/FIXME prefixes (case-insensitive)
  cleaned = cleaned.replace(/^(TODO|FIXME):?\s*/i, '');

  // Normalize whitespace (newlines → spaces, multiple spaces → single)
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}
