import { prepare, solve, TOLERANCE } from './engine.js';

export const VARIABLES = [
  { key: 'force', label: 'End load', short: 'F', unit: 'N', min: 10, max: 1500, factor: 1, step: 1, digits: 2 },
  { key: 'length', label: 'Length', short: 'L', unit: 'm', min: 0.2, max: 2, factor: 1, step: 0.01, digits: 3 },
  { key: 'width', label: 'Width', short: 'b', unit: 'mm', min: 0.01, max: 0.12, factor: 1000, step: 0.1, digits: 3 },
  { key: 'thickness', label: 'Thickness', short: 'h', unit: 'mm', min: 0.003, max: 0.06, factor: 1000, step: 0.1, digits: 3 },
];

// Illustrative isotropic properties, not certified grade-specific material data.
export const MATERIALS = {
  aluminum: { name: 'Aluminum', modulus: 69e9, density: 2700, allowedStress: 150e6 },
  steel: { name: 'Steel', modulus: 200e9, density: 7850, allowedStress: 200e6 },
  polymer: { name: 'Polymer', modulus: 3e9, density: 1180, allowedStress: 30e6 },
};

export function forward(params, materialId = 'aluminum') {
  const material = MATERIALS[materialId];
  if (!material) throw new RangeError('Unknown material.');
  const { force: F, length: L, width: b, thickness: h } = params;
  if (![F, L, b, h].every(v => typeof v === 'number' && Number.isFinite(v) && v > 0)) throw new RangeError('Beam quantities must be finite and positive.');
  const inertia = b * h ** 3 / 12;
  const deflection = F * L ** 3 / (3 * material.modulus * inertia);
  return { deflection, stress: 6 * F * L / (b * h ** 2), mass: material.density * L * b * h, inertia };
}

export function displacement(x, params, materialId = 'aluminum') {
  if (!Number.isFinite(x) || x < 0 || x > params.length) throw new RangeError('Position must lie along the beam.');
  const { inertia } = forward(params, materialId);
  return params.force * x ** 2 * (3 * params.length - x) / (6 * MATERIALS[materialId].modulus * inertia);
}

export function violations(params, materialId) {
  const result = forward(params, materialId);
  const names = [];
  if (result.stress > MATERIALS[materialId].allowedStress * (1 + TOLERANCE)) names.push('Stress exceeds the illustrative material limit.');
  if (result.deflection / params.length > 0.05 * (1 + TOLERANCE)) names.push('Deflection exceeds 5% of length.');
  if (params.thickness / params.length > 0.1 * (1 + TOLERANCE)) names.push('Thickness exceeds one tenth of length.');
  return names;
}

export function prepareBeam(state) {
  const baseline = forward(state.params, state.material);
  const { params: p } = state;
  const region = prepare({
    values: VARIABLES.map(v => p[v.key]),
    exponents: [1, 3, -1, -3],
    bounds: VARIABLES.map(v => ({ min: v.min, max: v.max, label: v.label.toLowerCase() })),
    locked: VARIABLES.map(v => state.locks[v.key]),
    weights: VARIABLES.map(v => state.weights[v.key]),
    constraints: [
      { a: [1, 1, -1, -2], b: Math.log(MATERIALS[state.material].allowedStress / baseline.stress), label: 'Material stress limit' },
      { a: [1, 2, -1, -3], b: Math.log(0.05 / (baseline.deflection / p.length)), label: 'Small-deflection limit (5%)' },
      { a: [0, -1, 0, 1], b: Math.log(0.1 / (p.thickness / p.length)), label: 'Slenderness limit (L/h ≥ 10)' },
    ],
  });
  return {
    state, baseline, region,
    range: region.range ? { min: baseline.deflection * Math.exp(region.range.min), max: baseline.deflection * Math.exp(region.range.max) } : null,
  };
}

export function inverseBeam(prepared, target) {
  if (typeof target !== 'number' || !Number.isFinite(target) || target <= 0) return { status: 'invalid', message: 'Enter a deflection greater than zero.' };
  const result = solve(prepared.region, Math.log(target / prepared.baseline.deflection));
  if (result.status !== 'solved') return result;
  const params = Object.fromEntries(VARIABLES.map((v, i) => [v.key, result.values[i]]));
  const output = forward(params, prepared.state.material);
  if (Math.abs(Math.log(output.deflection / target)) > 2 * TOLERANCE || violations(params, prepared.state.material).length) {
    return { status: 'numerical-failure', message: 'The candidate did not pass forward verification. No inputs were changed.' };
  }
  return { ...result, params, output };
}
