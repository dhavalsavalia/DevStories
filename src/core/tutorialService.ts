export interface TutorialStepMedia {
  light: string;
  dark: string;
  alt: string;
  type: 'image' | 'gif';
}

export interface TutorialStep {
  id: string;
  title: string;
  summary: string;
  instructions: string[];
  cta?: string;
  ctaCommandId?: string;
  media?: TutorialStepMedia;
}

export interface TutorialProgress {
  completedStepIds: string[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface TutorialState {
  completedStepIds: string[];
}

const STORAGE_KEY = 'devstories.tutorial.progress';

interface StorageLike {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: any): Thenable<void>;
}

const STEPS: TutorialStep[] = [
  {
    id: 'init',
    title: 'Initialize DevStories',
    summary: 'Run the init command to set up config, sample epics, and stories.',
    instructions: [
      'Open the Command Palette and run DevStories: Init.',
      'Pick a sprint cadence and Agle Solo Starter template.',
      'Verify .devstories directory contains epics and stories.',
    ],
    cta: 'Run DevStories: Init',
    ctaCommandId: 'devstories.init',
    media: {
      light: 'tutorial-media/init-light.svg',
      dark: 'tutorial-media/init-dark.svg',
      alt: 'Screenshot showing the DevStories init command',
      type: 'image',
    },
  },
  {
    id: 'create-epic',
    title: 'Create Your First Epic',
    summary: 'Use the Create Epic command to capture themes and backlog lanes.',
    instructions: [
      'Run DevStories: Create Epic.',
      'Fill in title, description, and optional dependencies.',
      'Confirm the epic appears in the tree and board.',
    ],
    cta: 'Run DevStories: Create Epic',
    ctaCommandId: 'devstories.createEpic',
    media: {
      light: 'tutorial-media/epic-light.svg',
      dark: 'tutorial-media/epic-dark.svg',
      alt: 'Epic creation modal in light and dark mode',
      type: 'image',
    },
  },
  {
    id: 'create-story',
    title: 'Create Linked Stories',
    summary: 'Attach a story to the epic and size it.',
    instructions: [
      'Run DevStories: Create Story.',
      'Select the epic you just created.',
      'Fill in dependencies and notes so the board view has full context.',
    ],
    cta: 'Run DevStories: Create Story',
    ctaCommandId: 'devstories.createStory',
    media: {
      light: 'tutorial-media/story-light.svg',
      dark: 'tutorial-media/story-dark.svg',
      alt: 'Story creation flow screenshot',
      type: 'image',
    },
  },
  {
    id: 'quick-capture',
    title: 'Capture Notes Quickly',
    summary: 'Quick Capture turns highlighted text into a ready-to-triage story.',
    instructions: [
      'Highlight TODOs or notes.',
      'Run DevStories: Quick Capture.',
      'Send the captured idea into the Inbox epic.',
    ],
    cta: 'Run DevStories: Quick Capture',
    ctaCommandId: 'devstories.quickCapture',
    media: {
      light: 'tutorial-media/quick-capture-light.svg',
      dark: 'tutorial-media/quick-capture-dark.svg',
      alt: 'Quick capture palette screenshot',
      type: 'image',
    },
  },
  {
    id: 'board-drag-drop',
    title: 'Drag Cards on the Board',
    summary: 'Use the DevStories board view to drag cards between workflow states.',
    instructions: [
      'Open the DevStories Board view.',
      'Drag stories between Todo → Doing → Done.',
      'Verify markdown status updates automatically.',
    ],
    media: {
      light: 'tutorial-media/board-light.svg',
      dark: 'tutorial-media/board-dark.svg',
      alt: 'Board view drag and drop preview',
      type: 'image',
    },
  },
  {
    id: 'agile-solo-starter',
    title: 'Enable Agile Solo Starter',
    summary: 'Toggle cadence kit features and starter rituals.',
    instructions: [
      'Open DevStories settings page.',
      'Enable Agile Solo Starter toggles.',
      'Confirm toolbar shows the cadence kit status.',
    ],
    media: {
      light: 'tutorial-media/solo-starter-light.svg',
      dark: 'tutorial-media/solo-starter-dark.svg',
      alt: 'Agile Solo Starter settings screenshot',
      type: 'image',
    },
  },
  {
    id: 'cadence-reminders',
    title: 'Schedule Cadence Reminders',
    summary: 'Configure reminders so VS Code nudges you before rituals.',
    instructions: [
      'Update cadence config in .devstories/config.yaml.',
      'Set planning/retro/grooming times.',
      'Confirm the ritual status bar item shows the next event.',
    ],
    media: {
      light: 'tutorial-media/cadence-light.svg',
      dark: 'tutorial-media/cadence-dark.svg',
      alt: 'Status bar cadence reminder preview',
      type: 'image',
    },
  },
];

export class TutorialService {
  constructor(private readonly storage: StorageLike) {}

  getSteps(): TutorialStep[] {
    return STEPS;
  }

  getProgress(): TutorialProgress {
    const completed = this.getState().completedStepIds;
    const total = STEPS.length;
    const completedCount = STEPS.filter((step) => completed.includes(step.id)).length;
    return {
      completedStepIds: [...completed],
      completedCount,
      totalCount: total,
      percentage: total === 0 ? 0 : Math.round((completedCount / total) * 100),
    };
  }

  async setStepCompletion(stepId: string, completed: boolean): Promise<void> {
    const state = this.getState();
    const next = new Set(state.completedStepIds);
    if (completed) {
      next.add(stepId);
    } else {
      next.delete(stepId);
    }
    await this.storage.update(STORAGE_KEY, { completedStepIds: Array.from(next) });
  }

  async resetProgress(): Promise<void> {
    await this.storage.update(STORAGE_KEY, { completedStepIds: [] });
  }

  isStepCompleted(stepId: string): boolean {
    return this.getState().completedStepIds.includes(stepId);
  }

  getStepCount(): number {
    return STEPS.length;
  }

  private getState(): TutorialState {
    const stored = this.storage.get<TutorialState>(STORAGE_KEY, { completedStepIds: [] });
    if (!stored || !Array.isArray(stored.completedStepIds)) {
      return { completedStepIds: [] };
    }
    return stored;
  }
}
