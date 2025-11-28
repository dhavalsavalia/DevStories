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

// Init payload sent to webview on load
export interface InitPayload {
  stories: WebviewStory[];
  epics: WebviewEpic[];
  statuses: StatusConfig[];
  currentSprint?: string;
  theme: ThemeKind;
}

// Extension → Webview messages
export type ExtensionMessage =
  | { type: 'init'; payload: InitPayload }
  | { type: 'storyUpdated'; payload: { story: WebviewStory } }
  | { type: 'storyDeleted'; payload: { id: string } }
  | { type: 'themeChanged'; payload: { kind: ThemeKind } };

// Webview → Extension messages
export type WebviewMessage =
  | { type: 'updateStatus'; payload: { storyId: string; newStatus: string } }
  | { type: 'openStory'; payload: { id: string } }
  | { type: 'filterChanged'; payload: { sprint: string | null; epic: string | null } }
  | { type: 'ready' }
  | { type: 'error'; payload: { message: string } };
