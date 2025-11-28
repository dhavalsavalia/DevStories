import * as vscode from 'vscode';
import { Store } from '../core/store';

export interface StatusBarStats {
  total: number;
  done: number;
}

export class StatusBarController implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(private store: Store) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.name = 'DevStories Progress';
    this.statusBarItem.tooltip = 'DevStories: Sprint Progress';

    // Listen for store updates
    this.disposables.push(
      this.store.onDidUpdate(() => this.update())
    );

    this.update();
    this.statusBarItem.show();
  }

  getStats(sprint?: string): StatusBarStats {
    let stories = this.store.getStories();

    if (sprint) {
      stories = stories.filter(s => s.sprint === sprint);
    }

    const total = stories.length;
    const done = stories.filter(s => s.status === 'done').length;

    return { total, done };
  }

  getFormattedText(sprint?: string): string {
    const stats = this.getStats(sprint);
    const { total, done } = stats;

    if (total === 0) {
      return '$(checklist) No stories';
    }

    const progressBar = this.buildProgressBar(done, total);
    return `$(checklist) ${progressBar} ${done}/${total}`;
  }

  private buildProgressBar(done: number, total: number): string {
    const barLength = 6;
    const filled = Math.round((done / total) * barLength);
    const empty = barLength - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private update(): void {
    this.statusBarItem.text = this.getFormattedText();
  }

  dispose(): void {
    this.statusBarItem.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
