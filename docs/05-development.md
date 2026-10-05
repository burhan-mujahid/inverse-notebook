# Developer guide

## Environment

Node.js 24 or later and a current desktop browser. No runtime dependency installation is required for the first implementation.

```sh
npm run dev
npm test
npm run check
```

`npm run dev` serves the application at http://127.0.0.1:5173. Set `PORT` to a different port if needed. Stop with Ctrl+C. Because the application uses browser modules, opening index.html directly through file:// is not supported.

`npm test` runs Node's built-in test runner. `npm run check` validates JavaScript syntax and local Markdown links. The developer server serves source files directly; there is no build step.

## Inspecting a computation

Start in `src/beam.js` for physical equations and limits. Follow its request into `src/engine.js` for log-coordinate reduction, feasible-region enumeration, and constrained projection. The pure functions can be imported directly in Node for debugging.

Avoid comparing rounded UI values to high-precision test expectations. Use forward substitution with the raw candidate state.

## Making a UI change

The application entry is `src/main.js`, and visual tokens are in `src/styles.css`. Preserve stable DOM nodes for the handle and input fields. Do not replace focused controls on each render. Read DESIGN.md before changing the visual system.

## Browser verification

The browser-check script uses the pinned Playwright development dependency and an installed Google Chrome. It launches a fresh headless profile; it does not use your regular browsing profile. Browser automation is not an application runtime dependency.

```sh
npm ci
# With the local server already running:
npm run test:browser
# Or, for a preview on another port:
BASE_URL=http://127.0.0.1:5174 npm run test:browser
```

The runner creates screenshots in `artifacts/` and checks the actual controls. That generated directory is ignored by Git. Installation and browser launch may need explicit permissions in restricted environments. Actual results are recorded in STATUS.

A manual alternative is specified in the verification guide. A browser check is not replaced by a screenshot alone: exercise the interactions and inspect console errors.

## Adding a physical model

First write forward equations with units and physical assumptions. Determine whether all inverse relationships fit the current monomial/log-linear class. If they do, provide exponents and constraints and add independent analytic tests. If they do not, do not hide an approximate method inside the exact solver API. Introduce an explicitly different capability and outcome contract.

The beam UI is model-specific in v0.1. A generic authoring UI is deferred until a second model clarifies the shared needs.

## Persistence format

Exported JSON is a portable notebook state with a schema version. Import validates positive finite numbers, bounds, material/model names, locks, and weights. New schema versions require explicit migrations; unsupported versions must not be silently accepted.

## Troubleshooting

- Port in use: choose another PORT value.
- Nothing changes while dragging: inspect pointer coordinate mapping and stable pointer capture.
- Target appears reachable but solver fails: inspect numeric conditioning; report numerical failure instead of infeasibility.
- Locked value drifts: check elimination/copy-back, not a larger optimization weight.
- Saved notebook does not persist: storage may be unavailable; use export and inspect the save status.
- Result differs from a beam calculator: compare loading/support conditions, SI conversions, and omitted physical effects first.

## Timing the engine

Measure region construction separately from requests against a cached region. For example, import `prepareBeam`, `inverseBeam`, and `DEFAULT_STATE` into Node, unlock the four variables, warm the engine, then time repeated region builds and targets spaced logarithmically over `prepared.range`. The browser prepares a new region only after committed input/lock/preference changes and reuses it during a drag.

A local warm run on an Intel i7-7820HQ with Node 24.18.0 measured approximately 1.47 ms median region construction and 1.28 ms median target solve. These are measurements of this machine and model, not browser-frame or cross-device guarantees. See STATUS for the sample counts and tails.
