#!/bin/bash
# DevStories status helper script for Claude Code sessions
# Usage: ./scripts/ds-status.sh [command]

DEVSTORIES_DIR=".devstories"
STORIES_DIR="$DEVSTORIES_DIR/stories"
EPICS_DIR="$DEVSTORIES_DIR/epics"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

case "${1:-summary}" in
  summary|s)
    echo -e "${BLUE}=== EPIC STATUS ===${NC}"
    for f in $EPICS_DIR/EPIC-*.md; do
      [ -f "$f" ] || continue
      id=$(grep "^id:" "$f" | cut -d' ' -f2)
      title=$(grep "^title:" "$f" | sed 's/^title: //' | tr -d '"')
      status=$(grep "^status:" "$f" | cut -d' ' -f2)
      case $status in
        done) color=$GREEN ;;
        in_progress) color=$YELLOW ;;
        *) color=$NC ;;
      esac
      echo -e "  $id: ${color}$status${NC} - $title"
    done

    echo ""
    echo -e "${BLUE}=== STORY STATUS ===${NC}"
    total=0
    done_count=0
    for f in $STORIES_DIR/DS-*.md; do
      [ -f "$f" ] || continue
      id=$(grep "^id:" "$f" | head -1 | cut -d' ' -f2)
      status=$(grep "^status:" "$f" | head -1 | cut -d' ' -f2)
      ((total++))
      [ "$status" = "done" ] && ((done_count++))
      case $status in
        done) color=$GREEN ;;
        in_progress) color=$YELLOW ;;
        *) color=$NC ;;
      esac
      echo -e "  $id: ${color}$status${NC}"
    done

    echo ""
    echo -e "${BLUE}=== PROGRESS ===${NC}"
    echo "  $done_count/$total stories done ($(( done_count * 100 / total ))%)"
    ;;

  stories|st)
    # Detailed story list with titles
    for f in $STORIES_DIR/DS-*.md; do
      [ -f "$f" ] || continue
      id=$(grep "^id:" "$f" | head -1 | cut -d' ' -f2)
      title=$(grep "^title:" "$f" | head -1 | sed 's/^title: //' | tr -d '"')
      status=$(grep "^status:" "$f" | head -1 | cut -d' ' -f2)
      epic=$(grep "^epic:" "$f" | head -1 | cut -d' ' -f2)
      case $status in
        done) color=$GREEN ;;
        in_progress) color=$YELLOW ;;
        *) color=$NC ;;
      esac
      echo -e "$id [${color}$status${NC}] ($epic): $title"
    done
    ;;

  epics|e)
    # Detailed epic list with story counts
    for f in $EPICS_DIR/EPIC-*.md; do
      [ -f "$f" ] || continue
      id=$(grep "^id:" "$f" | cut -d' ' -f2)
      title=$(grep "^title:" "$f" | sed 's/^title: //' | tr -d '"')
      status=$(grep "^status:" "$f" | cut -d' ' -f2)

      # Count stories for this epic
      total=0
      done_count=0
      for sf in $STORIES_DIR/DS-*.md; do
        [ -f "$sf" ] || continue
        story_epic=$(grep "^epic:" "$sf" | head -1 | cut -d' ' -f2)
        if [ "$story_epic" = "$id" ]; then
          ((total++))
          story_status=$(grep "^status:" "$sf" | head -1 | cut -d' ' -f2)
          [ "$story_status" = "done" ] && ((done_count++))
        fi
      done

      case $status in
        done) color=$GREEN ;;
        in_progress) color=$YELLOW ;;
        *) color=$NC ;;
      esac
      echo -e "$id [${color}$status${NC}]: $title ($done_count/$total stories)"
    done
    ;;

  todo|t)
    # List only todo stories
    echo -e "${BLUE}=== TODO STORIES ===${NC}"
    for f in $STORIES_DIR/DS-*.md; do
      [ -f "$f" ] || continue
      status=$(grep "^status:" "$f" | head -1 | cut -d' ' -f2)
      [ "$status" != "todo" ] && continue
      id=$(grep "^id:" "$f" | head -1 | cut -d' ' -f2)
      title=$(grep "^title:" "$f" | head -1 | sed 's/^title: //' | tr -d '"')
      epic=$(grep "^epic:" "$f" | head -1 | cut -d' ' -f2)
      echo "  $id ($epic): $title"
    done
    ;;

  next|n)
    # Show next story to work on (first todo)
    for f in $STORIES_DIR/DS-*.md; do
      [ -f "$f" ] || continue
      status=$(grep "^status:" "$f" | head -1 | cut -d' ' -f2)
      [ "$status" != "todo" ] && continue
      id=$(grep "^id:" "$f" | head -1 | cut -d' ' -f2)
      title=$(grep "^title:" "$f" | head -1 | sed 's/^title: //' | tr -d '"')
      epic=$(grep "^epic:" "$f" | head -1 | cut -d' ' -f2)
      echo "Next story: $id ($epic)"
      echo "Title: $title"
      echo "File: $f"
      break
    done
    ;;

  *)
    echo "DevStories Status Helper"
    echo ""
    echo "Usage: ./scripts/ds-status.sh [command]"
    echo ""
    echo "Commands:"
    echo "  summary, s  - Overview of all epics and stories (default)"
    echo "  stories, st - Detailed story list with titles"
    echo "  epics, e    - Detailed epic list with story counts"
    echo "  todo, t     - List only todo stories"
    echo "  next, n     - Show next story to work on"
    ;;
esac
