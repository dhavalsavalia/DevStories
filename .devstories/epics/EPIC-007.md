---
id: EPIC-007
title: "Phase 7: Solo Dev Polish"
status: todo
created: 2025-11-29
updated: 2025-11-29
---

# Phase 7: Solo Dev Polish

## Description
Tighten the core DevStories experience for solo developers and tiny teams before investing in heavyweight sprint management. Focus on immediacy, frictionless capture-to-triage, lightweight assignment, and a responsive board so the extension stays fast and delightful.

## Key Value Adds
- **Sprint awareness everywhere**: Status bar + pickers keep people aligned without opening new views.
- **Live config feedback**: Changing statuses, templates, or sprints reflects instantly—critical when experimenting with AI-generated workflows.
- **Inbox zero for capture**: Quick Capture stays useful thanks to a first-class triage loop.
- **Assignment clarity**: Even a one-person shop (or AI pair) can see ownership and filter by it.
- **Board polish**: Subtle color, WIP signals, and saved filters make the board feel premium without bloat.
- **Story ID utilities**: Jumping to or validating stories is instant—even when AI drops IDs into code.
- **Faster sync**: Incremental updates keep the UI snappy, unlocking future planning UX.

## Deliverables
- Sprint-aware status bar with a picker that drives shared filters.
- Config/template watcher that rehydrates store + views automatically.
- Inbox triage command for Quick Capture backlog.
- Assignee command plus UI surfaces in tree + board.
- Board polish bundle: status colors, WIP indicators, saved filters, card metadata.
- Story ID utilities (open by ID, validate links with diagnostics).
- Incremental store → board diffing pipeline.

## Stories
- [[DS-034]] Sprint-aware status bar & picker
- [[DS-035]] Config + template live reload service
- [[DS-036]] Quick Capture inbox triage command
- [[DS-037]] Assignee command & surfaces
- [[DS-038]] Board polish: colors, WIP, saved filters
- [[DS-039]] Story ID utilities (open & validate)
- [[DS-040]] Incremental store → board updates

## Notes
- Keep performance top-of-mind; these changes should reduce latency, not add to it.
- Favor progressive enhancement: all upgrades should gracefully degrade if config data is missing.
- Tests should emphasize UX contracts (e.g., focus retention, immediate refresh) since these features exist to preserve flow.
