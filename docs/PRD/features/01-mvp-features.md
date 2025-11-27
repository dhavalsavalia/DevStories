# MVP Features (v0.1)

This document defines the Minimum Viable Product for DevStories.

## Feature Prioritization

Features are grouped into three tiers:

- **P0 (Must Have)**: Core functionality, without these it's not usable
- **P1 (Should Have)**: Important for good UX, but can ship without
- **P2 (Nice to Have)**: Polish, can ship post-MVP

## P0 - Must Have (11 features)

### 1. Init Command

**Command:** `DevStories: Initialize`

**Behavior:**
- Creates `.devstories/` directory structure
- Generates config.yaml with defaults
- Creates epics/ and stories/ subdirectories
- Adds `.devstories/` to .gitignore if requested

**Success Criteria:**
- ✅ Command runs without errors
- ✅ Valid directory structure created
- ✅ config.yaml is valid YAML
- ✅ User can immediately create stories

---

### 2. Tree View

**Location:** VS Code sidebar (activity bar)

**Shows:**
- Epics as top-level items
- Stories nested under epics
- Icons for story types (💡/🐛/☑️/🔧)
- Status indicators (colored dots)

**Interactions:**
- Click to open story file
- Expand/collapse epics
- Right-click context menu (change status, delete)

**Success Criteria:**
- ✅ Tree refreshes on file changes
- ✅ Hierarchy is correct
- ✅ Icons are intuitive
- ✅ Click opens correct file

---

### 3. Create Epic

**Command:** `DevStories: Create Epic`

**Flow:**
1. User runs command
2. Prompt for epic title
3. Generate epic ID (auto or manual)
4. Create epic file with template
5. Open epic file for editing

**Success Criteria:**
- ✅ Epic created in epics/
- ✅ Frontmatter is valid
- ✅ Template is applied
- ✅ File opens immediately

---

### 4. Create Story

**Command:** `DevStories: Create Story`

**Flow:**
1. User runs command
2. Select parent epic (dropdown)
3. Prompt for story title
4. Select story type (feature/bug/task/chore)
5. Generate story ID
6. Create story file with type-specific template
7. Open story file for editing

**Success Criteria:**
- ✅ Story created in stories/
- ✅ Frontmatter is valid
- ✅ Epic reference is correct
- ✅ Template matches story type

---

### 5. Quick Capture ⭐

**Keybind:** `Cmd+Shift+S` (customizable)

**Flow:**
1. User presses keybind
2. Input box appears (stay in current file)
3. Type story title
4. Press Enter
5. Story created with defaults (type=task, size=M, current sprint)

**Success Criteria:**
- ✅ Works from any file
- ✅ No context switching
- ✅ <1 second from keybind to created
- ✅ Tree view updates immediately

---

### 6. Story Templates ⭐

**Location:** Defined in config.yaml

**Behavior:**
- Each story type has a template
- Template applied when creating story
- Templates are customizable in config

**Default Templates:**
- **feature**: User story + AC + technical notes
- **bug**: Bug description + steps to reproduce
- **task**: Task description + checklist
- **chore**: Description + checklist

**Success Criteria:**
- ✅ Template applied on create
- ✅ User can customize in config
- ✅ Changes take effect immediately

---

### 7. Status Toggle

**Trigger:** Right-click story in tree view

**Behavior:**
- Context menu shows status options
- Clicking status updates frontmatter
- File is auto-saved
- `updated` field is set to today

**Success Criteria:**
- ✅ Status changes in file
- ✅ Tree view updates immediately
- ✅ Updated timestamp is correct

---

### 8. Story Links

**Syntax:** `[[STORY-001]]`

**Behavior:**
- Links are clickable (Ctrl+click)
- Navigate to story file
- Works in any markdown file in workspace

**Success Criteria:**
- ✅ Links detected correctly
- ✅ Navigation works
- ✅ Invalid IDs show warning

---

### 9. Inline Preview ⭐

**Trigger:** Hover over `[[STORY-ID]]`

**Shows:**
- Story title
- Status (with colored indicator)
- Story type (with icon)
- Size
- Epic name

**Appearance:**
```
┌─────────────────────────────────────┐
│ 💡 STORY-001 (M)                    │
│ Login Form Implementation           │
│ ● In Progress | Epic: Auth System  │
└─────────────────────────────────────┘
```

**Success Criteria:**
- ✅ Hover shows preview
- ✅ Preview is readable
- ✅ Updates when story changes

---

### 10. Progress Bar ⭐

**Location:** VS Code status bar (bottom)

**Shows:** `Sprint 4: ████░░ 8/12`

**Behavior:**
- Counts stories in current sprint
- Shows done vs total
- Progress bar visualization
- Click to filter tree by current sprint

**Success Criteria:**
- ✅ Accurate count
- ✅ Updates on status change
- ✅ Click action works

---

### 11. Auto-timestamps ⭐

**Trigger:** File save

**Behavior:**
- Detects story file save
- Updates `updated` field to today
- No user action required

**Success Criteria:**
- ✅ Updates on save
- ✅ Doesn't update on trivial changes
- ✅ Format is YYYY-MM-DD

---

## P1 - Should Have (2 features)

### 12. Board View

**Command:** `DevStories: Open Board`

**Shows:**
- Kanban board with configured columns
- Stories as cards
- Drag-drop between columns

**Interactions:**
- Drag story to change status
- Click story to open file
- Filter by sprint

**Success Criteria:**
- ✅ All stories visible
- ✅ Drag-drop updates file
- ✅ Board syncs with file changes

---

### 13. Sprint Filter

**Location:** Tree view toolbar + board view

**Behavior:**
- Dropdown of sprints (from stories)
- Filter tree/board to show only selected sprint
- "All sprints" option

**Success Criteria:**
- ✅ Filter works correctly
- ✅ Preserves selection across restarts
- ✅ Updates when sprint changes

---

## P2 - Nice to Have (Post-MVP)

### 14. Dependency Graph

Visualize story dependencies as a directed graph.

### 15. Auto-link Commits

Parse commit messages like `feat(STORY-001): add login` and create links.

---

## Feature Dependencies

```
Init (1)
  ↓
Tree View (2) + Create Epic (3)
  ↓
Create Story (4)
  ↓
  ├─ Quick Capture (5)
  ├─ Story Templates (6)
  ├─ Status Toggle (7)
  └─ Story Links (8)
       ↓
       └─ Inline Preview (9)

Progress Bar (10) - standalone
Auto-timestamps (11) - standalone

Board View (12) - requires Tree View
Sprint Filter (13) - requires Board View
```

---

## Out of Scope for v0.1

- GitHub/GitLab integration
- Multi-repo support
- Comments on stories
- Story assignment notifications
- Custom fields
- Time tracking
- Velocity charts
