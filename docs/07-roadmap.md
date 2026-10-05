# Roadmap and open research questions

## Product hypothesis

Direct manipulation of outcomes can make model-based work easier to understand and faster to explore. The initial model is chosen for interpretability and solvability. It is not evidence that the interaction works for every domain.

## Expansion order

1. **A dependable notebook:** one physical model, exact restricted solver, reversibility, explicit limits.
2. **Multiple supported models:** a spring, a simple circuit, or a constrained resource model. Verify engine reuse before inventing a plugin API.
3. **Model declarations:** units, variables, relationships, admissible targets, bounds, and edit policies. No arbitrary code execution from imported models.
4. **Multiple desired outputs:** define conflict resolution, priority, and exact-versus-soft targets.
5. **Alternative feasible changes:** distinguish alternatives by a meaningful user preference such as mass, effort, or cost. Do not present random numerical perturbations as different ideas.
6. **Approximate nonlinear models:** explicit local convergence, uncertainty, initial-condition dependence, and verification residuals.
7. **Discrete choices:** finite material/component options, with clearly separated search and continuous optimization.
8. **Reusable runtime and authoring tools:** public model API only after repeated integration experience.

## Research questions

- Which outputs can users manipulate meaningfully without misunderstanding the model?
- How should change cost be specified across quantities with different semantics?
- When does the nearest feasible result frustrate users compared with explaining which constraint to relax?
- How can a model expose more than one defensible inverse without overwhelming the user?
- Can units and physical domains be checked before solving?
- How should a runtime disclose approximate, nonunique, or initialization-dependent solutions?
- How should manual edits, locks, and causal assumptions interact in cyclic models?

## Prior-art boundary

Inverse problems, optimization, CAD constraints, spreadsheet goal-seeking, and bidirectional programming are established ideas. We do not claim novelty over those fields. The potential contribution is the developer/runtime/interaction combination and its demonstrated usefulness. A proper competitive and academic review is required before making originality or patent claims.

## Risks and mitigations

| Risk | First response |
| --- | --- |
| A visually compelling demo hides incorrect math | Independent analytic checks and forward validation |
| Scope expands into a universal solver | Declare supported model classes and reject unsupported input |
| The objective feels unintuitive | Explain relative change, expose weights, observe user choices |
| Users mistake schematic geometry for literal simulation | Label exaggeration and assumptions |
| Too many solutions become an opaque optimization result | Show exact changes and active constraints |
| Model boundaries are confused with engineering standards | Label project screening limits and illustrative materials |
| Performance degrades as dimensions grow | Enforce v0.1 dimension cap; choose new algorithm before scaling |

## Commercial questions, deliberately unanswered

Who uses this repeatedly? Does it help education, design exploration, or software tooling most? Would an embeddable engine or an end-user notebook be more valuable? These require user experience and evidence. This initial build makes no revenue or adoption forecast.
