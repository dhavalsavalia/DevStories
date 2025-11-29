import { describe, it, expect } from 'vitest';
import { getWelcomeAssetFilePath } from '../../view/welcomeViewUtils';

describe('getWelcomeAssetFilePath', () => {
  it('should always resolve assets under dist/webview for offline use', () => {
    const result = getWelcomeAssetFilePath('/tmp/devstories', 'welcome.css');
    expect(result).toContain('/tmp/devstories/dist/webview/welcome.css');
  });
});
