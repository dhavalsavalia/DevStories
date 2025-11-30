import * as vscode from 'vscode';
import { Store } from '../core/store';
import { findLinksInDocument, createDocumentLink } from './storyLinkProviderUtils';

/**
 * Provides clickable [[ID]] links in markdown files
 * Ctrl+Click (Cmd+Click on Mac) navigates to the referenced story/epic
 */
export class StoryLinkProvider implements vscode.DocumentLinkProvider {
  constructor(private store: Store) {}

  provideDocumentLinks(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.DocumentLink[] {
    // Only process files in .devstories directory
    if (!document.uri.fsPath.includes('.devstories')) {
      return [];
    }

    const basePath = this.getDevStoriesPath(document.uri.fsPath);
    if (!basePath) {
      return [];
    }

    const text = document.getText();
    const matches = findLinksInDocument(text);
    const knownIds = this.getKnownIds();
    const links: vscode.DocumentLink[] = [];

    for (const match of matches) {
      const resolved = createDocumentLink(match, basePath, knownIds);
      if (resolved) {
        const startPos = document.positionAt(resolved.start);
        const endPos = document.positionAt(resolved.end);
        const range = new vscode.Range(startPos, endPos);
        const link = new vscode.DocumentLink(range, vscode.Uri.file(resolved.targetPath));
        links.push(link);
      }
      // Broken links are skipped (no link created) - graceful handling
    }

    return links;
  }

  /**
   * Get the .devstories directory path from a file path
   */
  private getDevStoriesPath(filePath: string): string | null {
    const devstoriesIndex = filePath.indexOf('.devstories');
    if (devstoriesIndex === -1) {
      return null;
    }
    return filePath.substring(0, devstoriesIndex + '.devstories'.length);
  }

  /**
   * Get all known story and epic IDs from the store
   */
  private getKnownIds(): Set<string> {
    const ids = new Set<string>();

    for (const story of this.store.getStories()) {
      ids.add(story.id);
    }

    for (const epic of this.store.getEpics()) {
      ids.add(epic.id);
    }

    return ids;
  }
}
