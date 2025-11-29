# DevStories

**Lightweight story management in VS Code. No JIRA. No bloat. Just markdown.**

> A VS Code extension that treats markdown story files as a first-class project management system.

---

## 🎯 Vision

For developers who are tired of heavy project management tools, DevStories brings story management directly into VS Code. Your stories live as markdown files in your repo, version-controlled with Git, accessible to AI coding tools, and completely free.

**Target users:**
- Solo developers
- Small teams (2-5 people)
- Open source maintainers
- Anyone who doesn't want to spin up JIRA

---

## ✨ Key Features (v0.1 MVP)

### Must-Have (P0)
- ✅ Initialize `.devstories/` structure
- ✅ Tree view showing epics → stories
- ✅ Create epic/story commands
- ✅ **Quick Capture** (`Cmd+Shift+S`) - create story without leaving code
- ✅ **Story Templates** - different templates per type (feature/bug/task/chore)
- ✅ **Inline Preview** - hover `[[STORY-001]]` anywhere to see story card
- ✅ **Progress Bar** - status bar shows `Sprint 4: ████░░ 8/12`
- ✅ **Auto-timestamps** - `updated` field auto-updates on save
- ✅ Status toggle via right-click
- ✅ Clickable `[[STORY-ID]]` links

### Should-Have (P1)
- Kanban board view with drag-drop
- Sprint filter for tree/board

### Nice-to-Have (P2)
- Dependency graph visualization
- Auto-link commits (`feat(STORY-001):`)

---

## 🧑‍🏫 Interactive Tutorial

DevStories now includes a guided tutorial that walks through the core workflow with bundled sample data.

1. Run `npm run compile` so the latest webview assets are available.
2. Launch VS Code in extension development mode, for example:
    ```bash
    code --extensionDevelopmentPath="$(pwd)" "$(pwd)/test-workspace" --new-window
    ```
3. In the Extension Development Host, open the Command Palette and run **DevStories: Start Tutorial**.
4. Choose whether to keep using your current workspace, open the bundled sample workspace, or reset tutorial progress.
5. Inside the tutorial panel, check off steps as you complete them. Use the per-step CTA buttons to run commands like `DevStories: Init`, `DevStories: Create Epic`, and `DevStories: Quick Capture` without leaving the panel.

If you do not see the tutorial panel, confirm the command was executed (it does not auto-open on activation) and that the extension was compiled beforehand so `dist/webview/` contains the tutorial assets.

---

## 📚 Documentation

Comprehensive PRD documentation is in `/docs/PRD/`:

### Overview
- [Vision](docs/PRD/overview/01-vision.md) - Problem, solution, target audience
- [Core Decisions](docs/PRD/overview/02-core-decisions.md) - Product, technical, design principles

### Specs
- [Markdown Spec](docs/PRD/specs/01-markdown-spec.md) - Complete format specification

### Features
- [MVP Features](docs/PRD/features/01-mvp-features.md) - P0/P1/P2 feature breakdown
- [Story Breakdown](docs/PRD/features/02-story-breakdown.md) - All 23 stories with tasks

### Architecture
- [Tech Stack](docs/PRD/architecture/01-tech-stack.md) - Components, data flow, testing

---

## 🏗️ Project Structure

```
devstories/
├── docs/PRD/              # Product requirements
│   ├── overview/
│   ├── specs/
│   ├── features/
│   └── architecture/
│
├── src/                   # Extension code (to be implemented)
├── webview/               # Board view UI
├── test/                  # Unit + integration tests
└── package.json
```

---

## 🚀 Implementation Phases

| Phase | Stories | Focus | Est. Time |
|-------|---------|-------|-----------|
| **1** | DS-001 to DS-005 | Foundation (parser, store, watcher) | 1.5 weeks |
| **2** | DS-006 to DS-009 | Tree view + progress bar | 1.2 weeks |
| **3** | DS-010 to DS-015 | Commands (create, quick capture, templates) | 1.8 weeks |
| **4** | DS-016 to DS-018 | Links (clickable + inline preview) | 1.0 week |
| **5** | DS-019 to DS-023 | Board view (kanban + drag-drop) | 2.0 weeks |
| **Total** | **23 stories** | **MVP v0.1** | **~8 weeks** |

*Add 25% buffer for unknowns: ~10 weeks to MVP*

---

## 🧪 Testing Strategy

- **TDD approach**: Red → Green → Refactor
- **Unit tests**: Vitest (parser, store, utils)
- **Integration tests**: @vscode/test-electron (commands, views, webview)
- **Manual testing**: Real-world usage during development

---

## 📦 Distribution

- **VS Code Marketplace**: Primary distribution (auto-updates)
- **Manual .vsix**: For offline install / air-gapped environments
- **Pricing**: Free, forever
- **License**: MIT (likely)

---

## 🎨 Example: DevStories Managing Itself

This extension will be built using DevStories to manage its own development:

```
.devstories/
├── config.yaml
├── epics/
│   ├── EPIC-001-foundation.md
│   ├── EPIC-002-tree-view.md
│   ├── EPIC-003-commands.md
│   ├── EPIC-004-links.md
│   └── EPIC-005-board-view.md
└── stories/
    ├── DS-001-scaffolding.md
    ├── DS-002-parser.md
    ├── DS-003-watcher.md
    └── ...
```

**Dogfooding from day 1.**

---

## 🤝 Contributing

*(To be added once implementation starts)*

This is currently in the planning phase. Implementation will begin soon.

---

## 📝 License

MIT (to be confirmed)

---

## 💡 Inspiration

Built by developers, for developers who:
- Want stories without spinning up heavy software
- Believe in version-controlled project management
- Live in VS Code and don't want context switching
- Value simplicity over enterprise features

---

**Status:** 📝 Planning Complete → 🚀 Ready for Implementation
