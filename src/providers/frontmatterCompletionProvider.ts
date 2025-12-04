/**
 * Completion provider for frontmatter enum fields in .devstories/ markdown files
 * Provides autocomplete suggestions for status, type, size, and sprint fields
 */

import * as vscode from 'vscode';
import { ConfigService } from '../core/configService';
import { isInFrontmatter } from './storyHoverProviderUtils';
import {
  detectFieldAtCursor,
  getStatusCompletions,
  getTypeCompletions,
  getSizeCompletions,
  getSprintCompletions,
  CompletionData,
} from './frontmatterCompletionProviderUtils';

export class FrontmatterCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private configService: ConfigService) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | null {
    // Only process files in .devstories directory
    if (!document.uri.fsPath.includes('.devstories')) {
      return null;
    }

    // Check if we're in frontmatter
    const allLines = document.getText().split('\n');
    const inFrontmatter = isInFrontmatter(allLines, position.line);

    if (!inFrontmatter) {
      return null;
    }

    // Get current line and detect field
    const line = document.lineAt(position.line).text;
    const field = detectFieldAtCursor(line, position.character);

    if (!field) {
      return null;
    }

    // Get completions based on field type
    const completionData = this.getCompletionsForField(field);
    if (!completionData || completionData.length === 0) {
      return null;
    }

    // Convert to VS Code CompletionItems
    return completionData.map((data, index) => {
      const item = new vscode.CompletionItem(data.value, vscode.CompletionItemKind.Value);
      if (data.detail) {
        item.detail = data.detail;
      }
      // Set sort order to preserve original order
      item.sortText = String(index).padStart(3, '0');
      return item;
    });
  }

  private getCompletionsForField(field: string): CompletionData[] {
    const config = this.configService.config;

    switch (field) {
      case 'status':
        return getStatusCompletions(config.statuses);
      case 'type':
        return getTypeCompletions();
      case 'size':
        return getSizeCompletions(config.sizes);
      case 'sprint':
        return getSprintCompletions(config.sprintSequence);
      default:
        return [];
    }
  }
}
