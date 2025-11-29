import * as vscode from 'vscode';
import { ConfigService } from '../core/configService';
import { SprintFilterService } from '../core/sprintFilterService';
import { Store } from '../core/store';
import {
  StatusBarStats,
  getStatsFromStories,
  getFormattedStatusBarText,
  buildProgressBar,
  collectAvailableSprints,
} from './statusBarUtils';

export { StatusBarStats };

export class StatusBarController implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private store: Store,
    private configService?: ConfigService,
    private sprintFilterService?: SprintFilterService
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.statusBarItem.name = 'DevStories Progress';
    this.statusBarItem.command = 'devstories.pickSprint';

    // Listen for store updates
    this.disposables.push(
      this.store.onDidUpdate(() => this.update())
    );

    // Listen for config changes (sprint config)
    if (this.configService) {
      this.disposables.push(
        this.configService.onDidConfigChange(() => this.update())
      );
    }

    // Listen for sprint filter changes
    if (this.sprintFilterService) {
      this.disposables.push(
        this.sprintFilterService.onDidSprintChange(() => this.update())
      );
    }

    this.update();
    this.statusBarItem.show();
  }

  /**
   * Get stats for the current sprint filter
   */
  getStats(sprint?: string): StatusBarStats {
    const sprintFilter = sprint !== undefined ? sprint : this.getCurrentSprintFilter();
    return getStatsFromStories(this.store.getStories(), sprintFilter);
  }

  /**
   * Get the current sprint filter (from filter service, or null for all)
   */
  private getCurrentSprintFilter(): string | null {
    return this.sprintFilterService?.currentSprint ?? null;
  }

  /**
   * Get formatted text for display
   */
  getFormattedText(sprint?: string): string {
    const sprintFilter = sprint !== undefined
      ? (sprint || null)
      : this.getCurrentSprintFilter();
    const stats = getStatsFromStories(this.store.getStories(), sprintFilter);
    return getFormattedStatusBarText(stats.done, stats.total, sprintFilter);
  }

  /**
   * Build progress bar (exposed for backwards compatibility with tests)
   */
  buildProgressBar(done: number, total: number): string {
    return buildProgressBar(done, total);
  }

  /**
   * Get available sprints for picker
   */
  getAvailableSprints(): string[] {
    return collectAvailableSprints(
      this.store.getStories(),
      this.configService?.config.currentSprint
    );
  }

  /**
   * Get tooltip with detailed stats
   */
  private getTooltip(): vscode.MarkdownString {
    const sprint = this.getCurrentSprintFilter();
    const stats = getStatsFromStories(this.store.getStories(), sprint);
    const remaining = stats.total - stats.done;

    const lines: string[] = [
      '**DevStories: Sprint Progress**',
      '',
    ];

    if (sprint === null) {
      lines.push('📊 Showing: All Sprints');
    } else if (sprint === 'backlog') {
      lines.push('📊 Showing: Backlog');
    } else {
      lines.push(`📊 Showing: ${sprint}`);
    }

    lines.push('');
    lines.push(`✅ Done: ${stats.done}`);
    lines.push(`📝 Remaining: ${remaining}`);
    lines.push(`📦 Total: ${stats.total}`);
    lines.push('');
    lines.push('*Click to change sprint filter*');

    const md = new vscode.MarkdownString(lines.join('\n'));
    md.isTrusted = true;
    return md;
  }

  private update(): void {
    this.statusBarItem.text = this.getFormattedText();
    this.statusBarItem.tooltip = this.getTooltip();
  }

  dispose(): void {
    this.statusBarItem.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
