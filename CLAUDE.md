# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevStories is a VS Code extension for lightweight story management using markdown files. Stories live in `.devstories/` as version-controlled markdown files, eliminating the need for external tools like JIRA.

**Current Status:** Planning complete, ready for implementation. No code exists yet—this is a greenfield project.

## Architecture

### Core Design Principles

1. **Markdown-first**: Stories are markdown files with YAML frontmatter, not database records
2. **Git as sync**: Version control is the source of truth, no external databases
3. **VS Code native**: Uses VS Code Extension API, no external services
4. **TDD approach**: Write tests before implementation (Red → Green → Refactor)

### Directory Structure (Target)

```
devstories/
├── src/
│   ├── extension.ts              # Entry point
│   ├── core/                     # Core functionality
│   │   ├── parser.ts             # Markdown + frontmatter parsing (gray-matter)
│   │   ├── store.ts              # In-memory story cache (Map<id, Story>)
│   │   ├── watcher.ts            # File system watching
│   │   └── writer.ts             # Write changes back to markdown
│   ├── providers/                # VS Code providers
│   │   ├── treeProvider.ts       # Sidebar tree view
│   │   ├── hoverProvider.ts      # [[STORY-ID]] hover preview
│   │   └── linkProvider.ts       # [[STORY-ID]] clickable links
│   ├── views/
│   │   ├── boardView.ts          # Kanban webview controller
│   │   └── statusBar.ts          # Progress bar in status bar
│   ├── commands/
│   │   ├── init.ts               # Initialize .devstories/
│   │   ├── createEpic.ts         # Create epic command
│   │   ├── createStory.ts        # Create story command
│   │   ├── quickCapture.ts       # Cmd+Shift+S quick capture
│   │   └── changeStatus.ts       # Change story status
│   ├── utils/
│   │   ├── idGenerator.ts        # Generate story/epic IDs
│   │   ├── linkResolver.ts       # Resolve [[ID]] to file path
│   │   └── validator.ts          # Validate frontmatter
│   └── types/
│       ├── story.ts              # Story type definitions
│       ├── epic.ts               # Epic type definitions
│       └── config.ts             # Config type definitions
├── webview/                      # Board view HTML/CSS/JS
├── test/
│   ├── unit/                     # Vitest unit tests
│   └── integration/              # @vscode/test-electron integration tests
├── docs/PRD/                     # Complete product requirements
└── package.json
```

## Data Flow Patterns

### Store-Centric Architecture
- **Store** (`src/core/store.ts`) is the single source of truth in memory
- All UI components (tree view, board view, status bar) read from Store
- Store emits events when data changes (`onStoryChanged`, `onEpicChanged`)
- File changes trigger Store updates via Watcher

### File → Store → UI Flow
```
.devstories/stories/STORY-001.md (filesystem)
  ↓ (FileWatcher detects change)
Parser.parseStory() (gray-matter)
  ↓
Store.stories.set(id, story) (Map update)
  ↓
Store.onStoryChanged event fires
  ↓
TreeProvider.refresh() + BoardView.updateWebview() (UI updates)
```

### UI → File Flow
```
User clicks status in tree view
  ↓
Command: changeStatus(storyId, newStatus)
  ↓
Writer.updateStoryStatus() (update YAML frontmatter only)
  ↓
File saved to disk
  ↓
FileWatcher detects change → Store reloads → UI refreshes
```

## Markdown Format Specification

### Story File Structure
```markdown
---
id: STORY-001
title: Login Form Implementation
type: feature              # feature | bug | task | chore
epic: EPIC-001
status: todo              # Defined in config.yaml
sprint: sprint-4
size: M                   # XS | S | M | L | XL
assignee: ""
dependencies:
  - STORY-005
  - STORY-006
created: 2025-01-15
updated: 2025-01-20      # Auto-updated on save
---

# Login Form Implementation

[Markdown content follows...]
```

### Config File (`.devstories/config.yaml`)
Defines:
- ID prefixes (e.g., `STORY`, `EPIC`, or custom like `PROJ`, `FEAT`)
- Status workflow (columns for board view)
- Valid sizes
- Story templates per type (feature/bug/task/chore)
- Current sprint

See `docs/PRD/specs/01-markdown-spec.md` for complete specification.

## Implementation Phases (23 Stories)

Implement in this exact order—dependencies matter:

1. **Phase 1 (DS-001 to DS-005)**: Foundation
   - Scaffolding, parser, watcher, store, auto-timestamps
   - **Critical**: Store must be complete before tree view

2. **Phase 2 (DS-006 to DS-009)**: Tree View
   - TreeDataProvider, epic/story hierarchy, icons, progress bar
   - **Blocker**: Requires working Store from Phase 1

3. **Phase 3 (DS-010 to DS-015)**: Commands
   - Init, create epic, create story, quick capture, templates, change status
   - **Note**: Quick capture (DS-013) is high-value UX feature

4. **Phase 4 (DS-016 to DS-018)**: Links
   - Link detection, DocumentLinkProvider, HoverProvider
   - **Note**: `[[STORY-ID]]` clickable links + inline preview

5. **Phase 5 (DS-019 to DS-023)**: Board View
   - Webview scaffolding, kanban UI, drag-drop, file writing, sprint filter
   - **Complexity**: Webview ↔ extension communication via postMessage

See `docs/PRD/features/02-story-breakdown.md` for detailed task breakdowns per story.

## Testing Strategy

### Unit Tests (Vitest)
Test pure logic without VS Code API:
- `parser.test.ts`: Valid/invalid frontmatter, missing fields
- `idGenerator.test.ts`: Sequential IDs, custom prefixes
- `linkResolver.test.ts`: Resolve links, handle missing stories
- `store.test.ts`: CRUD operations, event emissions

### Integration Tests (@vscode/test-electron)
Test VS Code API integration:
- `extension.test.ts`: Extension activation
- `commands.test.ts`: Command registration and execution
- `treeView.test.ts`: Tree rendering, expand/collapse
- `webview.test.ts`: Webview communication

### TDD Workflow
1. Write failing test (Red)
2. Implement minimal code to pass (Green)
3. Refactor (Refactor)
4. Commit when green

## Key Dependencies

- **gray-matter**: YAML frontmatter parsing (critical for parser)
- **remark**: Markdown AST parsing (may be needed for content analysis)
- **Vitest**: Unit tests (fast, modern)
- **@vscode/test-electron**: Integration tests (VS Code environment)
- **esbuild**: Extension bundling (fast builds)

## VS Code Extension Specifics

### Activation Events
Extension activates when:
- `.devstories/` directory exists in workspace
- User runs init command
- Workspace contains story files

### Package.json Contributions
- Commands: `devstories.init`, `devstories.createStory`, etc.
- Views: Tree view in sidebar, board view panel
- Keybindings: `Cmd+Shift+S` for quick capture
- Languages: Markdown file association for `.devstories/` context

### Performance Considerations
- **Lazy loading**: Parse stories only when Store.load() is called
- **Debouncing**: File watcher events debounced (100ms), tree refresh debounced (50ms)
- **Caching**: Parsed stories cached in Store, invalidated on file change
- **Limits**: Warn if >1000 stories in workspace

## Common Pitfalls to Avoid

1. **Don't bypass the Store**: UI should never read files directly—always go through Store
2. **Auto-timestamp behavior**: The `updated` field auto-updates on save—Writer must handle this
3. **Link resolution**: `[[STORY-ID]]` must resolve even if story is in different directory
4. **Frontmatter preservation**: Writer must preserve markdown content when updating YAML
5. **Event loops**: Avoid infinite loops where file save triggers watcher triggers save

## Development Workflow

When implementing a new story:
1. Read the story breakdown in `docs/PRD/features/02-story-breakdown.md`
2. Check dependencies—implement those first if missing
3. Write tests first (TDD approach)
4. Implement minimal code to pass tests
5. Update README.md checklist when story is complete

## Documentation References

- **Vision & Target Audience**: `docs/PRD/overview/01-vision.md`
- **Core Product Decisions**: `docs/PRD/overview/02-core-decisions.md`
- **Complete Markdown Spec**: `docs/PRD/specs/01-markdown-spec.md`
- **MVP Feature Breakdown**: `docs/PRD/features/01-mvp-features.md`
- **All 23 Stories**: `docs/PRD/features/02-story-breakdown.md`
- **Tech Stack Details**: `docs/PRD/architecture/01-tech-stack.md`

## Dogfooding Strategy

DevStories will manage its own development. After Phase 1 is complete:
- Initialize `.devstories/` in this repo
- Create EPIC-001 through EPIC-005 (matching the 5 phases)
- Migrate DS-001 through DS-023 into story files
- Use the extension to manage remaining work

## Claude Code Session Protocol

For long-running development across multiple sessions:

1. **Start**: Run `./init.sh` to verify environment (compiles, tests, launches dev host)
2. **Context**: Read `claude-progress.txt` to understand last session's state
3. **Focus**: Pick ONE story from backlog, update progress file with "in_progress"
4. **Implement**: Write tests first, then code (TDD)
5. **Verify**: Run tests, manually verify in Extension Development Host
6. **End**: Update `claude-progress.txt` with work done and next steps
7. **Commit**: Descriptive commit message referencing story ID

**Key files**:
- `init.sh` - Environment setup and test runner
- `claude-progress.txt` - Session-by-session work log
