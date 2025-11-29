# Archive Progress

Archive old sessions from `claude-progress.txt` to keep it manageable.

## Steps

1. Run the archive script:
   ```bash
   ./scripts/archive-progress.sh --keep 5
   ```

2. Review what was archived:
   - Old sessions moved to `claude-progress-archive.txt`
   - Summary header added to `claude-progress.txt`
   - Last 5 sessions preserved

3. Optionally commit the archive:
   ```bash
   git add claude-progress.txt claude-progress-archive.txt
   git commit --no-gpg-sign -m "chore: archive old progress sessions"
   ```

Use this command when `claude-progress.txt` exceeds ~1000 lines or ~15 sessions.
