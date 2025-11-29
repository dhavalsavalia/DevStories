export interface WelcomeHtmlOptions {
  cssHref: string;
  scriptSrc: string;
  heroSrc: string;
  csp: string;
  theme: string;
  nonce: string;
}

export function getWelcomeHtml(options: WelcomeHtmlOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${options.csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${options.cssHref}">
  <title>Welcome to DevStories</title>
</head>
<body data-theme="${options.theme}">
  <div class="welcome-root">
    <section class="welcome-hero">
      <div class="welcome-hero__text">
        <p class="eyebrow">First Run Experience</p>
        <h1>Ship stories within minutes</h1>
        <p class="subhead">
          DevStories bootstraps epics, rituals, and a focused kanban board so you can ship solo with confidence.
        </p>
      </div>
      <div class="welcome-hero__art">
        <img src="${options.heroSrc}" alt="DevStories board preview" />
      </div>
    </section>
    <section class="welcome-meta">
      <article class="meta-card">
        <header>
          <p class="eyebrow">Recent Changes</p>
          <h2>What shipped lately</h2>
        </header>
        <ul id="release-notes" class="release-notes" aria-live="polite"></ul>
      </article>
      <article class="meta-card meta-card--actions">
        <header>
          <p class="eyebrow">Docs & Tutorials</p>
          <h2>Keep learning</h2>
        </header>
        <p class="subhead">Open guides, screenshots, and sample workspaces without leaving VS Code.</p>
        <div class="button-row">
          <button id="open-docs" class="primary">Docs & Tutorials</button>
          <button id="dismiss-welcome" class="ghost">Dismiss</button>
        </div>
      </article>
    </section>
    <section id="welcome-content" class="welcome-grid" aria-live="polite"></section>
  </div>
  <script nonce="${options.nonce}" src="${options.scriptSrc}"></script>
</body>
</html>`;
}
