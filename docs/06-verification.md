# Verification and acceptance

## Mathematical tests

Use independent numeric oracles, not assertions that duplicate the implementation line by line.

1. Known beam forward value and dimensional conversion.
2. Beam endpoint from the shape function equals independently calculated tip deflection.
3. Analytic inverse with one free variable for force, length, width, and thickness.
4. Weighted multi-variable unconstrained projection agrees with its closed form.
5. Hard bounds activate correctly; a solution at a reachable endpoint remains feasible.
6. Locks preserve their original values exactly.
7. All-locked feasible target returns unchanged state; other targets are unreachable.
8. Safety/slenderness/deflection-ratio constraints hold on proposed states.
9. Infeasible constraint systems return no candidate.
10. Invalid inputs, nonfinite targets, nonpositive weights, and unsupported dimensions are rejected.
11. Deterministic sampled targets within feasible intervals forward-evaluate to their requests and respect all constraints.
12. Repeated identical requests return identical numerical results.

## State tests

- Serialization round trip preserves all committed fields.
- Malformed JSON, unsupported versions, invalid material, invalid numeric data, and malformed locks/weights are rejected without changing the current state.
- Undo/redo restore complete states, and new edits clear redo.
- History remains bounded.
- Reset restores the documented defaults through the same transaction model.

## Browser acceptance

| Action | Expected result |
| --- | --- |
| Load default | Correct numeric output, no console exception |
| Set a lower target | Feasible candidate and visible parameter differences |
| Drag endpoint | Target and preview update; committed inputs stay unchanged |
| Apply | Inputs match candidate and history gains one step |
| Undo/redo | Complete state returns correctly |
| Lock width | Subsequent candidate width remains exact |
| Lock everything, change target | Unreachable status, Apply disabled |
| Use nearest reachable | Explicitly changes the target to the reported boundary |
| Enter invalid number | Inline error, no corrupt state |
| Use handle with keyboard | Same solver path as numeric/pointer changes |
| Reload after Apply | Saved committed state restored |
| Export then import | Equivalent state; bad import leaves current state intact |
| 375px viewport | No horizontal document overflow; controls operable |
| Reduced motion | No required interaction depends on animation |

## Performance checks

Time feasible-region construction and repeated target solves separately. The interface caches the region while the baseline remains fixed and schedules pointer updates at frame cadence. If preview work exceeds interactive budgets on target devices, move it to a worker or change the small-system algorithm with matching numerical tests. Record measured timings with environment context.

## Accuracy claims

The implementation can claim correctness within its documented mathematical model and tested tolerances. It cannot claim physical validation, WCAG certification, or universal solver completeness. A numerical failure must remain distinguishable from a mathematically empty feasible set.

## Release checklist

All automated checks pass; browser evidence is recorded; docs match source paths and commands; no placeholder controls; no network keys; no silent target clamping; no unreported invalid candidate; no fabricated performance statistics.
