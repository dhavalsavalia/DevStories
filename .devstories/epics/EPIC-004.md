---
id: EPIC-004
title: "Phase 4: Links"
status: done
sprint: phase-4
created: 2025-11-26
updated: 2025-11-28
---

# Phase 4: Links

## Description
Wiki-style linking system with `[[ID]]` syntax for connecting stories. Includes validation, navigation, hover previews, and backlinks tracking.

## Key Value Adds
- **Autocomplete**: Type `[[` and see suggestions
- **Broken link detection**: Visual warnings for invalid references
- **Backlinks panel**: See what references the current story
- **Rich hover previews**: Story details without leaving context

## Deliverables
- Link detection regex with validation
- DocumentLinkProvider for clickable navigation
- HoverProvider for inline previews
- Backlinks index and panel

## Stories
- [[DS-016]] - Link Detection + Validation
- [[DS-017]] - Clickable Links + Navigation
- [[DS-018]] - Hover Preview + Backlinks

## Notes
- Backlinks index built once, updated incrementally on file change
- Consider link autocomplete as high-value enhancement
