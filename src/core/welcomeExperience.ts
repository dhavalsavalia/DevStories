import * as vscode from 'vscode';

interface WelcomeState {
  [workspaceId: string]: boolean;
}

const STORAGE_KEY = 'devstories.welcome.dismissed';

export class WelcomeExperience {
  private readonly workspaceId: string;

  constructor(private readonly globalState: vscode.Memento, workspaceId?: string) {
    this.workspaceId = workspaceId ?? WelcomeExperience.getWorkspaceId();
  }

  static getWorkspaceId(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder?.uri.fsPath ?? 'global';
  }

  shouldAutoOpen(): boolean {
    const state = this.getState();
    return !state[this.workspaceId];
  }

  async markDismissed(): Promise<void> {
    const state = this.getState();
    state[this.workspaceId] = true;
    await this.globalState.update(STORAGE_KEY, state);
  }

  async resetDismissed(): Promise<void> {
    const state = this.getState();
    delete state[this.workspaceId];
    await this.globalState.update(STORAGE_KEY, state);
  }

  private getState(): WelcomeState {
    const state = this.globalState.get<WelcomeState>(STORAGE_KEY, {} as WelcomeState);
    return state ?? {};
  }
}
