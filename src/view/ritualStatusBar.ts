/**
 * Ritual Status Bar - Shows next ritual and quick action
 * Only visible when cadence reminders are enabled
 */
import * as vscode from 'vscode';
import { CadenceService } from '../core/cadenceService';

export class RitualStatusBarController implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(private cadenceService: CadenceService) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      99 // Just to the right of sprint progress (100)
    );
    this.statusBarItem.name = 'DevStories Ritual';
    this.statusBarItem.command = 'devstories.startRitual';

    // Listen for cadence config changes
    this.disposables.push(
      this.cadenceService.onDidCadenceChange(() => this.update())
    );

    this.update();
  }

  /**
   * Get formatted text for status bar
   */
  getText(): string {
    return this.cadenceService.getStatusBarText();
  }

  /**
   * Get tooltip for hover
   */
  getTooltip(): vscode.MarkdownString | string {
    return this.cadenceService.getTooltip();
  }

  private update(): void {
    const text = this.getText();

    if (text) {
      this.statusBarItem.text = `$(calendar) ${text}`;
      this.statusBarItem.tooltip = this.getTooltip();
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
