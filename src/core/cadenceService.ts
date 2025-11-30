/**
 * CadenceService - Manages cadence reminders and ritual scheduling
 * Integrates with ConfigService for live config reload
 */
import * as vscode from 'vscode';
import { ConfigService } from './configService';
import {
  CadenceConfig,
  NextRitual,
  RitualType,
  getNextRitual,
  formatRitualText,
  shouldShowReminder,
  DEFAULT_CADENCE_CONFIG,
} from './cadenceServiceUtils';

export class CadenceService implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private config: CadenceConfig = DEFAULT_CADENCE_CONFIG;
  private lastReminderTime: number = 0;
  private reminderThrottleMs: number = 60 * 60 * 1000; // 1 hour throttle
  private reminderCheckInterval: NodeJS.Timeout | undefined;
  private reminderCheckMs: number = 5 * 60 * 1000; // Check every 5 minutes

  private readonly _onDidCadenceChange = new vscode.EventEmitter<CadenceConfig>();
  readonly onDidCadenceChange = this._onDidCadenceChange.event;

  constructor(private configService: ConfigService) {
    // Subscribe to config changes
    this.disposables.push(
      this.configService.onDidConfigChange(() => {
        this.updateConfig();
        this.restartReminderCheck();
      })
    );

    // Initial config load
    this.updateConfig();
    this.startReminderCheck();
  }

  /**
   * Start periodic reminder check
   */
  private startReminderCheck(): void {
    if (!this.config.enabled) {
      return;
    }

    this.reminderCheckInterval = setInterval(() => {
      void this.checkAndShowReminder();
    }, this.reminderCheckMs);
  }

  /**
   * Restart reminder check (after config change)
   */
  private restartReminderCheck(): void {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
      this.reminderCheckInterval = undefined;
    }
    this.startReminderCheck();
  }

  /**
   * Check if a reminder should be shown and display it
   */
  private async checkAndShowReminder(): Promise<void> {
    if (!this.shouldShowNotification()) {
      return;
    }

    const nextRitual = this.getNextRitual();
    if (!nextRitual) {
      return;
    }

    // Check if the ritual is approaching (within 24 hours)
    const hoursUntil = (nextRitual.nextDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil > 24) {
      return;
    }

    // Show notification
    const label = this.getRitualLabel(nextRitual.type);
    const timeText = this.formatTimeUntil(nextRitual.nextDate);

    const action = await vscode.window.showInformationMessage(
      `${label} ${timeText}`,
      'Start Ritual',
      'Dismiss'
    );

    this.markReminderShown();

    if (action === 'Start Ritual') {
      await vscode.commands.executeCommand('devstories.startRitual');
    }
  }

  /**
   * Format time until ritual
   */
  private formatTimeUntil(date: Date): string {
    const hoursUntil = (date.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil < 1) {
      return 'starts soon';
    } else if (hoursUntil < 24) {
      return `in ${Math.round(hoursUntil)} hours`;
    } else {
      const daysUntil = Math.round(hoursUntil / 24);
      return `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
    }
  }

  private updateConfig(): void {
    const newConfig = this.configService.config.cadence;
    if (newConfig && JSON.stringify(newConfig) !== JSON.stringify(this.config)) {
      this.config = newConfig;
      this._onDidCadenceChange.fire(this.config);
    }
  }

  /**
   * Get the current cadence configuration
   */
  get cadenceConfig(): CadenceConfig {
    return this.config;
  }

  /**
   * Get the next upcoming ritual
   */
  getNextRitual(): NextRitual | null {
    return getNextRitual(this.config);
  }

  /**
   * Get status bar text for the next ritual
   * Returns empty string if cadence is disabled
   */
  getStatusBarText(): string {
    if (!this.config.enabled) {
      return '';
    }

    const nextRitual = this.getNextRitual();
    if (!nextRitual) {
      return '';
    }

    return formatRitualText(nextRitual.type, nextRitual.nextDate);
  }

  /**
   * Get tooltip text for the status bar item
   */
  getTooltip(): vscode.MarkdownString | string {
    if (!this.config.enabled) {
      return '';
    }

    const nextRitual = this.getNextRitual();
    if (!nextRitual) {
      return 'No rituals scheduled';
    }

    const lines: string[] = [
      '**DevStories: Weekly Rituals**',
      '',
      `📅 Next: ${this.getRitualLabel(nextRitual.type)}`,
      `⏰ ${nextRitual.nextDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${nextRitual.nextDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      '',
      '*Click to start ritual walkthrough*',
    ];

    const md = new vscode.MarkdownString(lines.join('\n'));
    md.isTrusted = true;
    return md;
  }

  private getRitualLabel(type: RitualType): string {
    const labels: Record<RitualType, string> = {
      planning: 'Sprint Planning',
      retro: 'Retrospective',
      grooming: 'Backlog Grooming',
    };
    return labels[type];
  }

  /**
   * Check if we should show a notification reminder
   * Respects active hours and throttling
   */
  shouldShowNotification(): boolean {
    if (!shouldShowReminder(this.config)) {
      return false;
    }

    // Throttle notifications
    const now = Date.now();
    if (now - this.lastReminderTime < this.reminderThrottleMs) {
      return false;
    }

    return true;
  }

  /**
   * Mark that a reminder was shown (for throttling)
   */
  markReminderShown(): void {
    this.lastReminderTime = Date.now();
  }

  dispose(): void {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
      this.reminderCheckInterval = undefined;
    }
    this._onDidCadenceChange.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
