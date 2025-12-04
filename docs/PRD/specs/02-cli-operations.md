# CLI Operations Reference

Operations needed for managing DevStories data. Reference for future CLI implementation.

## Query Operations

### List stories by status
```
# All todo stories
grep -l "^status: todo" .devstories/stories/*.md

# Count by status
grep -h "^status:" .devstories/stories/*.md | sort | uniq -c
```

### List stories by epic
```
grep -l "^epic: EPIC-023" .devstories/stories/*.md
```

### List stories by sprint
```
grep -l "^sprint: 1.1.0" .devstories/stories/*.md
```

### Get story metadata (id, title, status)
```
grep -E "^(id|title|status):" .devstories/stories/DS-001.md
```

### Find orphan stories (epic doesn't exist)
```
# Get all epic references from stories
grep -h "^epic:" .devstories/stories/*.md | sort -u

# Get all existing epics
ls .devstories/epics/*.md | xargs -I{} basename {} .md

# Compare to find orphans
```

### Find stories with dependencies
```
grep -l "^dependencies:" .devstories/stories/*.md
```

### Search story content
```
grep -l "keyword" .devstories/stories/*.md
```

## Mutation Operations

### Change story status
Update `status:` line in frontmatter, update `updated:` date.

### Move story to different epic
Update `epic:` line in frontmatter.

### Change story sprint
Update `sprint:` line in frontmatter.

### Bulk status change
Change all stories in a sprint/epic to a status.

### Close story with note
Change status to `closed`, append closure note to body.

## Aggregation Operations

### Sprint progress
Count done vs total stories for a sprint.

### Epic progress
Count done vs total stories for an epic.

### Backlog size
Count all todo stories not assigned to a sprint.

### Stories by type
```
grep -h "^type:" .devstories/stories/*.md | sort | uniq -c
```

## Validation Operations

### Check frontmatter completeness
Required fields: id, title, type, epic, status, created, updated

### Validate epic references
All `epic:` values should have corresponding file in epics/

### Validate story links
All `[[DS-XXX]]` references should resolve to existing stories

### Check for duplicate IDs
```
grep -h "^id:" .devstories/stories/*.md | sort | uniq -d
```

## CLI Command Ideas

Based on these operations, future CLI could have:

```
ds list [--status=todo] [--epic=EPIC-001] [--sprint=1.1.0]
ds show DS-001
ds status DS-001 in_progress
ds move DS-001 --epic=EPIC-002
ds close DS-001 --reason="Deferred"
ds progress [--sprint=1.1.0] [--epic=EPIC-001]
ds validate
ds orphans
```
