/**
 * Pure utility functions for board view (unit-testable, no VS Code dependencies)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const matter = require('gray-matter');
import { Story } from '../types/story';
import { Epic } from '../types/epic';
import { StatusConfig, WebviewStory, WebviewEpic, ThemeKind } from '../types/webviewMessages';

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
