# Product

## Register

product

## Users

Initial audience: technically curious developers, students, and researchers exploring relationships between quantities. They use a desktop or laptop in a normal, well-lit working environment and want to understand why a desired result requires particular input changes.

This audience and the working name Inverse are implementation assumptions, open to revision. The working prototype supports the central interaction; user research and pilot feedback will guide the next model and product direction.

## Product purpose

Make the output of a computation a direct manipulation surface. A user changes a desired result, preserves important inputs with locks, and receives feasible proposed changes with clear explanations.

The long-term product is an environment for defining relationships and interacting from either direction. The first release is a fully connected local beam notebook with a small reusable mathematical core.

## First-release contract

- Forward computation from force, length, width, thickness, and selected material.
- Inverse computation from a desired tip deflection.
- Per-variable locks, hard bounds, and change weights.
- A precise definition of smallest change: weighted squared log-ratio displacement.
- A reachable output interval under the current locks and constraints.
- An explicit difference between feasible proposal, unreachable target, invalid model state, and numerical failure.
- A preview that does not alter committed inputs until Apply.
- Undo/redo, reset, local save, and portable JSON import/export.
- Mouse, touch, keyboard, and numeric equivalents for the central interaction.
- Visible equations, units, assumptions, and binding constraints.

## Non-goals for this release

Arbitrary user-entered code or equations; universal inversion; dynamics; finite-element analysis; discrete material search; remote accounts; collaboration; AI explanations; a general graph editor; certified engineering results; deployment to a public service.

## Brand personality

Precise, curious, calm. The visual experience should feel like a well-made scientific instrument on a white laboratory work surface. The engaging moment is seeing a result and its causes change together.

## Anti-references

Avoid chat interfaces, generic SaaS metric dashboards, decorative 3D, unexplained confidence scores, science-fiction controls, and marketing claims presented as computed facts.

## Design principles

1. The result is an input surface.
2. Show the causes of every proposed change.
3. Locks and constraints are promises.
4. Every exploration is reversible.
5. Mathematical limitations remain visible.

## Accessibility and inclusion

Target WCAG 2.2 AA interactions and contrast. Every drag interaction has keyboard and numeric alternatives. Use text as well as color to distinguish status. Focus remains visible and stable during recomputation. Respect reduced motion and support narrow screens. A complete compliance audit is not claimed by this milestone.

## Success criteria

A first-time visitor can change a target, understand which inputs will change, preserve an input, recognize an unreachable request, apply a proposal, and undo it without instruction from a developer. Numerical results must agree with independent analytic cases and preserve all explicit constraints.
