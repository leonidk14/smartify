---
name: prd-to-tickets
description: Break a PRD into independently-grabbable implementation tickets using tracer-bullet vertical slices. Use when user wants to convert a PRD to implementation tickets, or break down a PRD into work items.
---

# PRD to Tickets

Break a PRD into independently-grabbable implementation tickets using vertical slices (tracer bullets).

## Process

### 1. Locate the PRD

If the user has provided $ARGUMENTS, grab the PRD under docs/features/$ARGUMENTS/prd.md. If not provided ask the user for the PRD file.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the PRD into **tracer bullet** tickets. Each ticket is a thin vertical slice that cuts through integration layers end-to-end. It might include both frontend and backend changes or be frontend-heavy ticket with small backend change or the other way around. The main point is to keep it small and reviewable. In rare cases it might be frontend or backend only ticket while the other layer is mocked.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories from the PRD this addresses

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?

Iterate until the user approves the breakdown.

### 5. Create the tickets

Create tickets in dependency order (blockers first) so you can reference real ticket numbers in the "Blocked by" field.

<ticket-template>
## Parent PRD

#<prd-ticket-number>

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Reference specific sections of the parent PRD rather than duplicating content.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- Blocked by #<ticket-number> (if any)

Or "None - can start immediately" if no blockers.

## User stories addressed

Reference by number from the parent PRD:

- User story 3
- User story 7

</ticket-template>

Do NOT close or modify the parent PRD ticket.

Tickets should be stored in docs/features/$ARGUMENTS/issues folder as <ticket-number>-<ticket-name>.md file
Draw a schema which shows the order of implementation based on the parental dependency of tickets and store it in docs/features/$ARGUMENTS/issues/implementation-flow.md file.