# Core Decisions

This document captures the fundamental decisions that shape DevStories.

## Product Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Name** | DevStories | Clear, developer-focused, memorable |
| **Hierarchy** | Epic required | Forces organization, prevents chaos |
| **Dependencies** | YAML + inline links | Frontmatter for parsing, inline for readability |
| **Story IDs** | Configurable (auto/manual) | Flexibility for different workflows |
| **ID Prefixes** | Project-level config | Teams can use STORY, US, FEAT, etc. |
| **Story Types** | Built-in 4 types | feature, bug, task, chore - covers 95% of use cases |

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Platform** | VS Code Extension | Where developers already work |
| **Language** | TypeScript | Type safety, VS Code ecosystem standard |
| **Parsing** | gray-matter + remark | Battle-tested, widely used |
| **UI** | Webview for board | Native tree view + webview for kanban |
| **State** | In-memory store | Fast, simple, file system is source of truth |
| **Testing** | Vitest + @vscode/test-electron | Modern, fast, complete coverage |

## Distribution Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Marketplace** | Yes, from day 1 | Easy discovery, auto-updates |
| **Manual .vsix** | Also provided | Offline install, air-gapped environments |
| **Pricing** | Free, forever | Remove barriers, build community |
| **License** | MIT (likely) | Open source, maximum adoption |

## Design Principles

1. **Simplicity over features** - If it adds complexity, it needs strong justification
2. **Keyboard-first** - Every action accessible via keybind
3. **Fast** - No operation should feel slow
4. **Transparent** - Files are just markdown, no hidden state
5. **Git-native** - Embrace git workflows, don't fight them

## Non-Goals (What We're NOT Building)

- ❌ Time tracking
- ❌ Gantt charts
- ❌ Resource planning
- ❌ Custom fields (beyond what's in spec)
- ❌ Real-time collaboration (git is the collaboration layer)
- ❌ Mobile app
- ❌ Slack/Teams/etc. integrations (at least not in MVP)

## Future Considerations

Things we might add based on feedback:

- Velocity/burndown charts (if users want metrics)
- AI integration for story refinement (if there's demand)
- GitHub/GitLab PR linking (if workflow benefits are clear)
- Dependency graph visualization (nice to have, not essential)

## Decision Authority

For this project (initially):
- **Product decisions** - Founder/maintainer
- **Technical decisions** - Founder + community input
- **Community requests** - Evaluated against design principles
