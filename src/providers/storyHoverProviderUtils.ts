import { LINK_PATTERN, BARE_ID_PATTERN } from '../utils/linkResolver';
import { Story, StoryType } from '../types/story';
import { Epic } from '../types/epic';

/**
 * Represents a link match with position info
 */
export interface HoverLinkMatch {
  id: string;
  start: number;
  end: number;
}

/**
 * Get status indicator symbol for display
 */
export function getStatusIndicator(status: string): string {
  switch (status) {
    case 'todo':
      return '○';
    case 'in_progress':
      return '◐';
    case 'review':
      return '◑';
    case 'done':
      return '●';
    default:
      return '◇';
  }
}

/**
 * Get type icon emoji for display
 */
export function getTypeIcon(type: StoryType | 'epic'): string {
  switch (type) {
    case 'feature':
      return '✨';
    case 'bug':
      return '🐛';
    case 'task':
      return '📋';
    case 'chore':
      return '🔧';
    case 'epic':
      return '📁';
    default:
      return '📄';
  }
}

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Progress info for epics
 */
export interface EpicProgress {
  done: number;
  total: number;
}

/**
 * Format hover card markdown for a story or epic
 */
export function formatHoverCard(
  item: Story | Epic,
  type: 'story' | 'epic',
  progress?: EpicProgress
): string {
  const isStory = type === 'story';
  const story = item as Story;
  const icon = isStory ? getTypeIcon(story.type) : getTypeIcon('epic');

  const lines: string[] = [];

  // Title line
  lines.push(`### ${icon} ${item.id}: ${item.title}`);
  lines.push('');

  // Status
  lines.push(`**Status:** ${getStatusIndicator(item.status)} ${item.status}  `);

  // Type (stories only)
  if (isStory) {
    lines.push(`**Type:** ${capitalize(story.type)}  `);
  }

  // Size (stories only)
  if (isStory) {
    lines.push(`**Size:** ${story.size}  `);
  }

  // Priority (stories only, show when non-default)
  if (isStory && story.priority !== 500) {
    lines.push(`**Priority:** ${story.priority}  `);
  }

  // Epic (stories only)
  if (isStory && story.epic) {
    lines.push(`**Epic:** ${story.epic}  `);
  }

  // Sprint (stories only - epics don't have sprints)
  if (isStory && (item as Story).sprint) {
    lines.push(`**Sprint:** ${(item as Story).sprint}  `);
  }

  // Progress (epics only)
  if (!isStory && progress) {
    lines.push(`**Progress:** ${progress.done}/${progress.total} stories done  `);
  }

  return lines.join('\n');
}

/**
 * Find [[ID]] link at a given character position in text
 * Returns match info or null if position is not inside a link
 */
export function findLinkAtPosition(text: string, position: number): HoverLinkMatch | null {
  // Create new regex instance to reset lastIndex
  const regex = new RegExp(LINK_PATTERN.source, 'g');

  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;

    // Check if position is within this match (inclusive of brackets)
    if (position >= start && position < end) {
      return {
        id: match[1],
        start,
        end,
      };
    }
  }

  return null;
}

/**
 * Find bare ID (without [[]]) at a given character position in text
 * Used for frontmatter fields like epic: and dependencies:
 * Returns match info or null if position is not inside an ID
 */
export function findBareIdAtPosition(text: string, position: number): HoverLinkMatch | null {
  // Create new regex instance to reset lastIndex
  const regex = new RegExp(BARE_ID_PATTERN.source, 'g');

  let match;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;

    // Check if position is within this match
    if (position >= start && position < end) {
      return {
        id: match[1],
        start,
        end,
      };
    }
  }

  return null;
}

/**
 * Check if a line number is within YAML frontmatter
 * Frontmatter starts with --- on line 0 and ends with --- on a subsequent line
 * @param lines Array of all lines in the document
 * @param lineNumber The line number to check (0-indexed)
 * @returns true if line is inside frontmatter (between delimiters, not on them)
 */
export function isInFrontmatter(lines: string[], lineNumber: number): boolean {
  // Must have at least 2 lines for valid frontmatter
  if (lines.length < 2) {
    return false;
  }

  // First line must be ---
  if (lines[0].trim() !== '---') {
    return false;
  }

  // Can't be on line 0 (the opening delimiter)
  if (lineNumber === 0) {
    return false;
  }

  // Find the closing ---
  let closingLine = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingLine = i;
      break;
    }
  }

  // If no closing found, treat everything after line 0 as frontmatter
  if (closingLine === -1) {
    return lineNumber > 0;
  }

  // Line must be between opening (0) and closing, exclusive
  return lineNumber > 0 && lineNumber < closingLine;
}

/**
 * Represents a field name match with position info
 */
export interface FieldNameMatch {
  fieldName: string;
  start: number;
  end: number;
}

/**
 * Find YAML field name at a given character position in text
 * Returns match info or null if position is not on a field name
 */
export function findFieldNameAtPosition(text: string, position: number): FieldNameMatch | null {
  // Find colon position
  const colonIndex = text.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }

  // Position must be before the colon to be on the field name
  if (position >= colonIndex) {
    return null;
  }

  // Check if this is a YAML array item (starts with -)
  const trimmedLine = text.trimStart();
  if (trimmedLine.startsWith('-')) {
    return null;
  }

  // Extract field name (everything before the colon, trimmed)
  const beforeColon = text.substring(0, colonIndex);
  const fieldName = beforeColon.trim();

  if (!fieldName) {
    return null;
  }

  // Calculate start/end positions (accounting for leading whitespace)
  const leadingWhitespace = beforeColon.length - beforeColon.trimStart().length;
  const start = leadingWhitespace;
  const end = start + fieldName.length;

  // Check if position is within the field name bounds
  if (position < start || position >= end) {
    return null;
  }

  return {
    fieldName,
    start,
    end,
  };
}

/**
 * Field descriptions from JSON schemas
 * Loaded statically to avoid file I/O in hover provider
 */
const STORY_FIELD_DESCRIPTIONS: Record<string, string> = {
  id: 'Unique story identifier (e.g., DS-001)',
  title: 'Story title - brief description of the work',
  type: 'Story type: feature, bug, task, or chore',
  epic: 'Parent epic ID this story belongs to',
  status: 'Current workflow status (validated against config.yaml statuses)',
  sprint: 'Sprint identifier (validated against config.yaml sprints)',
  size: 'Complexity estimate: XS, S, M, L, or XL',
  priority: 'Sort priority - lower values appear first',
  assignee: 'Person assigned to this story',
  dependencies: 'List of story IDs this story depends on',
  created: 'Date story was created (YYYY-MM-DD)',
  updated: 'Date story was last modified (auto-updated on save)',
};

const EPIC_FIELD_DESCRIPTIONS: Record<string, string> = {
  id: 'Unique epic identifier (e.g., EPIC-001 or EPIC-INBOX)',
  title: 'Epic title - thematic grouping of related stories',
  status: 'Current workflow status (validated against config.yaml statuses)',
  created: 'Date epic was created (YYYY-MM-DD)',
  updated: 'Date epic was last modified (auto-updated on save)',
};

/**
 * Get field description from schema
 * @param fieldName The YAML field name
 * @param fileType 'story' or 'epic'
 * @returns Description string or null if field not found
 */
export function getFieldDescription(fieldName: string, fileType: 'story' | 'epic'): string | null {
  const descriptions = fileType === 'story' ? STORY_FIELD_DESCRIPTIONS : EPIC_FIELD_DESCRIPTIONS;
  return descriptions[fieldName] ?? null;
}
