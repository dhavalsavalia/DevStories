/**
 * Pure utility functions for board view (unit-testable, no VS Code dependencies)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const matter = require('gray-matter');
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
  const result: WebviewEpic = {
    id: epic.id,
    title: epic.title,
    status: epic.status,
  };

  if (epic.sprint) {
    result.sprint = epic.sprint;
  }

  return result;
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
 * Extract unique sprints from stories and epics
 */
export function extractSprints(stories: WebviewStory[], epics: WebviewEpic[]): string[] {
  const sprintSet = new Set<string>();

  for (const story of stories) {
    if (story.sprint) {
      sprintSet.add(story.sprint);
    }
  }

  for (const epic of epics) {
    if (epic.sprint) {
      sprintSet.add(epic.sprint);
    }
  }

  // Sort alphabetically
  return Array.from(sprintSet).sort();
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
