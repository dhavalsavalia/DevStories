import { TutorialProgress } from '../core/tutorialService';
import { ThemeKind } from './webviewMessages';

export interface TutorialStepViewModel {
  id: string;
  title: string;
  summary: string;
  instructions: string[];
  cta?: string;
  ctaCommandId?: string;
  completed: boolean;
  media?: TutorialStepMediaViewModel;
}

export interface TutorialStepMediaViewModel {
  light: string;
  dark: string;
  alt: string;
  type: 'image' | 'gif';
}

export interface TutorialPayload {
  steps: TutorialStepViewModel[];
  progress: TutorialProgress;
  theme: ThemeKind;
  sampleWorkspaceLabel: string;
}

export type TutorialExtensionMessage =
  | { type: 'tutorial:init'; payload: TutorialPayload }
  | { type: 'tutorial:update'; payload: TutorialPayload }
  | { type: 'tutorial:themeChanged'; payload: { kind: ThemeKind } };

export type TutorialWebviewMessage =
  | { type: 'tutorial:ready' }
  | { type: 'tutorial:toggleStep'; payload: { stepId: string; completed: boolean } }
  | { type: 'tutorial:reset' }
  | { type: 'tutorial:openSample' }
  | { type: 'tutorial:runCommand'; payload: { commandId: string } };
