# Implementation plan

Milestones 0–4 are implemented and locally verified for the first beam notebook. See [STATUS](STATUS.md) for the exact evidence and remaining limits; the later 4–8 week roadmap is still planned.

## Milestone 0 — documented contract

Deliver the product brief, interaction contract, equations and derivation, source architecture, contributor guide, acceptance plan, and roadmap. Record assumptions and first-release boundaries. This milestone precedes source implementation.

## Milestone 1 — forward and inverse core

- Define beam variable metadata, unit conversions, material properties, and bounds.
- Implement forward deflection, shape, stress, and mass.
- Implement tiny pivoted linear-system solving and active-set enumeration.
- Eliminate locked coordinates; validate domains and weights.
- Compute the feasible interval separately from a target request.
- Implement globally minimal weighted log change for the supported convex case.
- Return explicit infeasible and numerical-failure outcomes.
- Establish analytic single-variable and unconstrained multi-variable checks.

Done when tests prove the equations, exact lock preservation, bounds, safety constraints, and numerical residual contract.

## Milestone 2 — complete notebook interaction

- Build a responsive workspace with a functional SVG beam diagram.
- Connect parameters, material, lock toggles, and change preferences.
- Implement desired-output number entry and pointer/keyboard manipulation.
- Render baseline vs candidate, changes, reachable interval, and active constraints.
- Add explicit Apply, Cancel, and nearest-reachable actions.
- Present errors in context and keep invalid edits from changing state.

Done when a real drag creates a valid proposal and a user can apply or cancel it without losing focus or corrupting state.

## Milestone 3 — reversible and portable workspace

- Add bounded Undo/Redo and reset.
- Validate and save committed snapshots locally.
- Export/import versioned JSON.
- Recover from unavailable storage and malformed imports.
- Add an in-app guide, equations, and physical assumptions.

Done when reload and export/import preserve the notebook, failed import is nondestructive, and Undo restores all committed settings.

## Milestone 4 — verification and handoff

- Run mathematical and state tests.
- Check module syntax and documentation links.
- Exercise the notebook in a real browser at desktop/mobile widths.
- Verify pointer and keyboard target changes, infeasible requests, locks, Apply, Undo/Redo, persistence, and import/export.
- Inspect screenshots for clipping, text contrast, and diagram readability.
- Record actual evidence and outstanding limits in STATUS.

## First 4–8 weeks after this slice

| Period | Deliverable | Exit condition |
| --- | --- | --- |
| Week 1 | Harden the beam notebook with user feedback | Users can explain proposed changes and failures |
| Week 2 | Second small model, such as a spring or power-law circuit | Engine reuse works without physical-model assumptions leaking in |
| Weeks 3–4 | Model definition format and unit validation | A developer can add a model from documented metadata |
| Weeks 5–6 | Explore multi-output constraints and alternative objectives | Supported/unsupported solver guarantees remain explicit |
| Weeks 7–8 | Authoring experience and a small user pilot | Users repeatedly choose backward interaction for a real task |

This schedule is a planning estimate for a solo developer/small team, not a delivery guarantee for a universal environment.

## Scope discipline

Do not add AI, accounts, a graph canvas, physics animation, a general parser, or a generic plugin SDK to make the demo look broader. Add an abstraction when a second real model demonstrates its need. Do not weaken numerical checks to match a visual effect.
