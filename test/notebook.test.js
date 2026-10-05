import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE, validateState, serialize, deserialize, History } from '../src/notebook.js';

const copy = () => structuredClone(DEFAULT_STATE);

test('notebook serialization round-trip retains every committed setting', () => {
  const state = copy();
  state.material = 'steel';
  state.locks.force = false;
  state.weights.force = 4;
  state.params.force = 125;
  assert.deepEqual(deserialize(serialize(state)), state);
});

test('malformed and unknown imports are rejected', () => {
  assert.throws(() => deserialize('{broken'), /valid JSON/);
  assert.throws(() => deserialize('x'.repeat(65537)), /64 KB/);
  for (const mutate of [
    s => { s.version = 2; },
    s => { s.material = '__proto__'; },
    s => { s.params.width = -1; },
    s => { s.params.force = Infinity; },
    s => { s.locks.width = 'false'; },
    s => { s.weights.width = 0; },
  ]) {
    const s = copy(); mutate(s); assert.throws(() => validateState(s));
  }
});

test('history restores complete states and branching clears redo', () => {
  const h = new History();
  const next = copy(); next.params.force = 100; next.locks.force = false;
  assert.equal(h.commit(next, 'Changed load'), true);
  assert.equal(h.commit(next, 'Duplicate'), false);
  assert.equal(h.undo(), true);
  assert.deepEqual(h.current, DEFAULT_STATE);
  assert.equal(h.redo(), true);
  assert.deepEqual(h.current, next);
  h.undo();
  const branch = copy(); branch.material = 'steel';
  h.commit(branch, 'Changed material');
  assert.equal(h.redo(), false);
});

test('invalid transactions are nondestructive and history is bounded', () => {
  const h = new History(DEFAULT_STATE, 3);
  const bad = copy(); bad.params.force = 0;
  assert.throws(() => h.commit(bad, 'Bad'));
  assert.deepEqual(h.current, DEFAULT_STATE);
  assert.equal(h.past.length, 0);
  for (let force = 81; force < 90; force++) {
    const next = copy(); next.params.force = force; h.commit(next, 'Load');
  }
  assert.equal(h.past.length, 3);
});
