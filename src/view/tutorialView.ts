import * as path from 'path';
import * as vscode from 'vscode';
import { TutorialService, TutorialStep } from '../core/tutorialService';
import { TutorialExtensionMessage, TutorialPayload, TutorialStepViewModel, TutorialWebviewMessage } from '../types/tutorialMessages';
import { ThemeKind } from '../types/webviewMessages';
import { getThemeKindFromNumber } from './boardViewUtils';

export class TutorialPanel {
  public static readonly viewType = 'devstories.tutorial';

  private panel?: vscode.WebviewPanel;
  private themeListener?: vscode.Disposable;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly tutorialService: TutorialService,
    private readonly sampleWorkspacePath: string
  ) {}

  async show(): Promise<void> {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      await this.postState('tutorial:update');
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      TutorialPanel.viewType,
      'DevStories Tutorial',
      { viewColumn: vscode.ViewColumn.One, preserveFocus: false },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')],
      }
    );

    this.panel.onDidDispose(() => this.dispose());
    this.panel.webview.onDidReceiveMessage((message: TutorialWebviewMessage) => {
      void this.handleMessage(message);
    });

    this.themeListener = vscode.window.onDidChangeActiveColorTheme((event) => {
      this.postMessage({ type: 'tutorial:themeChanged', payload: { kind: getThemeKindFromNumber(event.kind) } });
    });

    this.panel.webview.html = this.buildHtml(this.panel.webview);
  }

  async refresh(): Promise<void> {
    if (this.panel) {
      await this.postState('tutorial:update');
    }
  }

  dispose(): void {
    this.panel = undefined;
    this.themeListener?.dispose();
    this.themeListener = undefined;
  }

  private async handleMessage(message: TutorialWebviewMessage): Promise<void> {
    switch (message.type) {
      case 'tutorial:ready':
        await this.postState('tutorial:init');
        break;
      case 'tutorial:toggleStep':
        await this.tutorialService.setStepCompletion(message.payload.stepId, message.payload.completed);
        await this.postState('tutorial:update');
        break;
      case 'tutorial:reset':
        await this.tutorialService.resetProgress();
        await this.postState('tutorial:update');
        void vscode.window.showInformationMessage('Tutorial progress reset.');
        break;
      case 'tutorial:openSample': {
        const uri = vscode.Uri.file(this.sampleWorkspacePath);
        await vscode.commands.executeCommand('vscode.openFolder', uri, true);
        break;
      }
      case 'tutorial:runCommand':
        try {
          await vscode.commands.executeCommand(message.payload.commandId);
        } catch (error) {
          console.error(`Failed to run tutorial CTA command: ${message.payload.commandId}`, error);
        }
        break;
    }
  }

  private buildHtml(webview: vscode.Webview): string {
    const cssUri = this.getAssetUri(webview, 'tutorial.css');
    const scriptUri = this.getAssetUri(webview, 'tutorial.js');
    const nonce = this.generateNonce();
    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} https: data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
    ].join('; ');

    const theme = this.getTheme();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${cssUri}">
  <title>DevStories Tutorial</title>
</head>
<body data-theme="${theme}">
  <header class="tutorial-header">
    <div>
      <p class="eyebrow">Interactive Walkthrough</p>
      <h1>Master DevStories faster</h1>
      <p class="subhead">Complete the guided tasks below or jump into the bundled sample workspace.</p>
    </div>
    <div class="toolbar">
      <button id="open-sample" class="ghost">Open Sample Workspace</button>
      <button id="reset-progress" class="subtle">Reset Progress</button>
    </div>
  </header>
  <section class="progress-card">
    <div>
      <p class="eyebrow">Progress</p>
      <h2 id="progress-label">0% Complete</h2>
      <p id="progress-summary">0 of 0 steps checked off.</p>
    </div>
    <div class="progress-ring">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" class="track"></circle>
        <circle cx="60" cy="60" r="54" class="indicator" stroke-dasharray="339.292" stroke-dashoffset="339.292"></circle>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" id="progress-percent">0%</text>
      </svg>
    </div>
  </section>
  <section id="tutorial-steps" class="tutorial-grid"></section>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private async postState(type: 'tutorial:init' | 'tutorial:update'): Promise<void> {
    if (!this.panel) {
      return;
    }

    const payload = this.buildPayload(this.panel.webview);
    this.postMessage({ type, payload });
  }

  private buildPayload(webview: vscode.Webview): TutorialPayload {
    const baseSteps = this.tutorialService.getSteps();
    const progress = this.tutorialService.getProgress();
    const completed = new Set(progress.completedStepIds);

    const steps: TutorialStepViewModel[] = baseSteps.map((step) => this.toViewModel(webview, step, completed.has(step.id)));

    return {
      steps,
      progress,
      theme: this.getTheme(),
      sampleWorkspaceLabel: path.basename(this.sampleWorkspacePath),
    };
  }

  private toViewModel(webview: vscode.Webview, step: TutorialStep, completed: boolean): TutorialStepViewModel {
    return {
      id: step.id,
      title: step.title,
      summary: step.summary,
      instructions: step.instructions,
      cta: step.cta,
      ctaCommandId: step.ctaCommandId,
      completed,
      media: step.media
        ? {
            ...step.media,
            light: this.resolveMedia(webview, step.media.light),
            dark: this.resolveMedia(webview, step.media.dark),
          }
        : undefined,
    };
  }

  private resolveMedia(webview: vscode.Webview, relativePath: string): string {
    const file = path.join(this.context.extensionPath, 'dist', 'webview', relativePath);
    return webview.asWebviewUri(vscode.Uri.file(file)).toString();
  }

  private postMessage(message: TutorialExtensionMessage): void {
    this.panel?.webview.postMessage(message);
  }

  private getAssetUri(webview: vscode.Webview, asset: string): string {
    const filePath = path.join(this.context.extensionPath, 'dist', 'webview', asset);
    return webview.asWebviewUri(vscode.Uri.file(filePath)).toString();
  }

  private getTheme(): ThemeKind {
    return getThemeKindFromNumber(vscode.window.activeColorTheme.kind);
  }

  private generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
