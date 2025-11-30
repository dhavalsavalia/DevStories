---
id: EPIC-003
title: Commands
status: done
created: 2025-11-26
updated: 2025-11-28
---

# Commands

## Description
Interactive commands for creating and managing stories with smart defaults, quick capture workflows, and intuitive status transitions. Focus on reducing friction in the story creation and management flow.

## Key Value Adds
- **Smart defaults**: Auto-detect project context, suggest sizes, inherit sprints
- **Quick Capture**: Sub-second story creation without context switch
- **Inbox workflow**: Capture now, triage later
- **Template library**: Built-in templates for common patterns

## Deliverables
- Init command with project detection and config wizard
- Epic/Story creation with auto-linking
- Quick Capture with keyboard shortcut
- Template system with bundled library
- Smart status transitions with bulk operations

## Stories
- [[DS-010]] - Init Command + Smart Defaults
- [[DS-011]] - Create Epic Command + Auto-Link
- [[DS-012]] - Smart Story Creation
- [[DS-013]] - Quick Capture + Inbox
- [[DS-014]] - Template System + Library
- [[DS-015]] - Smart Status Transitions
- [[DS-024]] - Load Custom Templates into Picker
- [[DS-025]] - Wrap dependencies in [[ID]] link format

## Notes
- All stories split into MVP vs Enhanced acceptance criteria
- Enhanced features can be deferred to post-MVP if needed
- Quick Capture (DS-013) is high-value, consider prioritizing
