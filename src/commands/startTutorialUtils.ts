export type TutorialWorkspaceOptionId = 'current' | 'sample' | 'reset';

export interface TutorialWorkspaceOption {
  id: TutorialWorkspaceOptionId;
  label: string;
  description: string;
  path?: string;
}

export function getTutorialWorkspaceOptions(workspaceName: string | undefined, samplePath: string): TutorialWorkspaceOption[] {
  const name = workspaceName ?? 'current workspace';
  return [
    {
      id: 'current',
      label: `Use ${name}`,
      description: 'Keep working inside the open workspace.',
    },
    {
      id: 'sample',
      label: 'Open sample workspace',
      description: 'Load the bundled test-workspace with prebuilt stories and cadence kit toggles.',
      path: samplePath,
    },
    {
      id: 'reset',
      label: 'Reset tutorial progress',
      description: 'Clear completion state for all steps.',
    },
  ];
}

export async function handleWorkspaceSelection(option: TutorialWorkspaceOption, openFolder: (path: string) => Promise<void>): Promise<boolean> {
  if (option.id === 'sample' && option.path) {
    await openFolder(option.path);
    return true;
  }
  return false;
}
