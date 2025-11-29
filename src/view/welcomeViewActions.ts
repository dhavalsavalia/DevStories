import * as vscode from 'vscode';

export type QuickActionCategory = 'get-started' | 'learn' | 'customize';

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  command: string;
  icon: string;
  category: QuickActionCategory;
  args?: unknown[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'init',
    label: 'Initialize DevStories',
    description: 'Create .devstories structure with sample epics/stories',
    command: 'devstories.init',
    icon: 'rocket',
    category: 'get-started',
  },
  {
    id: 'open-board',
    label: 'Open Board View',
    description: 'Jump into the kanban board to visualize flow',
    command: 'devstories.views.board.focus',
    icon: 'layout',
    category: 'get-started',
  },
  {
    id: 'quick-capture',
    label: 'Quick Capture Idea',
    description: 'Capture a story from any note or selection',
    command: 'devstories.quickCapture',
    icon: 'note',
    category: 'get-started',
  },
  {
    id: 'create-epic',
    label: 'Create Epic',
    description: 'Outline a new initiative with stories',
    command: 'devstories.createEpic',
    icon: 'milestone',
    category: 'learn',
  },
  {
    id: 'create-story',
    label: 'Create Story',
    description: 'Add a structured work item with checklist + metadata',
    command: 'devstories.createStory',
    icon: 'tasklist',
    category: 'learn',
  },
  {
    id: 'start-ritual',
    label: 'Start Ritual',
    description: 'Guided planning/retro/grooming prompts',
    command: 'devstories.startRitual',
    icon: 'calendar',
    category: 'learn',
  },
  {
    id: 'enable-solo-kit',
    label: 'Toggle Agile Solo Starter',
    description: 'Enable sample cadences/templates from config',
    command: 'devstories.pickSprint',
    icon: 'settings-gear',
    category: 'customize',
  },
  {
    id: 'save-template',
    label: 'Save Story as Template',
    description: 'Capture repeatable workflows for future reuse',
    command: 'devstories.saveAsTemplate',
    icon: 'snippet',
    category: 'customize',
  },
];

export function getQuickActionSections(): Record<QuickActionCategory, QuickAction[]> {
  return {
    'get-started': QUICK_ACTIONS.filter((action) => action.category === 'get-started'),
    learn: QUICK_ACTIONS.filter((action) => action.category === 'learn'),
    customize: QUICK_ACTIONS.filter((action) => action.category === 'customize'),
  };
}

export async function runQuickAction(actionId: string): Promise<void> {
  const action = QUICK_ACTIONS.find((item) => item.id === actionId);
  if (!action) {
    return;
  }

  await vscode.commands.executeCommand(action.command, ...(action.args ?? []));
}

export function getQuickActionById(actionId: string): QuickAction | undefined {
  return QUICK_ACTIONS.find((item) => item.id === actionId);
}
