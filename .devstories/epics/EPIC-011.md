---
id: EPIC-011
title: "Error Handling & Lint"
status: todo
created: 2025-11-29
updated: 2025-11-29
---

# Error Handling & Lint

## Description
Robust error handling throughout the extension, stricter lint rules to prevent regressions and maintain code quality.

## Goals
- Wrap all command handlers with try-catch for graceful error handling
- Eliminate silent catch blocks that swallow errors
- Add stricter ESLint rules for production code
- Fix type safety issues (remove `any` types)

## Deliverables
- All commands show user-friendly error messages on failure
- Errors logged to OutputChannel for debugging
- ESLint rules: no-console, no-explicit-any, no-floating-promises
- Proper TypeScript interfaces for all webview messages

## Stories
- [[DS-056]] Add error handling to all command registrations
- [[DS-057]] Replace empty catch blocks with proper error handling
- [[DS-058]] Add production ESLint rules
- [[DS-059]] Replace 'any' types with proper interfaces
