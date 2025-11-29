---
id: EPIC-015
title: "AI Integration"
status: todo
created: 2025-11-29
updated: 2025-11-29
---

# AI Integration

## Description
Match Backlog.md's AI capabilities with richer data model - TODO comment scanning and MCP server for AI agents.

## Goals
- Scan workspace for TODO/FIXME comments and create stories
- Implement MCP server for AI agent integration
- Support Claude Code, Cursor, Codex, and other AI tools
- Expose full epic/story/sprint hierarchy to AI

## Deliverables
- `devstories.scanTodos` command with deduplication
- Stories created from TODOs with file path and line number
- MCP server with read resources (stories, epics, story/{id})
- MCP tools for create_story, update_status, quick_capture

## Stories
- [[DS-072]] Implement TODO/FIXME comment scanner
- [[DS-073]] Create stories from scanned TODOs
- [[DS-074]] Implement MCP server for reading stories
- [[DS-075]] Add MCP tools for creating/updating stories
