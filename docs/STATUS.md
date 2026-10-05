# Progress

## Working first milestone

Inverse v0.1 is implemented as a local browser notebook. Run `npm run dev` and open **http://127.0.0.1:5173**. Use `PORT=5174 npm run dev` if that port is occupied.

## Completed

- Product, design, architecture, mathematics, implementation, development, verification, roadmap, and progress documentation.
- Dependency-free browser runtime with a loopback-only Node static server.
- End-loaded rectangular cantilever forward equations in SI units.
- Exact convex inverse formulation for the supported positive monomial / log-linear constraint class, limited to four variables.
- Weighted relative-change objective, exact locks, hard bounds, and three explicit beam-model constraints.
- Cached reachable interval, explicit unreachable/invalid/empty/numerical-failure states, and forward verification of returned candidates.
- Editable numeric target, stable SVG pointer handle, keyboard control, and mobile touch interaction.
- Baseline-versus-proposal drawing, parameter differences, mass/stress outputs, and binding-constraint labels.
- Preview/Apply/Cancel, an explicit nearest-reachable action, Undo/Redo, and reset.
- Device-local committed-state saving and versioned JSON import/export with validation.
- Recovery from corrupt saved data, unavailable storage, and malformed imports.
- In-app guide, visible assumptions, equations, and source documentation links.

## Verification actually run

Date: 2026-10-04.

| Check | Result |
| --- | --- |
| `npm test` | 17 tests passed |
| `npm run check` | JavaScript syntax and all local Markdown links passed |
| `BASE_URL=http://127.0.0.1:5174 npm run test:browser` | 47 browser assertions passed |
| Browser runtime/console errors during primary run | None |
| Desktop review | Full-page 1440px screenshot inspected |
| Mobile layout | No horizontal overflow at 375px and 320px |
| Mobile target | At least 44px hit area at 320px; real emulated touch drag passed |
| Text palette contrast on white | Ink 16.85:1; muted 6.88:1; primary 7.86:1; success 8.75:1; warning 8.42:1 |

Browser checks used Google Chrome 154.0.8037.93 through Playwright in a fresh headless profile. The checks include pointer and keyboard target edits, actual Apply/Undo/Redo, exact locked width, unreachable target preservation, explicit nearest-reachable selection, invalid forward/target input, reload persistence, export/import, failed import, guide opening/closing, touch dragging, corrupt-save recovery, blocked storage, and custom imported resistance.

Mathematical tests include known forward values, independent single-variable and weighted unconstrained inverse oracles, bound activation, all-locked states, infeasible constraints, degenerate fixed bounds, input validation, deterministic results, and sampled reachable targets across all 16 lock combinations and all three materials.

Generated screenshots are in `artifacts/notebook-initial.png`, `artifacts/notebook-desktop.png`, `artifacts/notebook-unreachable.png`, and `artifacts/notebook-mobile.png`. These are local verification artifacts and are not required to run the app.

## Local numerical timing sample

Node v24.18.0 on macOS, Intel Core i7-7820HQ @ 2.90 GHz. Four variables unlocked; 100 warmup region builds, 300 measured region builds, and 600 target solves spaced across the reachable log-output interval.

| Operation | Median | p95 | Maximum observed |
| --- | ---: | ---: | ---: |
| Build feasible region | 1.47 ms | 7.13 ms | 30.91 ms |
| Solve against cached region | 1.28 ms | 2.54 ms | 5.76 ms |

These are one local warm-run sample, not universal performance guarantees or end-to-end rendering timings. The UI caches the region and schedules pointer updates with requestAnimationFrame.

## Remaining scope limits

- One static beam model. No arbitrary equation editor, time-dependent simulation, multi-output inverse request, discrete material search, or general nonlinear solver.
- Small active-set enumeration deliberately supports at most four variables and is not a scalable optimization backend.
- Imported models cannot execute code; only the versioned beam notebook schema is accepted.
- Illustrative material constants and screening thresholds; no physical validation or engineering certification.
- No complete formal accessibility audit or Safari/Firefox verification yet.
- In-memory undo history does not survive reload; committed notebook state does.
- No in-app accounts, shared editing, or public demo deployment.

## Open-source publication preparation

The project now includes an MIT license, a public-facing README with a screenshot and contact details, primary-source research references, contribution and community guidelines, security reporting, software citation metadata, issue/PR templates, and a GitHub checks workflow.

At preparation time (2026-10-05), the intended repository was `burhan-mujahid/inverse-notebook`. Remote creation and GitHub settings could not be verified: the preparation session could not resolve `api.github.com` and could not create `.git` under its filesystem restrictions. The remote links in README and package/citation metadata target that intended repository. See [publishing instructions](PUBLISHING.md) to complete publication from a terminal with access.

Local publication checks on 2026-10-05, Node v24.18.0 on macOS:

| Check | Result |
| --- | --- |
| `npm test` | 18 tests passed, including a publisher test covering six mocked success/failure scenarios |
| `npm run check` | 10 JavaScript modules and all local Markdown links passed |
| `bash -n scripts/publish-github.sh` | Passed |
| YAML parsing | Citation metadata, workflow, and issue forms parsed successfully |
| Metadata consistency | MIT license matched package/lockfile; 13 unique topics met GitHub's documented format |
| Publication review | Reviewed source/documentation; no common credential patterns found in the scanned project text |

The publisher test uses fake commands and makes no GitHub requests. Remote creation, GitHub Actions execution, and citation rendering still require verification after publication. The existing application source was unchanged, so the browser verification above remains a dated prior result rather than a claimed rerun.

## Next implementation milestone

Choose a second small relationship model, add independent equations/tests, and validate that the engine can be reused without leaking beam-specific assumptions. The longer-term authoring and arbitrary-relationship work remains in the roadmap.
