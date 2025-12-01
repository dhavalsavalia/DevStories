/**
 * Notification utilities for ConfigService
 * Provides user feedback when config.json has errors
 */

import * as vscode from 'vscode';

// Message constants
export const CONFIG_ERROR_MESSAGE = 'Config has errors, using previous valid config';
export const OPEN_CONFIG_ACTION = 'Open Config';

/**
 * Get the path to config.json for a workspace folder
 */
export function getConfigFilePath(workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
  return vscode.Uri.joinPath(
    workspaceFolder.uri,
    '.devstories',
    'config.json'
  );
}

/**
 * Show warning notification for config parse errors
 * Includes "Open Config" action button
 */
export async function showConfigErrorNotification(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  const action = await vscode.window.showWarningMessage(
    CONFIG_ERROR_MESSAGE,
    OPEN_CONFIG_ACTION
  );

  if (action === OPEN_CONFIG_ACTION && workspaceFolder) {
    const configPath = getConfigFilePath(workspaceFolder);
    const doc = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(doc);
  }
}

/**
 * Show warning notification for sprint validation errors
 * Includes "Open Config" action button
 */
export async function showSprintValidationErrorNotification(error: string): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  const action = await vscode.window.showWarningMessage(
    `Sprint config error: ${error}`,
    OPEN_CONFIG_ACTION
  );

  if (action === OPEN_CONFIG_ACTION && workspaceFolder) {
    const configPath = getConfigFilePath(workspaceFolder);
    const doc = await vscode.workspace.openTextDocument(configPath);
    await vscode.window.showTextDocument(doc);
  }
}
