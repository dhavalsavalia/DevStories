---
id: EPIC-012
title: "Accessibility & Security"
status: todo
sprint: polish-3
created: 2025-11-29
updated: 2025-11-29
---

# Accessibility & Security

## Description
WCAG compliance for webviews, XSS prevention audit, and input validation for all user-facing commands.

## Goals
- Add ARIA labels to all interactive webview elements
- Audit and harden innerHTML usage against XSS
- Validate user input in command handlers
- Ensure keyboard navigation works throughout

## Deliverables
- Board view cards, columns, filters have proper ARIA labels
- Welcome and tutorial views are screen-reader accessible
- escapeHtml() covers all XSS vectors
- Input validation with helpful error messages

## Stories
- [[DS-060]] Implement accessibility labels in board webview
- [[DS-061]] Implement accessibility in welcome and tutorial webviews
- [[DS-062]] Audit and harden all innerHTML assignments
- [[DS-063]] Validate user input in command handlers
