---
id: EPIC-008
title: "Phase 8: Cadence Kit"
status: in_progress
created: 2025-11-29
updated: 2025-11-29
---

# Phase 8: Cadence Kit

## Description
Deliver "just enough ceremony" for solo devs who appreciate Agile principles but do not want heavyweight sprint machinery. The Cadence Kit layers optional rituals on top of existing epics/stories so developers can keep rhythm, learn from iterations, and see flow health without burning cycles on process.

## Key Value Adds
- **Cadence reminders** keep focus on backlog grooming, planning, and reflection.
- **Definition of Done checklists** ensure quality gates without meetings.
- **Flow analytics** surface cycle time and throughput trends right in VS Code.
- **Retro generators** prompt insight from what just shipped.
- **Improvement experiments** capture tiny habit changes in the same system.

## Deliverables
- Status bar + notification nudges for weekly rituals that adapt to progress.
- DoD checklist UI tied to stories with optional auto-check heuristics.
- Flow snapshot view (cycle time, throughput, WIP) updated from story metadata.
- Retro markdown generator pre-populating wins, risks, and carry-overs.
- Experiment tracker template to turn retro insights into actionable stories.
- **Agile Solo Starter pack** with backlog/retro/experiment templates and guidance.

## Stories
- [[DS-041]] Cadence reminders & ritual prompts
- [[DS-042]] Definition of Done checklist surface
- [[DS-043]] Flow snapshot & metrics view
- [[DS-044]] Retro generator command
- [[DS-045]] Improvement experiment tracker

## Notes
- All features must be optional toggles in `config.yaml` (or feature flags) so non-Agile workflows stay clean.
- Lean on existing data (timestamps, statuses) before inventing new schema.
- Favor markdown outputs for retros/experiments so everything stays version controlled.
