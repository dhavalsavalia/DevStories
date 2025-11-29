import * as path from 'path';

export function getWelcomeAssetFilePath(extensionPath: string, assetName: string): string {
  return path.join(extensionPath, 'dist', 'webview', assetName);
}
