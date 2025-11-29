import { describe, it, expect } from 'vitest';
import { getWelcomeHtml, WelcomeHtmlOptions } from '../../view/welcomeViewTemplate';

function buildOptions(overrides: Partial<WelcomeHtmlOptions> = {}): WelcomeHtmlOptions {
  return {
    cssHref: 'vscode-resource://welcome.css',
    scriptSrc: 'vscode-resource://welcome.js',
    heroSrc: 'vscode-resource://hero.svg',
    csp: "default-src 'none'",
    theme: 'dark',
    nonce: 'abc123',
    ...overrides,
  };
}

describe('getWelcomeHtml', () => {
  it('should embed provided asset URIs for offline usage', () => {
    const html = getWelcomeHtml(buildOptions());
    expect(html).toContain('vscode-resource://welcome.css');
    expect(html).toContain('vscode-resource://welcome.js');
    expect(html).toContain('vscode-resource://hero.svg');
  });

  it('should mark body with theme data attribute for styling', () => {
    const html = getWelcomeHtml(buildOptions({ theme: 'light' }));
    expect(html).toContain('data-theme="light"');
  });
});
