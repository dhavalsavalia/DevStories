/**
 * SprintFilterService - Shared sprint filter state
 *
 * Manages the current sprint filter selection and notifies subscribers
 * when the filter changes. Used by StatusBar, TreeView, and BoardView.
 */

import * as vscode from 'vscode';

export class SprintFilterService implements vscode.Disposable {
  private _currentSprint: string | null = null;

  private _onDidSprintChange = new vscode.EventEmitter<string | null>();
  readonly onDidSprintChange = this._onDidSprintChange.event;

  /**
   * Get the current sprint filter (null = all sprints)
   */
  get currentSprint(): string | null {
    return this._currentSprint;
  }

  /**
   * Set the current sprint filter
   * @param sprint - Sprint name, 'backlog', or null for all sprints
   */
  setSprint(sprint: string | null): void {
    if (this._currentSprint !== sprint) {
      this._currentSprint = sprint;
      this._onDidSprintChange.fire(sprint);
    }
  }

  dispose(): void {
    this._onDidSprintChange.dispose();
  }
}
