---
id: EPIC-006
title: "Phase 6: Sprint Management"
status: todo
created: 2025-11-28
updated: 2025-11-28
---

# Phase 6: Sprint Management

## Vision

Transform DevStories from a static story tracker into a dynamic sprint planning tool. Enable developers to create, plan, execute, and close sprints without leaving VS Code.

## Problem Statement

Currently, sprints are just string labels in story frontmatter. There's no:
- Sprint lifecycle (create → plan → start → close)
- Sprint metadata (dates, goals, velocity)
- Planning interface (drag stories into sprints)
- Progress tracking (burndown, completion %)
- Sprint transitions (what happens to incomplete work?)

## Success Criteria

- [ ] Create sprints with dates, goals, and capacity
- [ ] Plan sprints by dragging stories from backlog
- [ ] Start/close sprints with proper state transitions
- [ ] Track sprint progress in status bar and board
- [ ] Handle incomplete stories on sprint close
- [ ] View sprint history and velocity trends

## Stories

| ID | Title | Size | Status |
|----|-------|------|--------|
| DS-028 | Sprint config schema + parser | S | todo |
| DS-029 | createSprint command + UI | S | todo |
| DS-030 | startSprint + closeSprint commands | M | todo |
| DS-031 | Sprint picker in status bar | S | todo |
| DS-032 | Sprint planning webview | L | todo |
| DS-033 | Sprint management panel | M | todo |

## Technical Architecture

### Config Schema Extension

```yaml
# .devstories/config.yaml
sprints:
  current: "sprint-5"           # Currently active sprint
  velocity_avg: 21              # Auto-calculated from history
  list:
    - id: "sprint-5"
      name: "Sprint 5 - User Auth"
      status: active            # planned | active | completed
      start: 2025-11-25
      end: 2025-12-06
      goal: "Complete user authentication flow"
      capacity: 25              # Story points planned
      completed: 13             # Points done (auto-updated)
    - id: "sprint-4"
      status: completed
      # ...
```

### New Files

```
src/
├── core/
│   └── sprintManager.ts        # Sprint CRUD, state machine
├── commands/
│   ├── createSprint.ts
│   ├── startSprint.ts
│   ├── closeSprint.ts
│   └── planSprint.ts
├── view/
│   └── sprintPlanningView.ts   # Two-panel planning webview
└── providers/
    └── sprintStatusBar.ts      # Status bar item
webview/
├── sprintPlanning.html
├── sprintPlanning.css
└── sprintPlanning.js
```

### Sprint State Machine

```
[No Sprint] --createSprint--> [Planned]
[Planned] --startSprint--> [Active]
[Active] --closeSprint--> [Completed]

Only ONE sprint can be [Active] at a time.
Multiple sprints can be [Planned].
```

### Story Transitions on Sprint Close

```
Sprint closes with incomplete stories:
┌─────────────────────────────────────────┐
│  What would you like to do with         │
│  incomplete stories?                    │
│                                         │
│  ○ Move to next sprint                  │
│  ○ Move to backlog                      │
│  ○ Choose individually                  │
└─────────────────────────────────────────┘
```

## UI/UX Design

### Status Bar Sprint Indicator

```
┌────────────────────────────────────────────────────────────┐
│ Sprint 5 ▾  ████████░░ 52% (13/25)  │  4 days left        │
└────────────────────────────────────────────────────────────┘
     ↑                    ↑                   ↑
   Click to           Progress bar        Countdown
   switch sprint      with points

Click opens sprint picker:
┌──────────────────────────┐
│ ● Sprint 5 (active)      │
│ ○ Sprint 6 (planned)     │
│ ─────────────────────    │
│ + Create New Sprint      │
│ ⚙ Manage Sprints         │
└──────────────────────────┘
```

### Sprint Planning View

```
┌─────────────────────────────────────────────────────────────────────┐
│  Sprint Planning: Sprint 6                                    [×]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─── Backlog ──────────────┐   ┌─── Sprint 6 ──────────────────┐  │
│  │                          │   │                                │  │
│  │ ┌──────────────────────┐ │   │ Goal: Complete payment flow    │  │
│  │ │ ✨ DS-040           S│ │◀──│ Capacity: 0/25 pts             │  │
│  │ │ Payment form         │ │   │ ─────────────────────────────  │  │
│  │ └──────────────────────┘ │   │                                │  │
│  │ ┌──────────────────────┐ │   │  (Drag stories here)           │  │
│  │ │ 🐛 DS-041           M│ │──▶│                                │  │
│  │ │ Fix checkout bug     │ │   │                                │  │
│  │ └──────────────────────┘ │   │                                │  │
│  │                          │   │                                │  │
│  │ Filter: ▾ All Types      │   │                                │  │
│  └──────────────────────────┘   └────────────────────────────────┘  │
│                                                                     │
│  [Cancel]                              [Save] [Start Sprint]        │
└─────────────────────────────────────────────────────────────────────┘
```

### Board Header Sprint Section

```
┌─────────────────────────────────────────────────────────────────────┐
│  Sprint: [Sprint 5 ▾]  │  Goal: Complete auth  │  [+ New Sprint]   │
├─────────────────────────────────────────────────────────────────────┤
│  Filter: [All Sprints ▾] [All Epics ▾] [All Types ▾] 🔍 Search     │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Order

1. **DS-028**: Sprint config schema + parser
   - Extend config.yaml schema
   - Add sprint type definitions
   - Parser for sprint data
   - Validation

2. **DS-029**: createSprint command
   - Quick pick for sprint name
   - Date pickers (start/end)
   - Goal input
   - Capacity input
   - Write to config.yaml

3. **DS-030**: startSprint + closeSprint
   - Start: Set as current, change status to active
   - Close: Show incomplete story dialog, update statuses
   - Velocity calculation

4. **DS-031**: Sprint picker in status bar
   - StatusBarItem with sprint name + progress
   - Click to open sprint picker
   - Quick switch between sprints

5. **DS-032**: Sprint planning webview
   - Two-panel layout (backlog | sprint)
   - Drag-drop between panels
   - Capacity tracking
   - Story point totals

6. **DS-033**: Sprint management panel
   - List all sprints
   - Edit sprint details
   - Delete planned sprints
   - View completed sprint summaries

## Dependencies

- Requires: EPIC-005 (Board View) complete ✅
- Enhances: Board filters (DS-023) ✅
- Uses: Drag-drop patterns from DS-021 ✅

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Complex state machine | Unit test all transitions |
| Config.yaml conflicts | File locking or merge strategy |
| Planning view complexity | Reuse board drag-drop code |
| Date handling | Use simple YYYY-MM-DD strings |

## Out of Scope (Future)

- Burndown charts (would need historical data)
- Sprint retrospectives
- Team capacity planning
- Sprint templates
- Integration with external calendars
