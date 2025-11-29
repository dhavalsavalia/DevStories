import { describe, expect, it, vi } from 'vitest';
import {
    getTutorialWorkspaceOptions,
    handleWorkspaceSelection,
    TutorialWorkspaceOption,
} from '../../commands/startTutorialUtils';

describe('startTutorialUtils', () => {
  it('exposes current workspace and sample workspace options', () => {
    const options = getTutorialWorkspaceOptions('DevStories', '/sample/path');

    const ids = options.map((option) => option.id);
    expect(ids).toContain('current');
    expect(ids).toContain('sample');
    expect(ids).toContain('reset');

    const sample = options.find((option) => option.id === 'sample');
    expect(sample?.path).toBe('/sample/path');
  });

  it('opens sample workspace when sample option selected', async () => {
    const openFolder = vi.fn().mockResolvedValue(undefined);
    const option: TutorialWorkspaceOption = {
      id: 'sample',
      label: 'Sample',
      description: '',
      path: '/tmp/workspace',
    };

    const didOpen = await handleWorkspaceSelection(option, openFolder);

    expect(didOpen).toBe(true);
    expect(openFolder).toHaveBeenCalledWith('/tmp/workspace');
  });
});
