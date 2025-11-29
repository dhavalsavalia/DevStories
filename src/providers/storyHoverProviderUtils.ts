import { LINK_PATTERN } from '../utils/linkResolver';
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
