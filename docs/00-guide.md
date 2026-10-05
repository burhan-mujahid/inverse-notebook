# Project guide

## What we are building

Inverse lets a person edit the result of a computation and inspect the changes needed to make that result true. The first application is a beam notebook; the engine underneath operates on a deliberately narrow mathematical class: positive monomials with bounded variables and log-linear inequalities.

This document set is the implementation contract. Planned capability is explicitly separated from the first supported capability. The name, initial audience, and interface direction can change without changing the mathematical contract.

## Read the documents in this order

| Document | What it answers |
| --- | --- |
| [PRODUCT](../PRODUCT.md) | Who is this for? What does v0.1 do? |
| [User experience](01-experience.md) | What does the user do and see? |
| [Mathematics](02-mathematics.md) | What exactly is calculated and guaranteed? |
| [Architecture](03-architecture.md) | How do the pieces communicate? |
| [Implementation](04-implementation.md) | What gets built in what order? |
| [Development](05-development.md) | How do I run, inspect, and extend it? |
| [Verification](06-verification.md) | How do we establish correctness? |
| [Roadmap](07-roadmap.md) | How does this become a broader product? |
| [Decisions](08-decisions.md) | Why these choices? What alternatives were deferred? |
| [STATUS](STATUS.md) | What actually exists and what was checked? |
| [Research](RESEARCH.md) | What is the idea based on, and which questions remain open? |
| [Contributing](../CONTRIBUTING.md) | How can I help or collaborate? |

## One-minute product walkthrough

1. Open the notebook with its initial aluminum beam.
2. Notice the computed tip deflection and the parameters producing it.
3. Drag the endpoint upward to ask for less deflection, or enter a desired millimeter value.
4. Watch a proposed beam and a table of parameter changes update together.
5. Lock width. The next solution must preserve it exactly.
6. Ask for an extreme result. The notebook explains the reachable interval and keeps the requested value visible.
7. Apply a feasible proposal. Undo returns to the previous complete state.
8. Export the notebook to a small JSON file and import it again.

## Delivery boundaries

The project is licensed under MIT and prepared for public GitHub collaboration. Browser execution keeps data on the device. The Node server is a local development convenience, not the computational backend. Running the notebook does not require a hosted service, account, or paid API.

## First milestone definition of done

The user interaction above works end to end. The solver has independent numeric checks. Locked values are untouched, bounds are enforced, and infeasible requests cannot be applied. Browser interaction is checked at desktop and narrow widths. The guide matches real commands and implemented behavior. Remaining limitations are recorded in STATUS rather than hidden behind a finished-looking UI.

## What this milestone does not establish

It does not establish a novel mathematical theorem, worldwide product novelty, demand, engineering certification, or a universal method of inverting programs. It establishes the product's central interaction on a model for which the mathematics is transparent and independently verifiable.

## Longer-term ambition

A model author should eventually declare quantities, units, relationships, allowed edits, and constraints. A user should then be able to work from any supported result toward feasible causes. Reaching that ambition requires additional model classes, authoring tools, and careful semantics for underdetermination and approximation. See the roadmap for explicit gates.

## Current handoff

The first milestone is implemented. Read [STATUS](STATUS.md) for actual checks. Start a local preview with `npm run dev` at `http://127.0.0.1:5173`. Use `PORT=5174 npm run dev` if the default port is occupied.

For a fast inspection: open the notebook, click **Try a stiffer beam: 8 mm**, review the proposed width and thickness, click **Apply changes**, then **Undo**. Toggle a lock and enter an unreachable target to inspect the boundary behavior.
