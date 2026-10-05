# Mathematics and solver contract

## 1. Physical model

A straight, prismatic, rectangular cantilever is clamped at x = 0. A positive transverse point force F acts at its free end x = L. The beam is homogeneous, isotropic, linearly elastic, and modeled under Euler–Bernoulli small-deflection assumptions.

SI quantities:

- F: force, N.
- L: length, m.
- b: width, m.
- h: thickness in the bending direction, m.
- E: Young's modulus, Pa, fixed by the explicitly selected material.
- ρ: density, kg/m³.

The area moment of inertia is I = b h³ / 12, in m⁴.

Tip deflection:

    δ = F L³ / (3 E I) = 4 F L³ / (E b h³)

Deflection along the beam:

    y(x) = F x² (3L − x) / (6 E I), 0 ≤ x ≤ L

Maximum bending stress magnitude at the clamp:

    σ = 6 F L / (b h²)

Mass (beam only, with self-weight excluded from loading):

    m = ρ L b h

At x = L, the shape equation must reproduce δ. Vertical geometry is magnified for readability and labeled accordingly.

## 2. Model limits

This model omits shear deformation, geometric nonlinearity, plasticity, buckling, distributed/self-weight loads, dynamics, joint compliance, anisotropy, local stress concentrations, and manufacturing effects. The material library is illustrative. This notebook is not an engineering sign-off tool.

The implementation uses explicit conservative modeling limits, not universal physical laws:

- δ/L ≤ 0.05: small-deflection screening convention for this demonstration.
- h/L ≤ 0.1: slenderness screening convention for this demonstration.
- σ ≤ material.allowedStress: illustrative stress limit.

Meeting these inequalities does not prove that every omitted physical effect is negligible.

## 3. Supported inverse model class

For positive variables x_i, a positive monomial output is

    y(x) = c ∏ x_i ^ a_i.

Let x₀ be the committed baseline and z_i = ln(x_i / x₀_i). Then

    ln(y(x)/y(x₀)) = aᵀ z.

For the beam variables [F, L, b, h], a = [1, 3, −1, −3]. E remains fixed for an inverse request.

A desired positive deflection δ* gives one affine equality:

    aᵀ z = ln(δ*/δ₀).

This transformation is valid only on the strictly positive domain. Zero/negative targets are rejected with a clear input error in v0.1.

## 4. Meaning of smallest change

Minimize

    J(z) = ½ Σ w_i z_i², with w_i > 0.

This measures weighted relative multiplicative changes, not millimeters or absolute Euclidean displacement. For small edits, ln(x_i/x₀_i) approximates the fractional change. Doubling and halving are symmetric under this metric.

Hard bounds lower_i ≤ x_i ≤ upper_i become:

    ln(lower_i/x₀_i) ≤ z_i ≤ ln(upper_i/x₀_i).

Locked coordinates are eliminated from the numerical system and copied unchanged from the baseline in the returned candidate. They are not approximated using large weights.

## 5. Other constraints are also log-linear

Using each baseline's computed quantities:

    log stress: [1, 1, −1, −2] · z ≤ ln(σ_max/σ₀)
    log deflection ratio: [1, 2, −1, −3] · z ≤ ln(0.05/(δ₀/L₀))
    log thickness ratio: [0, −1, 0, 1] · z ≤ ln(0.1/(h₀/L₀))

Thus the first inverse problem is a strictly convex quadratic objective over a convex polytope intersected by one affine equality. If feasible, the minimizer in free coordinates is unique. Uniqueness is relative to the stated weights and constraints, not a claim that nature has a unique inverse.

## 6. Small exact solver

For n ≤ 4 free coordinates, enumerate independent sets of active inequalities. Include the target equality and zero through n−1 active inequalities. For each full-row-rank equality system Bz = d, calculate the minimum weighted norm solution:

    z = W⁻¹ Bᵀ (B W⁻¹ Bᵀ)⁻¹ d.

Implement the small linear solve with partial pivoting; do not explicitly form an inverse. Skip rank-deficient candidate systems. Check the target residual and every inequality, then retain the feasible candidate with smallest J.

Why enumeration suffices: at the convex optimum, the active constraint normals plus the target normal span the directions needed for the equality-constrained minimum. A linearly independent subset of at most n rows represents that face. Enumeration includes it. Selecting the best feasible candidate therefore finds the global solution up to floating-point tolerances.

This is deliberately a low-dimensional algorithm. Its combinatorial cost is unsuitable for large arbitrary graphs. Record this ceiling in code and change the algorithm before increasing dimensionality.

## 7. Reachable interval

The safety/bound constraints without the target define a compact convex polytope in free log coordinates. Enumerate its vertices by solving independent sets of n active inequalities; keep those satisfying all inequalities. Minimize and maximize aᵀz over the feasible vertices. With no free variables, check the baseline directly.

The resulting interval for δ is:

    [δ₀ exp(min aᵀz), δ₀ exp(max aᵀz)].

Linear extrema occur at vertices, including lower-dimensional feasible polytopes when independent active constraints fix their affine hull. Continuity and convexity imply all intermediate log-output values are attainable.

A nonempty range plus an in-range target for which the numerical solve finds no candidate is a numerical failure, not proof of infeasibility.

## 8. Precision and validation

Keep SI values in double precision. Use scale-aware pivot checks and approximately 1e−8 log-space feasibility tolerance. A returned candidate must pass forward substitution and bound/constraint checks. Do not round model values before solving or committing. Round only presentation.

At a reported endpoint, tiny floating-point excursions can be tolerated consistently; meaningful out-of-range targets cannot be silently clamped. An explicit UI action may replace a target with the nearest reachable endpoint.

## 9. Independent checks

With only thickness free, h* = h₀(δ₀/δ*)^(1/3). With only width free, b* = b₀ δ₀/δ*. With only force free, F* = F₀ δ*/δ₀. With only length free, L* = L₀(δ*/δ₀)^(1/3).

Without active inequalities, z = W⁻¹a ln(δ*/δ₀)/(aᵀW⁻¹a). These analytic cases provide independent numerical oracles.

## Sources

- [MIT OpenCourseWare: Deflections due to Bending](https://ocw.mit.edu/courses/1-050-solid-mechanics-fall-2004/f9a4d5764b9b0f51ffaacbdf69f7aed8_emech10_04.pdf).
- [Wierzbicki: Castigliano theorem and cantilever displacement](https://eng.libretexts.org/Bookshelves/Mechanical_Engineering/Structural_Mechanics_%28Wierzbicki%29/07%3A_Energy_Methods_in_Elasticity/7.06%3A_Castigliano_Theorem).

The optimization derivation above is the explicit design for this implementation. The bounds and screening ratios are project choices, not a cited engineering standard.
