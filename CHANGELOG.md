# Changelog

All notable changes to DevStories will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-12-XX

### Added

- **Story & Epic Management**: Create and manage stories/epics as markdown files with YAML frontmatter
- **Tree View Sidebar**: Hierarchical view of epics and stories with status icons and sprint filtering
- **Quick Capture** (`Cmd+Shift+S`): Rapid story creation with inline type notation (`bug:`, `feat:`, etc.)
- **Wiki-Style Links**: `[[STORY-ID]]` syntax with clickable links and hover previews
- **Template System**: Save stories as templates, load from `.devstories/templates/`
- **Status Bar Progress**: Visual sprint progress indicator with click-to-filter
- **Auto-Timestamps**: `updated` field automatically set on file save
- **Configurable Workflow**: Custom statuses, sprints, sizes, and ID prefixes via `config.yaml`

### Notes

- Built and managed using itself
- No external dependencies - all data stored as local markdown files
- Git-native: version control is your project management sync
