/**
 * Board View Webview Script
 * Handles communication with extension and state management
 * DS-020: Kanban board rendering
 */

(function () {
  // @ts-check
  // eslint-disable-next-line no-undef
  const vscode = acquireVsCodeApi();

  // Type icons for story types
  const TYPE_ICONS = {
    feature: '✨',
    bug: '🐛',
    task: '🔧',
    chore: '🧹',
  };

  // State management - merge with defaults to handle missing properties from older versions
  const defaultState = {
    stories: [],
    epics: [],
    statuses: [],
    theme: 'dark',
    currentSprint: null,
    scrollPosition: 0,
    columnScrollPositions: {},
  };
  let state = { ...defaultState, ...(vscode.getState() || {}) };

  // DOM elements
  const loadingEl = document.getElementById('loading');
  const boardEl = document.getElementById('board');
  const errorEl = document.getElementById('error');

  // Listen for messages from extension
  window.addEventListener('message', (event) => {
    const message = event.data;

    switch (message.type) {
      case 'init':
        handleInit(message.payload);
        break;
      case 'storyUpdated':
        handleStoryUpdated(message.payload);
        break;
      case 'storyDeleted':
        handleStoryDeleted(message.payload);
        break;
      case 'themeChanged':
        handleThemeChanged(message.payload);
        break;
    }
  });

  /**
   * Handle init message - load all data
   */
  function handleInit(payload) {
    state = {
      ...state,
      stories: payload.stories || [],
      epics: payload.epics || [],
      statuses: payload.statuses || [],
      theme: payload.theme || 'dark',
      currentSprint: payload.currentSprint || null,
    };

    saveState();
    renderBoard();

    // Signal ready to extension
    vscode.postMessage({ type: 'ready' });
  }

  /**
   * Handle story update - update or add story
   */
  function handleStoryUpdated(payload) {
    if (!payload.story) return;

    const index = state.stories.findIndex((s) => s.id === payload.story.id);
    if (index >= 0) {
      state.stories[index] = payload.story;
    } else {
      state.stories.push(payload.story);
    }
    saveState();
    renderBoard();
  }

  /**
   * Handle story deletion
   */
  function handleStoryDeleted(payload) {
    if (!payload.id) return;

    state.stories = state.stories.filter((s) => s.id !== payload.id);
    saveState();
    renderBoard();
  }

  /**
   * Handle theme change
   */
  function handleThemeChanged(payload) {
    state.theme = payload.kind || 'dark';
    // Theme CSS variables update automatically via VS Code
    saveState();
  }

  /**
   * Save state for persistence across reloads
   */
  function saveState() {
    // Persist board scroll position
    if (boardEl) {
      state.scrollPosition = boardEl.scrollLeft;
    }
    // Persist column scroll positions
    const columns = document.querySelectorAll('.column-body');
    columns.forEach((col) => {
      const statusId = col.getAttribute('data-status');
      if (statusId) {
        state.columnScrollPositions[statusId] = col.scrollTop;
      }
    });
    vscode.setState(state);
  }

  /**
   * Render the kanban board
   * DS-020: Full kanban implementation
   */
  function renderBoard() {
    if (!loadingEl || !boardEl) return;

    loadingEl.style.display = 'none';
    boardEl.style.display = 'block';

    // Group stories by status
    const storiesByStatus = groupStoriesByStatus(state.stories, state.statuses);

    // Build columns HTML
    const columnsHtml = state.statuses
      .map((status) => renderColumn(status, storiesByStatus[status.id] || []))
      .join('');

    boardEl.innerHTML = `<div class="board-container">${columnsHtml}</div>`;

    // Attach click handlers for cards
    boardEl.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', () => {
        const storyId = card.getAttribute('data-id');
        if (storyId) {
          window.boardApi.openStory(storyId);
        }
      });
    });

    // Restore scroll positions
    if (state.scrollPosition) {
      boardEl.querySelector('.board-container').scrollLeft = state.scrollPosition;
    }
    if (state.columnScrollPositions) {
      document.querySelectorAll('.column-body').forEach((col) => {
        const statusId = col.getAttribute('data-status');
        if (statusId && state.columnScrollPositions[statusId]) {
          col.scrollTop = state.columnScrollPositions[statusId];
        }
      });
    }
  }

  /**
   * Group stories by status ID
   */
  function groupStoriesByStatus(stories, statuses) {
    const grouped = {};
    statuses.forEach((s) => {
      grouped[s.id] = [];
    });
    stories.forEach((story) => {
      if (grouped[story.status]) {
        grouped[story.status].push(story);
      }
    });
    return grouped;
  }

  /**
   * Render a single column
   */
  function renderColumn(status, stories) {
    const count = stories.length;
    const cardsHtml =
      stories.length > 0
        ? stories.map((story) => renderCard(story)).join('')
        : '<div class="column-empty">No stories</div>';

    return `
      <div class="column" data-status="${escapeHtml(status.id)}">
        <div class="column-header">
          <div class="column-title">${escapeHtml(status.label)}</div>
          <span class="column-count">${count}</span>
        </div>
        <div class="column-body" data-status="${escapeHtml(status.id)}">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Render a single card
   */
  function renderCard(story) {
    const typeIcon = TYPE_ICONS[story.type] || '📄';
    const epicName = getEpicName(story.epic);
    const depsCount = story.dependencies ? story.dependencies.length : 0;
    const depsHtml =
      depsCount > 0 ? `<span class="deps-count">🔗 ${depsCount}</span>` : '';

    return `
      <div class="card" data-id="${escapeHtml(story.id)}" data-type="${escapeHtml(story.type)}">
        <div class="card-header">
          <span class="card-id">
            <span class="type-icon">${typeIcon}</span>
            ${escapeHtml(story.id)}
          </span>
          <span class="size-badge">${escapeHtml(story.size)}</span>
        </div>
        <div class="card-title">${escapeHtml(story.title)}</div>
        <div class="card-footer">
          <span class="epic-name">${escapeHtml(epicName)}</span>
          ${depsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Get epic name by ID
   */
  function getEpicName(epicId) {
    const epic = state.epics.find((e) => e.id === epicId);
    return epic ? epic.title : epicId;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Show error state
   */
  function showError(message) {
    if (!loadingEl || !errorEl) return;

    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = message;

    vscode.postMessage({
      type: 'error',
      payload: { message },
    });
  }

  /**
   * API for future features (DS-020+)
   * Exposed on window for use by kanban implementation
   */
  window.boardApi = {
    /**
     * Update story status (DS-021, DS-022)
     */
    updateStatus(storyId, newStatus) {
      vscode.postMessage({
        type: 'updateStatus',
        payload: { storyId, newStatus },
      });
    },

    /**
     * Open story file in editor
     */
    openStory(id) {
      vscode.postMessage({
        type: 'openStory',
        payload: { id },
      });
    },

    /**
     * Set filter (DS-023)
     */
    setFilter(sprint, epic) {
      vscode.postMessage({
        type: 'filterChanged',
        payload: { sprint, epic },
      });
    },

    /**
     * Get current state
     */
    getState() {
      return { ...state };
    },
  };

  // Error boundary
  window.onerror = function (message) {
    showError(`Error: ${message}`);
    return true;
  };
})();
