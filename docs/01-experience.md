# User experience and behavior

## Notebook surface

The primary surface is a working notebook, not a marketing page. It contains the model name, a beam diagram, desired output, input parameters, an explanation of the proposal, equations, model assumptions, and recent applied changes.

The initial configuration is an aluminum-like material with E = 69 GPa, density = 2700 kg/m³, force = 80 N, length = 0.6 m, width = 40 mm, and thickness = 12 mm. Force and length start locked. Width and thickness are available for inverse changes. These material values are illustrative.

## Forward editing

Changing a valid parameter recomputes outputs immediately on commit of the field. Parameter limits are enforced before state mutation. Changing material changes E and density as one explicit user action; the inverse solver does not quietly switch material. Manual forward changes may expose a model-constraint violation; show it prominently and calculate whether an inverse proposal can repair the state using unlocked variables.

Force is in N, length in m, cross-section dimensions in mm, deflection in mm, stress in MPa, modulus in GPa, and mass in kg. Convert to SI at the UI boundary and keep the engine in SI.

## Inverse editing

The desired tip deflection can be set numerically or by pointer/keyboard interaction with the endpoint. Every preview is solved relative to the committed state at the beginning of that proposal; repeated rendering must not move the optimization reference.

Show the computed candidate, requested target, parameter differences, objective interpretation, and any active bounds/constraints. A candidate must be forward-evaluated before being offered for application.

## Locks and preferences

Each variable has a lock and a relative resistance to change. Locked variables remain bit-for-bit equal to their committed value. Larger positive weights make changes more expensive in the declared objective; weights are preferences, not hard constraints. Bounds and locks remain hard constraints.

When a locked variable is edited manually, that manual edit is permitted: the lock only restricts inverse solving. Explain this in the guide.

## Feasibility and failure states

| State | Behavior |
| --- | --- |
| Target is feasible | Show a proposal; enable Apply if values actually change |
| Target equals committed output | Show no change needed; avoid duplicate history entries |
| Target is outside reachable interval | Show requested value and reachable range; disable Apply; offer an explicit nearest-reachable action |
| Locks and constraints leave no feasible state | Explain that constraints conflict under these locks; preserve inputs; suggest reviewing locks/bounds |
| Input is empty, nonfinite, nonpositive, or outside bounds | Field error; preserve last valid committed state |
| Numeric solver fails unexpectedly | Explicit numerical failure; never label it mathematically impossible |
| Saved state cannot be read | Load the documented default and show a recovery notice |
| Browser storage is unavailable | Continue in memory; offer JSON export |
| Import is invalid or a future schema version | Explain the error; leave the current notebook unchanged |

The reachable interval is exact up to numeric tolerances for the supported model class. The UI must not imply identification of a minimal unsatisfiable constraint set; that capability is deferred.

## Reversibility and persistence

Apply creates a new committed state. Undo and redo restore parameters, material, locks, and weights. Making a new committed change after Undo clears Redo. Keep a bounded in-memory history. Auto-save only committed notebook state to localStorage; history need not survive reload. JSON export has an explicit schema version and import is validated.

## Accessibility

The SVG endpoint is a focusable slider with an accessible name and output units. Arrow keys adjust target by 0.1 mm, Shift increases the step to 1 mm, Home/End move to the current reachable endpoints, and Escape cancels a preview. A labeled number field provides equivalent functionality. Mouse and touch use pointer events and pointer capture. Controls remain visible and stable during calculation.

## Guide

An in-app guide explains the interaction, the meaning of smallest change, what locks mean, and the model's assumptions. Source-level documentation lives in this directory and is linked from the project README.
