# Markdown Specification v0.1

This document defines the DevStories markdown format.

## Directory Structure

```
.devstories/
├── config.yaml           # Project configuration
├── epics/
│   ├── EPIC-001.md      # Epic files
│   ├── EPIC-002.md
│   └── ...
└── stories/
    ├── STORY-001.md     # Story files
    ├── STORY-002.md
    └── ...
```

## Configuration File (config.yaml)

```yaml
version: 1
project: "My Project Name"

# ID generation mode
id_mode: auto  # auto | manual

# ID prefixes (customizable)
id_prefix:
  epic: "EPIC"      # Can be: EPIC, E, EP, etc.
  story: "STORY"    # Can be: STORY, US, FEAT, TASK, PROJ, etc.

# Board columns (status workflow)
statuses:
  - id: backlog
    label: "Backlog"
    color: "#6B7280"
  - id: todo
    label: "To Do"
    color: "#3B82F6"
  - id: in_progress
    label: "In Progress"
    color: "#F59E0B"
  - id: review
    label: "Review"
    color: "#8B5CF6"
  - id: done
    label: "Done"
    color: "#10B981"

# Sprint configuration
sprints:
  current: "sprint-4"

# Size options
sizes: ["XS", "S", "M", "L", "XL"]

# Story templates per type
templates:
  feature: |
    ## User Story
    As a [user], I need [feature] so that [benefit].

    ## Acceptance Criteria
    - [ ]

    ## Technical Notes

    ## Files to Modify

  bug: |
    ## Bug Description

    ## Steps to Reproduce
    1.

    ## Expected vs Actual

    ## Root Cause

  task: |
    ## Task Description

    ## Checklist
    - [ ]

  chore: |
    ## Description

    ## Checklist
    - [ ]
```

### Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | number | Yes | Spec version (currently 1) |
| `project` | string | Yes | Project name |
| `id_mode` | enum | Yes | `auto` or `manual` |
| `id_prefix.epic` | string | Yes | Prefix for epic IDs |
| `id_prefix.story` | string | Yes | Prefix for story IDs |
| `statuses` | array | Yes | Board column definitions |
| `sprints.current` | string | No | Current sprint identifier |
| `sizes` | array | Yes | Valid story sizes |
| `templates` | object | Yes | Templates per story type |

## Epic Format

```markdown
---
id: EPIC-001
title: User Authentication System
status: in_progress
sprint: sprint-4
created: 2025-01-15
---

# User Authentication System

## Description
Implement complete user authentication flow including login, logout, registration, and password reset functionality.

## Acceptance Criteria
- [ ] Users can register with email/password
- [ ] Users can login/logout
- [ ] Password reset via email link
- [ ] Session management with JWT
- [ ] Protected routes

## Stories
<!-- Auto-populated by extension, or manually maintained -->
- [[STORY-001]] - Login form UI
- [[STORY-002]] - Registration flow
- [[STORY-003]] - Password reset
- [[STORY-004]] - JWT session management

## Notes
- Use bcrypt for password hashing
- JWT tokens expire after 24 hours
- Email service: SendGrid
```

### Epic Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique epic ID (format: PREFIX-NNN) |
| `title` | string | Yes | Epic title |
| `status` | enum | Yes | One of configured status IDs |
| `sprint` | string | No | Sprint identifier |
| `created` | date | Yes | Creation date (YYYY-MM-DD) |

## Story Format

```markdown
---
id: STORY-001
title: Login Form Implementation
type: feature
epic: EPIC-001
status: todo
sprint: sprint-4
size: M
assignee: ""
dependencies:
  - STORY-005
  - STORY-006
created: 2025-01-15
updated: 2025-01-20
---

# Login Form Implementation

## User Story
As a user, I need to login with my email and password so that I can access my account.

## Acceptance Criteria
- [ ] Email/password form with proper validation
- [ ] Error messages for invalid credentials
- [ ] "Remember me" checkbox
- [ ] Link to password reset ([[STORY-003]])
- [ ] Loading state during auth
- [ ] Redirect to dashboard on success

## Technical Notes
- Use existing auth service (src/services/auth.ts)
- Follow design system patterns (Button, Input components)
- Form validation with Zod schema
- Accessibility: ARIA labels, keyboard navigation

## Files to Modify
- `src/pages/Login.tsx` - Login component
- `src/services/auth.ts` - Auth service integration
- `src/styles/login.css` - Styling

## Dependencies
Depends on:
- [[STORY-005]] (Auth Service API) - Must be implemented first
- [[STORY-006]] (Design System) - Need Button and Input components

## Resources
- [Figma Design](https://figma.com/file/xyz)
- [Auth Service Docs](https://docs.example.com/auth)
```

### Story Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique story ID (format: PREFIX-NNN) |
| `title` | string | Yes | Story title |
| `type` | enum | Yes | `feature`, `bug`, `task`, or `chore` |
| `epic` | string | Yes | Parent epic ID |
| `status` | enum | Yes | One of configured status IDs |
| `sprint` | string | No | Sprint identifier |
| `size` | enum | Yes | One of configured sizes |
| `assignee` | string | No | Assignee name or identifier |
| `dependencies` | array | No | List of story IDs this depends on |
| `created` | date | Yes | Creation date (YYYY-MM-DD) |
| `updated` | date | No | Last update date (auto-updated) |

## Story Types

| Type | Icon | Use Case |
|------|------|----------|
| `feature` | 💡 lightbulb | New functionality |
| `bug` | 🐛 bug | Bug fixes |
| `task` | ☑️ checklist | General tasks, chores that don't fit other types |
| `chore` | 🔧 wrench | Maintenance, refactoring, tooling |

## Story Linking

Stories can reference each other using wiki-link syntax:

```markdown
Depends on [[STORY-005]] and [[STORY-006]].
See also [[EPIC-001]] for context.
```

**Behavior:**
- `[[STORY-ID]]` becomes clickable in VS Code
- Hover shows story card preview (title, status, type, size)
- Ctrl+click navigates to the story file

## Auto-Timestamps

The `updated` field is automatically updated when:
- Story file is saved
- Status is changed via command
- Story is edited via extension UI

## Validation Rules

1. **IDs must be unique** across all stories and epics
2. **Epic must exist** for every story (no orphan stories)
3. **Status must be valid** (one of configured statuses)
4. **Size must be valid** (one of configured sizes)
5. **Dependencies must exist** (no dangling references)
6. **Dates must be valid** (YYYY-MM-DD format)

## Migration Strategy

When upgrading spec versions:
- Extension will detect old version in config.yaml
- Prompt user to migrate
- Automatic migration when possible
- Manual steps documented for breaking changes
