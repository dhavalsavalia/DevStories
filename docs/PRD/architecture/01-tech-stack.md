# Technical Architecture

## Tech Stack

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| **TypeScript** | ^5.0 | Extension language |
| **VS Code Extension API** | ^1.85 | Platform |
| **Node.js** | ^18.0 | Runtime |

### Dependencies

| Package | Purpose |
|---------|---------|
| **gray-matter** | YAML frontmatter parsing |
| **remark** | Markdown AST parsing |
| **chokidar** | File watching (if needed beyond VS Code API) |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| **@vscode/test-electron** | Integration tests |
| **vitest** | Unit tests |
| **@types/vscode** | VS Code API types |
| **@types/node** | Node.js types |
| **c8** | Code coverage |
| **esbuild** | Bundling |

---

## Extension Structure

```
devstories/
├── src/
│   ├── extension.ts              # Entry point
│   │
│   ├── core/
│   │   ├── parser.ts             # Markdown + frontmatter parsing
│   │   ├── store.ts              # In-memory story state
│   │   ├── watcher.ts            # File system watching
│   │   └── writer.ts             # Write changes back to files
│   │
│   ├── providers/
│   │   ├── treeProvider.ts       # Sidebar tree view
│   │   ├── hoverProvider.ts      # [[STORY-ID]] hover preview
│   │   └── linkProvider.ts       # [[STORY-ID]] clickable links
│   │
│   ├── views/
│   │   ├── boardView.ts          # Kanban webview controller
│   │   └── statusBar.ts          # Progress bar in status bar
│   │
│   ├── commands/
│   │   ├── init.ts               # Initialize .devstories/
│   │   ├── createEpic.ts         # Create epic command
│   │   ├── createStory.ts        # Create story command
│   │   ├── quickCapture.ts       # Cmd+Shift+S quick capture
│   │   └── changeStatus.ts       # Change story status
│   │
│   ├── utils/
│   │   ├── idGenerator.ts        # Generate story/epic IDs
│   │   ├── linkResolver.ts       # Resolve [[ID]] to file path
│   │   └── validator.ts          # Validate story/epic frontmatter
│   │
│   └── types/
│       ├── story.ts              # Story type definitions
│       ├── epic.ts               # Epic type definitions
│       └── config.ts             # Config type definitions
│
├── webview/                      # Board view HTML/CSS/JS
│   ├── board.html
│   ├── board.css
│   └── board.js
│
├── test/
│   ├── unit/
│   │   ├── parser.test.ts
│   │   ├── store.test.ts
│   │   ├── idGenerator.test.ts
│   │   └── linkResolver.test.ts
│   │
│   └── integration/
│       ├── extension.test.ts
│       ├── treeView.test.ts
│       ├── commands.test.ts
│       └── webview.test.ts
│
├── package.json
├── tsconfig.json
├── .vscodeignore
├── README.md
└── CHANGELOG.md
```

---

## Core Components

### 1. Parser (src/core/parser.ts)

**Responsibility:** Parse markdown files with YAML frontmatter

```typescript
interface ParseResult {
  frontmatter: StoryFrontmatter | EpicFrontmatter;
  content: string;
  rawMarkdown: string;
}

function parseStory(filePath: string): ParseResult;
function parseEpic(filePath: string): ParseResult;
```

**Uses:**
- gray-matter for frontmatter extraction
- remark for markdown AST

---

### 2. Store (src/core/store.ts)

**Responsibility:** In-memory cache of all stories and epics

```typescript
class StoryStore {
  private stories: Map<string, Story>;
  private epics: Map<string, Epic>;

  async load(rootPath: string): Promise<void>;
  getStory(id: string): Story | undefined;
  getEpic(id: string): Epic | undefined;
  getStoriesByEpic(epicId: string): Story[];
  getStoriesBySprint(sprint: string): Story[];

  // Listeners for UI updates
  onStoryChanged: Event<Story>;
  onEpicChanged: Event<Epic>;
}
```

**Characteristics:**
- Single source of truth for UI
- Fast lookups by ID
- Emits events on changes
- Rebuilds from file system on startup

---

### 3. Watcher (src/core/watcher.ts)

**Responsibility:** Watch .devstories/ for file changes

```typescript
class FileWatcher {
  async start(rootPath: string): Promise<void>;

  // Events
  onFileCreated: Event<string>;
  onFileChanged: Event<string>;
  onFileDeleted: Event<string>;
}
```

**Behavior:**
- Uses VS Code's FileSystemWatcher
- Triggers store updates
- Debounced to avoid thrashing

---

### 4. Writer (src/core/writer.ts)

**Responsibility:** Write changes back to markdown files

```typescript
async function updateStoryStatus(
  storyId: string,
  newStatus: string
): Promise<void>;

async function updateStoryFrontmatter(
  storyId: string,
  updates: Partial<StoryFrontmatter>
): Promise<void>;
```

**Behavior:**
- Preserves markdown content
- Only updates frontmatter
- Auto-updates `updated` timestamp
- Triggers file watcher

---

### 5. Tree Provider (src/providers/treeProvider.ts)

**Responsibility:** Sidebar tree view

```typescript
class StoriesTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  getTreeItem(element: TreeItem): vscode.TreeItem;
  getChildren(element?: TreeItem): Thenable<TreeItem[]>;

  refresh(): void;  // Called on store changes
}
```

**Tree Structure:**
```
📁 EPIC-001: User Authentication
  💡 STORY-001: Login form (M) ● In Progress
  💡 STORY-002: Registration (L) ● To Do
  🐛 STORY-003: Fix login bug (S) ● Done
```

---

### 6. Board View (src/views/boardView.ts)

**Responsibility:** Kanban board webview

```typescript
class BoardViewProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(webviewView: vscode.WebviewView): void;

  private handleMessage(message: any): void;
  private updateWebview(): void;
}
```

**Communication:**
- Extension → Webview: `postMessage({ type: 'update', stories: [...] })`
- Webview → Extension: `postMessage({ type: 'statusChange', storyId, newStatus })`

---

## Data Flow

### Loading Stories

```
Extension Activation
  ↓
Store.load()
  ↓
Find all .md files in .devstories/
  ↓
Parser.parseStory() for each
  ↓
Store.stories Map populated
  ↓
TreeProvider.refresh()
```

### Changing Status

```
User clicks status in tree view
  ↓
Command: changeStatus(storyId, newStatus)
  ↓
Writer.updateStoryStatus()
  ↓
File is updated
  ↓
FileWatcher detects change
  ↓
Store reloads story
  ↓
Store.onStoryChanged fires
  ↓
TreeProvider.refresh()
BoardView.updateWebview()
```

### Quick Capture

```
User presses Cmd+Shift+S
  ↓
Input box appears
  ↓
User types title, presses Enter
  ↓
IDGenerator.nextStoryId()
  ↓
Writer.createStory(title, defaults)
  ↓
File created
  ↓
FileWatcher detects new file
  ↓
Store loads story
  ↓
TreeProvider.refresh()
  ↓
vscode.window.showTextDocument(story file)
```

---

## Performance Considerations

### Lazy Loading
- Parse stories only when needed
- Webview only loads visible stories

### Debouncing
- File watcher events debounced (100ms)
- Tree refresh debounced (50ms)

### Caching
- Parsed stories cached in Store
- Invalidated on file change

### Limits
- Warn if >1000 stories in workspace
- Paginate board view if >100 stories

---

## Error Handling

### Parse Errors
- Show warning notification
- Mark story as "invalid" in tree
- Allow user to fix manually

### Missing Dependencies
- Show warning if [[STORY-ID]] references missing story
- Highlight in hover preview

### Corrupted config.yaml
- Extension activation fails gracefully
- Prompt user to fix or re-initialize

---

## Testing Strategy

### Unit Tests (Vitest)
- Parser: valid/invalid frontmatter
- IDGenerator: sequential IDs, custom prefixes
- LinkResolver: resolve links, handle missing
- Store: CRUD operations, events

### Integration Tests (@vscode/test-electron)
- Extension activation
- Commands registration
- Tree view rendering
- Webview communication

### Manual Testing
- Create story → verify file
- Change status → verify file update
- Quick capture → verify speed
- Board drag-drop → verify status change
