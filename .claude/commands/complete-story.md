# Complete Story

Finalize the current story after manual testing. Either merge to main or address issues.

## Step 1: Status Check

Run these commands to understand current state:

```bash
git status
git branch --show-current
git log --oneline -5
```

Verify:

- You are on a feature/bugfix branch (NOT main)
- There are no uncommitted changes

## Step 2: Identify Story

1. Extract story ID from branch name (e.g., `feature/DS-033-load-on-activation` → `DS-033`)
2. Read the story file: `.devstories/stories/<story-id>.md`
3. Read `claude-progress.txt` to verify session was documented

## Step 3: Verify Completeness

Check these items:

1. **Story file**:

   - [ ] All worked on acceptance criteria marked as `[x]`
   - [ ] `status: done` in frontmatter
   - [ ] `## Implementation Notes` section exists
   - [ ] `updated:` date is current
2. **Progress file**:

   - [ ] Current session documented
   - [ ] Files changed listed
   - [ ] Test counts updated

## Step 4: Decision Point

If ALL checks pass, ask the user:

> "All checks passed. Ready to merge `<branch-name>` to main?"
>
> - Tests: X unit + Y integration passing
> - Story: All criteria complete
> - Documentation: Updated
>
> Merge to main now?

Wait for user confirmation before proceeding.

## Step 5: Merge Flow (if approved)

```bash
git checkout main
git pull origin main  # Ensure up to date
git merge --no-ff <branch-name> --no-gpg-sign -m "Merge <branch-name>"
git branch -d <branch-name>
```

Report:

- Merge commit hash
- Branch deleted
- Current main status
- Next actions/tasks to work on

## Critical Rules

- NEVER merge without user confirmation
- NEVER merge if tests fail
- NEVER merge if story file is incomplete
- ALWAYS use `--no-gpg-sign` for merge commits
- ALWAYS delete the feature branch after successful merge
