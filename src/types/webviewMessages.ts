/**
 * Type-safe message definitions for webview ↔ extension communication
 */

// Theme types
export type ThemeKind = 'light' | 'dark' | 'high-contrast';

// Status configuration from config.yaml
export interface StatusConfig {
  id: string;
  label: string;
  color?: string;
}

// Webview-safe story (excludes filePath/content for security)
export interface WebviewStory {
  id: string;
  title: string;
  type: string;
  epic: string;
  status: string;
  sprint?: string;
  size: string;
  assignee?: string;
  dependencies?: string[];
  created: string; // ISO date string
  updated?: string;
}

// Webview-safe epic (excludes filePath/content)
export interface WebviewEpic {
  id: string;
  title: string;
  status: string;
  sprint?: string;
}

// DS-023: Filter state for board view
export interface FilterState {
  sprint: string | null;      // null = all sprints
  epic: string | null;        // null = all epics
  type: string | null;        // null = all types
  assignee: string | null;    // null = all, empty string = unassigned
  search: string;             // empty = no search
}

// Init payload sent to webview on load
export interface InitPayload {
  stories: WebviewStory[];
  epics: WebviewEpic[];
  statuses: StatusConfig[];
  sprints: string[];          // DS-023: List of available sprints for filter dropdown
  currentSprint?: string;
  theme: ThemeKind;
}

// Extension → Webview messages
export type ExtensionMessage =
  | { type: 'init'; payload: InitPayload }
  | { type: 'storyUpdated'; payload: { story: WebviewStory } }
  | { type: 'storyDeleted'; payload: { id: string } }
  | { type: 'themeChanged'; payload: { kind: ThemeKind } }
  | { type: 'updateFailed'; payload: { storyId: string; originalStatus: string; error: string } }
  | { type: 'sprintFilterChanged'; payload: { sprint: string | null } };  // DS-034: Sprint filter from extension

// Webview → Extension messages
export type WebviewMessage =
  | { type: 'updateStatus'; payload: { storyId: string; newStatus: string } }
  | { type: 'openStory'; payload: { id: string } }
  | { type: 'filterChanged'; payload: FilterState }  // DS-023: Full filter state
  | { type: 'ready' }
  | { type: 'error'; payload: { message: string } };
