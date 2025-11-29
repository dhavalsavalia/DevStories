(function () {
  const vscode = acquireVsCodeApi();
  let currentTheme = 'light';
  let steps = [];

  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'tutorial:init':
      case 'tutorial:update':
        renderTutorial(message.payload);
        break;
      case 'tutorial:themeChanged':
        applyTheme(message.payload.kind);
        updateMedia();
        break;
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
      return;
    }

    const stepId = target.dataset.stepId;
    if (!stepId) {
      return;
    }

    vscode.postMessage({ type: 'tutorial:toggleStep', payload: { stepId, completed: target.checked } });
  });

  document.addEventListener('click', (event) => {
    const element = event.target;
    if (!(element instanceof HTMLElement)) {
      return;
    }

    const ctaButton = element.closest('[data-cta-command]');
    if (ctaButton instanceof HTMLElement) {
      const commandId = ctaButton.dataset.ctaCommand;
      if (commandId) {
        vscode.postMessage({ type: 'tutorial:runCommand', payload: { commandId } });
      }
      return;
    }

    if (element.id === 'reset-progress') {
      vscode.postMessage({ type: 'tutorial:reset' });
    }

    if (element.id === 'open-sample') {
      vscode.postMessage({ type: 'tutorial:openSample' });
    }
  });

  vscode.postMessage({ type: 'tutorial:ready' });

  function renderTutorial(payload) {
    steps = payload.steps;
    applyTheme(payload.theme);
    renderProgress(payload.progress);
    renderSteps(payload.steps);
    updateMedia();
    updateSampleButton(payload.sampleWorkspaceLabel);
  }

  function applyTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
  }

  function renderProgress(progress) {
    const label = document.getElementById('progress-label');
    const summary = document.getElementById('progress-summary');
    const percentLabel = document.getElementById('progress-percent');
    const indicator = document.querySelector('.progress-ring .indicator');

    if (label) {
      label.textContent = `${progress.percentage}% Complete`;
    }

    if (summary) {
      summary.textContent = `${progress.completedCount} of ${progress.totalCount} steps checked off.`;
    }

    if (percentLabel) {
      percentLabel.textContent = `${progress.percentage}%`;
    }

    if (indicator) {
      const circumference = 2 * Math.PI * 54;
      const offset = circumference - (progress.percentage / 100) * circumference;
      indicator.setAttribute('stroke-dasharray', circumference.toString());
      indicator.setAttribute('stroke-dashoffset', offset.toString());
    }
  }

  function renderSteps(stepList) {
    const container = document.getElementById('tutorial-steps');
    if (!container) {
      return;
    }

    container.innerHTML = stepList
      .map((step, index) => {
        const instructions = step.instructions
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('');

        return `
          <article class="step-card" data-step-id="${step.id}">
            <header>
              <div>
                <p class="eyebrow">Step ${index + 1}</p>
                <h3>${escapeHtml(step.title)}</h3>
              </div>
              <label class="checkbox">
                <input type="checkbox" data-step-id="${step.id}" ${step.completed ? 'checked' : ''} />
                <span>Done</span>
              </label>
            </header>
            <p class="step-summary">${escapeHtml(step.summary)}</p>
            ${renderActions(step)}
            ${renderMedia(step)}
            <ol>${instructions}</ol>
          </article>
        `;
      })
      .join('');
  }

  function renderActions(step) {
    if (!step.cta || !step.ctaCommandId) {
      return '';
    }

    return `
      <div class="step-actions">
        <button data-cta-command="${step.ctaCommandId}">${escapeHtml(step.cta)}</button>
      </div>
    `;
  }

  function renderMedia(step) {
    if (!step.media) {
      return '';
    }

    return `
      <figure class="step-media">
        <img
          data-step-media="${step.id}"
          src="${getMediaSrc(step)}"
          alt="${escapeHtml(step.media.alt)}"
        />
      </figure>
    `;
  }

  function updateMedia() {
    steps.forEach((step) => {
      if (!step.media) {
        return;
      }
      const el = document.querySelector(`img[data-step-media="${step.id}"]`);
      if (el instanceof HTMLImageElement) {
        el.src = getMediaSrc(step);
      }
    });
  }

  function getMediaSrc(step) {
    if (!step.media) {
      return '';
    }
    return currentTheme === 'dark' ? step.media.dark : step.media.light;
  }

  function updateSampleButton(label) {
    const button = document.getElementById('open-sample');
    if (button) {
      button.textContent = `Open ${label}`;
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
