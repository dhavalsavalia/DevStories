#!/bin/bash
# Archive old progress sessions to keep claude-progress.txt manageable
# Usage: ./scripts/archive-progress.sh [--keep N]
#   --keep N: Keep last N sessions (default: 5)

set -e

PROGRESS_FILE="claude-progress.txt"
ARCHIVE_FILE="claude-progress-archive.txt"
KEEP_SESSIONS=5

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --keep)
      KEEP_SESSIONS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ ! -f "$PROGRESS_FILE" ]]; then
  echo "No progress file found"
  exit 0
fi

# Count sessions (each starts with "=== Session:")
TOTAL_SESSIONS=$(grep -c "^=== Session:" "$PROGRESS_FILE" || echo 0)

if [[ "$TOTAL_SESSIONS" -le "$KEEP_SESSIONS" ]]; then
  echo "Only $TOTAL_SESSIONS sessions, keeping all (threshold: $KEEP_SESSIONS)"
  exit 0
fi

ARCHIVE_COUNT=$((TOTAL_SESSIONS - KEEP_SESSIONS))
echo "Archiving $ARCHIVE_COUNT sessions, keeping $KEEP_SESSIONS"

# Find line number where we should split (keep last N sessions)
# Get line numbers of all session headers, take the Nth from the end
SPLIT_LINE=$(grep -n "^=== Session:" "$PROGRESS_FILE" | tail -n "$KEEP_SESSIONS" | head -1 | cut -d: -f1)

if [[ -z "$SPLIT_LINE" ]]; then
  echo "Error: Could not determine split point"
  exit 1
fi

# Extract sessions to archive (everything before split line)
ARCHIVE_CONTENT=$(head -n $((SPLIT_LINE - 1)) "$PROGRESS_FILE")

# Create summary of archived sessions
SUMMARY="=== Archived $(date +%Y-%m-%d) ===
Sessions archived: $ARCHIVE_COUNT
Date range: $(echo "$ARCHIVE_CONTENT" | grep "^=== Session:" | head -1 | sed 's/=== Session: //' | sed 's/ ===//')  to  $(echo "$ARCHIVE_CONTENT" | grep "^=== Session:" | tail -1 | sed 's/=== Session: //' | sed 's/ ===//')
Stories completed: $(echo "$ARCHIVE_CONTENT" | grep -c "^Status: done" || echo 0)

---

"

# Append to archive file
if [[ -f "$ARCHIVE_FILE" ]]; then
  echo "$ARCHIVE_CONTENT" >> "$ARCHIVE_FILE"
  echo -e "\n---\n" >> "$ARCHIVE_FILE"
else
  echo "$ARCHIVE_CONTENT" > "$ARCHIVE_FILE"
  echo -e "\n---\n" >> "$ARCHIVE_FILE"
fi

# Keep only recent sessions in progress file
tail -n +$SPLIT_LINE "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp"

# Prepend summary header to new progress file
echo "$SUMMARY$(cat "${PROGRESS_FILE}.tmp")" > "$PROGRESS_FILE"
rm "${PROGRESS_FILE}.tmp"

echo "Done. Archived $ARCHIVE_COUNT sessions to $ARCHIVE_FILE"
echo "Progress file now has $KEEP_SESSIONS sessions"
