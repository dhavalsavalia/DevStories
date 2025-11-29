import * as path from 'path';
import * as vscode from 'vscode';
import { TutorialService } from '../core/tutorialService';
import { TutorialPanel } from '../view/tutorialView';
import { getTutorialWorkspaceOptions, handleWorkspaceSelection, TutorialWorkspaceOptionId } from './startTutorialUtils';

export async function executeStartTutorial(
  context: vscode.ExtensionContext,
  tutorialService: TutorialService,
  tutorialPanel: TutorialPanel
): Promise<void> {
  const sampleWorkspacePath = path.join(context.extensionPath, 'test-workspace');
  const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name;
  const options = getTutorialWorkspaceOptions(workspaceName, sampleWorkspacePath);

  interface TutorialPickItem extends vscode.QuickPickItem {
    id: TutorialWorkspaceOptionId;
  }

  const pick = await vscode.window.showQuickPick<TutorialPickItem>(
    options.map((option) => ({
      label: option.label,
      description: option.description,
      id: option.id,
    })),
    {
      placeHolder: 'Choose where to run the DevStories tutorial',
    }
  );

  if (!pick) {
    return;
  }

  const selection = options.find((option) => option.id === pick.id);
  if (!selection) {
    return;
  }

  if (selection.id === 'reset') {
    await tutorialService.resetProgress();
    void vscode.window.showInformationMessage('DevStories tutorial progress reset.');
    await tutorialPanel.refresh();
    return;
  }

  const openedSample = await handleWorkspaceSelection(selection, async (targetPath) => {
    const uri = vscode.Uri.file(targetPath);
    await vscode.commands.executeCommand('vscode.openFolder', uri, true);
  });

  if (openedSample) {
    void vscode.window.showInformationMessage('Opening DevStories sample workspace...');
    return;
  }

  await tutorialPanel.show();
}
