# Idea, foundations, and research directions

## The idea

Inverse asks what a computational interface could look like if a result were something a person could edit directly. The user specifies a target, preserves important inputs with locks, and examines a feasible proposal before committing it.

The first demonstration uses a cantilever beam because its behavior is visible and its positive power-law equations support an inspectable convex formulation. This is a working testbed for an interaction idea, not evidence that arbitrary programs can be inverted.

The product hypothesis is that combining outcome editing with visible constraints and reversible proposals can help people explore models and understand tradeoffs. The current prototype establishes an implementation and numerical test cases. It does not establish improved learning, faster design, market demand, or a novel optimization algorithm.

## Primary sources and their relationship to this project

These are foundations and related work, not endorsements or claims that Inverse implements the referenced systems. This is a starting bibliography, not an exhaustive literature review.

| Source | Connection to Inverse | Boundary |
| --- | --- | --- |
| Ivan E. Sutherland, [Sketchpad: A man-machine graphical communication system](https://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-574.html), 1963 dissertation; 2003 technical-report edition | Direct graphical interaction and user-specified constraints have a long history | Inverse is a small numeric notebook, not a reconstruction of Sketchpad |
| Greg J. Badros, Alan Borning, and Peter J. Stuckey, [The Cassowary Linear Arithmetic Constraint Solving Algorithm](https://constraints.cs.washington.edu/cassowary/), 2001 | Demonstrates constraint solving for interactive interfaces | Inverse does not use Cassowary; it enumerates small active sets for a quadratic objective in log coordinates |
| Bret Victor, [Explorable Explanations](https://worrydream.com/ExplorableExplanations/), 2011 | Interactive documents let readers explore assumptions and alternatives | Inverse adds one specific constrained outcome-editing interaction; educational benefit still needs evaluation |
| Stephen Boyd and Lieven Vandenberghe, [Convex Optimization](https://web.stanford.edu/~boyd/cvxbook/), 2004 | Convex feasible sets, quadratic objectives, and optimality provide the mathematical basis | The project's formulation and numerical tolerances are specified separately |
| Stephen Boyd, Seung-Jean Kim, Lieven Vandenberghe, and Arash Hassibi, [A Tutorial on Geometric Programming](https://stanford.edu/~boyd/papers/gp_tutorial.html), 2007 | Logarithmic transformations expose useful structure in positive monomial relationships | Inverse minimizes a quadratic log-displacement objective; it is not a general geometric-programming package |
| MIT OpenCourseWare, [1.050 Solid Mechanics: Deflections due to Bending](https://ocw.mit.edu/courses/1-050-solid-mechanics-fall-2004/f9a4d5764b9b0f51ffaacbdf69f7aed8_emech10_04.pdf), 2004 | Background for the beam model | Illustrative material values and screening thresholds are project choices |

See [Mathematics](02-mathematics.md) for the complete forward equations, log-coordinate derivation, constraints, reachable interval, analytic checks, and physical assumptions.

## What the prototype contributes so far

The inspectable artifact is a cohesive interaction: set a target, preserve locks, inspect a weighted minimum-change proposal, see binding constraints, and apply or undo. Its engine, interface, and test cases are available for reproduction and criticism.

The current solver handles up to four variables. It solves a strictly convex quadratic objective over affine constraints in log coordinates, using active-set enumeration and forward verification. This gives a controlled setting for studying the interface. It does not establish general program inversion, causal inference, or a scalable numerical method.

Spreadsheet goal-seeking, constrained CAD, bidirectional programming, inverse design, and interactive scientific notebooks are neighboring areas for a fuller review. Future publication should compare specific systems and tasks before making novelty claims.

## Questions worth testing

| Question | A possible evaluation |
| --- | --- |
| Does editing an outcome reduce trial and error? | Compare the inverse interface with forward-only controls on matched beam tasks; record completion time, errors, and revisions |
| Do people understand which inputs may change? | Ask participants to predict proposals before and after changing a lock or weight |
| Does visible infeasibility improve understanding? | Compare reachable-range feedback with a generic failure message, using tasks requiring identification of a binding constraint |
| Is weighted relative change a useful preference model? | Ask participants to choose between feasible alternatives and explain where the default objective disagrees with their priorities |
| Does the interaction generalize beyond the beam? | Add an independently verified second model and compare both implementation reuse and user comprehension |

These are proposed studies, not completed findings. No participant data has been collected by this prototype.

## A practical first evaluation

Recruit participants from the intended audience and document their prior modeling experience. Use matched tasks that ask for a target output while preserving specified inputs. Counterbalance the order of forward-only and inverse conditions to reduce order effects. Keep the underlying equations and available information comparable.

Measure task success, constraint violations, time, and an explanation of why the result required particular changes. Collect qualitative confusion points. Decide hypotheses and analysis rules before interpreting results, and report sample size and uncertainty with the results. Participation and any data collection need informed consent; the current app contains no study telemetry.

For reproducibility, record the Git commit, Node/browser versions, starting notebook JSON, targets, locks, weights, and expected outcomes. Run `npm test`, `npm run check`, and the optional browser verification. [STATUS](STATUS.md) distinguishes recorded measurements from untested scope.

## From prototype to a useful product

Three initial audiences to investigate are STEM educators building lessons, researchers studying interaction with computational models, and developers building domain-specific exploration tools. These are candidate audiences, not validated customer segments.

A useful pilot starts with one recurring workflow: the user's present tool, a desired outcome, inputs that must stay fixed, constraints, and what a successful session would look like. Prefer a small model with an independent correctness check. Measure whether Inverse improves that workflow before building a general model editor or a hosted platform.

To collaborate, contact **[Burhan Mujahid](mailto:burhanmujahid552@gmail.com)** with your domain, one concrete task, and what you would like to investigate or build. Code, model reviews, teaching feedback, and research collaboration are all welcome. See [CONTRIBUTING](../CONTRIBUTING.md) and the [roadmap](07-roadmap.md).

## Cite and reproduce

Use [CITATION.cff](../CITATION.cff) for software attribution and include the exact commit used in an experiment. There is currently no project paper or DOI. Numerical correctness, physical validity, interaction usefulness, and market demand are separate claims and need separate evidence.
