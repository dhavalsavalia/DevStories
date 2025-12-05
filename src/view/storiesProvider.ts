import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigService } from '../core/configService';
import { SprintFilterService } from '../core/sprintFilterService';
import { Store } from '../core/store';
import { Epic } from '../types/epic';
import { Story, StoryType } from '../types/story';
import { sortStoriesForTreeView, sortEpicsBySprintOrder, getStatusIndicator } from './storiesProviderUtils';

export class StoriesProvider implements vscode.TreeDataProvider<Epic | Story> {
  private _onDidChangeTreeData: vscode.EventEmitter<Epic | Story | undefined | null | void> = new vscode.EventEmitter<Epic | Story | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Epic | Story | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private store: Store,
    private extensionPath: string | undefined,
    private configService?: ConfigService,
    private sprintFilterService?: SprintFilterService
  ) {
    this.store.onDidUpdate(() => this.refresh());
    // DS-035: Subscribe to config changes to refresh tree
    this.configService?.onDidConfigChange(() => this.refresh());
    // DS-034: Subscribe to sprint filter changes to refresh tree
    this.sprintFilterService?.onDidSprintChange(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Epic | Story): vscode.TreeItem {
    return this.createTreeItem(element);
  }

  getChildren(element?: Epic | Story): Thenable<(Epic | Story)[]> {
    const sprintSequence = this.configService?.config.sprintSequence ?? [];

    if (!element) {
      // Root level: return epics that have visible stories (based on sprint filter)
      const sprintFilter = this.sprintFilterService?.currentSprint ?? null;
      const allEpics = this.store.getEpics();

      // Filter epics to only those with visible stories (if filter active)
      let visibleEpics = allEpics;
      if (sprintFilter !== null) {
        visibleEpics = allEpics.filter(epic => {
          const stories = this.store.getStoriesByEpic(epic.id);
          return stories.some(s => this.matchesSprintFilter(s, sprintFilter));
        });
      }

      // Sort epics by earliest story's sprint position
      const sortedEpics = sortEpicsBySprintOrder(
        visibleEpics,
        sprintSequence,
        (epicId) => this.store.getStoriesByEpic(epicId)
      );

      return Promise.resolve(sortedEpics);
    }

    if (!this.isStory(element)) {
      // Epic: return filtered and sorted stories
      const sprintFilter = this.sprintFilterService?.currentSprint ?? null;
      const stories = this.store.getStoriesByEpic(element.id);

      // Apply sprint filter if active
      let filtered = stories;
      if (sprintFilter !== null) {
        filtered = stories.filter(s => this.matchesSprintFilter(s, sprintFilter));
      }

      // Sort stories by sprint → priority → created
      const sorted = sortStoriesForTreeView(filtered, sprintSequence);

      return Promise.resolve(sorted);
    }

    return Promise.resolve([]);
  }

  private matchesSprintFilter(story: Story, sprintFilter: string): boolean {
    if (sprintFilter === 'backlog') {
      // Backlog = empty, undefined, or 'backlog' sprint
      return !story.sprint || story.sprint === '' || story.sprint === 'backlog';
    }
    return story.sprint === sprintFilter;
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
    const statuses = this.configService?.config?.statuses ?? [];
    return getStatusIndicator(status, statuses);
  }

  private createTreeItem(element: Epic | Story): vscode.TreeItem {
    const label = `${element.id}: ${element.title}`;

    if (!this.isStory(element)) {
      // Epic item - no command set so single-click expands/collapses naturally
      // Use "Open Epic" context menu or double-click (with workbench.list.openMode: doubleClick)
      const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
      item.contextValue = 'epic';
      item.id = element.id;
      item.iconPath = this.getIconPath('epic');
      item.description = `${this.getStatusIndicator(element.status)} ${element.status}`;
      item.tooltip = new vscode.MarkdownString(`**${element.id}**: ${element.title}\n\nStatus: ${element.status}`);

      // Set resourceUri for file-related operations (enables proper theming and file associations)
      if (element.filePath) {
        item.resourceUri = vscode.Uri.file(element.filePath);
      }

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
