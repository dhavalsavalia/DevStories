/**
 * Board View Webview Script
 * Handles communication with extension and state management
 * DS-020: Kanban board rendering
 * DS-021: Drag-drop + keyboard navigation
 * DS-023: Filter bar + quick filters
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

  // DS-023: Default filter state
  const DEFAULT_FILTERS = {
    sprint: null,
    epic: null,
    type: null,
    assignee: null,
    search: '',
  };

  // State management - merge with defaults to handle missing properties from older versions
  const defaultState = {
    stories: [],
    epics: [],
    statuses: [],
    sprints: [],  // DS-023
    theme: 'dark',
    currentSprint: null,
    scrollPosition: 0,
    columnScrollPositions: {},
    // DS-021: Focus state
    focusedCardId: null,
    focusedColumnIndex: 0,
    // DS-023: Filter state
    filters: { ...DEFAULT_FILTERS },
  };
  let state = { ...defaultState, ...(vscode.getState() || {}) };
  // Ensure filters object exists (migration from older state)
  if (!state.filters) {
    state.filters = { ...DEFAULT_FILTERS };
  }

  // DS-021: Track pending updates for optimistic UI
  const pendingUpdates = new Map();

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
      // DS-021: Handle update failure for rollback
      case 'updateFailed':
        handleUpdateFailed(message.payload);
        break;
    }
  });

  // DS-021: Listen for keyboard events
  document.addEventListener('keydown', handleKeydown);

  /**
   * Handle init message - load all data
   */
  function handleInit(payload) {
    state = {
      ...state,
      stories: payload.stories || [],
      epics: payload.epics || [],
      statuses: payload.statuses || [],
      sprints: payload.sprints || [],  // DS-023
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

    const storyId = payload.story.id;
    const index = state.stories.findIndex((s) => s.id === storyId);
    if (index >= 0) {
      state.stories[index] = payload.story;
    } else {
      state.stories.push(payload.story);
    }

    // DS-021: Clear pending update on success
    if (pendingUpdates.has(storyId)) {
      pendingUpdates.delete(storyId);
      // Add animation class to show successful move
      const cardEl = document.querySelector(`.card[data-id="${storyId}"]`);
      if (cardEl) {
        cardEl.classList.add('just-moved');
        setTimeout(() => cardEl.classList.remove('just-moved'), 200);
      }
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
   * DS-021: Handle update failure - rollback optimistic update
   */
  function handleUpdateFailed(payload) {
    const { storyId, originalStatus, error } = payload;

    // Find and rollback the story
    const story = state.stories.find((s) => s.id === storyId);
    if (story && originalStatus) {
      story.status = originalStatus;
    }

    // Clear pending update
    pendingUpdates.delete(storyId);

    // Show error animation on card
    const cardEl = document.querySelector(`.card[data-id="${storyId}"]`);
    if (cardEl) {
      cardEl.classList.add('update-failed');
      setTimeout(() => cardEl.classList.remove('update-failed'), 300);
    }

    // Re-render to show rollback
    saveState();
    renderBoard();

    // Log error for debugging
    console.error('Status update failed:', error);
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
   * DS-023: Filter bar + filtered stories
   */
  function renderBoard() {
    if (!loadingEl || !boardEl) return;

    loadingEl.style.display = 'none';
    boardEl.style.display = 'flex';

    // DS-023: Apply filters
    const filteredStories = filterStories(state.stories, state.filters);

    // Group stories by status
    const storiesByStatus = groupStoriesByStatus(filteredStories, state.statuses);

    // Build filter bar HTML (DS-023)
    const filterBarHtml = renderFilterBar();

    // Build columns HTML
    const columnsHtml = state.statuses
      .map((status) => renderColumn(status, storiesByStatus[status.id] || []))
      .join('');

    boardEl.innerHTML = `
      ${filterBarHtml}
      <div class="board-content">
        <div class="board-container">${columnsHtml}</div>
      </div>
    `;

    // DS-023: Attach filter event handlers
    attachFilterHandlers();

    // Attach click handlers for cards
    boardEl.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', () => {
        const storyId = card.getAttribute('data-id');
        if (storyId) {
          window.boardApi.openStory(storyId);
        }
      });
    });

    // DS-021: Attach drag handlers to cards
    boardEl.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragend', handleDragEnd);
    });

    // DS-021: Attach drop handlers to columns
    boardEl.querySelectorAll('.column').forEach((column) => {
      column.addEventListener('dragover', handleDragOver);
      column.addEventListener('dragleave', handleDragLeave);
      column.addEventListener('drop', handleDrop);
    });

    // Restore scroll positions
    const boardContent = boardEl.querySelector('.board-content');
    if (state.scrollPosition && boardContent) {
      const container = boardContent.querySelector('.board-container');
      if (container) {
        container.scrollLeft = state.scrollPosition;
      }
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

  // === DS-023: Filter Functions ===

  /**
   * Render filter bar HTML
   */
  function renderFilterBar() {
    const hasFilters = hasActiveFilters();
    const filterCount = countActiveFilters();

    return `
      <div class="filter-bar">
        <div class="filter-row">
          ${renderSprintFilter()}
          ${renderEpicFilter()}
          ${renderTypeFilter()}
          <input type="text"
                 class="filter-search"
                 id="filter-search"
                 placeholder="🔍 Search..."
                 value="${escapeHtml(state.filters.search || '')}">
          <button class="filter-clear" id="filter-clear" ${hasFilters ? '' : 'disabled'}>
            Clear${filterCount > 0 ? ` <span class="filter-count">${filterCount}</span>` : ''}
          </button>
        </div>
        <div class="filter-row quick-filters">
          ${renderQuickFilters()}
        </div>
      </div>
    `;
  }

  /**
   * Render sprint filter dropdown
   */
  function renderSprintFilter() {
    const options = state.sprints.map((sprint) => {
      const selected = state.filters.sprint === sprint ? 'selected' : '';
      return `<option value="${escapeHtml(sprint)}" ${selected}>${escapeHtml(sprint)}</option>`;
    }).join('');

    return `
      <select class="filter-select" id="filter-sprint">
        <option value="">All Sprints</option>
        ${options}
      </select>
    `;
  }

  /**
   * Render epic filter dropdown
   */
  function renderEpicFilter() {
    const options = state.epics.map((epic) => {
      const selected = state.filters.epic === epic.id ? 'selected' : '';
      return `<option value="${escapeHtml(epic.id)}" ${selected}>${escapeHtml(epic.id)}: ${escapeHtml(epic.title)}</option>`;
    }).join('');

    return `
      <select class="filter-select" id="filter-epic">
        <option value="">All Epics</option>
        ${options}
      </select>
    `;
  }

  /**
   * Render type filter dropdown
   */
  function renderTypeFilter() {
    const types = ['feature', 'bug', 'task', 'chore'];
    const options = types.map((type) => {
      const selected = state.filters.type === type ? 'selected' : '';
      const icon = TYPE_ICONS[type] || '📄';
      return `<option value="${type}" ${selected}>${icon} ${type}</option>`;
    }).join('');

    return `
      <select class="filter-select" id="filter-type">
        <option value="">All Types</option>
        ${options}
      </select>
    `;
  }

  /**
   * Render quick filter chips
   */
  function renderQuickFilters() {
    const bugsActive = state.filters.type === 'bug';
    const unassignedActive = state.filters.assignee === '';
    const featuresActive = state.filters.type === 'feature';

    return `
      <button class="filter-chip${bugsActive ? ' active' : ''}" data-quick="bugs">
        🐛 Bugs
      </button>
      <button class="filter-chip${featuresActive ? ' active' : ''}" data-quick="features">
        ✨ Features
      </button>
      <button class="filter-chip${unassignedActive ? ' active' : ''}" data-quick="unassigned">
        👤 Unassigned
      </button>
    `;
  }

  /**
   * Attach event handlers to filter elements
   */
  function attachFilterHandlers() {
    // Sprint filter
    const sprintEl = document.getElementById('filter-sprint');
    if (sprintEl) {
      sprintEl.addEventListener('change', (e) => {
        state.filters.sprint = e.target.value || null;
        onFilterChanged();
      });
    }

    // Epic filter
    const epicEl = document.getElementById('filter-epic');
    if (epicEl) {
      epicEl.addEventListener('change', (e) => {
        state.filters.epic = e.target.value || null;
        onFilterChanged();
      });
    }

    // Type filter
    const typeEl = document.getElementById('filter-type');
    if (typeEl) {
      typeEl.addEventListener('change', (e) => {
        state.filters.type = e.target.value || null;
        onFilterChanged();
      });
    }

    // Search input (debounced)
    const searchEl = document.getElementById('filter-search');
    if (searchEl) {
      let searchTimeout;
      searchEl.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.filters.search = e.target.value || '';
          onFilterChanged();
        }, 150);
      });
    }

    // Clear button
    const clearEl = document.getElementById('filter-clear');
    if (clearEl) {
      clearEl.addEventListener('click', () => {
        state.filters = { ...DEFAULT_FILTERS };
        onFilterChanged();
      });
    }

    // Quick filter chips
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const quick = chip.getAttribute('data-quick');
        handleQuickFilter(quick);
      });
    });
  }

  /**
   * Handle quick filter chip click
   */
  function handleQuickFilter(quick) {
    switch (quick) {
      case 'bugs':
        // Toggle bugs filter
        state.filters.type = state.filters.type === 'bug' ? null : 'bug';
        break;
      case 'features':
        // Toggle features filter
        state.filters.type = state.filters.type === 'feature' ? null : 'feature';
        break;
      case 'unassigned':
        // Toggle unassigned filter
        state.filters.assignee = state.filters.assignee === '' ? null : '';
        break;
    }
    onFilterChanged();
  }

  /**
   * Called when filter state changes
   */
  function onFilterChanged() {
    saveState();
    renderBoard();

    // Notify extension of filter change
    vscode.postMessage({
      type: 'filterChanged',
      payload: state.filters,
    });
  }

  /**
   * Filter stories based on current filter state
   */
  function filterStories(stories, filters) {
    return stories.filter((story) => {
      // Sprint filter
      if (filters.sprint !== null && story.sprint !== filters.sprint) {
        return false;
      }

      // Epic filter
      if (filters.epic !== null && story.epic !== filters.epic) {
        return false;
      }

      // Type filter
      if (filters.type !== null && story.type !== filters.type) {
        return false;
      }

      // Assignee filter
      if (filters.assignee !== null) {
        if (filters.assignee === '' && story.assignee) {
          return false;
        }
        if (filters.assignee !== '' && story.assignee !== filters.assignee) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = story.title.toLowerCase().includes(searchLower);
        const idMatch = story.id.toLowerCase().includes(searchLower);
        if (!titleMatch && !idMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Check if any filter is active
   */
  function hasActiveFilters() {
    return (
      state.filters.sprint !== null ||
      state.filters.epic !== null ||
      state.filters.type !== null ||
      state.filters.assignee !== null ||
      state.filters.search !== ''
    );
  }

  /**
   * Count active filters
   */
  function countActiveFilters() {
    let count = 0;
    if (state.filters.sprint !== null) count++;
    if (state.filters.epic !== null) count++;
    if (state.filters.type !== null) count++;
    if (state.filters.assignee !== null) count++;
    if (state.filters.search !== '') count++;
    return count;
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
   * DS-021: Added draggable, data-status, focused class
   */
  function renderCard(story) {
    const typeIcon = TYPE_ICONS[story.type] || '📄';
    const epicName = getEpicName(story.epic);
    const depsCount = story.dependencies ? story.dependencies.length : 0;
    const depsHtml =
      depsCount > 0 ? `<span class="deps-count">🔗 ${depsCount}</span>` : '';
    const focusedClass = state.focusedCardId === story.id ? ' focused' : '';

    return `
      <div class="card${focusedClass}" draggable="true" data-id="${escapeHtml(story.id)}" data-type="${escapeHtml(story.type)}" data-status="${escapeHtml(story.status)}" tabindex="0">
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

  // === DS-021: Drag-Drop Handlers ===

  let draggedCard = null;
  let draggedStoryId = null;
  let originalStatus = null;

  /**
   * Handle drag start
   */
  function handleDragStart(e) {
    draggedCard = e.target;
    draggedStoryId = e.target.getAttribute('data-id');
    originalStatus = e.target.getAttribute('data-status');

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedStoryId);

    // Add dragging class after a short delay for visual feedback
    setTimeout(() => {
      if (draggedCard) {
        draggedCard.classList.add('dragging');
      }
    }, 0);
  }

  /**
   * Handle drag end
   */
  function handleDragEnd() {
    if (draggedCard) {
      draggedCard.classList.remove('dragging');
    }

    // Clear all drag-over highlights
    document.querySelectorAll('.column.drag-over').forEach((col) => {
      col.classList.remove('drag-over');
    });

    draggedCard = null;
    draggedStoryId = null;
    originalStatus = null;
  }

  /**
   * Handle drag over column
   */
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const column = e.target.closest('.column');
    if (column) {
      const targetStatus = column.getAttribute('data-status');
      // Only highlight if dropping to different column
      if (targetStatus !== originalStatus) {
        column.classList.add('drag-over');
      }
    }
  }

  /**
   * Handle drag leave column
   */
  function handleDragLeave(e) {
    const column = e.target.closest('.column');
    // Only remove highlight if leaving the column entirely
    if (column && !column.contains(e.relatedTarget)) {
      column.classList.remove('drag-over');
    }
  }

  /**
   * Handle drop on column
   */
  function handleDrop(e) {
    e.preventDefault();

    const column = e.target.closest('.column');
    if (!column || !draggedStoryId) return;

    const newStatus = column.getAttribute('data-status');
    column.classList.remove('drag-over');

    // Don't do anything if dropped on same column
    if (newStatus === originalStatus) return;

    // Optimistic update: immediately update local state
    const story = state.stories.find((s) => s.id === draggedStoryId);
    if (story) {
      // Store original for rollback
      pendingUpdates.set(draggedStoryId, originalStatus);

      // Update locally
      story.status = newStatus;
      saveState();
      renderBoard();

      // Send to extension
      window.boardApi.updateStatus(draggedStoryId, newStatus);
    }
  }

  // === DS-021: Keyboard Navigation ===

  /**
   * Handle keyboard events for navigation
   */
  function handleKeydown(e) {
    // Only handle if board is visible
    if (!boardEl || boardEl.style.display === 'none') return;

    const storiesByStatus = groupStoriesByStatus(state.stories, state.statuses);
    const totalColumns = state.statuses.length;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        navigateVertical(1, storiesByStatus);
        break;

      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        navigateVertical(-1, storiesByStatus);
        break;

      case 'l':
      case 'ArrowRight':
        e.preventDefault();
        navigateHorizontal(1, storiesByStatus, totalColumns);
        break;

      case 'h':
      case 'ArrowLeft':
        e.preventDefault();
        navigateHorizontal(-1, storiesByStatus, totalColumns);
        break;

      case 'Enter':
        e.preventDefault();
        if (state.focusedCardId) {
          window.boardApi.openStory(state.focusedCardId);
        }
        break;

      case ' ': // Space - advance status
        e.preventDefault();
        advanceFocusedCardStatus();
        break;

      case '1':
      case '2':
      case '3':
      case '4':
        // Jump to column by number
        e.preventDefault();
        jumpToColumn(parseInt(e.key) - 1, storiesByStatus);
        break;
    }
  }

  /**
   * Navigate up/down within column
   */
  function navigateVertical(direction, storiesByStatus) {
    if (!state.focusedCardId) {
      // Focus first card in first non-empty column
      focusFirstAvailableCard(storiesByStatus);
      return;
    }

    const currentStory = state.stories.find((s) => s.id === state.focusedCardId);
    if (!currentStory) return;

    const columnStories = storiesByStatus[currentStory.status] || [];
    const currentIndex = columnStories.findIndex(
      (s) => s.id === state.focusedCardId
    );

    if (currentIndex === -1 || columnStories.length <= 1) return;

    // Calculate next index with wrap
    const newIndex =
      direction > 0
        ? (currentIndex + 1) % columnStories.length
        : (currentIndex - 1 + columnStories.length) % columnStories.length;

    setFocusedCard(columnStories[newIndex].id);
  }

  /**
   * Navigate left/right between columns
   */
  function navigateHorizontal(direction, storiesByStatus, totalColumns) {
    const currentColumnIndex = state.focusedColumnIndex || 0;
    let newColumnIndex =
      direction > 0
        ? (currentColumnIndex + 1) % totalColumns
        : (currentColumnIndex - 1 + totalColumns) % totalColumns;

    // Find first non-empty column in the direction
    let attempts = 0;
    while (attempts < totalColumns) {
      const newStatus = state.statuses[newColumnIndex]?.id;
      const columnStories = storiesByStatus[newStatus] || [];

      if (columnStories.length > 0) {
        state.focusedColumnIndex = newColumnIndex;
        setFocusedCard(columnStories[0].id);
        return;
      }

      // Try next column in same direction
      newColumnIndex =
        direction > 0
          ? (newColumnIndex + 1) % totalColumns
          : (newColumnIndex - 1 + totalColumns) % totalColumns;
      attempts++;
    }

    // No cards found, just update column index
    state.focusedColumnIndex = newColumnIndex;
    state.focusedCardId = null;
    saveState();
    renderBoard();
  }

  /**
   * Jump to a specific column by index (1-4 keys)
   */
  function jumpToColumn(columnIndex, storiesByStatus) {
    if (columnIndex < 0 || columnIndex >= state.statuses.length) return;

    const status = state.statuses[columnIndex];
    const columnStories = storiesByStatus[status.id] || [];

    state.focusedColumnIndex = columnIndex;
    if (columnStories.length > 0) {
      setFocusedCard(columnStories[0].id);
    } else {
      state.focusedCardId = null;
      saveState();
      renderBoard();
    }
  }

  /**
   * Focus first available card in any column
   */
  function focusFirstAvailableCard(storiesByStatus) {
    for (let i = 0; i < state.statuses.length; i++) {
      const status = state.statuses[i];
      const columnStories = storiesByStatus[status.id] || [];
      if (columnStories.length > 0) {
        state.focusedColumnIndex = i;
        setFocusedCard(columnStories[0].id);
        return;
      }
    }
  }

  /**
   * Set focused card and re-render
   */
  function setFocusedCard(cardId) {
    state.focusedCardId = cardId;
    saveState();
    renderBoard();

    // Scroll focused card into view
    const cardEl = document.querySelector(`.card[data-id="${cardId}"]`);
    if (cardEl) {
      cardEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      cardEl.focus();
    }
  }

  /**
   * Advance focused card to next status (Space key)
   */
  function advanceFocusedCardStatus() {
    if (!state.focusedCardId) return;

    const story = state.stories.find((s) => s.id === state.focusedCardId);
    if (!story) return;

    const currentStatusIndex = state.statuses.findIndex(
      (s) => s.id === story.status
    );
    if (currentStatusIndex === -1 || currentStatusIndex >= state.statuses.length - 1) {
      // Already at last status, can't advance
      return;
    }

    const newStatus = state.statuses[currentStatusIndex + 1].id;
    const originalStatus = story.status;

    // Optimistic update
    pendingUpdates.set(state.focusedCardId, originalStatus);
    story.status = newStatus;
    saveState();
    renderBoard();

    // Send to extension
    window.boardApi.updateStatus(state.focusedCardId, newStatus);
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
    setFilter(filters) {
      state.filters = { ...DEFAULT_FILTERS, ...filters };
      onFilterChanged();
    },

    /**
     * Clear all filters (DS-023)
     */
    clearFilters() {
      state.filters = { ...DEFAULT_FILTERS };
      onFilterChanged();
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
