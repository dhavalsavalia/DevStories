import * as vscode from 'vscode';
import { CONTEXT_KEY_HAS_DEVSTORIES_FOLDER, CONTEXT_KEY_HAS_EPICS } from './welcomeContextUtils';

// Re-export for convenience
export { CONTEXT_KEY_HAS_DEVSTORIES_FOLDER, CONTEXT_KEY_HAS_EPICS, WelcomeState, determineWelcomeState } from './welcomeContextUtils';

/**
 * Check if .devstories folder exists in workspace
 */
export async function hasDevstoriesFolder(): Promise<boolean> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return false;
  }
  const devstoriesUri = vscode.Uri.joinPath(folders[0].uri, '.devstories');
  try {
    const stat = await vscode.workspace.fs.stat(devstoriesUri);
    return stat.type === vscode.FileType.Directory;
  } catch {
    return false;
  }
}

/**
 * Update welcome context keys based on current state.
 */
export async function updateWelcomeContext(epicCount: number): Promise<void> {
  const hasFolder = await hasDevstoriesFolder();
  await vscode.commands.executeCommand('setContext', CONTEXT_KEY_HAS_DEVSTORIES_FOLDER, hasFolder);
  await vscode.commands.executeCommand('setContext', CONTEXT_KEY_HAS_EPICS, epicCount > 0);
}
