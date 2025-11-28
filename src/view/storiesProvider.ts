import * as vscode from 'vscode';
import * as path from 'path';
import { Store } from '../core/store';
import { Epic } from '../types/epic';
import { Story, StoryType } from '../types/story';

// Status indicators using unicode symbols for clarity
const STATUS_INDICATORS: Record<string, string> = {
  todo: '○',        // Empty circle - not started
  in_progress: '◐', // Half circle - in progress
  review: '◑',      // Other half - in review
  done: '●',        // Filled circle - complete
};

export class StoriesProvider implements vscode.TreeDataProvider<Epic | Story> {
  private _onDidChangeTreeData: vscode.EventEmitter<Epic | Story | undefined | null | void> = new vscode.EventEmitter<Epic | Story | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Epic | Story | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private store: Store,
    private extensionPath?: string
  ) {
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

  private getIconPath(iconName: string): vscode.ThemeIcon | { light: vscode.Uri; dark: vscode.Uri } | undefined {
    if (!this.extensionPath) {
      return undefined;
    }

    const iconsPath = path.join(this.extensionPath, 'assets', 'icons');
    return {
      light: vscode.Uri.file(path.join(iconsPath, `${iconName}-light.svg`)),
      dark: vscode.Uri.file(path.join(iconsPath, `${iconName}-dark.svg`)),
    };
  }

  private getStoryIcon(type: StoryType): vscode.ThemeIcon | { light: vscode.Uri; dark: vscode.Uri } | undefined {
    const iconMap: Record<StoryType, string> = {
      feature: 'feature',
      bug: 'bug',
      task: 'task',
      chore: 'chore',
    };

    const iconName = iconMap[type] || 'story';
    return this.getIconPath(iconName);
  }

  private getStatusIndicator(status: string): string {
    return STATUS_INDICATORS[status] || '○';
  }

  private createTreeItem(element: Epic | Story): vscode.TreeItem {
    const label = `${element.id}: ${element.title}`;

    if (!this.isStory(element)) {
      // Epic item
      const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
      item.contextValue = 'epic';
      item.id = element.id;
      item.iconPath = this.getIconPath('epic');
      item.description = `${this.getStatusIndicator(element.status)} ${element.status}`;
      item.tooltip = new vscode.MarkdownString(`**${element.id}**: ${element.title}\n\nStatus: ${element.status}`);
      return item;
    } else {
      // Story item
      const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
      item.contextValue = 'story';
      item.id = element.id;
      item.iconPath = this.getStoryIcon(element.type);
      item.description = `${this.getStatusIndicator(element.status)} ${element.status}`;
      item.tooltip = new vscode.MarkdownString(
        `**${element.id}**: ${element.title}\n\n` +
        `Type: ${element.type}\n` +
        `Status: ${element.status}\n` +
        `Size: ${element.size || 'N/A'}`
      );

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
