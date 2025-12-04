import * as vscode from 'vscode';
import { Store } from '../core/store';
import { findLinkAtPosition, findBareIdAtPosition, isInFrontmatter, formatHoverCard, EpicProgress, HoverLinkMatch, findFieldNameAtPosition, getFieldDescription } from './storyHoverProviderUtils';

/**
 * Provides hover previews for [[ID]] links in markdown files
 * Shows story/epic details in a formatted markdown card
 */
export class StoryHoverProvider implements vscode.HoverProvider {
  constructor(private store: Store) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | null {
    // Only process files in .devstories directory
    if (!document.uri.fsPath.includes('.devstories')) {
      return null;
    }

    // Get the line text and find if cursor is on a link
    const line = document.lineAt(position.line);
    const lineText = line.text;
    const charOffset = position.character;

    // Check if we're in frontmatter - if so, look for bare IDs
    const allLines = document.getText().split('\n');
    const inFrontmatter = isInFrontmatter(allLines, position.line);

    // In frontmatter, check for field name hover first
    if (inFrontmatter) {
      const fieldMatch = findFieldNameAtPosition(lineText, charOffset);
      if (fieldMatch) {
        // Determine file type from path
        const fsPath = document.uri.fsPath;
        const fileType = fsPath.includes('/stories/') ? 'story' : 'epic';

        const description = getFieldDescription(fieldMatch.fieldName, fileType);
        if (description) {
          const md = new vscode.MarkdownString();
          md.appendMarkdown(`**${fieldMatch.fieldName}**\n\n${description}`);

          const range = new vscode.Range(
            position.line,
            fieldMatch.start,
            position.line,
            fieldMatch.end
          );

          return new vscode.Hover(md, range);
        }
      }
    }

    let match: HoverLinkMatch | null = null;

    if (inFrontmatter) {
      // In frontmatter: look for bare IDs first, then [[ID]] links
      match = findBareIdAtPosition(lineText, charOffset) || findLinkAtPosition(lineText, charOffset);
    } else {
      // In body: only look for [[ID]] links (bare IDs should NOT trigger hover)
      match = findLinkAtPosition(lineText, charOffset);
    }

    if (!match) {
      return null;
    }

    // Look up the story or epic
    const story = this.store.getStory(match.id);
    const epic = this.store.getEpic(match.id);
    const item = story || epic;

    if (!item) {
      // Return a "not found" hover
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**${match.id}** - Not found`);
      const range = new vscode.Range(
        position.line,
        match.start,
        position.line,
        match.end
      );
      return new vscode.Hover(md, range);
    }

    // Calculate progress for epics
    let progress: EpicProgress | undefined;
    if (epic) {
      const stories = this.store.getStoriesByEpic(epic.id);
      const done = stories.filter(s => s.status === 'done').length;
      progress = { done, total: stories.length };
    }

    // Format the hover card
    const type = story ? 'story' : 'epic';
    const cardContent = formatHoverCard(item, type, progress);

    const md = new vscode.MarkdownString(cardContent);
    md.isTrusted = true;

    const range = new vscode.Range(
      position.line,
      match.start,
      position.line,
      match.end
    );

    return new vscode.Hover(md, range);
  }
}
