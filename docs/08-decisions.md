# Architecture decisions

## ADR 001 — Start with an end-loaded cantilever

Accepted. The physical relationship is visible, the forward equations are compact, and the inverse supports independent closed-form checks. This avoids making opaque nonlinear optimization a prerequisite for experiencing the product.

## ADR 002 — Exact restricted model class

Accepted. Positive monomials and log-linear constraints make the initial inverse problem convex. The product must disclose this scope. A generic nonlinear solver can come later with a different guarantee contract.

## ADR 003 — Relative change objective

Accepted. Weighted squared log ratios are unit-invariant, symmetric for reciprocal multiplicative changes, and strictly convex. They are not universally the correct measure of human effort. Expose weights and explain the metric.

## ADR 004 — Eliminate locked coordinates

Accepted. A lock is an exact constraint. Large weights would permit drift, so locks are removed from solving and copied back unchanged.

## ADR 005 — Preview before commit

Accepted. The user should see what must change and retain control over adoption. Pointer motion never creates hundreds of history entries. Apply is one transaction.

## ADR 006 — Native browser stack

Accepted. SVG, native form controls, browser modules, and Node's built-in test runner cover the first vertical slice. No framework or bundler is needed for its current size. Revisit only if application complexity creates a concrete benefit.

## ADR 007 — Local state and portable files

Accepted. Committed notebooks are device-local, with validated JSON export/import. No account, remote storage, cloud deployment, or AI API is part of this milestone.

## ADR 008 — Active-set enumeration only for small systems

Accepted with a ceiling. Enumeration is transparent and easy to verify at four variables, but grows combinatorially. Enforce the dimension cap. A future quadratic-programming implementation needs benchmark and correctness evidence.

## ADR 009 — Material choice is explicit

Accepted. Material switching is a discrete decision. The first solver treats E and density as fixed for each solve, so it cannot silently change the material to satisfy a target.

## ADR 010 — Documentation evolves with evidence

Accepted. Planning documents explain intended behavior; STATUS records implemented capability and checks actually run. Do not silently convert roadmap items into claims of completion.

## ADR 011 — Publish under MIT with explicit research boundaries

Accepted. The source and project documentation use the MIT license. The repository presents the working prototype, its established mathematical foundations, and opportunities for collaboration. Research hypotheses and future capabilities remain distinct from measured results. The npm package stays `private: true` to prevent accidental registry publication; this does not control GitHub visibility or the source license.
