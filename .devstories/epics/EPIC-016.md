---
id: EPIC-016
title: "Multi-Platform Core"
status: todo
created: 2025-11-29
updated: 2025-11-29
---

# Multi-Platform Core

## Description
Extract headless core package for multi-platform support - CLI, Neovim, JetBrains, and beyond.

## Goals
- Extract parser, store, writer into standalone @devstories/core package
- Create CLI tool for terminal usage (like Backlog.md)
- Enable future Neovim and JetBrains plugin development
- Maintain full VS Code extension functionality

## Deliverables
- packages/core with parser.ts, store.ts, writer.ts, types/
- @devstories/core published to npm
- packages/cli with ds list, ds create, ds status, ds board commands
- VS Code extension refactored to use core package

## Stories
- [[DS-076]] Create devstories-core package with shared logic
- [[DS-077]] Create devstories CLI for terminal usage
- [[DS-078]] Update VS Code extension to import from core package

## Notes
- Abstract file system operations for platform independence
- CLI should work with Claude Code, Codex, any terminal
- Terminal Kanban view similar to Backlog.md
