---
id: EPIC-023
title: "Frontmatter Intellisense"
status: todo
created: 2025-11-30
updated: 2025-11-30
---

# Frontmatter Intellisense

## Description

Full validation, autocomplete, and hover support for story/epic frontmatter. JSON Schema foundation enables future CLI and MCP reuse.

## Goals

- Validate frontmatter fields (required, enums, dates)
- Cross-file validation (orphan stories, dangling deps, unique IDs)
- Autocomplete for status, type, size, epic, dependencies, [[links]]
- Hover documentation for fields and references

## Stories

- [[DS-120]] JSON Schema definitions
- [[DS-121]] Single-file validation
- [[DS-122]] Cross-file validation
- [[DS-123]] Autocomplete for enum fields
- [[DS-124]] Autocomplete for references
- [[DS-125]] Hover documentation
