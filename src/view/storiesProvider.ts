import * as vscode from 'vscode';
import { Store } from '../core/store';
import { Epic } from '../types/epic';
import { Story } from '../types/story';

export class StoriesProvider implements vscode.TreeDataProvider<Epic | Story> {
  private _onDidChangeTreeData: vscode.EventEmitter<Epic | Story | undefined | null | void> = new vscode.EventEmitter<Epic | Story | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Epic | Story | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private store: Store) {
    this.store.onDidUpdate(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Epic | Story): vscode.TreeItem {
    return this.createTreeItem(element);
  }

  getChildren(element?: Epic | Story): Thenable<(Epic | Story)[]> {
    if (!element) {
        return Promise.resolve(this.store.getEpics());
    }

    if (!this.isStory(element)) {
        return Promise.resolve(this.store.getStoriesByEpic(element.id));
    }

    return Promise.resolve([]);
  }

  private isStory(element: Epic | Story): element is Story {
      return 'type' in element;
  }

  private createTreeItem(element: Epic | Story): vscode.TreeItem {
      const label = `${element.id}: ${element.title}`;
      if (!this.isStory(element)) {
          const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
          item.contextValue = 'epic';
          item.id = element.id;
          item.description = element.status;
          item.tooltip = `${element.id}: ${element.title}`;
          return item;
      } else {
          const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
          item.contextValue = 'story';
          item.id = element.id;
          item.description = element.status;
          item.tooltip = `${element.id}: ${element.title}`;
          
          if (element.filePath) {
            item.command = {
                command: 'vscode.open',
                title: 'Open Story',
                arguments: [vscode.Uri.file(element.filePath)]
            };
          }
          
          return item;
      }
  }
}
