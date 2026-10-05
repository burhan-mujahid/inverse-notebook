# Contributing to Inverse

Inverse is an early open-source project maintained by [Burhan Mujahid](https://github.com/burhan-mujahid). Contributions to the mathematics, interface, documentation, and research direction are welcome. You do not need to write code to contribute.

## Start with a small, concrete contribution

| Contribution | Useful deliverable |
| --- | --- |
| First-time usability feedback | Try the README walkthrough; report the first confusing step and what you expected |
| Documentation improvement | Clarify one equation, unit, constraint, or setup instruction |
| Browser compatibility | Check the walkthrough in Firefox or Safari and report browser/OS versions and failures |
| Accessibility review | Check keyboard and screen-reader use; identify a specific control and expected behavior |
| Numerical review | Supply a small reproducible state, an independent expected result, and tolerances |
| Second-model proposal | Describe forward equations, units, bounds, inverse target, and an analytic verification case |

Use [Issues](https://github.com/burhan-mujahid/inverse-notebook/issues) for bugs and scoped proposals. Use [Discussions](https://github.com/burhan-mujahid/inverse-notebook/discussions) for open research and product questions. Contact **[burhanmujahid552@gmail.com](mailto:burhanmujahid552@gmail.com)** for research, teaching, or pilot collaborations; include your context and one concrete use case.

## Local development

1. Fork the repository and clone your fork.
2. Use Node.js 24 or later.
3. Create a focused branch: `git switch -c describe-your-change`.
4. Run `npm run dev` and open http://127.0.0.1:5173.
5. Make the smallest useful change and run `npm test` and `npm run check`.
6. Open a pull request describing the problem, resulting behavior, and checks performed.

For interaction changes, install development dependencies with `npm ci`, keep the server running, and run `npm run test:browser` with Google Chrome installed. Include a screenshot when the visual result matters. See the [developer guide](docs/05-development.md) for details.

## Preserve the mathematical and interaction contracts

- Give numerical changes an independent analytic case or a reproducible regression test.
- Preserve locked values exactly; explain the objective and any approximation.
- Keep unreachable, invalid, and numerical-failure outcomes distinct.
- Keep Apply explicit and exploration reversible.
- Preserve keyboard/numeric alternatives to dragging and visible focus.
- Discuss new model classes, runtime dependencies, and large architectural changes before implementing them.
- Add citations for borrowed formulas or research claims. Separate measured results from hypotheses.

Do not upload private notebook data or credentials. For vulnerabilities, use the private reporting route in [SECURITY.md](SECURITY.md).

## Review and community

The maintainer reviews scope, correctness, clarity, and fit with the documented roadmap. Review timing depends on availability; there is no service-level commitment. Credit collaborators in pull requests and release notes. Participation follows the [Code of Conduct](CODE_OF_CONDUCT.md).

By submitting a contribution, you agree to license that contribution under the project's [MIT license](LICENSE). Only submit material you have the right to contribute.
