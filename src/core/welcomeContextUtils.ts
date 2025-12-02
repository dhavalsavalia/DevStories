/**
 * Context keys for tree view welcome content.
 * These are set via vscode.commands.executeCommand('setContext', key, value)
 */
export const CONTEXT_KEY_HAS_DEVSTORIES_FOLDER = 'devstories:hasDevstoriesFolder';
export const CONTEXT_KEY_HAS_EPICS = 'devstories:hasEpics';

/**
 * Welcome content states
 */
export enum WelcomeState {
  NoFolder = 'noFolder',
  NoEpics = 'noEpics',
  HasContent = 'hasContent'
}

/**
 * Determine which welcome state to show based on folder and epic existence.
 */
export function determineWelcomeState(hasFolder: boolean, epicCount: number): WelcomeState {
  if (!hasFolder) {
    return WelcomeState.NoFolder;
  }
  if (epicCount === 0) {
    return WelcomeState.NoEpics;
  }
  return WelcomeState.HasContent;
}
