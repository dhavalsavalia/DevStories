/**
 * Board View Webview Script
 * Handles communication with extension and state management
 */

(function () {
  // @ts-check
  // eslint-disable-next-line no-undef
  const vscode = acquireVsCodeApi();

  // State management
  let state = vscode.getState() || {
    stories: [],
    epics: [],
    statuses: [],
    theme: 'dark',
    currentSprint: null,
    scrollPosition: 0,
  };

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
    // Persist scroll position
    if (boardEl) {
      state.scrollPosition = boardEl.scrollTop;
    }
    vscode.setState(state);
  }

  /**
   * Render the board view
   * DS-019: Placeholder - full kanban implementation in DS-020
   */
  function renderBoard() {
    if (!loadingEl || !boardEl) return;

    loadingEl.style.display = 'none';
    boardEl.style.display = 'block';

    const storyCount = state.stories.length;
    const epicCount = state.epics.length;
    const statusCount = state.statuses.length;

    // Group stories by status for count display
    const statusCounts = {};
    state.statuses.forEach((s) => {
      statusCounts[s.id] = 0;
    });
    state.stories.forEach((story) => {
      if (statusCounts[story.status] !== undefined) {
        statusCounts[story.status]++;
      }
    });

    const statusSummary = state.statuses
      .map((s) => `${s.label}: ${statusCounts[s.id] || 0}`)
      .join(' | ');

    boardEl.innerHTML = `
      <div class="board-placeholder">
        <h2>Board View</h2>
        <div class="stats">
          ${storyCount} stories across ${epicCount} epics
        </div>
        <div class="stats">
          ${statusCount} columns: ${statusSummary}
        </div>
        <div class="info">
          Kanban board coming in DS-020
        </div>
      </div>
    `;

    // Restore scroll position
    if (state.scrollPosition) {
      boardEl.scrollTop = state.scrollPosition;
    }
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
