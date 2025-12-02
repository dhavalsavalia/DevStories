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

## CI Pipeline

The CI pipeline runs on every push to main and on pull requests:

1. **test** - Runs on Node 20.x and 22.x:
   - Type checking
   - Linting
   - Unit tests (Vitest)

2. **integration-test** - Runs after unit tests pass:
   - Uses `xvfb-run` for headless VS Code tests
   - Skipped for fork PRs (security)

### Fork PR Security

Fork PRs use a separate workflow (`pr-fork.yml`) that:
- Runs lint + unit tests only (no integration tests)
- Has no access to secrets
- Uses explicit `ref` checkout for safety
- Uses `pull_request` event (not `pull_request_target`)

## Commit Guidelines

- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Reference story IDs: `feat: add quick capture (DS-013)`
- Keep commits focused and atomic

## Releases

Releases are automated via GitHub Actions when a version tag is pushed.

### Release Process

1. Update version in `package.json`
2. Commit: `git commit -am "chore: bump version to X.Y.Z"`
3. Tag: `git tag vX.Y.Z`
4. Push: `git push && git push --tags`

The workflow will:
- Run full test suite (unit + integration)
- Build the extension
- Create GitHub Release with auto-generated notes
- Upload `.vsix` as release asset
- Publish to VS Code Marketplace

### Repository Secrets Required

| Secret | Description |
|--------|-------------|
| `VSCE_PAT` | VS Code Marketplace Personal Access Token |

**To create VSCE_PAT:**
1. Go to [Azure DevOps](https://dev.azure.com)
2. User Settings → Personal Access Tokens
3. Create token with Marketplace → Manage scope
4. Add to repo: Settings → Secrets → Actions → `VSCE_PAT`
