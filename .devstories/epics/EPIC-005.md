---
id: EPIC-005
title: "Phase 5: Board View"
status: todo
sprint: phase-5
created: 2025-11-26
updated: 2025-11-28
---

# Phase 5: Board View

## Description
Visual Kanban board in a VS Code webview with drag-drop, keyboard navigation, filters, and real-time sync with markdown files.

## Key Value Adds
- **VS Code theme integration**: Matches user's color scheme
- **Keyboard navigation**: Full vim-style navigation (j/k/h/l)
- **WIP limits**: Visual warnings when columns are overloaded
- **Swimlanes**: Optional epic-based grouping
- **Saved views**: Preset filter combinations

## Deliverables
- Webview infrastructure with bidirectional messaging
- Kanban UI with columns and cards
- Drag-drop with optimistic updates
- File writer with conflict detection
- Comprehensive filtering system

## Stories
- [[DS-019]] - Webview Foundation + Theme
- [[DS-020]] - Kanban Board UI
- [[DS-021]] - Drag-Drop + Keyboard Navigation
- [[DS-022]] - File Writer + Conflict Handling
- [[DS-023]] - Board Filters + Views

## Notes
- Webview is complex - consider using React or vanilla JS
- Theme integration critical for developer adoption
- Keyboard navigation makes this competitive with CLI tools
