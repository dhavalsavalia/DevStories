# Story Breakdown

All 23 stories for DevStories v0.1, organized by implementation phase.

---

## Phase 1: Foundation (DS-001 to DS-005)

### DS-001: Project Scaffolding

**Size:** S
**Dependencies:** None

**Tasks:**
- [ ] Generate extension with `yo code`
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up esbuild for bundling
- [ ] Configure package.json (name, publisher, activation events)
- [ ] Add extension icon
- [ ] Basic README with project overview

**Tests:**
- [ ] Extension activates without errors
- [ ] package.json is valid

---

### DS-002: Markdown Parser

**Size:** M
**Dependencies:** DS-001

**Tasks:**
- [ ] Install gray-matter
- [ ] Create `src/core/parser.ts`
- [ ] Parse story frontmatter (YAML)
- [ ] Parse epic frontmatter
- [ ] Extract markdown content
- [ ] Handle parse errors gracefully

**Tests:**
- [ ] Unit: Valid story parsing
- [ ] Unit: Invalid frontmatter handling
- [ ] Unit: Epic parsing
- [ ] Unit: Missing fields show warnings

---

### DS-003: File Watcher

**Size:** S
**Dependencies:** DS-001

**Tasks:**
- [ ] Create `src/core/watcher.ts`
- [ ] Use vscode.workspace.createFileSystemWatcher
- [ ] Watch `.devstories/**/*.md`
- [ ] Emit events on create/change/delete
- [ ] Debounce file events (100ms)

**Tests:**
- [ ] Integration: Detects file creation
- [ ] Integration: Detects file changes
- [ ] Integration: Detects file deletion

---

### DS-004: In-Memory Store

**Size:** M
**Dependencies:** DS-002, DS-003

**Tasks:**
- [ ] Create `src/core/store.ts`
- [ ] Map<id, Story> for stories
- [ ] Map<id, Epic> for epics
- [ ] load() method to scan .devstories/
- [ ] getStory(id), getEpic(id) methods
- [ ] getStoriesByEpic(epicId)
- [ ] Event emitters for changes

**Tests:**
- [ ] Unit: Load stories from directory
- [ ] Unit: Get story by ID
- [ ] Unit: Get stories by epic
- [ ] Unit: Events fire on changes

---

### DS-005: Auto-Timestamps on Save

**Size:** XS
**Dependencies:** DS-002

**Tasks:**
- [ ] Detect story file save (vscode.workspace.onDidSaveTextDocument)
- [ ] Parse frontmatter
- [ ] Update `updated` field to today
- [ ] Write back to file

**Tests:**
- [ ] Integration: Save updates timestamp
- [ ] Integration: Format is YYYY-MM-DD

---

## Phase 2: Tree View (DS-006 to DS-009)

### DS-006: TreeDataProvider

**Size:** M
**Dependencies:** DS-004

**Tasks:**
- [ ] Create `src/providers/treeProvider.ts`
- [ ] Implement TreeDataProvider interface
- [ ] Register tree view in package.json
- [ ] getChildren() returns epics at root
- [ ] getChildren(epic) returns stories
- [ ] refresh() on store changes

**Tests:**
- [ ] Integration: Tree shows epics
- [ ] Integration: Expanding epic shows stories
- [ ] Integration: Tree refreshes on file change

---

### DS-007: Epic/Story Hierarchy

**Size:** S
**Dependencies:** DS-006

**Tasks:**
- [ ] TreeItem for epic (collapsible)
- [ ] TreeItem for story (file link)
- [ ] Click story opens file
- [ ] Expand/collapse epics

**Tests:**
- [ ] Integration: Click opens correct file
- [ ] Integration: Expand/collapse works

---

### DS-008: Status + Type Icons

**Size:** S
**Dependencies:** DS-006

**Tasks:**
- [ ] Add icons to extension (assets/)
- [ ] Map story type to icon (💡/🐛/☑️/🔧)
- [ ] Map status to color (colored dot)
- [ ] Show icon + status in tree item

**Tests:**
- [ ] Integration: Icons display correctly
- [ ] Integration: Status colors are correct

---

### DS-009: Progress Bar (Status Bar)

**Size:** S
**Dependencies:** DS-004

**Tasks:**
- [ ] Create `src/views/statusBar.ts`
- [ ] vscode.window.createStatusBarItem()
- [ ] Count stories in current sprint
- [ ] Calculate done vs total
- [ ] Show: `Sprint 4: ████░░ 8/12`
- [ ] Update on story status change

**Tests:**
- [ ] Integration: Counts are accurate
- [ ] Integration: Updates on status change

---

## Phase 3: Commands (DS-010 to DS-015)

### DS-010: Init Command

**Size:** S
**Dependencies:** DS-001

**Tasks:**
- [ ] Create `src/commands/init.ts`
- [ ] Register command in package.json
- [ ] Create .devstories/ directory
- [ ] Create config.yaml with defaults
- [ ] Create epics/ and stories/ subdirs
- [ ] Ask to add to .gitignore

**Tests:**
- [ ] Integration: Directory structure created
- [ ] Integration: config.yaml is valid

---

### DS-011: Create Epic Command

**Size:** S
**Dependencies:** DS-002

**Tasks:**
- [ ] Create `src/commands/createEpic.ts`
- [ ] Prompt for epic title
- [ ] Generate epic ID (auto or manual)
- [ ] Create epic file with template
- [ ] Open epic file

**Tests:**
- [ ] Integration: Epic created
- [ ] Integration: File opened
- [ ] Integration: Frontmatter is valid

---

### DS-012: Create Story Command

**Size:** M
**Dependencies:** DS-002, DS-011

**Tasks:**
- [ ] Create `src/commands/createStory.ts`
- [ ] Dropdown to select epic
- [ ] Prompt for story title
- [ ] Select story type (feature/bug/task/chore)
- [ ] Generate story ID
- [ ] Apply type-specific template
- [ ] Create story file
- [ ] Open story file

**Tests:**
- [ ] Integration: Story created
- [ ] Integration: Epic reference is correct
- [ ] Integration: Template matches type

---

### DS-013: Quick Capture (Cmd+Shift+S)

**Size:** S
**Dependencies:** DS-012

**Tasks:**
- [ ] Create `src/commands/quickCapture.ts`
- [ ] Register keybinding in package.json
- [ ] Show input box (current file stays open)
- [ ] Create story with defaults (type=task, size=M)
- [ ] Auto-assign to current sprint
- [ ] Tree refreshes immediately

**Tests:**
- [ ] Integration: Keybind works
- [ ] Integration: Story created with defaults
- [ ] Integration: <1 second from keybind to created

---

### DS-014: Story Templates per Type

**Size:** S
**Dependencies:** DS-012

**Tasks:**
- [ ] Read templates from config.yaml
- [ ] Apply template based on story type
- [ ] Allow user customization
- [ ] Handle missing template (fallback to generic)

**Tests:**
- [ ] Unit: Template applied correctly
- [ ] Integration: Custom template works

---

### DS-015: Change Status Command

**Size:** S
**Dependencies:** DS-004

**Tasks:**
- [ ] Create `src/commands/changeStatus.ts`
- [ ] Right-click context menu in tree
- [ ] Show status options (from config)
- [ ] Update story frontmatter
- [ ] Auto-save file
- [ ] Update `updated` timestamp

**Tests:**
- [ ] Integration: Status changes in file
- [ ] Integration: Tree refreshes

---

## Phase 4: Links (DS-016 to DS-018)

### DS-016: [[ID]] Link Detection

**Size:** M
**Dependencies:** DS-004

**Tasks:**
- [ ] Create `src/utils/linkResolver.ts`
- [ ] Regex to detect `[[STORY-ID]]` or `[[EPIC-ID]]`
- [ ] Resolve ID to file path
- [ ] Handle invalid IDs (show warning)

**Tests:**
- [ ] Unit: Regex detects links
- [ ] Unit: Resolve story ID to path
- [ ] Unit: Handle missing story

---

### DS-017: DocumentLinkProvider

**Size:** S
**Dependencies:** DS-016

**Tasks:**
- [ ] Create `src/providers/linkProvider.ts`
- [ ] Implement DocumentLinkProvider
- [ ] Make [[ID]] clickable (Ctrl+click)
- [ ] Navigate to story file

**Tests:**
- [ ] Integration: Links are clickable
- [ ] Integration: Navigation works

---

### DS-018: Inline Preview (HoverProvider)

**Size:** M
**Dependencies:** DS-016

**Tasks:**
- [ ] Create `src/providers/hoverProvider.ts`
- [ ] Implement HoverProvider
- [ ] On hover `[[ID]]`, show card:
  - Story title
  - Status (colored indicator)
  - Type (icon)
  - Size
  - Epic name
- [ ] Format as markdown hover

**Tests:**
- [ ] Integration: Hover shows preview
- [ ] Integration: Preview is readable

---

## Phase 5: Board View (DS-019 to DS-023)

### DS-019: Webview Scaffolding

**Size:** M
**Dependencies:** DS-004

**Tasks:**
- [ ] Create `src/views/boardView.ts`
- [ ] Implement WebviewViewProvider
- [ ] Create webview HTML scaffold
- [ ] Set up postMessage communication
- [ ] Load stories into webview

**Tests:**
- [ ] Integration: Webview renders
- [ ] Integration: postMessage works

---

### DS-020: Board HTML/CSS

**Size:** M
**Dependencies:** DS-019

**Tasks:**
- [ ] Create `webview/board.html`
- [ ] Create `webview/board.css`
- [ ] Kanban columns (from config.yaml)
- [ ] Story cards (title, type icon, size)
- [ ] Responsive layout

**Tests:**
- [ ] Integration: Columns render
- [ ] Integration: Cards display

---

### DS-021: Drag-Drop Logic

**Size:** M
**Dependencies:** DS-020

---


**Tasks:**
- [ ] Implement drag-drop in board.js
- [ ] Drag story card to new column
- [ ] postMessage to extension (storyId, newStatus)
- [ ] Extension updates file
- [ ] Webview re-renders

**Tests:**
- [ ] Integration: Drag-drop works
- [ ] Integration: File updates correctly

---

### DS-022: Write Back to Files

**Size:** S
**Dependencies:** DS-021

**Tasks:**
- [ ] Create `src/core/writer.ts`
- [ ] updateStoryStatus(id, status)
- [ ] Preserve markdown content
- [ ] Update frontmatter only
- [ ] Trigger file watcher

**Tests:**
- [ ] Unit: Frontmatter updated
- [ ] Unit: Content preserved

---

### DS-023: Sprint Filter

**Size:** S
**Dependencies:** DS-019

**Tasks:**
- [ ] Dropdown in board view
- [ ] List sprints from stories
- [ ] Filter board by sprint
- [ ] "All sprints" option

**Tests:**
- [ ] Integration: Filter works
- [ ] Integration: Shows correct stories

---

## Phase 7: Solo Dev Polish (DS-034 to DS-040)

Enhancements that keep DevStories fast, sprint-aware, and useful for solo developers before investing in heavier sprint tooling.

### DS-034: Sprint-aware Status Bar & Picker

**Size:** M  
**Dependencies:** Status Bar (DS-009)

**Tasks:**
- Read `sprints.current` + history from config service
- Show `Sprint <name>: ███░░ done/total` in status bar
- Add `DevStories: Pick Sprint` command + QuickPick
- Sync selection with tree + board filters

**Tests:**
- [ ] Unit: sprint stats calculation
- [ ] Integration: picker updates filters

---

### DS-035: Config + Template Live Reload Service

**Size:** M  
**Dependencies:** Parser (DS-002), Watcher (DS-003)

**Tasks:**
- Watch `.devstories/config.yaml` + templates folder
- Parse config into normalized object with statuses/sprints/sizes/templates
- Emit events to consumers (commands, views, status bar)
- Surface errors with fallback to last-known-good

**Tests:**
- [ ] Unit: debounce + parsing
- [ ] Integration: live column/status updates

---

### DS-036: Quick Capture Inbox Triage Command

**Size:** M  
**Dependencies:** Quick Capture (DS-013)

**Tasks:**
- Add `DevStories: Triage Inbox` command
- List inbox stories with metadata + bulk actions
- Allow editing epic/sprint/size/status inline
- Support archive/delete + success summary

**Tests:**
- [ ] Integration: move multiple stories to new epic
- [ ] Unit: batch operation helpers

---

### DS-037: Assignee Command & UI Surfaces

**Size:** M  
**Dependencies:** Config watcher (DS-035)

**Tasks:**
- Command to assign/clear assignee using git user history
- Update markdown frontmatter and refresh store
- Display assignee chips in tree + board cards
- Extend board filters/chips with "Assigned to me"

**Tests:**
- [ ] Unit: assignment command flow
- [ ] Integration: board filter by assignee

---

### DS-038: Board Polish (Colors, WIP, Saved Filters)

**Size:** L  
**Dependencies:** DS-035, DS-037

**Tasks:**
- Apply status colors from config to columns/cards
- Add optional WIP limit indicators per status
- Persist named filter presets (save/update/delete)
- Surface assignee/due/dependency metadata on cards
- Ensure keyboard + drag-drop UX stay smooth

**Tests:**
- [ ] Unit: WIP calculations + preset persistence
- [ ] Integration: visual regression / focus retention

---

### DS-039: Story ID Utilities (Open & Validate)

**Size:** M  
**Dependencies:** Link Resolver (DS-016)

**Tasks:**
- `DevStories: Open Story by ID` QuickPick
- Workspace link validator with diagnostics + quick fixes
- Optional stub-story generator for missing IDs

**Tests:**
- [ ] Unit: link scanning + diagnostic lifecycle
- [ ] Integration: open-by-ID command

---

### DS-040: Incremental Store → Board Updates

**Size:** M  
**Dependencies:** Board view infrastructure (DS-019 to DS-023)

**Tasks:**
- Diff store payloads and emit granular `storyUpdated/storyDeleted` messages
- Update webview state without full rerender
- Provide fallback refresh message for edge cases
- Measure perf + ensure focus/search stability

**Tests:**
- [ ] Unit: diffing utility
- [ ] Integration: ensure search input stays focused during updates

---

## Phase 8: Cadence Kit (DS-041 to DS-045)

Optional Agile-lite ceremony tools that layer on top of epics/stories to keep solos in rhythm without heavy sprints.

### DS-041: Cadence Reminders & Ritual Prompts

**Size:** M  
**Dependencies:** Status bar upgrades (DS-034)

**Tasks:**
- Cadence config (day/time, rituals) in config.yaml
- Status bar nudges + quick actions
- `DevStories: Start Weekly Ritual` command flow
- Respect VS Code quiet hours / Do Not Disturb

**Tests:**
- [ ] Unit: reminder scheduling + throttling
- [ ] Integration: ritual command opens relevant views

---

### DS-042: Definition of Done Checklist Surface

**Size:** M  
**Dependencies:** Story templates (DS-014)

**Tasks:**
- Extend templates/frontmatter with `dod` arrays
- Render DoD checklist view + tree badges
- Guard status changes when required items unchecked (configurable)
- Optional auto-check hooks (tests run, docs touched)

**Tests:**
- [ ] Unit: DoD parsing + serialization
- [ ] Integration: status change guardrails

---

### DS-043: Flow Snapshot & Metrics View

**Size:** M  
**Dependencies:** Store timestamps (DS-004, DS-005)

**Tasks:**
- Calculate cycle/lead time, throughput, WIP
- Build lightweight webview or markdown report with sparklines
- Export command for sharing
- Surface stats in status bar tooltip/board header

**Tests:**
- [ ] Unit: metric calculations
- [ ] Integration: snapshot refresh on status change

---

### DS-044: Retro Generator Command

**Size:** M  
**Dependencies:** Flow snapshot (DS-043)

**Tasks:**
- Command to create retro markdown with auto-filled sections
- Include done vs carry-over tables, metrics, prompts
- Optional AI prompt scaffolding hooks
- Save files under `.devstories/retros/`

**Tests:**
- [ ] Unit: retro content builder
- [ ] Integration: generated retro links to stories/experiments

---

### DS-045: Improvement Experiment Tracker

**Size:** S  
**Dependencies:** Retro generator (DS-044)

**Tasks:**
- Experiment template + command
- Tree/status view of active experiments
- Link experiments to stories/retros
- Reminder system for experiment check-ins

**Tests:**
- [ ] Unit: experiment template + linking
- [ ] Integration: reminders + completion workflow

---

### DS-046: Agile Solo Starter Template Pack

**Size:** S  
**Dependencies:** Template system (DS-014)

**Tasks:**
- Create curated templates for backlog grooming, planning, retros, experiments
- Add command to apply starter pack (creates sample epic/stories)
- Wire optional config toggle to enable cadence features in one step
- Update README/PRD with onboarding instructions

**Tests:**
- [ ] Unit: template parsing + command flow
- [ ] Integration: starter pack generation + cleanup

---

## Phase 9: Onboarding & Docs (DS-047 to DS-051)

Launch-ready onboarding, tutorials, and documentation to make DevStories self-explanatory on first install.

### DS-047: First-run Welcome Hub + Quick Actions

**Size:** M  
**Dependencies:** none

**Tasks:**
- Implement welcome webview with init/learn/customize actions
- Persist dismissal state via globalState
- Provide release notes section for returning users

**Tests:**
- [ ] Unit: state persistence + command wiring
- [ ] Integration: first-run triggers once per workspace

---

### DS-048: Interactive DevStories Tutorial & Sample Workspace

**Size:** L  
**Dependencies:** DS-047

**Tasks:**
- Create walkthrough (VS Code builtin or custom) covering full workflow
- Bundle/open sample workspace with realistic data
- Track tutorial progress + reset command

**Tests:**
- [ ] Unit: step tracking
- [ ] Integration: tutorial actions succeed against sample workspace

---

### DS-049: Docusaurus Documentation Site

**Size:** L  
**Dependencies:** none

**Tasks:**
- Scaffold site structure + theme
- Author core pages (overview, quick start, workflows, cadence, FAQ)
- Configure deployment pipeline

**Tests:**
- [ ] CI: docs build + deploy pipeline
- [ ] Manual QA: links/screenshots valid

---

### DS-050: Screenshot Automation Pipeline

**Size:** M  
**Dependencies:** DS-049

**Tasks:**
- Script Playwright/VS Code scenarios
- Capture dark/light screenshots, optimize assets
- Wire into CI (`npm run shots`)

**Tests:**
- [ ] CI: screenshot job produces artifacts
- [ ] Unit: scenario scripts exit cleanly

---

### DS-051: In-editor Docs Navigator & Contextual Help

**Size:** M  
**Dependencies:** DS-049

**Tasks:**
- Command to open docs topics via QuickPick
- Help icons/tooltips linking to doc anchors
- Offline fallback excerpts

**Tests:**
- [ ] Unit: command + config toggles
- [ ] Integration: context help opens correct URLs/fallbacks

---

## Estimated Timeline

**Assumptions:**
- Solo developer
- ~10 hours/week
- TDD approach (test first)

| Phase | Stories | Est. Hours | Weeks |
|-------|---------|------------|-------|
| 1 | DS-001 to DS-005 | 15h | 1.5 |
| 2 | DS-006 to DS-009 | 12h | 1.2 |
| 3 | DS-010 to DS-015 | 18h | 1.8 |
| 4 | DS-016 to DS-018 | 10h | 1.0 |
| 5 | DS-019 to DS-023 | 20h | 2.0 |
| **Total** | **23 stories** | **75h** | **~8 weeks** |

Add 25% buffer for unknowns: **~10 weeks to MVP**.
