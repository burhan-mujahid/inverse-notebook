import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepare, solve } from '../src/engine.js';
import { forward, displacement, prepareBeam, inverseBeam, violations, VARIABLES } from '../src/beam.js';
import { DEFAULT_STATE } from '../src/notebook.js';

const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) <= tolerance * Math.max(Math.abs(b), 1e-10), `${a} should equal ${b}`);
const state = () => structuredClone(DEFAULT_STATE);

test('beam forward calculation matches independently evaluated reference values', () => {
  const p = { force: 100, length: 1, width: 0.05, thickness: 0.02 };
  const output = forward(p, 'steel');
  near(output.deflection, 0.005);
  near(output.stress, 30e6);
  near(output.mass, 7.85);
  near(displacement(1, p, 'steel'), 0.005);
  near(displacement(0, p, 'steel'), 0);
  near(displacement(0.5, p, 'steel'), 0.0015625);
});

for (const [key, exponent] of [['force', 1], ['length', 3], ['width', -1], ['thickness', -3]]) {
  test(`single-variable inverse agrees with analytic ${key} solution and preserves locks exactly`, () => {
    const s = state();
    s.locks = Object.fromEntries(VARIABLES.map(v => [v.key, v.key !== key]));
    const p = prepareBeam(s);
    const target = p.baseline.deflection * 0.8;
    const result = inverseBeam(p, target);
    assert.equal(result.status, 'solved');
    near(result.params[key], s.params[key] * 0.8 ** (1 / exponent));
    for (const v of VARIABLES) if (v.key !== key) assert.equal(result.params[v.key], s.params[v.key]);
    near(result.output.deflection, target);
  });
}

test('weighted multivariable inverse matches closed-form projection', () => {
  const spec = { values: [1, 1], exponents: [1, 2], bounds: [{ min: 0.1, max: 10 }, { min: 0.1, max: 10 }], locked: [false, false], weights: [2, 4] };
  const region = prepare(spec);
  const logTarget = Math.log(2);
  const result = solve(region, logTarget);
  assert.equal(result.status, 'solved');
  near(Math.log(result.values[0]), logTarget / 3);
  near(Math.log(result.values[1]), logTarget / 3);
});

test('bound activation and attainable endpoints are exact', () => {
  const region = prepare({ values: [1, 1], exponents: [1, 1], bounds: [{ min: 1, max: 2 }, { min: 1, max: 4 }], locked: [false, false], weights: [1, 1] });
  near(Math.exp(region.range.min), 1);
  near(Math.exp(region.range.max), 8);
  const result = solve(region, Math.log(6));
  near(result.values[0], 2);
  near(result.values[1], 3);
  const end = solve(region, region.range.max);
  assert.equal(end.status, 'solved');
  near(end.values[0] * end.values[1], 8);
  assert.equal(solve(region, Math.log(9)).status, 'unreachable');
});

test('all locked model only accepts its original feasible output', () => {
  const s = state();
  for (const v of VARIABLES) s.locks[v.key] = true;
  const p = prepareBeam(s);
  assert.deepEqual(inverseBeam(p, p.baseline.deflection).params, s.params);
  assert.equal(inverseBeam(p, p.baseline.deflection * 2).status, 'unreachable');
});

test('conflicting fixed safety constraints are an explicit empty region', () => {
  const s = state();
  s.params.force = 1500;
  for (const v of VARIABLES) s.locks[v.key] = true;
  const p = prepareBeam(s);
  assert.equal(p.region.status, 'empty');
  assert.equal(inverseBeam(p, 0.001).status, 'empty');
});

test('constant outputs and equal min/max bounds are supported', () => {
  const region = prepare({ values: [1, 1], exponents: [0, 0], bounds: [{ min: 1, max: 1 }, { min: 1, max: 2 }], locked: [false, false], weights: [1, 1] });
  const result = solve(region, 0);
  assert.equal(result.status, 'solved');
  assert.deepEqual(result.values, [1, 1]);
  assert.equal(solve(region, 0.1).status, 'unreachable');
});

test('invalid domains cannot leak NaN candidates', () => {
  const p = prepareBeam(state());
  for (const target of [0, -1, Infinity, NaN, '3']) assert.equal(inverseBeam(p, target).status, 'invalid');
  const spec = { values: [1], exponents: [1], bounds: [{ min: 0.1, max: 10 }], locked: [false], weights: [1] };
  assert.throws(() => prepare({ ...spec, weights: [0] }));
  assert.throws(() => prepare({ ...spec, values: [Infinity] }));
  assert.throws(() => prepare({ ...spec, locked: ['false'] }));
  assert.throws(() => prepare({ ...spec, values: [1, 1, 1, 1, 1] }));
});

test('sampled reachable outputs round-trip and satisfy all physical constraints across lock configurations', () => {
  for (const material of ['aluminum', 'steel', 'polymer']) {
    for (let mask = 0; mask < 16; mask++) {
      const s = state();
      s.material = material;
      VARIABLES.forEach((v, i) => { s.locks[v.key] = Boolean(mask & (1 << i)); });
      const p = prepareBeam(s);
      if (!p.range) continue;
      for (const fraction of [0, 0.1, 0.37, 0.8, 1]) {
        const target = Math.exp(Math.log(p.range.min) * (1 - fraction) + Math.log(p.range.max) * fraction);
        const result = inverseBeam(p, target);
        assert.equal(result.status, 'solved', `${material}, mask ${mask}, fraction ${fraction}`);
        near(result.output.deflection, target);
        assert.deepEqual(violations(result.params, material), []);
        for (const v of VARIABLES) {
          assert.ok(result.params[v.key] >= v.min && result.params[v.key] <= v.max);
          if (s.locks[v.key]) assert.equal(result.params[v.key], s.params[v.key]);
        }
      }
    }
  }
});

test('a request is deterministic and does not mutate its baseline', () => {
  const s = state();
  const original = structuredClone(s);
  const p = prepareBeam(s);
  assert.deepEqual(inverseBeam(p, 0.008), inverseBeam(p, 0.008));
  assert.deepEqual(s, original);
});
