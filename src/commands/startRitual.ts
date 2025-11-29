/**
 * Start Weekly Ritual command - multi-step walkthrough for planning, retro, grooming
 */
import * as vscode from 'vscode';
import { CadenceService } from '../core/cadenceService';
import { Store } from '../core/store';

export type RitualStep = 'planning' | 'retro' | 'grooming';

interface RitualOption {
  label: string;
  description: string;
  step: RitualStep;
}

const RITUAL_OPTIONS: RitualOption[] = [
  {
    label: '$(calendar) Sprint Planning',
    description: 'Review backlog, select stories for next sprint',
    step: 'planning',
  },
  {
    label: '$(note) Retrospective',
    description: 'Reflect on completed work, capture learnings',
    step: 'retro',
  },
  {
    label: '$(list-unordered) Backlog Grooming',
    description: 'Refine stories, break down epics, update priorities',
    step: 'grooming',
  },
];

/**
 * Execute the start ritual command
 * Shows multi-step walkthrough based on selected ritual type
 */
export async function executeStartRitual(
  store: Store,
  cadenceService: CadenceService
): Promise<void> {
  // Show ritual picker
  const selected = await vscode.window.showQuickPick(
    RITUAL_OPTIONS.map(opt => ({
      label: opt.label,
      description: opt.description,
      step: opt.step,
    })),
    {
      title: 'DevStories: Start Weekly Ritual',
      placeHolder: 'Select a ritual to begin',
    }
  );

  if (!selected) {
    return;
  }

  switch (selected.step) {
    case 'planning':
      await runPlanningRitual(store);
      break;
    case 'retro':
      await runRetroRitual(store);
      break;
    case 'grooming':
      await runGroomingRitual(store);
      break;
  }
}

/**
 * Planning ritual walkthrough
 */
async function runPlanningRitual(store: Store): Promise<void> {
  const stories = store.getStories();
  const backlogStories = stories.filter(s => !s.sprint || s.sprint === 'backlog');
  const todoStories = stories.filter(s => s.status === 'todo');

  const lines = [
    '## Sprint Planning',
    '',
    `📋 **Backlog stories:** ${backlogStories.length}`,
    `📝 **To-do stories:** ${todoStories.length}`,
    '',
    '### Steps:',
    '1. Review the backlog for unassigned stories',
    '2. Select stories for the upcoming sprint',
    '3. Update story sprints via the board or tree view',
    '',
    '*Open the Board view to drag stories into the sprint*',
  ];

  const action = await vscode.window.showInformationMessage(
    `Sprint Planning: ${backlogStories.length} backlog stories, ${todoStories.length} to-do`,
    'Open Board',
    'Open Backlog Story',
    'Done'
  );

  if (action === 'Open Board') {
    await vscode.commands.executeCommand('devstories.views.board.focus');
  } else if (action === 'Open Backlog Story' && backlogStories.length > 0) {
    const firstBacklog = backlogStories[0];
    if (firstBacklog.filePath) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(firstBacklog.filePath));
      await vscode.window.showTextDocument(doc);
    }
  }
}

/**
 * Retrospective ritual walkthrough
 */
async function runRetroRitual(store: Store): Promise<void> {
  const stories = store.getStories();
  const doneStories = stories.filter(s => s.status === 'done');
  const inProgressStories = stories.filter(s => s.status === 'in_progress');

  const action = await vscode.window.showInformationMessage(
    `Retrospective: ${doneStories.length} done, ${inProgressStories.length} in progress`,
    'Create Retro Note',
    'View Done Stories',
    'Done'
  );

  if (action === 'Create Retro Note') {
    // Create a simple retro note in the workspace
    const retroContent = generateRetroTemplate(doneStories.length, inProgressStories.length);
    const doc = await vscode.workspace.openTextDocument({
      content: retroContent,
      language: 'markdown',
    });
    await vscode.window.showTextDocument(doc);
  } else if (action === 'View Done Stories' && doneStories.length > 0) {
    const firstDone = doneStories[0];
    if (firstDone.filePath) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(firstDone.filePath));
      await vscode.window.showTextDocument(doc);
    }
  }
}

/**
 * Backlog grooming ritual walkthrough
 */
async function runGroomingRitual(store: Store): Promise<void> {
  const stories = store.getStories();
  const epics = store.getEpics();
  const unsizedStories = stories.filter(s => !s.size);
  const inboxStories = stories.filter(s => s.epic === 'EPIC-INBOX');

  const action = await vscode.window.showInformationMessage(
    `Grooming: ${unsizedStories.length} unsized, ${inboxStories.length} in inbox`,
    'View Unsized Story',
    'View Inbox',
    'Create Story',
    'Done'
  );

  if (action === 'View Unsized Story' && unsizedStories.length > 0) {
    const first = unsizedStories[0];
    if (first.filePath) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(first.filePath));
      await vscode.window.showTextDocument(doc);
    }
  } else if (action === 'View Inbox' && inboxStories.length > 0) {
    const first = inboxStories[0];
    if (first.filePath) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(first.filePath));
      await vscode.window.showTextDocument(doc);
    }
  } else if (action === 'Create Story') {
    await vscode.commands.executeCommand('devstories.createStory');
  }
}

/**
 * Generate retrospective template content
 */
function generateRetroTemplate(doneCount: number, inProgressCount: number): string {
  const date = new Date().toISOString().split('T')[0];
  return `# Retrospective - ${date}

## Summary
- **Stories completed:** ${doneCount}
- **In progress:** ${inProgressCount}

## What went well
-

## What could be improved
-

## Action items
- [ ]

## Notes

`;
}
