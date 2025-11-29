(function () {
  const vscode = acquireVsCodeApi();

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'welcome:init':
        applyTheme(message.payload.theme);
        renderSections(message.payload.sections);
        renderReleaseNotes(message.payload.releaseNotes);
        break;
      case 'welcome:themeChanged':
        applyTheme(message.payload.kind);
        break;
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest('[data-action-id]');
    if (button) {
      vscode.postMessage({ type: 'runCommand', payload: { actionId: button.dataset.actionId } });
      return;
    }

    if (target.id === 'open-docs') {
      vscode.postMessage({ type: 'openDocs' });
    }

    if (target.id === 'dismiss-welcome') {
      vscode.postMessage({ type: 'dismiss' });
    }
  });

  vscode.postMessage({ type: 'ready' });

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
  }

  function renderSections(sections) {
    const container = document.getElementById('welcome-content');
    if (!container) {
      return;
    }

    container.innerHTML = sections
      .map((section) => {
        const cards = section.actions
          .map(
            (action) => `
          <article class="action-card">
            <div class="action-card__icon">${getIcon(action.icon)}</div>
            <h3 class="action-card__title">${escapeHtml(action.label)}</h3>
            <p class="action-card__description">${escapeHtml(action.description)}</p>
            <button data-action-id="${action.id}">Run Action</button>
          </article>
        `
          )
          .join('');

        return `
          <div class="section">
            <p class="eyebrow">${escapeHtml(section.title)}</p>
            ${cards}
          </div>
        `;
      })
      .join('');
  }

  function renderReleaseNotes(notes) {
    const list = document.getElementById('release-notes');
    if (!list) {
      return;
    }

    if (!notes || notes.length === 0) {
      list.innerHTML = '<li>Welcome improvements shipped recently.</li>';
      return;
    }

    list.innerHTML = notes
      .map((note) => `<li>${escapeHtml(note)}</li>`)
      .join('');
  }

  function getIcon(name) {
    switch (name) {
      case 'rocket':
        return '🚀';
      case 'layout':
        return '🗂️';
      case 'note':
        return '📝';
      case 'milestone':
        return '🎯';
      case 'tasklist':
        return '✅';
      case 'calendar':
        return '📅';
      case 'settings-gear':
        return '⚙️';
      case 'snippet':
        return '📄';
      default:
        return '✨';
    }
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
