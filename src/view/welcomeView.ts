import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WelcomeExperience } from '../core/welcomeExperience';
import { getQuickActionSections, runQuickAction, QuickAction, QuickActionCategory } from './welcomeViewActions';
import { getWelcomeAssetFilePath } from './welcomeViewUtils';
import { getWelcomeHtml } from './welcomeViewTemplate';
import { WelcomeExtensionMessage, WelcomeInitPayload, WelcomeSection, WelcomeSectionAction, WelcomeWebviewMessage } from '../types/welcomeMessages';
import { ThemeKind } from '../types/webviewMessages';
import { getThemeKindFromNumber } from './boardViewUtils';

const SECTION_TITLES: Record<QuickActionCategory, string> = {
  'get-started': 'Get Started',
  learn: 'Learn the Flow',
  customize: 'Customize Your Setup',
};

export class WelcomeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'devstories.views.welcome';

  private view?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly welcomeExperience: WelcomeExperience
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')],
    };

    webviewView.webview.html = this.buildHtml(webviewView.webview);

    this.disposables.push(
      webviewView.webview.onDidReceiveMessage((message: WelcomeWebviewMessage) => this.handleMessage(message))
    );

    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme((theme) =>
        this.postMessage({
          type: 'welcome:themeChanged',
          payload: { kind: getThemeKindFromNumber(theme.kind) },
        })
      )
    );

    webviewView.onDidDispose(() => {
      this.disposables.forEach((d) => d.dispose());
      this.disposables = [];
      this.view = undefined;
    });

    if (webviewView.visible) {
      this.sendInitData();
    }

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.sendInitData();
      }
    });
  }

  async reveal(): Promise<void> {
    if (this.view) {
      this.view.show?.(true);
      return;
    }
    await vscode.commands.executeCommand(`${WelcomeViewProvider.viewId}.focus`);
  }

  private buildHtml(webview: vscode.Webview): string {
    const cssFile = getWelcomeAssetFilePath(this.context.extensionPath, 'welcome.css');
    const scriptFile = getWelcomeAssetFilePath(this.context.extensionPath, 'welcome.js');
    const heroFile = getWelcomeAssetFilePath(this.context.extensionPath, 'welcome-hero.svg');

    const cssUri = webview.asWebviewUri(vscode.Uri.file(cssFile));
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(scriptFile));
    const heroUri = webview.asWebviewUri(vscode.Uri.file(heroFile));

    const nonce = this.generateNonce();
    const csp = this.buildContentSecurityPolicy(webview, nonce);

    return getWelcomeHtml({
      cssHref: cssUri.toString(),
      scriptSrc: scriptUri.toString(),
      heroSrc: heroUri.toString(),
      csp,
      theme: this.getTheme(),
      nonce,
    });
  }

  private buildContentSecurityPolicy(webview: vscode.Webview, nonce: string): string {
    return [
      "default-src 'none'",
      `img-src ${webview.cspSource} https: data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
    ].join('; ');
  }

  private getTheme(): ThemeKind {
    return getThemeKindFromNumber(vscode.window.activeColorTheme.kind);
  }

  private async handleMessage(message: WelcomeWebviewMessage): Promise<void> {
    switch (message.type) {
      case 'ready':
        this.sendInitData();
        break;
      case 'runCommand':
        await runQuickAction(message.payload.actionId);
        break;
      case 'dismiss':
        await this.welcomeExperience.markDismissed();
        void vscode.window.showInformationMessage('Welcome hub dismissed. Reopen via DevStories: Open Welcome.');
        break;
      case 'openDocs':
        await this.openDocs(message.payload?.path);
        break;
    }
  }

  private async openDocs(relativePath?: string): Promise<void> {
    const defaultDoc = path.join('docs', 'overview', '01-vision.md');
    const target = relativePath ?? defaultDoc;
    const filePath = path.join(this.context.extensionPath, target);

    if (fs.existsSync(filePath)) {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
      return;
    }

    const fallbackPath = path.join(this.context.extensionPath, 'README.md');
    if (fs.existsSync(fallbackPath)) {
      await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fallbackPath));
    }
  }

  private sendInitData(): void {
    if (!this.view) {
      return;
    }

    const payload: WelcomeInitPayload = {
      sections: this.buildSections(),
      releaseNotes: this.loadReleaseNotes(),
      theme: this.getTheme(),
    };

    this.postMessage({ type: 'welcome:init', payload });
  }

  private buildSections(): WelcomeSection[] {
    const sectionMap = getQuickActionSections();
    const categories: QuickActionCategory[] = ['get-started', 'learn', 'customize'];

    return categories
      .map((category) => ({
        id: category,
        title: SECTION_TITLES[category],
        actions: (sectionMap[category] || []).map((action) => this.toSectionAction(action)),
      }))
      .filter((section) => section.actions.length > 0);
  }

  private toSectionAction(action: QuickAction): WelcomeSectionAction {
    return {
      id: action.id,
      label: action.label,
      description: action.description,
      icon: action.icon,
    };
  }

  private loadReleaseNotes(): string[] {
    try {
      const progressPath = path.join(this.context.extensionPath, 'claude-progress.txt');
      if (!fs.existsSync(progressPath)) {
        return this.defaultReleaseNotes();
      }

      const content = fs.readFileSync(progressPath, 'utf8');
      const sessions = content.match(/=== Session:[\s\S]*?(?=== Session:|$)/g);
      const latest = sessions?.[sessions.length - 1] ?? content;
      const bullets = latest
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.slice(2).trim())
        .filter(Boolean)
        .slice(0, 4);

      return bullets.length > 0 ? bullets : this.defaultReleaseNotes();
    } catch {
      return this.defaultReleaseNotes();
    }
  }

  private defaultReleaseNotes(): string[] {
    return [
      'Welcome hub launches automatically on first activation.',
      'Quick action tiles trigger core DevStories commands.',
      'Offline docs and hero visuals now bundled into the extension.',
    ];
  }

  private postMessage(message: WelcomeExtensionMessage): void {
    this.view?.webview.postMessage(message);
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
