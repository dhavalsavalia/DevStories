/**
 * Board View Provider
 * Provides the webview for the Kanban board
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import { Store } from '../core/store';
import { ConfigService } from '../core/configService';
import { ExtensionMessage, WebviewMessage, InitPayload, StatusConfig } from '../types/webviewMessages';
import {
  serializeStoryForWebview,
  serializeEpicForWebview,
  generateNonce,
  getThemeKindFromNumber,
  extractSprints,
} from './boardViewUtils';
import { updateStoryStatus as updateStoryStatusInFile } from '../commands/changeStatusUtils';

export class BoardViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'devstories.views.board';

  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly store: Store,
    private readonly configService: ConfigService
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview')],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    this._disposables.push(
      webviewView.webview.onDidReceiveMessage((message: WebviewMessage) =>
        this.handleMessage(message)
      )
    );

    // Subscribe to store updates
    this._disposables.push(this.store.onDidUpdate(() => this.sendInitData()));

    // Subscribe to config changes (DS-035: live reload)
    this._disposables.push(this.configService.onDidConfigChange(() => this.sendInitData()));

    // Listen for theme changes
    this._disposables.push(
      vscode.window.onDidChangeActiveColorTheme((theme) => {
        this.postMessage({
          type: 'themeChanged',
          payload: { kind: getThemeKindFromNumber(theme.kind) },
        });
      })
    );

    // Send initial data when webview becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.sendInitData();
      }
    });

    // Cleanup
    webviewView.onDidDispose(() => {
      this._disposables.forEach((d) => d.dispose());
      this._disposables = [];
    });

    // Send initial data
    this.sendInitData();
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');

    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewPath, 'board.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewPath, 'board.js'));

    const nonce = generateNonce();
    const csp = this.buildContentSecurityPolicy(webview, nonce);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="stylesheet" href="${cssUri}">
  <title>Board</title>
</head>
<body>
  <div id="app">
    <div id="loading">
      <span class="spinner"></span>
      <span>Loading board...</span>
    </div>
    <div id="board" style="display: none;"></div>
    <div id="error" style="display: none;"></div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private buildContentSecurityPolicy(webview: vscode.Webview, nonce: string): string {
    return [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
      `font-src ${webview.cspSource}`,
      `img-src ${webview.cspSource} https: data:`,
    ].join('; ');
  }

  private sendInitData(): void {
    if (!this._view?.visible) {
      return;
    }

    const stories = this.store.getStories().map(serializeStoryForWebview);
    const epics = this.store.getEpics().map(serializeEpicForWebview);
    const statuses = this.loadStatuses();
    const sprints = extractSprints(stories, epics);  // DS-023
    const theme = getThemeKindFromNumber(vscode.window.activeColorTheme.kind);

    const payload: InitPayload = {
      stories,
      epics,
      statuses,
      sprints,  // DS-023
      theme,
    };

    this.postMessage({ type: 'init', payload });
  }

  private loadStatuses(): StatusConfig[] {
    // DS-035: Use ConfigService for live-reloaded statuses
    const statuses = this.configService.config.statuses;
    return statuses.map(s => ({
      id: s.id,
      label: s.label,
    }));
  }

  private handleMessage(message: WebviewMessage): void {
    switch (message.type) {
      case 'ready':
        console.log('Board webview ready');
        break;
      case 'openStory':
        this.openStory(message.payload.id);
        break;
      case 'updateStatus':
        // DS-021: Handle status update from drag-drop or keyboard
        this.updateStoryStatus(message.payload.storyId, message.payload.newStatus);
        break;
      case 'filterChanged':
        // Will be implemented in DS-023
        console.log('filterChanged:', message.payload);
        break;
      case 'error':
        vscode.window.showErrorMessage(`Board error: ${message.payload.message}`);
        break;
    }
  }

  private openStory(id: string): void {
    const story = this.store.getStory(id);
    const epic = this.store.getEpic(id);
    const target = story || epic;

    if (target?.filePath) {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.file(target.filePath));
    }
  }

  /**
   * DS-021: Update story status from webview (drag-drop or keyboard)
   */
  private async updateStoryStatus(storyId: string, newStatus: string): Promise<void> {
    const story = this.store.getStory(storyId);
    if (!story?.filePath) {
      this.postMessage({
        type: 'updateFailed',
        payload: {
          storyId,
          originalStatus: '',
          error: 'Story not found',
        },
      });
      return;
    }

    const originalStatus = story.status;

    try {
      // Read current file content
      const content = fs.readFileSync(story.filePath, 'utf8');

      // Update the status in frontmatter
      const updatedContent = updateStoryStatusInFile(content, newStatus);

      // Write back to file
      fs.writeFileSync(story.filePath, updatedContent, 'utf8');

      // Store will auto-update via file watcher, which triggers sendInitData
      // The webview will receive storyUpdated message automatically
    } catch (err) {
      // Send failure message for rollback
      this.postMessage({
        type: 'updateFailed',
        payload: {
          storyId,
          originalStatus,
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      });
    }
  }

  private postMessage(message: ExtensionMessage): void {
    this._view?.webview.postMessage(message);
  }

  dispose(): void {
    this._disposables.forEach((d) => d.dispose());
  }
}
