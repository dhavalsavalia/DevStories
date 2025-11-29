# Story Implementer

You MUST implement story `$ARGUMENTS` following ALL phases below. Do NOT skip any phase.

## Phase 1: Session Start

1. Run `pwd` and `date` to verify working directory and timestamp
2. Run `./init.sh` to verify environment (deps, tests, compile)
3. Read `claude-progress.txt` for context from previous sessions

## Phase 2: Story Setup

1. Read the story file: `.devstories/stories/$ARGUMENTS.md`
2. Extract acceptance criteria and create a TodoWrite list from them
3. Determine branch type from story type:
   - `bug` → `bugfix/$ARGUMENTS-kebab-title`
   - Otherwise → `feature/$ARGUMENTS-kebab-title`
4. Create the feature branch: `git checkout -b <branch-name>`
5. Add entry to `claude-progress.txt` with current timestamp and "in_progress"

## Phase 3: Implementation (TDD - MUST FOLLOW)

For each acceptance criterion:

1. **RED**: Write a failing test first
2. **GREEN**: Implement minimal code to pass the test
3. **REFACTOR**: Clean up if needed
4. Run tests: `npm run test` (unit) and `npm run test:integration`
5. Mark the todo as complete

Do NOT skip writing tests. TDD is mandatory.

## Phase 4: Verification

1. Run `./init.sh` to run full test suite
2. Extension Development Host launches automatically for manual verification
3. Use test workspace at `/Users/dhavalsavalia/projects/devstories_test` to verify

## Phase 5: Documentation (MUST COMPLETE)

1. Update story file `.devstories/stories/$ARGUMENTS.md`:
   - Mark ALL acceptance criteria checkboxes as `[x]`
   - Add `## Implementation Notes` section with:
     - Files changed
     - Key decisions made
   - Add `## Deferred Decisions` section if anything was postponed
   - Update `updated:` date in frontmatter
   - Change `status: todo` to `status: done`

2. Update `claude-progress.txt`:
   - Session summary with work done
   - Files changed
   - Test counts
   - Next steps (if any)

3. Check if all stories in the epic are done → update epic status to `done`

## Phase 6: Commit

1. Stage all changes: `git add .`
2. Commit with descriptive message using `--no-gpg-sign`:
   ```bash
   git commit --no-gpg-sign -m "$(cat <<'EOF'
   type: description ($ARGUMENTS)

   Details here
   EOF
   )"
   ```
3. NEVER commit directly to main branch
4. Report the branch name and commit hash when done

## Critical Rules

- NEVER skip TDD - write tests FIRST
- NEVER commit to main directly
- ALWAYS use `--no-gpg-sign` for commits
- ALWAYS update story file, progress file, and epic (if applicable)
- Use TodoWrite to track progress through acceptance criteria
