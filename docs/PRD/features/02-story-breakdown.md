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
