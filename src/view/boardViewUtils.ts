/**
 * Pure utility functions for board view (unit-testable, no VS Code dependencies)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const matter = require('gray-matter');
import { sortSprintsBySequence } from '../core/configServiceUtils';
import { Story } from '../types/story';
import { Epic } from '../types/epic';
import { StatusConfig, WebviewStory, WebviewEpic, ThemeKind, FilterState } from '../types/webviewMessages';

const DEFAULT_STATUSES: StatusConfig[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

/**
 * Parse statuses from config.yaml content
 */
export function parseStatuses(configContent: string): StatusConfig[] {
  if (!configContent.trim()) {
    return DEFAULT_STATUSES;
  }

  try {
    // Use gray-matter's YAML engine to parse raw YAML (not frontmatter)
    const parsed = matter.engines.yaml.parse(configContent) as {
      statuses?: Array<{ id: string; label?: string; color?: string }>;
    };

    if (!parsed?.statuses || !Array.isArray(parsed.statuses) || parsed.statuses.length === 0) {
      return DEFAULT_STATUSES;
    }

    return parsed.statuses.map((s) => ({
      id: s.id,
      label: s.label || s.id,
      color: s.color,
    }));
  } catch {
    return DEFAULT_STATUSES;
  }
}

/**
 * Format Date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Serialize Story for webview (exclude sensitive filePath/content)
 */
export function serializeStoryForWebview(story: Story): WebviewStory {
  const result: WebviewStory = {
    id: story.id,
    title: story.title,
    type: story.type,
    epic: story.epic,
    status: story.status,
    size: story.size,
    priority: story.priority,
    created: formatDate(story.created),
  };

  if (story.sprint) {
    result.sprint = story.sprint;
  }
  if (story.assignee) {
    result.assignee = story.assignee;
  }
  if (story.dependencies && story.dependencies.length > 0) {
    result.dependencies = story.dependencies;
  }
  if (story.updated) {
    result.updated = formatDate(story.updated);
  }

  return result;
}

/**
 * Serialize Epic for webview (exclude sensitive filePath/content)
 */
export function serializeEpicForWebview(epic: Epic): WebviewEpic {
  return {
    id: epic.id,
    title: epic.title,
    status: epic.status,
  };
}

/**
 * Generate 32-character alphanumeric nonce for CSP
 */
export function generateNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * Map VS Code ColorThemeKind to our ThemeKind
 * Note: vscode types are not imported here to keep this unit-testable
 * The actual mapping is done in boardView.ts
 */
export function getThemeKindFromNumber(kind: number): ThemeKind {
  // vscode.ColorThemeKind: Light=1, Dark=2, HighContrast=3, HighContrastLight=4
  switch (kind) {
    case 1:
      return 'light';
    case 2:
      return 'dark';
    case 3:
    case 4:
      return 'high-contrast';
    default:
      return 'dark';
  }
}

// === DS-020: Kanban Board Utilities ===

/**
 * Type icons for story types (used in cards)
 */
const TYPE_ICONS: Record<string, string> = {
  feature: '✨',
  bug: '🐛',
  task: '🔧',
  chore: '🧹',
};

/**
 * Get emoji icon for story type
 */
export function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] || '📄';
}

/**
 * Group stories by status ID for column rendering
 */
export type StoriesByStatus = Record<string, WebviewStory[]>;

export function groupStoriesByStatus(
  stories: WebviewStory[],
  statuses: StatusConfig[]
): StoriesByStatus {
  const grouped: StoriesByStatus = {};

  // Initialize empty arrays for each status
  for (const status of statuses) {
    grouped[status.id] = [];
  }

  // Group stories into their status buckets
  for (const story of stories) {
    if (grouped[story.status]) {
      grouped[story.status].push(story);
    }
    // Stories with unknown status are ignored (not rendered)
  }

  return grouped;
}

/**
 * Get stories for a specific column (status)
 */
export function getStoriesForColumn(
  grouped: StoriesByStatus,
  statusId: string
): WebviewStory[] {
  return grouped[statusId] || [];
}

// === DS-021: Drag-Drop + Keyboard Navigation Utilities ===

/**
 * Get next column index with wraparound
 */
export function getNextColumnIndex(currentIndex: number, totalColumns: number): number {
  if (totalColumns <= 1) {
    return 0;
  }
  return (currentIndex + 1) % totalColumns;
}

/**
 * Get previous column index with wraparound
 */
export function getPrevColumnIndex(currentIndex: number, totalColumns: number): number {
  if (totalColumns <= 1) {
    return 0;
  }
  return (currentIndex - 1 + totalColumns) % totalColumns;
}

/**
 * Get next card index with wraparound within column
 */
export function getNextCardIndex(currentIndex: number, totalCards: number): number {
  if (totalCards === 0) {
    return 0;
  }
  return (currentIndex + 1) % totalCards;
}

/**
 * Get previous card index with wraparound within column
 */
export function getPrevCardIndex(currentIndex: number, totalCards: number): number {
  if (totalCards === 0) {
    return 0;
  }
  return (currentIndex - 1 + totalCards) % totalCards;
}

/**
 * Find first card ID in a column (for column navigation)
 */
export function findFirstCardInColumn(
  grouped: StoriesByStatus,
  statusId: string
): string | null {
  const stories = grouped[statusId];
  if (!stories || stories.length === 0) {
    return null;
  }
  return stories[0].id;
}

/**
 * Get index of a card within its column
 */
export function getCardIndexInColumn(
  grouped: StoriesByStatus,
  statusId: string,
  cardId: string
): number {
  const stories = grouped[statusId];
  if (!stories) {
    return -1;
  }
  return stories.findIndex((s) => s.id === cardId);
}

/**
 * Get column index by status ID
 */
export function getColumnIndexByStatus(
  statuses: StatusConfig[],
  statusId: string
): number {
  return statuses.findIndex((s) => s.id === statusId);
}

/**
 * Get status ID by column index
 */
export function getStatusByColumnIndex(
  statuses: StatusConfig[],
  index: number
): string | null {
  if (index < 0 || index >= statuses.length) {
    return null;
  }
  return statuses[index].id;
}

/**
 * Get next status in workflow (for Space key advance)
 * Returns null if at end of workflow or status not found
 */
export function getNextStatusInWorkflow(
  statuses: StatusConfig[],
  currentStatus: string
): string | null {
  const currentIndex = statuses.findIndex((s) => s.id === currentStatus);
  if (currentIndex === -1 || currentIndex >= statuses.length - 1) {
    return null;
  }
  return statuses[currentIndex + 1].id;
}

// === DS-023: Filter Utilities ===

/**
 * Default empty filter state
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  sprint: null,
  epic: null,
  type: null,
  assignee: null,
  search: '',
};

/**
 * Extract unique sprints from stories
 * Note: Epics don't have sprints - sprints are story-level only
 * @param stories - Webview stories
 * @param sprintSequence - Sprint sequence from config for ordering
 */
export function extractSprints(stories: WebviewStory[], sprintSequence: string[] = []): string[] {
  const sprintSet = new Set<string>();

  for (const story of stories) {
    if (story.sprint) {
      sprintSet.add(story.sprint);
    }
  }

  // Sort by sequence (sprints in sequence first, then alphabetical)
  return sortSprintsBySequence(Array.from(sprintSet), sprintSequence);
}

/**
 * Extract unique assignees from stories
 */
export function extractAssignees(stories: WebviewStory[]): string[] {
  const assigneeSet = new Set<string>();

  for (const story of stories) {
    if (story.assignee) {
      assigneeSet.add(story.assignee);
    }
  }

  return Array.from(assigneeSet).sort();
}

/**
 * Filter stories based on filter state
 * Uses AND logic: all active filters must match
 */
export function filterStories(stories: WebviewStory[], filters: FilterState): WebviewStory[] {
  return stories.filter((story) => {
    // Sprint filter
    if (filters.sprint !== null && story.sprint !== filters.sprint) {
      return false;
    }

    // Epic filter
    if (filters.epic !== null && story.epic !== filters.epic) {
      return false;
    }

    // Type filter
    if (filters.type !== null && story.type !== filters.type) {
      return false;
    }

    // Assignee filter
    if (filters.assignee !== null) {
      // Empty string means "unassigned"
      if (filters.assignee === '' && story.assignee) {
        return false;
      }
      // Non-empty means specific assignee
      if (filters.assignee !== '' && story.assignee !== filters.assignee) {
        return false;
      }
    }

    // Search filter (case-insensitive match on title or id)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = story.title.toLowerCase().includes(searchLower);
      const idMatch = story.id.toLowerCase().includes(searchLower);
      if (!titleMatch && !idMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if any filter is active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.sprint !== null ||
    filters.epic !== null ||
    filters.type !== null ||
    filters.assignee !== null ||
    filters.search !== ''
  );
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.sprint !== null) count++;
  if (filters.epic !== null) count++;
  if (filters.type !== null) count++;
  if (filters.assignee !== null) count++;
  if (filters.search !== '') count++;
  return count;
}

// === DS-081: Story Sorting and Priority Badge ===

/**
 * Check if a story is blocked by unresolved dependencies
 * A story is blocked if any of its dependencies is not in 'done' status
 */
export function isStoryBlocked(story: WebviewStory, allStories: WebviewStory[]): boolean {
  if (!story.dependencies || story.dependencies.length === 0) {
    return false;
  }

  for (const depId of story.dependencies) {
    const depStory = allStories.find((s) => s.id === depId);
    // If dependency doesn't exist, assume it's not blocking (graceful handling)
    if (!depStory) {
      continue;
    }
    // If dependency is not done, this story is blocked
    if (depStory.status !== 'done') {
      return true;
    }
  }

  return false;
}

/**
 * Sort stories within a column:
 * 1. Blocked stories go to the end
 * 2. Sort by priority ascending (lower priority number = higher priority)
 * 3. Sort by created date ascending (older first)
 *
 * @param columnStories - Stories in this column (same status)
 * @param allStories - All stories in the board (for dependency resolution)
 * @returns Sorted array (does not mutate original)
 */
export function sortStoriesForColumn(
  columnStories: WebviewStory[],
  allStories: WebviewStory[]
): WebviewStory[] {
  if (columnStories.length === 0) {
    return [];
  }

  // Create a copy to avoid mutating the original
  return [...columnStories].sort((a, b) => {
    const aBlocked = isStoryBlocked(a, allStories);
    const bBlocked = isStoryBlocked(b, allStories);

    // Blocked stories go last
    if (aBlocked !== bBlocked) {
      return aBlocked ? 1 : -1;
    }

    // Sort by priority ascending (lower number = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // Sort by created date ascending (older first)
    return a.created.localeCompare(b.created);
  });
}

/**
 * Determine if priority badge should be shown
 * Badge is shown when priority differs from default (500)
 */
export function shouldShowPriorityBadge(priority: number): boolean {
  return priority !== 500;
}

// === DS-083: Drag-Drop Reorder Priority Calculation ===

/**
 * Check if this is a reorder within the same column (vertical drag)
 * vs a cross-column status change (horizontal drag)
 */
export function isReorderWithinColumn(originalStatus: string, targetStatus: string): boolean {
  return originalStatus === targetStatus;
}

/**
 * Calculate priority as average of two priorities (for inserting between two stories)
 */
export function calculatePriorityBetween(abovePriority: number, belowPriority: number): number {
  return Math.round((abovePriority + belowPriority) / 2);
}

/**
 * Calculate new priority for a story dropped at a specific position in a column
 *
 * @param columnStories - Stories currently in the column (sorted by priority)
 * @param dropIndex - Index where the story is being dropped (0 = first, length = last)
 * @returns New priority value for the dropped story
 */
export function calculatePriorityForPosition(
  columnStories: WebviewStory[],
  dropIndex: number
): number {
  // Empty column: use default priority
  if (columnStories.length === 0) {
    return 500;
  }

  // Drop at first position: priority = first story's priority - 10
  if (dropIndex === 0) {
    const firstPriority = columnStories[0].priority;
    return Math.max(1, firstPriority - 10); // Clamp to minimum 1
  }

  // Drop at last position: priority = last story's priority + 10
  if (dropIndex >= columnStories.length) {
    const lastPriority = columnStories[columnStories.length - 1].priority;
    return lastPriority + 10;
  }

  // Drop between two stories: average of neighbors
  const abovePriority = columnStories[dropIndex - 1].priority;
  const belowPriority = columnStories[dropIndex].priority;
  return calculatePriorityBetween(abovePriority, belowPriority);
}

/**
 * Calculate the drop target index based on mouse Y position within column
 *
 * @param dropY - Mouse Y position in page coordinates
 * @param columnTop - Top position of column body in page coordinates
 * @param cardCount - Number of cards currently in the column
 * @param cardHeight - Approximate height of each card in pixels (default 80)
 * @returns Index where the card should be inserted (0 to cardCount)
 */
export function getDropTargetIndex(
  dropY: number,
  columnTop: number,
  cardCount: number,
  cardHeight: number = 80
): number {
  // Empty column: always index 0
  if (cardCount === 0) {
    return 0;
  }

  // Calculate relative Y position within column
  const relativeY = dropY - columnTop;

  // Calculate target index based on card positions
  const targetIndex = Math.floor(relativeY / cardHeight);

  // Clamp to valid range [0, cardCount]
  return Math.max(0, Math.min(cardCount, targetIndex));
}
