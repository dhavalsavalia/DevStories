/**
 * Pick Sprint Command - Opens QuickPick for sprint selection
 */

import * as vscode from 'vscode';
import { ConfigService } from '../core/configService';
import { SprintFilterService } from '../core/sprintFilterService';
import { Store } from '../core/store';
import { collectAvailableSprints } from '../view/statusBarUtils';

interface SprintQuickPickItem extends vscode.QuickPickItem {
  value: string | null;
}

/**
 * Execute the pick sprint command
 */
export async function executePickSprint(
  store: Store,
  sprintFilterService: SprintFilterService,
  configService?: ConfigService
): Promise<void> {
  const stories = store.getStories();
  const currentSprint = configService?.config.currentSprint;
  const sprintSequence = configService?.config.sprintSequence ?? [];
  const availableSprints = collectAvailableSprints(stories, currentSprint, sprintSequence);
  const selectedSprint = sprintFilterService.currentSprint;

  // Build QuickPick items
  const items: SprintQuickPickItem[] = [];

  // All Sprints option
  items.push({
    label: '$(list-flat) All Sprints',
    description: selectedSprint === null ? '(current)' : undefined,
    value: null,
  });

  // Current sprint from config (if defined and exists)
  if (currentSprint && availableSprints.includes(currentSprint)) {
    items.push({
      label: `$(star) ${currentSprint}`,
      description: selectedSprint === currentSprint ? '(current)' : 'Current sprint',
      value: currentSprint,
    });
  }

  // Backlog option
  const hasBacklogStories = stories.some(s => !s.sprint || s.sprint === '' || s.sprint === 'backlog');
  if (hasBacklogStories) {
    items.push({
      label: '$(archive) Backlog',
      description: selectedSprint === 'backlog' ? '(current)' : undefined,
      value: 'backlog',
    });
  }

  // Separator
  if (availableSprints.length > 0) {
    items.push({
      label: '',
      kind: vscode.QuickPickItemKind.Separator,
      value: null,
    });
  }

  // Other sprints (excluding current sprint to avoid duplication)
  for (const sprint of availableSprints) {
    if (sprint !== currentSprint) {
      items.push({
        label: `$(milestone) ${sprint}`,
        description: selectedSprint === sprint ? '(current)' : undefined,
        value: sprint,
      });
    }
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select sprint to filter by',
    title: 'DevStories: Pick Sprint',
  });

  if (selected && selected.kind !== vscode.QuickPickItemKind.Separator) {
    sprintFilterService.setSprint(selected.value);
  }
}
