import { ThemeKind } from './webviewMessages';

export interface WelcomeSectionAction {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface WelcomeSection {
  id: string;
  title: string;
  actions: WelcomeSectionAction[];
}

export interface WelcomeInitPayload {
  sections: WelcomeSection[];
  releaseNotes: string[];
  theme: ThemeKind;
}

export type WelcomeExtensionMessage =
  | { type: 'welcome:init'; payload: WelcomeInitPayload }
  | { type: 'welcome:themeChanged'; payload: { kind: ThemeKind } };

export type WelcomeWebviewMessage =
  | { type: 'ready' }
  | { type: 'runCommand'; payload: { actionId: string } }
  | { type: 'dismiss' }
  | { type: 'openDocs'; payload?: { path?: string } };
