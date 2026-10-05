import { VARIABLES, MATERIALS, forward, prepareBeam, inverseBeam, violations } from './beam.js';
import { DEFAULT_STATE, STORAGE_KEY, History, serialize, deserialize } from './notebook.js';

const $ = selector => document.querySelector(selector);
const fmt = (value, digits = 2) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const compact = (value, digits = 3) => Number(value.toFixed(digits)).toString();
const mm = value => value * 1000;
const iconPaths = {
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
  unlock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 017.5-2"/>',
  undo: '<path d="M9 5 4 10l5 5M4 10h10a6 6 0 010 12"/>',
  redo: '<path d="m15 5 5 5-5 5m5-5H10a6 6 0 000 12"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  book: '<path d="M12 5v16M3 4h5a4 4 0 014 2 4 4 0 014-2h5v15h-5a4 4 0 00-4 2 4 4 0 00-4-2H3z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  reset: '<path d="M4 11a8 8 0 111 7M4 4v7h7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`;

let initial = DEFAULT_STATE;
let startupMessage = '';
let storageAvailable = true;
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) initial = deserialize(saved);
} catch {
  startupMessage = 'The saved notebook could not be loaded. The default is open; you can import an exported copy.';
  storageAvailable = false;
}
const history = new History(initial);
let prepared = prepareBeam(history.current);
let target = prepared.baseline.deflection;
let proposal = inverseBeam(prepared, target);
let targetInvalid = false;
let dragging = false;
let dragScale = 30;
let dragStartTarget = target;
let pendingPoint = null;
let pendingFrame = 0;
let scaleMax = 30;
let toastTimer;

$('#app').innerHTML = `
  <header class="masthead">
    <a class="wordmark" href="/" aria-label="Inverse home"><svg viewBox="0 0 30 30" aria-hidden="true"><path d="M4 9h8l6 12h8M4 21h8l6-12h8"/></svg><span>inverse</span><span class="version">0.1</span></a>
    <div class="masthead-middle"><span class="notebook-icon">▤</span> Mechanics notebook <span class="divider">/</span> Cantilever</div>
    <div class="masthead-actions"><span id="save-status" class="save-state">Local notebook</span><button class="button quiet" id="guide-button">${icon('book')}<span>Guide</span></button><button class="button quiet" id="export-button">${icon('download')}<span>Export</span></button></div>
  </header>
  <main id="workspace">
    <div class="workspace-heading">
      <div><div class="context-label"><span class="mini-beam"></span> An experiment in working backward</div><h1>Cantilever study<span class="title-period">.</span></h1><p>Move the result. See what has to change.</p></div>
      <div class="history-controls"><button id="undo-button" class="icon-button" aria-label="Undo" title="Undo (⌘/Ctrl Z)">${icon('undo')}</button><button id="redo-button" class="icon-button" aria-label="Redo" title="Redo (⌘/Ctrl Shift Z)">${icon('redo')}</button><span class="control-divider"></span><button id="reset-button" class="button quiet">${icon('reset')} Reset</button></div>
    </div>
    <div id="notice" class="notice" role="status" hidden></div>
    <div class="workbench">
      <section class="experiment" aria-labelledby="experiment-title">
        <div class="panel-top"><h2 id="experiment-title">The result is yours to move</h2><span class="model-type">Static · End-loaded beam</span></div>
        <div class="output-strip">
          <div><label for="target-input">Desired tip deflection <span class="symbol">δ</span></label><div class="target-field"><input id="target-input" aria-describedby="target-help target-error" type="number" min="0.0001" max="1000000" step="any" inputmode="decimal"><span>mm</span></div><p id="target-help">Drag the handle, or enter a result.</p><p id="target-error" class="field-error" hidden></p></div>
          <div class="baseline-output"><span>Committed result</span><strong id="baseline-value"></strong><button id="example-button" class="text-button">Try a stiffer beam: 8 mm</button></div>
        </div>
        <div class="drawing">
          <svg id="beam-canvas" viewBox="0 0 900 360" aria-labelledby="diagram-title diagram-description">
            <title id="diagram-title">Cantilever beam with an editable tip deflection</title>
            <desc id="diagram-description">The beam is fixed on the left and loaded at its free right end. The solid beam shows the proposed shape; the dashed beam shows the committed shape. Use the handle or the desired deflection field to change the output.</desc>
            <defs>
              <pattern id="plot-grid" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" class="grid-dot"/></pattern>
              <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="8" class="hatch-line"/></pattern>
              <marker id="force-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" class="arrow-fill"/></marker>
            </defs>
            <rect width="900" height="360" fill="url(#plot-grid)"/>
            <text x="46" y="37" class="drawing-caption">Fixed support</text>
            <path d="M99 48 111 70 111 122" class="annotation-line"/>
            <text x="696" y="37" class="drawing-caption" id="force-label">80 N end load</text>
            <path id="force-line" d="M730 55V116" class="load-line" marker-end="url(#force-arrow)"/>
            <rect x="103" y="123" width="32" height="90" fill="url(#hatch)"/>
            <line x1="135" x2="135" y1="121" y2="215" class="support-line"/>
            <line x1="135" x2="794" y1="155" y2="155" class="zero-line"/>
            <rect id="reachable-band" x="800" y="155" width="13" height="130" rx="3" class="reachable-band"/>
            <line x1="807" x2="807" y1="155" y2="305" class="ruler-line"/>
            <path d="M798 155h18M801 230h12M798 305h18" class="ruler-line"/>
            <text x="832" y="159" class="ruler-label">0</text><text x="832" y="234" id="ruler-mid" class="ruler-label">15</text><text x="832" y="309" id="ruler-max" class="ruler-label">30</text>
            <text x="803" y="135" class="ruler-label">mm</text>
            <path id="baseline-path" class="baseline-path" d=""/>
            <path id="beam-path" class="beam-path" d=""/>
            <line id="target-guide" x1="735" x2="806" y1="225" y2="225" class="target-guide"/>
            <circle id="ruler-target" cx="807" cy="225" r="4" class="ruler-target"/>
            <g id="tip-handle" role="slider" tabindex="0" aria-label="Desired tip deflection" aria-orientation="vertical" aria-valuemin="0.001" aria-valuemax="1000000" aria-valuenow="14.49" aria-describedby="handle-help" transform="translate(730 225)">
              <circle r="27" class="handle-hit"/><circle r="17" class="handle-halo"/><circle r="10" class="handle-core"/><path d="m-3-2 3-3 3 3m-6 4 3 3 3-3" class="handle-glyph"/>
            </g>
            <text id="handle-caption" x="708" y="252" text-anchor="end" class="handle-caption">Drag to change</text>
            <path d="M136 326v12m0-6h594m0-6v12" class="dimension-line"/>
            <text id="length-label" x="433" y="352" text-anchor="middle" class="dimension-label">L = 0.600 m</text>
          </svg>
          <span id="handle-help" class="sr-only">Arrow up reduces deflection and arrow down increases it by 0.1 millimeters. Hold Shift for 1 millimeter. Home and End select reachable endpoints. Escape cancels a proposal.</span>
        </div>
        <div class="diagram-footer"><div class="legend"><span><i class="legend-line solid"></i>Proposed</span><span><i class="legend-line dashed"></i>Committed</span></div><span id="scale-note">Deflection magnified · schematic</span></div>
        <div class="reachability"><div class="range-heading"><span>Reachable with these locks</span><strong id="range-text"></strong></div><svg class="range-track" viewBox="0 0 600 12" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="3" width="600" height="6" rx="3" class="track-fill"/><line id="range-marker" x1="300" x2="300" y1="0" y2="12" class="track-marker"/></svg><p id="range-note">Bounds and model limits are enforced.</p></div>
      </section>
      <aside class="parameters" aria-labelledby="parameters-title">
        <div class="panel-top"><h2 id="parameters-title">What can change?</h2><span class="free-count" id="free-count">2 free</span></div>
        <p class="panel-description">Lock what matters. Let the rest adapt.</p>
        <div id="variable-controls">${VARIABLES.map(v => `
          <div class="variable-row" data-variable="${v.key}">
            <div class="variable-top"><label for="input-${v.key}"><span class="variable-symbol">${v.short}</span>${v.label}</label><button class="lock-button" id="lock-${v.key}" data-lock="${v.key}" aria-pressed="false" aria-label="Lock ${v.label.toLowerCase()}"></button></div>
            <div class="parameter-field"><input id="input-${v.key}" data-param="${v.key}" type="number" inputmode="decimal" min="${v.min * v.factor}" max="${v.max * v.factor}" step="any" aria-describedby="bounds-${v.key} error-${v.key}"><span>${v.unit}</span><span id="delta-${v.key}" class="parameter-delta" hidden></span></div>
            <div class="variable-bottom"><span id="bounds-${v.key}">${compact(v.min * v.factor)}–${compact(v.max * v.factor)} ${v.unit}</span><label class="weight-control" title="Higher resistance favors smaller relative changes">Resistance <select data-weight="${v.key}" id="weight-${v.key}" aria-label="${v.label} change resistance">${[0.25, 0.5, 1, 2, 4, 8, 16].map(w => `<option value="${w}">${w}×</option>`).join('')}</select></label></div>
            <p id="error-${v.key}" class="field-error" hidden></p>
          </div>`).join('')}</div>
        <div class="material-row"><label for="material-select">Material</label><select id="material-select">${Object.entries(MATERIALS).map(([id, m]) => `<option value="${id}">${m.name}</option>`).join('')}</select><p id="material-note"></p></div>
        <details class="constraint-details"><summary>Model constraints <span>3 limits</span></summary><ul><li id="stress-rule"></li><li>Deflection ≤ 5% of length</li><li>Length ≥ 10 × thickness</li></ul><p>Illustrative screening limits for this model.</p></details>
      </aside>
      <section class="proposal-panel" aria-labelledby="proposal-title">
        <div class="proposal-heading"><div class="proposal-heading-copy"><span id="proposal-icon" class="proposal-icon">${icon('info')}</span><div><h2 id="proposal-title">Start with the result</h2><p id="proposal-description">Set a target above. We’ll find the smallest relative changes.</p></div></div><span id="proposal-status" class="status-tag">Ready to explore</span></div>
        <div id="changes" class="changes"></div>
        <div id="metrics" class="metrics"></div>
        <div id="active-constraints" class="active-constraints" hidden></div>
        <div class="proposal-actions"><p id="objective-note">A preview leaves your committed notebook untouched.</p><div><button id="nearest-button" class="button secondary" hidden>Use nearest reachable</button><button id="cancel-button" class="button quiet" hidden>Cancel</button><button id="apply-button" class="button primary" disabled>${icon('check')} Apply changes</button></div></div>
      </section>
      <section class="notebook-note" aria-labelledby="relationship-title"><span class="note-symbol">ƒ</span><h2 id="relationship-title">One relationship.<br>Both directions.</h2><p>Changing an input moves the beam. Moving the beam finds new inputs.</p><div class="formula">δ = 4FL³ / Ebh³</div><p class="note-small">Thickness has a cubic effect. A small increase can make a big difference.</p><button id="math-button" class="text-button">Understand the mathematics</button></section>
    </div>
    <section class="bottom-section"><div class="history-section"><h2>Your exploration</h2><div id="history-list" class="history-list"></div></div><details class="assumptions"><summary>About this model</summary><p>A static, rectangular cantilever with one end load, using Euler–Bernoulli beam theory. It assumes a homogeneous, linearly elastic material and small deflections. Self-weight, shear deformation, dynamics, plasticity, and joint behavior are omitted. Materials and limits are illustrative; this is an educational notebook.</p><p>The inverse is exact within its supported positive power-law model and numerical tolerances. It is not a general-purpose solver.</p></details></section>
    <footer class="workspace-footer"><span>Built for curiosity. Computed on your device.</span><div><button id="import-button" class="text-button">${icon('upload')} Import notebook</button><a href="/docs/00-guide.md" target="_blank" rel="noopener">Project docs</a><span>v0.1 · Local preview</span></div></footer>
  </main>
  <dialog id="guide-dialog" aria-labelledby="guide-title"><div class="dialog-heading"><div><span class="context-label">The Inverse notebook</span><h2 id="guide-title">Begin at the other end.</h2></div><button id="close-guide" class="icon-button" aria-label="Close guide">${icon('close')}</button></div><div class="guide-body"><p class="guide-intro">You don’t have to guess every input. Tell the model what you want to happen, then decide which changes to keep.</p><ol class="guide-steps"><li><strong>Move the result.</strong> Drag the beam’s handle, enter a desired tip deflection, or use the example. Keyboard users can focus the handle and press the arrow keys.</li><li><strong>Choose what can change.</strong> Locks preserve inputs exactly during inverse solving. You can still edit locked inputs manually. Higher resistance makes relative changes more expensive.</li><li><strong>Read the proposal.</strong> Compare the committed beam with the new one. The notebook shows exactly which inputs change and whether limits are binding.</li><li><strong>Keep it or try again.</strong> Apply commits one change. Cancel discards the preview. Undo and redo let you explore without losing your place.</li></ol><h3 id="guide-math">What does “smallest change” mean?</h3><p>We minimize a weighted sum of squared log ratios: <code>½ Σ wᵢ ln(xᵢ / x₀ᵢ)²</code>. This compares relative changes across different units. A higher weight makes a variable more resistant to change.</p><p>For this beam, deflection is <code>δ = 4FL³ / (Ebh³)</code>. In log coordinates, its target and constraints become linear. A small convex solver finds the nearest feasible combination, up to numerical tolerance.</p><h3>When a result is out of reach</h3><p>The requested target stays visible. Apply is disabled and the reachable interval is shown. “Use nearest reachable” explicitly changes your request to its closest boundary. You can also unlock a parameter or choose a different model setup.</p><h3>Your work stays here</h3><p>Committed settings save in this browser. Export creates a versioned JSON notebook you can import later. There are no accounts, cloud calls, or AI-generated calculations.</p><h3>What this model leaves out</h3><p>This is a static, small-deflection beam demonstration with illustrative materials. It omits self-weight, shear deformation, nonlinear effects, buckling, and dynamics. The diagram magnifies displacement. It is not an engineering design certification.</p><div class="guide-links"><a href="/docs/02-mathematics.md" target="_blank" rel="noopener">Full mathematical derivation</a><a href="/docs/04-implementation.md" target="_blank" rel="noopener">Implementation plan</a><a href="/docs/07-roadmap.md" target="_blank" rel="noopener">Product roadmap</a></div></div></dialog>
  <input type="file" id="import-file" accept=".json,application/json" hidden>
  <div id="toast" class="toast" role="status" hidden></div><div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>
`;

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}
function announce(message) { $('#announcer').textContent = message; }
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(history.current));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
    toast('Browser saving is unavailable. Export a notebook to keep your work.');
  }
}
function commit(next, label) {
  try {
    if (history.commit(next, label)) save();
    resetPreview();
  } catch (error) { toast(error.message); }
}
function resetPreview() {
  prepared = prepareBeam(history.current);
  target = prepared.baseline.deflection;
  targetInvalid = false;
  proposal = inverseBeam(prepared, target);
  $('#target-error').hidden = true;
  $('#target-input').removeAttribute('aria-invalid');
  for (const v of VARIABLES) {
    $(`#error-${v.key}`).hidden = true;
    $(`#input-${v.key}`).removeAttribute('aria-invalid');
  }
  render();
}
function setTarget(value, speak = false) {
  if (!Number.isFinite(value) || value <= 0 || value > 1000) {
    targetInvalid = true;
    $('#target-error').textContent = 'Enter a value greater than 0 and at most 1,000,000 mm.';
    $('#target-error').hidden = false;
    $('#target-input').setAttribute('aria-invalid', 'true');
    proposal = { status: 'invalid' };
    render();
    if (speak) announce('Enter a finite, positive deflection.');
    return;
  }
  targetInvalid = false;
  target = value;
  $('#target-error').hidden = true;
  $('#target-input').removeAttribute('aria-invalid');
  proposal = inverseBeam(prepared, target);
  render();
  if (speak) announce(`${$('#proposal-title').textContent}. ${$('#proposal-description').textContent}`);
}
function changes() {
  if (proposal.status !== 'solved') return [];
  return VARIABLES.filter(v => Math.abs(Math.log(proposal.params[v.key] / history.current.params[v.key])) > 1e-8);
}
function render() {
  const state = history.current;
  const changeList = changes();
  const hasChange = changeList.length > 0;
  const isPreview = !targetInvalid && Math.abs(Math.log(target / prepared.baseline.deflection)) > 1e-8;
  $('#app').dataset.status = proposal.status;
  $('#save-status').textContent = storageAvailable ? 'Saved on this device' : 'Unsaved · export to keep';
  $('#baseline-value').textContent = `${fmt(mm(prepared.baseline.deflection))} mm`;
  if (document.activeElement !== $('#target-input') && !targetInvalid) $('#target-input').value = compact(mm(target), 4);
  for (const v of VARIABLES) {
    const field = $(`#input-${v.key}`);
    if (document.activeElement !== field) field.value = compact(state.params[v.key] * v.factor, 5);
    const lock = $(`#lock-${v.key}`);
    lock.setAttribute('aria-pressed', String(state.locks[v.key]));
    lock.setAttribute('aria-label', `${state.locks[v.key] ? 'Unlock' : 'Lock'} ${v.label.toLowerCase()}`);
    lock.innerHTML = `${icon(state.locks[v.key] ? 'lock' : 'unlock')}<span>${state.locks[v.key] ? 'Locked' : 'Free'}</span>`;
    const weightControl = $(`#weight-${v.key}`);
    weightControl.querySelectorAll('[data-custom]').forEach(option => option.remove());
    if (![...weightControl.options].some(option => Number(option.value) === state.weights[v.key])) {
      const option = new Option(`${state.weights[v.key]}×`, String(state.weights[v.key]));
      option.dataset.custom = 'true';
      weightControl.add(option);
    }
    weightControl.value = state.weights[v.key];
    weightControl.disabled = state.locks[v.key];
    const delta = $(`#delta-${v.key}`);
    delta.hidden = !changeList.includes(v);
    if (!delta.hidden) delta.textContent = `→ ${compact(proposal.params[v.key] * v.factor, 3)}`;
  }
  $('#material-select').value = state.material;
  const material = MATERIALS[state.material];
  $('#material-note').textContent = `E = ${fmt(material.modulus / 1e9, 0)} GPa · illustrative properties`;
  $('#stress-rule').textContent = `Stress ≤ ${material.allowedStress / 1e6} MPa`;
  $('#free-count').textContent = `${VARIABLES.filter(v => !state.locks[v.key]).length} free`;
  $('#undo-button').disabled = !history.past.length;
  $('#redo-button').disabled = !history.future.length;
  $('#apply-button').disabled = !hasChange || targetInvalid;
  $('#cancel-button').hidden = !isPreview && !targetInvalid;
  $('#nearest-button').hidden = proposal.status !== 'unreachable' || !prepared.range;

  const baselineViolations = violations(state.params, state.material);
  $('#notice').hidden = !baselineViolations.length && !startupMessage;
  $('#notice').textContent = startupMessage || (baselineViolations.length ? `The committed beam is outside this model’s limits. ${baselineViolations.join(' ')} Review free variables to find a feasible proposal.` : '');
  if (prepared.range) {
    $('#range-text').textContent = `${fmt(mm(prepared.range.min), 3)}–${fmt(mm(prepared.range.max), 3)} mm`;
    $('#range-note').textContent = 'Hard bounds, stress, and beam-model limits are included.';
    const span = prepared.range.max - prepared.range.min;
    const position = span > 1e-12 ? Math.max(0, Math.min(1, (target - prepared.range.min) / span)) : 0.5;
    $('#range-marker').setAttribute('x1', 2 + position * 596);
    $('#range-marker').setAttribute('x2', 2 + position * 596);
  } else {
    $('#range-text').textContent = 'No feasible configuration';
    $('#range-note').textContent = 'Current locks and model constraints conflict. Try freeing a parameter.';
  }
  renderDiagram();
  renderProposal(changeList, isPreview);
  renderHistory();
}

function renderDiagram() {
  const candidate = proposal.status === 'solved' ? proposal.output.deflection : prepared.baseline.deflection;
  scaleMax = dragging ? dragScale : Math.max(30, Math.ceil(Math.max(mm(candidate), mm(target), mm(prepared.baseline.deflection)) * 1.18 / 10) * 10);
  const toY = value => 155 + mm(value) / scaleMax * 150;
  const curve = value => `M135 155 C333.33 155 531.67 ${155 + (toY(value) - 155) / 2} 730 ${toY(value)}`;
  $('#beam-path').setAttribute('d', curve(candidate));
  $('#baseline-path').setAttribute('d', curve(prepared.baseline.deflection));
  $('#beam-path').classList.toggle('unreachable', proposal.status === 'unreachable' || proposal.status === 'empty');
  const y = toY(target);
  $('#tip-handle').setAttribute('transform', `translate(730 ${y})`);
  $('#tip-handle').setAttribute('aria-valuenow', compact(mm(target), 4));
  $('#tip-handle').setAttribute('aria-valuetext', `${fmt(mm(target), 3)} millimeters desired deflection`);
  $('#tip-handle').classList.toggle('unreachable', proposal.status === 'unreachable' || proposal.status === 'empty');
  $('#target-guide').setAttribute('y1', y);
  $('#target-guide').setAttribute('y2', y);
  $('#ruler-target').setAttribute('cy', y);
  $('#handle-caption').setAttribute('y', y + 30);
  $('#handle-caption').textContent = dragging ? `${fmt(mm(target))} mm requested` : (proposal.status === 'unreachable' ? 'Target out of reach' : 'Drag the result');
  $('#ruler-mid').textContent = compact(scaleMax / 2, 1);
  $('#ruler-max').textContent = compact(scaleMax, 1);
  $('#force-label').textContent = `${fmt((proposal.params ?? history.current.params).force, 1)} N end load`;
  $('#length-label').textContent = `L = ${fmt((proposal.params ?? history.current.params).length, 3)} m`;
  $('#scale-note').textContent = `Magnified deflection · 0–${compact(scaleMax, 0)} mm scale`;
  const band = $('#reachable-band');
  band.setAttribute('y', prepared.range ? toY(prepared.range.min) : 155);
  band.setAttribute('height', prepared.range ? Math.max(2, Math.min(305, toY(prepared.range.max)) - toY(prepared.range.min)) : 0);
}

function renderProposal(changeList, isPreview) {
  const status = proposal.status;
  let title = 'Start with the result';
  let description = 'Set a target above. We’ll find the smallest relative changes.';
  let tag = 'Ready to explore';
  if (status === 'solved' && changeList.length) {
    title = `${changeList.length} ${changeList.length === 1 ? 'change makes' : 'changes make'} it possible`;
    description = `${fmt(mm(prepared.baseline.deflection))} → ${fmt(mm(proposal.output.deflection))} mm deflection. Your locked inputs stay exactly the same.`;
    tag = 'Feasible proposal';
  } else if (status === 'unreachable') {
    title = 'This result is out of reach';
    description = `${fmt(mm(target))} mm is outside the reachable interval. Unlock a parameter or explicitly use the closest reachable result.`;
    tag = 'Target unreachable';
  } else if (status === 'empty') {
    title = 'These constraints need more room';
    description = (proposal.conflicts ?? prepared.region.conflicts ?? ['Review the locked inputs.']).join(' ');
    tag = 'No feasible state';
  } else if (status === 'invalid') {
    title = 'Give the result a valid value';
    description = 'Enter a positive, finite deflection. Your committed inputs are unchanged.';
    tag = 'Check target';
  } else if (status === 'numerical-failure') {
    title = 'We couldn’t verify this solution';
    description = proposal.message;
    tag = 'Numerical failure';
  }
  $('#proposal-title').textContent = title;
  $('#proposal-description').textContent = description;
  $('#proposal-status').textContent = tag;
  $('#proposal-status').dataset.tone = status === 'solved' ? (changeList.length ? 'success' : 'neutral') : 'warning';
  $('#proposal-icon').innerHTML = icon(changeList.length ? 'check' : 'info');
  $('#changes').innerHTML = changeList.length ? `<div class="changes-table"><div class="changes-table-head"><span>Parameter</span><span>Committed</span><span>Proposed</span><span>Change</span></div>${changeList.map(v => {
    const before = history.current.params[v.key];
    const after = proposal.params[v.key];
    const percent = (after / before - 1) * 100;
    return `<div class="change-row"><span><span class="change-symbol">${v.short}</span>${v.label}</span><span>${fmt(before * v.factor, v.digits)} <small>${v.unit}</small></span><strong>${fmt(after * v.factor, v.digits)} <small>${v.unit}</small></strong><span class="percent-change">${percent > 0 ? '+' : ''}${fmt(percent, 1)}%</span></div>`;
  }).join('')}</div>` : `<p class="empty-proposal">${status === 'solved' ? 'The notebook is unchanged. Try 8 mm to explore a stiffer beam.' : 'No changes have been applied to your notebook.'}</p>`;
  const output = proposal.status === 'solved' ? proposal.output : prepared.baseline;
  const material = MATERIALS[history.current.material];
  $('#metrics').innerHTML = `<div><span>Beam mass</span><strong>${fmt(output.mass, 3)} <small>kg</small></strong>${changeList.length ? `<span class="metric-reference">was ${fmt(prepared.baseline.mass, 3)} kg</span>` : ''}</div><div><span>Maximum stress</span><strong>${fmt(output.stress / 1e6, 1)} <small>MPa</small></strong><span class="metric-reference">limit ${material.allowedStress / 1e6} MPa</span></div>`;
  const active = status === 'solved' ? proposal.active : [];
  $('#active-constraints').hidden = !active.length;
  $('#active-constraints').textContent = `At the limit: ${active.join(' · ')}`;
  $('#objective-note').textContent = changeList.length ? 'Smallest weighted relative change. Preview only, until applied.' : 'A preview leaves your committed notebook untouched.';
}

function renderHistory() {
  const entries = [{ label: history.label }, ...history.past.slice(-3).reverse()];
  const fragment = document.createDocumentFragment();
  entries.forEach((entry, i) => {
    const item = document.createElement('div');
    item.className = `history-item${i === 0 ? ' current' : ''}`;
    const marker = document.createElement('span');
    marker.className = 'history-marker';
    marker.textContent = i === 0 ? 'Now' : 'Earlier';
    const text = document.createElement('span');
    text.textContent = entry.label;
    item.append(marker, text);
    fragment.append(item);
  });
  $('#history-list').replaceChildren(fragment);
}

$('#target-input').addEventListener('input', event => setTarget(event.target.valueAsNumber / 1000));
$('#target-input').addEventListener('change', () => announce(`${$('#proposal-title').textContent}. ${$('#proposal-description').textContent}`));
$('#example-button').addEventListener('click', () => setTarget(0.008, true));
$('#cancel-button').addEventListener('click', () => { resetPreview(); announce('Preview cancelled.'); });
$('#apply-button').addEventListener('click', () => {
  if (proposal.status !== 'solved' || !changes().length || targetInvalid) return;
  const next = structuredClone(history.current);
  next.params = { ...proposal.params };
  const label = `Applied ${fmt(mm(proposal.output.deflection))} mm deflection`;
  commit(next, label);
  announce(`${label}. You can undo this change.`);
});
$('#nearest-button').addEventListener('click', () => {
  if (prepared.range) setTarget(Math.max(prepared.range.min, Math.min(prepared.range.max, target)), true);
});

for (const v of VARIABLES) {
  $(`#input-${v.key}`).addEventListener('change', event => {
    const value = event.target.valueAsNumber / v.factor;
    const error = $(`#error-${v.key}`);
    if (!Number.isFinite(value) || value < v.min || value > v.max) {
      error.textContent = `Use ${compact(v.min * v.factor)}–${compact(v.max * v.factor)} ${v.unit}.`;
      error.hidden = false;
      event.target.setAttribute('aria-invalid', 'true');
      return;
    }
    error.hidden = true;
    event.target.removeAttribute('aria-invalid');
    const next = structuredClone(history.current);
    next.params[v.key] = value;
    commit(next, `Set ${v.label.toLowerCase()} to ${compact(value * v.factor)} ${v.unit}`);
  });
  $(`#lock-${v.key}`).addEventListener('click', () => {
    const next = structuredClone(history.current);
    next.locks[v.key] = !next.locks[v.key];
    commit(next, `${next.locks[v.key] ? 'Locked' : 'Freed'} ${v.label.toLowerCase()}`);
  });
  $(`#weight-${v.key}`).addEventListener('change', event => {
    const next = structuredClone(history.current);
    next.weights[v.key] = Number(event.target.value);
    commit(next, `Changed ${v.label.toLowerCase()} resistance`);
  });
}
$('#material-select').addEventListener('change', event => {
  const next = structuredClone(history.current);
  next.material = event.target.value;
  commit(next, `Selected ${MATERIALS[next.material].name.toLowerCase()}`);
});
function stepHistory(direction) {
  if (history[direction]()) { save(); resetPreview(); announce(`${direction === 'undo' ? 'Undid' : 'Restored'} the last change.`); }
}
$('#undo-button').addEventListener('click', () => stepHistory('undo'));
$('#redo-button').addEventListener('click', () => stepHistory('redo'));
$('#reset-button').addEventListener('click', () => {
  startupMessage = '';
  commit(DEFAULT_STATE, 'Reset to the initial beam');
  toast('Initial beam restored. Undo is available for committed changes.');
});
document.addEventListener('keydown', event => {
  if ($('#guide-dialog').open || event.target.matches('input, select, textarea')) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault(); stepHistory(event.shiftKey ? 'redo' : 'undo');
  }
});

function updateFromPointer(event) {
  const matrix = $('#beam-canvas').getScreenCTM();
  if (!matrix) return;
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  const value = Math.max(0.001, Math.min(dragScale, (point.y - 155) / 150 * dragScale));
  setTarget(value / 1000);
}
const handle = $('#tip-handle');
handle.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  dragging = true;
  dragScale = scaleMax;
  dragStartTarget = target;
  handle.setPointerCapture(event.pointerId);
  handle.focus();
  event.preventDefault();
});
handle.addEventListener('pointermove', event => {
  if (!dragging) return;
  pendingPoint = { clientX: event.clientX, clientY: event.clientY };
  if (!pendingFrame) pendingFrame = requestAnimationFrame(() => {
    pendingFrame = 0;
    if (pendingPoint && dragging) updateFromPointer(pendingPoint);
    pendingPoint = null;
  });
});
function endDrag(event, cancelled = false) {
  if (!dragging) return;
  if (pendingFrame) cancelAnimationFrame(pendingFrame);
  pendingFrame = 0;
  if (pendingPoint && !cancelled) updateFromPointer(pendingPoint);
  pendingPoint = null;
  dragging = false;
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  if (cancelled) setTarget(dragStartTarget); else render();
  announce(`${$('#proposal-title').textContent}. ${$('#proposal-description').textContent}`);
}
handle.addEventListener('pointerup', event => endDrag(event));
handle.addEventListener('pointercancel', event => endDrag(event, true));
handle.addEventListener('keydown', event => {
  const step = event.shiftKey ? 0.001 : 0.0001;
  let next;
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = Math.max(0.000001, target - step);
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = Math.min(1000, target + step);
  if (event.key === 'Home' && prepared.range) next = prepared.range.min;
  if (event.key === 'End' && prepared.range) next = prepared.range.max;
  if (event.key === 'Escape') { event.preventDefault(); resetPreview(); return; }
  if (next !== undefined) { event.preventDefault(); setTarget(next, true); }
});

function openGuide(math = false) {
  $('#guide-dialog').showModal();
  if (math) $('#guide-math').scrollIntoView({ block: 'start' });
}
$('#guide-button').addEventListener('click', () => openGuide());
$('#math-button').addEventListener('click', () => openGuide(true));
$('#close-guide').addEventListener('click', () => $('#guide-dialog').close());
$('#guide-dialog').addEventListener('click', event => {
  if (event.target !== $('#guide-dialog')) return;
  const bounds = event.target.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close();
});
$('#export-button').addEventListener('click', () => {
  const blob = new Blob([serialize(history.current)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'inverse-cantilever.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Committed notebook exported. Unapplied previews are not included.');
});
$('#import-button').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 65536) throw new Error('Choose a notebook smaller than 64 KB.');
    const imported = deserialize(await file.text());
    startupMessage = '';
    commit(imported, 'Imported a notebook');
    toast('Notebook imported. The previous state is available with Undo.');
  } catch (error) { toast(error.message); }
  event.target.value = '';
});

save();
render();
