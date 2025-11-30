---
id: EPIC-018
title: Language Features (Intellisense, Diagnostics, Navigation)
status: todo
created: 2025-11-29
---

# Language Features (Intellisense, Diagnostics, Navigation)

## Description

Full IDE-quality editing experience for DevStories markdown files: autocomplete, validation, diagnostics, navigation, and references. Consolidates all VS Code language provider work.

## Why

- LLM-generated stories have inconsistent syntax (inline vs block arrays)
- No feedback when typing invalid values (wrong status, missing required fields)
- Typing `pri` should suggest `priority` - currently no help
- Broken links silently ignored, no way to find references

## Constraints

- vscode-yaml extension does NOT support markdown frontmatter (checked Issue #207)
- Markdown has `quickSuggestions: false` by default - users must Ctrl+Space or we configure it
- Must detect frontmatter boundaries (between `---` markers at doc start)

## Stories

### Foundation
- [[DS-084]] - Frontmatter position detection utilities

### Completions (CompletionItemProvider)
- [[DS-085]] - Field name completions
- [[DS-086]] - Field value completions (enums from config)
- [[DS-088]] - ID link completions in frontmatter
- [[DS-092]] - Wiki-link autocomplete (`[[`)

### Diagnostics (DiagnosticCollection)
- [[DS-087]] - Real-time validation diagnostics (frontmatter)
- [[DS-090]] - Broken link diagnostics (content)
- [[DS-091]] - Quick fix for broken links (CodeActionProvider)

### Navigation (Definition/Reference Providers)
- [[DS-039]] - Open Story by ID command
- [[DS-093]] - Backlinks index and panel
- [[DS-094]] - Enhanced hover previews
- [[DS-095]] - Peek definition and go to references

### Formatting
- [[DS-089]] - Format normalization on save
