---
id: EPIC-009
title: "Phase 9: Onboarding & Docs"
status: todo
created: 2025-11-29
updated: 2025-11-29
---

# Phase 9: Onboarding & Docs

## Description
Deliver a first-run experience, guided tutorials, and a polished documentation site so new users (and future v1 launch visitors) understand DevStories within minutes. This phase turns the extension into a self-explanatory product with beautiful visuals and evergreen docs.

## Goals
- Welcome every new install with an interactive startup page and quick actions.
- Provide in-editor tutorials that walk through setting up epics/stories, board, cadence kit, and Agile Solo Starter.
- Publish a Docusaurus site with detailed guides, screenshots, and versioned docs.
- Automate screenshot capture so docs stay fresh as UI evolves.
- Keep help accessible via commands/tooltips without overwhelming experienced users.

## Deliverables
- Welcome webview that launches on first activation (and lives under the DevStories view container).
- Step-by-step “DevStories Tour” with progress tracking and sample workspace toggle.
- Docusaurus documentation repo (versioned, deployed) with hero page, guides, cadence cookbook, troubleshooting.
- Automated screenshot generator (Playwright or VS Code extension host) feeding docs + README.
- In-editor “Docs & Tutorials” command palette entry linking to specific sections with context.

## Stories
- [[DS-047]] First-run welcome hub + quick actions
- [[DS-048]] Interactive DevStories tutorial & sample workspace
- [[DS-049]] Docusaurus documentation site (structure + deployment)
- [[DS-050]] Screenshot automation pipeline
- [[DS-051]] In-editor docs navigator & contextual help

## Notes
- Respect user preference: allow dismissing the welcome hub and re-opening via command.
- Tutorials should leverage the Agile Solo Starter pack (DS-046) for realistic content.
- Keep docs assets under version control; prefer markdown + static images (PNG/WebP) with dark/light variants.
