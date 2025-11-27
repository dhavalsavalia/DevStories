import * as vscode from 'vscode';
import { Epic } from '../types/epic';
import { Story } from '../types/story';
import { Parser } from './parser';
import { Watcher } from './watcher';

export class Store {
  private stories = new Map<string, Story>();
  private epics = new Map<string, Epic>();
  private _onDidUpdate = new vscode.EventEmitter<void>();
  readonly onDidUpdate = this._onDidUpdate.event;

  constructor(private watcher: Watcher) {
    // Listen to watcher events
    this.watcher.onDidCreate(uri => this.onFileChanged(uri));
    this.watcher.onDidChange(uri => this.onFileChanged(uri));
    this.watcher.onDidDelete(uri => this.onFileDeleted(uri));
  }

  async load() {
    const storyFiles = await vscode.workspace.findFiles('**/.devstories/stories/*.md');
    const epicFiles = await vscode.workspace.findFiles('**/.devstories/epics/*.md');

    this.stories.clear();
    this.epics.clear();

    await Promise.all(storyFiles.map(uri => this.parseAndAddStory(uri)));
    await Promise.all(epicFiles.map(uri => this.parseAndAddEpic(uri)));
  }

  getStory(id: string): Story | undefined {
    return this.stories.get(id);
  }

  getEpic(id: string): Epic | undefined {
    return this.epics.get(id);
  }

  getStoriesByEpic(epicId: string): Story[] {
    return Array.from(this.stories.values()).filter(story => story.epic === epicId);
  }

  getEpics(): Epic[] {
    return Array.from(this.epics.values());
  }

  getStories(): Story[] {
    return Array.from(this.stories.values());
  }

  private async onFileChanged(uri: vscode.Uri) {
    if (uri.path.includes('/stories/')) {
      await this.parseAndAddStory(uri);
    } else if (uri.path.includes('/epics/')) {
      await this.parseAndAddEpic(uri);
    }
    this._onDidUpdate.fire();
  }

  private onFileDeleted(uri: vscode.Uri) {
    // We don't know the ID from the URI easily without parsing, but we can iterate.
    // Or we can assume ID is filename? No, ID is in frontmatter.
    // But if file is deleted, we can't read it.
    // We have to search the map for the story with this filePath.
    
    for (const [id, story] of this.stories) {
      if (story.filePath === uri.fsPath) {
        this.stories.delete(id);
        break;
      }
    }

    for (const [id, epic] of this.epics) {
      if (epic.filePath === uri.fsPath) {
        this.epics.delete(id);
        break;
      }
    }
    this._onDidUpdate.fire();
  }

  private async parseAndAddStory(uri: vscode.Uri) {
    try {
      const content = await this.readFile(uri);
      const story = Parser.parseStory(content, uri.fsPath);
      this.stories.set(story.id, story);
    } catch (e) {
      console.error(`Failed to parse story ${uri.fsPath}:`, e);
    }
  }

  private async parseAndAddEpic(uri: vscode.Uri) {
    try {
      const content = await this.readFile(uri);
      const epic = Parser.parseEpic(content, uri.fsPath);
      this.epics.set(epic.id, epic);
    } catch (e) {
      console.error(`Failed to parse epic ${uri.fsPath}:`, e);
    }
  }

  private async readFile(uri: vscode.Uri): Promise<string> {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder().decode(bytes);
  }
}
