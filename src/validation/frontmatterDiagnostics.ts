/**
 * VS Code DiagnosticCollection provider for frontmatter validation
 * Shows red squiggles and warnings for invalid frontmatter
 */

import * as vscode from 'vscode';
import { ConfigService } from '../core/configService';
import {
  validateFrontmatter,
  getFileTypeFromPath,
  isDevStoriesFile,
  ValidationError,
  ValidationConfig
} from './frontmatterValidator';
import * as path from 'path';

const DEBOUNCE_DELAY = 300;

/**
 * Provider that validates frontmatter and shows diagnostics
 */
export class FrontmatterDiagnosticsProvider implements vscode.Disposable {
  private diagnostics: vscode.DiagnosticCollection;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private disposables: vscode.Disposable[] = [];
  private schemasDir: string;

  constructor(
    private configService: ConfigService,
    extensionPath: string
  ) {
    this.diagnostics = vscode.languages.createDiagnosticCollection('devstories');
    this.schemasDir = path.join(extensionPath, 'schemas');
  }

  /**
   * Register all document listeners and return disposables
   */
  register(): vscode.Disposable[] {
    // Validate on document open
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        this.validateDocumentIfDevStories(doc);
      })
    );

    // Validate on document change (debounced)
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.debouncedValidate(event.document);
      })
    );

    // Validate on document save (immediate)
    this.disposables.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        this.validateDocumentIfDevStories(doc);
      })
    );

    // Clear diagnostics when document closes
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.clearDiagnostics(doc.uri);
        this.clearDebounceTimer(doc.uri.toString());
      })
    );

    // Re-validate all open documents when config changes
    this.disposables.push(
      this.configService.onDidConfigChange(() => {
        this.validateAllOpenDocuments();
      })
    );

    // Validate already-open documents
    this.validateAllOpenDocuments();

    return this.disposables;
  }

  /**
   * Validate document if it's a devstories file
   */
  private validateDocumentIfDevStories(doc: vscode.TextDocument): void {
    if (!isDevStoriesFile(doc.uri.fsPath)) {
      return;
    }

    const fileType = getFileTypeFromPath(doc.uri.fsPath);
    if (!fileType) {
      return;
    }

    this.validateDocument(doc, fileType);
  }

  /**
   * Debounced validation for typing
   */
  private debouncedValidate(doc: vscode.TextDocument): void {
    if (!isDevStoriesFile(doc.uri.fsPath)) {
      return;
    }

    const fileType = getFileTypeFromPath(doc.uri.fsPath);
    if (!fileType) {
      return;
    }

    const uri = doc.uri.toString();

    // Clear existing timer
    this.clearDebounceTimer(uri);

    // Set new timer
    const timer = setTimeout(() => {
      this.validateDocument(doc, fileType);
      this.debounceTimers.delete(uri);
    }, DEBOUNCE_DELAY);

    this.debounceTimers.set(uri, timer);
  }

  /**
   * Validate a single document
   */
  private validateDocument(doc: vscode.TextDocument, fileType: 'story' | 'epic'): void {
    const content = doc.getText();

    // Build config from ConfigService
    const config: ValidationConfig = {
      statuses: this.configService.config.statuses.map(s => s.id),
      sizes: this.configService.config.sizes
    };

    const errors = validateFrontmatter(content, fileType, config, this.schemasDir);
    const diagnostics = errors.map(error => this.errorToDiagnostic(error, doc));

    this.diagnostics.set(doc.uri, diagnostics);
  }

  /**
   * Convert ValidationError to VS Code Diagnostic
   */
  private errorToDiagnostic(error: ValidationError, doc: vscode.TextDocument): vscode.Diagnostic {
    const line = error.line - 1; // VS Code uses 0-indexed lines
    const startCol = error.column;
    const endCol = error.endColumn ?? error.column + 1;

    // Clamp to document bounds
    const lineCount = doc.lineCount;
    const clampedLine = Math.min(Math.max(0, line), lineCount - 1);
    const lineText = doc.lineAt(clampedLine).text;
    const clampedEndCol = Math.min(endCol, lineText.length);

    const range = new vscode.Range(
      clampedLine,
      Math.min(startCol, lineText.length),
      clampedLine,
      clampedEndCol
    );

    const severity = error.severity === 'error'
      ? vscode.DiagnosticSeverity.Error
      : vscode.DiagnosticSeverity.Warning;

    const diagnostic = new vscode.Diagnostic(range, error.message, severity);
    diagnostic.source = 'DevStories';

    return diagnostic;
  }

  /**
   * Validate all currently open documents
   */
  private validateAllOpenDocuments(): void {
    for (const doc of vscode.workspace.textDocuments) {
      this.validateDocumentIfDevStories(doc);
    }
  }

  /**
   * Clear diagnostics for a URI
   */
  clearDiagnostics(uri: vscode.Uri): void {
    this.diagnostics.delete(uri);
  }

  /**
   * Clear debounce timer for a URI
   */
  private clearDebounceTimer(uri: string): void {
    const timer = this.debounceTimers.get(uri);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(uri);
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Dispose diagnostic collection
    this.diagnostics.dispose();

    // Dispose all listeners
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
