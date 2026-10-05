import { VARIABLES, MATERIALS } from './beam.js';

export const STORAGE_KEY = 'inverse.notebook.v1';
export const DEFAULT_STATE = {
  version: 1, model: 'cantilever-v1', material: 'aluminum',
  params: { force: 80, length: 0.6, width: 0.04, thickness: 0.012 },
  locks: { force: true, length: true, width: false, thickness: false },
  weights: { force: 1, length: 1, width: 2, thickness: 1 },
};
const clone = value => structuredClone(value);
const object = value => value && typeof value === 'object' && !Array.isArray(value);

export function validateState(input) {
  if (!object(input) || input.version !== 1 || input.model !== 'cantilever-v1') throw new Error('This file is not a supported Inverse v1 beam notebook.');
  if (typeof input.material !== 'string' || !Object.hasOwn(MATERIALS, input.material)) throw new Error('The notebook contains an unknown material.');
  if (![input.params, input.locks, input.weights].every(object)) throw new Error('The notebook is missing parameters, locks, or preferences.');
  const state = { version: 1, model: 'cantilever-v1', material: input.material, params: {}, locks: {}, weights: {} };
  for (const variable of VARIABLES) {
    const { key, label, min, max } = variable;
    const value = input.params[key];
    const weight = input.weights[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${label} must be inside the documented bounds.`);
    if (typeof input.locks[key] !== 'boolean') throw new Error(`${label} needs a boolean lock.`);
    if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0.25 || weight > 16) throw new Error(`${label} needs a change weight from 0.25 through 16.`);
    state.params[key] = value;
    state.locks[key] = input.locks[key];
    state.weights[key] = weight;
  }
  return state;
}

export function serialize(state) { return JSON.stringify(validateState(state), null, 2); }
export function deserialize(text) {
  if (typeof text !== 'string' || text.length > 65536) throw new Error('Choose an Inverse JSON notebook smaller than 64 KB.');
  try { return validateState(JSON.parse(text)); }
  catch (error) {
    if (error instanceof SyntaxError) throw new Error('This file is not valid JSON. Your current notebook is unchanged.');
    throw error;
  }
}

export class History {
  constructor(state = DEFAULT_STATE, limit = 40) {
    this.current = validateState(state);
    this.label = 'Initial notebook';
    this.past = [];
    this.future = [];
    this.limit = limit;
  }
  commit(next, label) {
    const validated = validateState(next);
    if (JSON.stringify(validated) === JSON.stringify(this.current)) return false;
    this.past.push({ state: clone(this.current), label: this.label });
    if (this.past.length > this.limit) this.past.shift();
    this.current = validated;
    this.label = label;
    this.future = [];
    return true;
  }
  undo() {
    const previous = this.past.pop();
    if (!previous) return false;
    this.future.push({ state: clone(this.current), label: this.label });
    this.current = previous.state;
    this.label = previous.label;
    return true;
  }
  redo() {
    const next = this.future.pop();
    if (!next) return false;
    this.past.push({ state: clone(this.current), label: this.label });
    this.current = next.state;
    this.label = next.label;
    return true;
  }
}
