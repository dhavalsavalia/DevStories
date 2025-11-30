---
id: EPIC-010
title: "Production Polish"
status: in_progress
created: 2025-11-29
updated: 2025-11-30
---

# Production Polish

## Description
Clean codebase to professional standards - no console.logs, no dead code, proper logging via VS Code OutputChannel.

## Goals
- Create centralized logger service using VS Code OutputChannel
- Remove all console.log/warn/error statements
- Eliminate dead code, unused exports, stale dependencies
- Clean up commented code blocks and stale TODOs

## Deliverables
- `src/core/logger.ts` with info/warn/error/debug methods
- Zero console.* statements in production code
- Clean dependency tree verified by ts-prune and depcheck
- No commented-out code blocks

## Stories
- [[DS-052]] Create OutputChannel-based logger service
- [[DS-053]] Replace all console.log with logger service
- [[DS-054]] Identify and remove unused exports/dependencies
- [[DS-055]] Clean up commented code blocks and stale TODOs
