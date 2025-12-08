---
id: EPIC-027
title: "UX Cohesion & Custom Config Fixes"
created: 2025-12-05
updated: 2025-12-05
---

# UX Cohesion & Custom Config Fixes

Fix hardcoded values and inconsistencies that break UX with custom configurations. Ensures the "custom workflow" promise actually works.

## Goals

- Remove hardcoded status/size values that break custom configs
- Surface errors to users instead of silent failures
- Achieve epic/story feature parity
- Derive epic status from stories (zero maintenance)

## Stories

- [[DS-175]] - Fix hardcoded 'done' status checks
- [[DS-176]] - Fix hardcoded hover status indicators
- [[DS-177]] - Fix hardcoded size suggestions
- [[DS-178]] - Parse error user notifications
- [[DS-179]] - Config fallback notifications
- ~~[[DS-180]] - Empty state tree guidance~~ (duplicate of [[DS-138]])
- [[DS-181]] - Epic tooltip parity
- [[DS-182]] - Epic title 200 char limit
- [[DS-183]] - Epic cross-validation
- [[DS-184]] - Epic stories section validation
- [[DS-185]] - Derive epic status from stories
