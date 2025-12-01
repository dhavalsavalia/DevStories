import * as vscode from 'vscode';
import { Store } from '../core/store';
import { getLogger } from '../core/logger';
import {
  parseQuickInput,
  truncateForTitle,
  cleanSelectionText,
  OPEN_STORY_ACTION,
} from './quickCaptureUtils';
import {
  parseConfigYaml,
  findNextStoryId,
  generateStoryMarkdown,
  generateStoryLink,
  appendStoryToEpic,
  DevStoriesConfig,
  DEFAULT_TEMPLATES,
} from './createStoryUtils';
import { validateStoryTitle } from '../utils/inputValidation';

// Re-export for testing
export {
  parseQuickInput,
  truncateForTitle,
  cleanSelectionText,
  INBOX_EPIC_ID,
  OPEN_STORY_ACTION,
} from './quickCaptureUtils';

/**
 * Read and parse config.yaml from workspace
 */
async function readConfig(workspaceUri: vscode.Uri): Promise<DevStoriesConfig | undefined> {
  const configUri = vscode.Uri.joinPath(workspaceUri, '.devstories', 'config.yaml');
  try {
    const content = await vscode.workspace.fs.readFile(configUri);
    return parseConfigYaml(Buffer.from(content).toString('utf8'));
  } catch (error) {
    getLogger().debug('Config not found or unreadable', error);
    return undefined;
  }
}

/**
 * Generate inbox epic markdown content
 */
function generateInboxEpicMarkdown(prefix: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `---
id: ${prefix}-INBOX
title: "Inbox"
status: active
sprint: ""
created: ${today}
updated: ${today}
---

# Inbox

Quick captures and ideas to triage later.

## Stories
`;
}

/**
 * Ensure inbox epic exists, create if missing
 * Returns the epic ID (e.g., EPIC-INBOX)
 */
async function ensureInboxEpic(
  workspaceUri: vscode.Uri,
  config: DevStoriesConfig
): Promise<string> {
  const inboxId = `${config.epicPrefix}-INBOX`;
  const epicUri = vscode.Uri.joinPath(
    workspaceUri,
    '.devstories',
    'epics',
    `${inboxId}.md`
  );

  try {
    await vscode.workspace.fs.stat(epicUri);
    // File exists
    return inboxId;
  } catch {
    // Inbox epic doesn't exist - create it (expected scenario)
    getLogger().debug('Creating inbox epic');
    const markdown = generateInboxEpicMarkdown(config.epicPrefix);
    await vscode.workspace.fs.writeFile(epicUri, Buffer.from(markdown));
    return inboxId;
  }
}

/**
 * Get selected text from active editor, cleaned for title use
 */
function getSelectedText(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }

  const selection = editor.selection;
  if (selection.isEmpty) {
    return undefined;
  }

  const text = editor.document.getText(selection);
  if (!text.trim()) {
    return undefined;
  }

  return truncateForTitle(cleanSelectionText(text));
}

/**
 * Execute the quickCapture command
 * Returns true if story was created, false otherwise
 */
export async function executeQuickCapture(store: Store): Promise<boolean> {
  // Check for workspace
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    void vscode.window.showErrorMessage('DevStories: No workspace folder open');
    return false;
  }

  const workspaceUri = workspaceFolders[0].uri;

  // Read config
  const config = await readConfig(workspaceUri);
  if (!config) {
    const action = await vscode.window.showErrorMessage(
      'DevStories: No config.yaml found. Initialize DevStories first.',
      'Initialize'
    );
    if (action === 'Initialize') {
      void vscode.commands.executeCommand('devstories.init');
    }
    return false;
  }

  // Get prefilled value from selection (if any)
  const prefillValue = getSelectedText() || '';

  // Show input box with validation
  const rawInput = await vscode.window.showInputBox({
    prompt: 'Quick capture (prefix: bug:|feat:|chore: | pipe: for notes)',
    placeHolder: 'e.g., bug: Fix login | users report 500',
    value: prefillValue,
    valueSelection: prefillValue ? [0, prefillValue.length] : undefined,
    validateInput: (value) => {
      if (!value || !value.trim()) {
        return 'Title is required';
      }
      // Parse to extract title, then validate
      const parsed = parseQuickInput(value);
      const validation = validateStoryTitle(parsed.title);
      return validation.valid ? undefined : validation.error;
    },
  });

  if (!rawInput || !rawInput.trim()) {
    return false;
  }

  // Parse input
  const parsed = parseQuickInput(rawInput);

  // Ensure inbox epic exists
  const inboxEpicId = await ensureInboxEpic(workspaceUri, config);

  // Generate story ID
  const existingIds = store.getStories().map(s => s.id);
  const nextNum = findNextStoryId(existingIds, config.storyPrefix);
  const storyId = `${config.storyPrefix}-${String(nextNum).padStart(3, '0')}`;

  // Determine sprint based on config option (default: backlog for inbox workflow)
  const sprint = config.quickCaptureDefaultToCurrentSprint && config.currentSprint
    ? config.currentSprint
    : 'backlog';

  // Get template and add notes if provided
  let template = config.templates[parsed.type] || DEFAULT_TEMPLATES[parsed.type];
  if (parsed.notes) {
    // Prepend notes to template
    template = `## Notes\n${parsed.notes}\n\n${template}`;
  }

  // Generate markdown
  const markdown = generateStoryMarkdown(
    {
      id: storyId,
      title: parsed.title,
      type: parsed.type,
      epic: inboxEpicId,
      sprint,
      size: 'M', // Default size for quick capture
    },
    template
  );

  // Write story file
  const storyUri = vscode.Uri.joinPath(
    workspaceUri,
    '.devstories',
    'stories',
    `${storyId}.md`
  );

  await vscode.workspace.fs.writeFile(storyUri, Buffer.from(markdown));

  // Auto-link to inbox epic
  const inboxEpicUri = vscode.Uri.joinPath(
    workspaceUri,
    '.devstories',
    'epics',
    `${inboxEpicId}.md`
  );

  try {
    const epicContent = Buffer.from(await vscode.workspace.fs.readFile(inboxEpicUri)).toString('utf8');
    const storyLink = generateStoryLink(storyId, parsed.title);
    const updatedEpic = appendStoryToEpic(epicContent, storyLink);
    await vscode.workspace.fs.writeFile(inboxEpicUri, Buffer.from(updatedEpic));
  } catch {
    // Non-critical: epic auto-link failed
    getLogger().warn('Failed to auto-link story to inbox epic');
  }

  // Show notification with "Open Story" action button
  // Non-blocking: user can dismiss or click later without interrupting workflow
  void vscode.window.showInformationMessage(
    `Created ${storyId}: ${parsed.title}`,
    OPEN_STORY_ACTION
  ).then(async (action) => {
    if (action === OPEN_STORY_ACTION) {
      const doc = await vscode.workspace.openTextDocument(storyUri);
      await vscode.window.showTextDocument(doc);
    }
  });

  return true;
}
