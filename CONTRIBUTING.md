# Contributing to DevStories

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Development Setup

**Requirements:** Node.js 20 or higher (use `nvm use` to switch)

```bash
# Clone the repo
git clone https://github.com/dhavalsavalia/devstories.git
cd devstories

# Install dependencies
npm install

# Compile
npm run compile

# Run tests
npm test                  # Unit tests (Vitest)
npm run test:integration  # Integration tests (@vscode/test-electron)
```

## Running the Extension

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Use the test workspace at `/path/to/devstories_test` for manual testing

## Project Structure

```
devstories/
├── src/
│   ├── extension.ts          # Entry point
│   ├── core/                  # Parser, store, watcher, config
│   ├── commands/              # Command implementations
│   ├── view/                  # Tree view, status bar providers
│   └── providers/             # Link, hover providers
├── webview/                   # Board view HTML/CSS/JS
├── test/
│   ├── unit/                  # Vitest unit tests
│   └── suite/                 # Integration tests
└── assets/                    # Icons, screenshots
```

## Testing

- **TDD approach**: Write failing test first, then implement
- **Unit tests**: Pure logic without VS Code API (Vitest)
- **Integration tests**: VS Code API interactions (@vscode/test-electron)

```bash
npm test                  # Run unit tests
npm run test:integration  # Run integration tests
./init.sh                 # Full environment check + all tests
```

## Documentation

- `CLAUDE.md` — AI assistant instructions (not for users)
- `docs/PRD/` — Product requirements and specs
- `.devstories/` — DevStories manages its own development

## Commit Guidelines

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Reference story IDs: `feat: add quick capture (DS-013)`
- Keep commits focused and atomic
