---
id: EPIC-013
title: "Test Coverage"
status: todo
sprint: polish-4
created: 2025-11-29
updated: 2025-11-29
---

# Test Coverage

## Description
Fill test coverage gaps for status bar components and extension lifecycle to ensure stability.

## Goals
- Add unit tests for statusBar.ts
- Add unit tests for ritualStatusBar.ts
- Add integration tests for extension activation/deactivation
- Maintain 340+ passing tests

## Deliverables
- statusBar.test.ts with progress and sprint display tests
- ritualStatusBar.test.ts with cadence service integration tests
- Extension lifecycle tests in integration suite
- All tests passing after polish changes

## Stories
- [[DS-064]] Add unit tests for statusBar.ts
- [[DS-065]] Add unit tests for ritualStatusBar.ts
- [[DS-066]] Add integration tests for extension lifecycle
