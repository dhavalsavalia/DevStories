# Contributing to DevStories

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Quick Start

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/devstories.git
   cd devstories
   ```

2. **Node Version** (20+)
   ```bash
   nvm use  # or ensure Node 20+
   ```

3. **Install & Compile**
   ```bash
   npm install
   npm run compile
   ```

4. **Run Tests**
   ```bash
   npm test                  # Unit tests (Vitest)
   npm run test:integration  # Integration tests
   ```

5. **Launch Extension**
   - Open project in VS Code
   - Press `F5` to launch Extension Development Host

## Branch Naming

Use prefixes that match conventional commits:

| Prefix | Use for |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `chore/` | Maintenance, deps |

Examples: `feat/quick-capture`, `fix/tree-view-refresh`, `docs/readme-update`

## Pull Request Process

1. Create a branch from `main`
2. Make your changes with tests
3. Ensure CI passes (lint, types, tests)
4. Open PR with clear description
5. Add labels for changelog (`feat`, `fix`, `docs`, `chore`)
6. One approval required to merge

## PR Labels

Labels determine how your PR appears in release notes:

| Label | Changelog Section |
|-------|-------------------|
| `feat`, `feature`, `enhancement` | 🚀 Features |
| `fix`, `bug`, `bugfix` | 🐛 Bug Fixes |
| `docs`, `documentation` | 📚 Documentation |
| `chore`, `maintenance`, `deps` | 🔧 Maintenance |

## Testing

- **TDD approach**: Write failing test first, then implement
- **Unit tests**: Pure logic without VS Code API (Vitest)
- **Integration tests**: VS Code API interactions (@vscode/test-electron)

```bash
npm test                  # Unit tests
npm run test:integration  # Integration tests
./init.sh                 # Full environment check + all tests
```

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

## CI Pipeline

Runs on every push to main and on pull requests:

1. **test** - Node 20.x and 22.x:
   - Type checking, linting, unit tests

2. **integration-test** - After unit tests pass:
   - Uses `xvfb-run` for headless VS Code tests
   - Skipped for fork PRs (security)

### Fork PR Security

Fork PRs use a separate workflow (`pr-fork.yml`) with limited scope:
- Lint + unit tests only
- No secrets access
- Uses `pull_request` event (not `pull_request_target`)

## Branch Protection

The `main` branch has protection rules enabled:

- **Require pull request**: No direct pushes to main
- **Require 1 approval**: At least one reviewer must approve
- **Require status checks**: CI must pass (`test (20.x)`, `test (22.x)`, `integration-test`)
- **Block force pushes**: History cannot be rewritten
- **No branch deletion**: Main branch cannot be deleted

### CLI Reference

To configure branch protection (maintainers only):

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["test (20.x)", "test (22.x)", "integration-test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

Or configure via GitHub UI: Settings → Branches → Add rule for `main`

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

## Documentation

- `docs/PRD/` — Product requirements and specs
- `.devstories/` — DevStories manages its own development

## Other Resources

- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
