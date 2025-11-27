import * as vscode from 'vscode';

export class Watcher {
  private watcher: vscode.FileSystemWatcher;
  private _onDidCreate = new vscode.EventEmitter<vscode.Uri>();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private _onDidDelete = new vscode.EventEmitter<vscode.Uri>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  readonly onDidCreate = this._onDidCreate.event;
  readonly onDidChange = this._onDidChange.event;
  readonly onDidDelete = this._onDidDelete.event;

  constructor() {
    // Watch .devstories/**/*.md
    // The pattern needs to be relative to workspace or absolute?
    // createFileSystemWatcher takes a glob pattern.
    // We want to watch .devstories folder in the workspace.
    // Using a relative pattern is better for multi-root workspaces, but for now simple glob.
    this.watcher = vscode.workspace.createFileSystemWatcher('**/.devstories/**/*.md');

    this.watcher.onDidCreate(uri => this._onDidCreate.fire(uri));
    
    this.watcher.onDidChange(uri => {
      const key = uri.toString();
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key)!);
      }
      this.debounceTimers.set(key, setTimeout(() => {
        this.debounceTimers.delete(key);
        this._onDidChange.fire(uri);
      }, 100));
    });

    this.watcher.onDidDelete(uri => this._onDidDelete.fire(uri));
  }

  dispose() {
    this.watcher.dispose();
    this._onDidCreate.dispose();
    this._onDidChange.dispose();
    this._onDidDelete.dispose();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}
