/** A bounded, positive-monomial inverse solver. No DOM or physical-model dependencies. */
export const TOLERANCE = 1e-8;
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const finite = (n) => typeof n === 'number' && Number.isFinite(n);

function combinations(items, count, visit, selected = [], start = 0) {
  if (selected.length === count) return visit(selected);
  for (let i = start; i <= items.length - (count - selected.length); i++) {
    selected.push(items[i]);
    combinations(items, count, visit, selected, i + 1);
    selected.pop();
  }
}

/** Partial-pivot elimination. Returns null for rank-deficient systems. */
function linearSolve(matrix, rhs) {
  const n = rhs.length;
  if (!n) return [];
  const rows = matrix.map((row, i) => [...row, rhs[i]]);
  const scale = Math.max(...matrix.flat().map(Math.abs));
  if (!scale) return null;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(rows[row][col]) > Math.abs(rows[pivot][col])) pivot = row;
    }
    if (Math.abs(rows[pivot][col]) <= scale * 1e-11) return null;
    [rows[col], rows[pivot]] = [rows[pivot], rows[col]];
    const divisor = rows[col][col];
    for (let j = col; j <= n; j++) rows[col][j] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = rows[row][col];
      for (let j = col; j <= n; j++) rows[row][j] -= factor * rows[col][j];
    }
  }
  const result = rows.map(row => row[n]);
  return result.every(finite) ? result : null;
}

function satisfies(point, constraints) {
  return constraints.every(({ a, b }) => dot(a, point) <= b + TOLERANCE);
}

function validateSpec(spec) {
  const { values, exponents, bounds, locked, weights, constraints = [] } = spec;
  if (!Array.isArray(values) || values.length < 1 || values.length > 4) {
    throw new RangeError('The exact solver supports one through four variables.');
  }
  const n = values.length;
  for (const list of [exponents, bounds, locked, weights]) {
    if (!Array.isArray(list) || list.length !== n) throw new TypeError('Variable arrays must have equal length.');
  }
  values.forEach((value, i) => {
    if (!finite(value) || value <= 0) throw new RangeError('Baseline values must be finite and positive.');
    if (!finite(exponents[i])) throw new RangeError('Exponents must be finite.');
    if (!finite(weights[i]) || weights[i] <= 0) throw new RangeError('Change weights must be finite and positive.');
    if (typeof locked[i] !== 'boolean') throw new TypeError('Locks must be booleans.');
    const range = bounds[i];
    if (!range || !finite(range.min) || !finite(range.max) || range.min <= 0 || range.min > range.max || value < range.min || value > range.max) {
      throw new RangeError('Baseline values must be inside finite positive bounds.');
    }
  });
  if (!Array.isArray(constraints)) throw new TypeError('Constraints must be an array.');
  constraints.forEach(row => {
    if (!Array.isArray(row.a) || row.a.length !== n || !row.a.every(finite) || !finite(row.b)) {
      throw new TypeError('A constraint needs finite coefficients and a finite upper bound.');
    }
  });
}

/** Prepare a fixed baseline and calculate its attainable log-output interval. */
export function prepare(spec) {
  validateSpec(spec);
  const { values, exponents, bounds, locked, weights } = spec;
  const free = values.map((_, i) => i).filter(i => !locked[i]);
  const n = free.length;
  const a = free.map(i => exponents[i]);
  const w = free.map(i => weights[i]);
  const rows = (spec.constraints ?? []).map(row => ({ ...row, a: free.map(i => row.a[i]) }));
  free.forEach((index, j) => {
    const axis = Array(n).fill(0);
    axis[j] = 1;
    rows.push({ a: axis, b: Math.log(bounds[index].max / values[index]), label: `Maximum ${bounds[index].label ?? index}` });
    rows.push({ a: axis.map(v => -v), b: Math.log(values[index] / bounds[index].min), label: `Minimum ${bounds[index].label ?? index}` });
  });
  const fixedConflicts = rows.filter(row => row.a.every(v => v === 0) && row.b < -TOLERANCE);
  const constraints = rows.filter(row => row.a.some(v => v !== 0));
  const region = { spec, free, a, w, constraints, status: 'ready', range: null, vertices: [] };
  if (fixedConflicts.length) return { ...region, status: 'empty', conflicts: fixedConflicts.map(r => r.label) };
  if (!n) return { ...region, vertices: [[]], range: { min: 0, max: 0 } };

  // ponytail: exhaustive active sets are bounded to four variables; use a QP/LP solver before scaling this model class.
  combinations(constraints, n, active => {
    const z = linearSolve(active.map(r => r.a), active.map(r => r.b));
    if (z && satisfies(z, constraints)) region.vertices.push(z);
  });
  if (!region.vertices.length) return { ...region, status: 'empty', conflicts: ['Bounds and model constraints have no common feasible state under these locks.'] };
  const outputs = region.vertices.map(z => dot(a, z));
  region.range = { min: Math.min(...outputs), max: Math.max(...outputs) };
  return region;
}

function minimumNorm(rows, w) {
  if (!rows.length) return Array(w.length).fill(0);
  const matrix = rows.map(r => rows.map(s => r.a.reduce((sum, value, i) => sum + value * s.a[i] / w[i], 0)));
  const multipliers = linearSolve(matrix, rows.map(r => r.b));
  if (!multipliers) return null;
  return w.map((weight, i) => rows.reduce((sum, row, j) => sum + row.a[i] * multipliers[j], 0) / weight);
}

/** Solve for log(target / baseline output); input is deliberately dimensionless. */
export function solve(region, logTarget) {
  if (!finite(logTarget)) return { status: 'invalid', message: 'The target must be a finite positive quantity.' };
  if (region.status === 'empty') return { status: 'empty', conflicts: region.conflicts };
  const { a, w, free, constraints, range, spec } = region;
  if (logTarget < range.min - TOLERANCE || logTarget > range.max + TOLERANCE) return { status: 'unreachable', range };
  const n = free.length;
  const targetRows = a.some(v => v !== 0) ? [{ a, b: logTarget }] : [];
  let best = null;
  for (let k = 0; k <= n - targetRows.length; k++) {
    combinations(constraints, k, active => {
      const z = minimumNorm([...targetRows, ...active], w);
      if (!z || Math.abs(dot(a, z) - logTarget) > TOLERANCE || !satisfies(z, constraints)) return;
      const objective = 0.5 * z.reduce((sum, value, i) => sum + w[i] * value ** 2, 0);
      if (!best || objective < best.objective) best = { z, objective };
    });
  }
  if (!best) return { status: 'numerical-failure', message: 'A feasible target was found, but the numerical projection could not be verified.' };
  const values = [...spec.values];
  free.forEach((index, i) => {
    const value = spec.values[index] * Math.exp(best.z[i]);
    values[index] = Math.max(spec.bounds[index].min, Math.min(spec.bounds[index].max, value));
  });
  return {
    status: 'solved', values, objective: best.objective,
    active: constraints.filter(row => Math.abs(dot(row.a, best.z) - row.b) < 1e-7).map(row => row.label),
    range,
  };
}
