// Original educational diagrams, decoded from the official browser core.
// Source: m-vave/fm1_open @ 4c7496daac04a95ff10d1afdcc8f9ead2dbabc41.
// Engine storage order OP6..OP1: app/instrument.h:149 and web/engine/sound.c:1675.
const SOURCE = 'https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/';
const ALGORITHMS = [
  { number: 1, title: 'Deep stack', subtitle: '4 + 2 operators', line: 37, flags: [0xc1, 0x11, 0x11, 0x14, 0x01, 0x14], positions: { 6: [115, 65], 5: [115, 160], 4: [115, 255], 3: [115, 350], 2: [280, 255], 1: [280, 350] }, caption: 'A long chain shapes one carrier. A second pair adds another layer.' },
  { number: 5, title: 'Three pairs', subtitle: '3 separate layers', line: 41, flags: [0xc1, 0x14, 0x01, 0x14, 0x01, 0x14], positions: { 6: [68, 135], 5: [68, 305], 4: [190, 135], 3: [190, 305], 2: [312, 135], 1: [312, 305] }, caption: 'Three independent modulator–carrier pairs meet only at the output.' },
  { number: 16, title: 'One carrier', subtitle: '3 branches converge', line: 52, flags: [0xc1, 0x11, 0x02, 0x25, 0x05, 0x14], positions: { 6: [68, 85], 5: [68, 225], 4: [190, 85], 3: [190, 225], 2: [312, 225], 1: [190, 350] }, caption: 'Three signals combine to modulate OP1. Only OP1 reaches the output.' },
  { number: 32, title: 'All parallel', subtitle: '6 audible layers', line: 68, flags: [0xc4, 0x04, 0x04, 0x04, 0x04, 0x04], positions: { 6: [68, 115], 5: [190, 115], 4: [312, 115], 3: [68, 285], 2: [190, 285], 1: [312, 285] }, caption: 'Six carriers are added together. OP6 can still modulate itself with feedback.' },
];

// Follow the actual bus flags rather than hand-encoding edges. A write replaces
// a bus unless OUT_BUS_ADD is set. Every selected topology uses self-feedback.
function decode(flags) {
  const buses = [[], [], []], edges = [], carriers = [], feedback = [];
  flags.forEach((flag, index) => {
    const op = 6 - index, input = (flag >> 4) & 3, output = flag & 3;
    if (input) for (const from of buses[input]) edges.push([from, op]);
    if (!output) carriers.push(op);
    if ((flag & 0xc0) === 0xc0) feedback.push(op);
    if (output) buses[output] = flag & 4 ? [...buses[output], op] : [op];
  });
  return { edges, carriers, feedback };
}
let instance = 0;

/** Mount a source-backed, silent six-operator routing lesson. */
export function mountOperatorExplorer(container) {
  if (!container) throw new TypeError('mountOperatorExplorer needs a container element');
  const uid = `operator-explorer-${++instance}`;
  const aborter = new AbortController();
  const on = (node, event, callback) => node.addEventListener(event, callback, { signal: aborter.signal });
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let algorithm = ALGORITHMS[0], topology = decode(algorithm.flags), selected = 6;
  let level = .55, timer, running = false, step = 0, destroyed = false;
  const sequence = [6, 5, 4, 3, 2, 1, 'out'];

  container.innerHTML = `
    <div class="operator-explorer">
      <div class="oe-header"><div><span class="oe-eyebrow">SIX OPERATORS · DIFFERENT CONNECTIONS</span><h3>Change the route.<br>Change the instrument.</h3></div><p>Click an operator.<br>Follow what it changes.</p></div>
      <div class="oe-algorithms" role="group" aria-label="Choose an FM algorithm">${ALGORITHMS.map(item => `<button type="button" data-oe-algorithm="${item.number}" aria-pressed="${item.number === 1}"><span class="oe-alg-number">${String(item.number).padStart(2, '0')}</span><span><strong>${item.title}</strong><small>${item.subtitle}</small></span></button>`).join('')}</div>
      <div class="oe-workspace">
        <div class="oe-map-wrap"><div class="oe-map-heading"><span data-oe-caption>ALGORITHM 01</span><span>Click to inspect ↓</span></div><div class="oe-map"></div><div class="oe-legend"><span><i class="oe-carrier-dot"></i>Carrier → output</span><span><i class="oe-modulator-dot"></i>Modulator → operator</span><span><i class="oe-feedback-dot"></i>Feedback ↺</span></div></div>
        <div class="oe-inspector">
          <div class="oe-selection" aria-live="polite" aria-atomic="true"></div>
          <div class="oe-level-experiment"><label for="${uid}-level"><span data-oe-level-title>Raise this operator’s level</span><output for="${uid}-level" data-oe-level-value>55%</output></label><input id="${uid}-level" type="range" min="0" max="100" value="55" step="1"><div class="oe-sketch-heading"><span data-oe-sketch-label>TIMBRE CHANGES</span><span data-oe-wave-caption>Downstream carrier</span></div><svg class="oe-sketch" viewBox="0 0 360 110" role="img" aria-label="Qualitative waveform sketch"><path class="oe-sketch-axis" d="M0 55H360"/><path data-oe-wave></path></svg><p class="oe-sketch-note">Qualitative illustration, not a simulated patch.</p></div>
          <div class="oe-observation"><span class="oe-observation-arrow" aria-hidden="true">↳</span><p data-oe-observation></p></div>
        </div>
      </div>
      <div class="oe-trace"><div class="oe-trace-controls"><button type="button" data-oe-next>Next operator <span aria-hidden="true">→</span></button><button type="button" data-oe-play aria-pressed="false">Animate once <span aria-hidden="true">▷</span></button><span data-oe-step>Read order: OP6 → OP1 → mix</span></div><p data-oe-trace-note>The diagram shows signal connections. The source evaluates operators in storage order, accumulating carrier outputs along the way.</p></div>
      <details class="oe-source"><summary>See how the code defines this route <span aria-hidden="true">↗</span></summary><div class="oe-source-content"><div class="oe-source-bytes"></div><p>Each byte selects an input bus, an output bus and flags for addition or feedback. Bus 0 is the audible output. The array stores OP6 first and OP1 last.</p><div class="oe-source-links"><a data-oe-source href="${SOURCE}web/synth/dx7core.c#L37">Algorithm table ↗</a><a href="${SOURCE}web/synth/dx7core.c#L268">Bus dispatch ↗</a><a href="${SOURCE}app/instrument.h#L149">Operator order ↗</a></div><p class="oe-source-boundary">Verified against the official browser core at <code>4c7496d</code>. Routing is source-backed; waveform sketches are our teaching illustrations. The native FM1 Open engine is distributed as a binary SDK.</p></div></details>
      <div class="oe-footer"><p>Routing is the structure. Ratio, level and envelopes shape the result.</p><a href="#sound-lab">Hear the two-operator idea <span aria-hidden="true">↗</span></a></div>
    </div>`;
  const root = container.querySelector('.operator-explorer');
  const $ = selector => root.querySelector(selector);
  const map = $('.oe-map');
  const inspector = $('.oe-selection');
  const input = $(`#${uid}-level`);

  function pathToOutput(op, visited = []) {
    if (topology.carriers.includes(op)) return [...visited, op, 'out'];
    const target = topology.edges.find(([from]) => from === op)?.[1];
    return target ? pathToOutput(target, [...visited, op]) : [...visited, op];
  }

  function edgePath(from, to) {
    const [x1, y1] = algorithm.positions[from], [x2, y2] = algorithm.positions[to];
    return `M${x1} ${y1 + 35} C${x1} ${(y1 + y2) / 2},${x2} ${(y1 + y2) / 2},${x2} ${y2 - 40}`;
  }

  function carrierPath(op) {
    const [x, y] = algorithm.positions[op];
    if (algorithm.number === 32 && y < 200) {
      const track = x - 54;
      return `M${x} ${y + 35}V${y + 62}Q${x} ${y + 72},${x - 10} ${y + 72}H${track + 8}Q${track} ${y + 72},${track} ${y + 80}V411`;
    }
    return `M${x} ${y + 35}V411`;
  }

  function renderMap() {
    const feedbackOp = topology.feedback[0];
    const [fx, fy] = algorithm.positions[feedbackOp];
    const loop = `M${fx + 43} ${fy + 15}H${fx + 51}Q${fx + 60} ${fy + 15},${fx + 60} ${fy + 6}V${fy - 44}Q${fx + 60} ${fy - 53},${fx + 51} ${fy - 53}H${fx + 8}Q${fx} ${fy - 53},${fx} ${fy - 44}V${fy - 39}`;
    const outputXs = topology.carriers.map(op => algorithm.number === 32 && algorithm.positions[op][1] < 200 ? algorithm.positions[op][0] - 54 : algorithm.positions[op][0]);
    const busLeft = Math.min(190, ...outputXs), busRight = Math.max(190, ...outputXs);
    map.innerHTML = `<svg class="oe-routing" viewBox="0 0 380 475" role="group" aria-label="Algorithm ${algorithm.number}: ${algorithm.caption}">
      <defs><marker id="${uid}-mod-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#73855d"/></marker><marker id="${uid}-out-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#556f31"/></marker><marker id="${uid}-fb-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#b5683e"/></marker><pattern id="${uid}-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#899774" opacity=".2"/></pattern></defs>
      <rect width="380" height="475" fill="url(#${uid}-grid)" aria-hidden="true"/>
      <g aria-hidden="true">${topology.edges.map(([from, to]) => `<path class="oe-wire oe-mod-wire" data-from="${from}" data-to="${to}" d="${edgePath(from, to)}" marker-end="url(#${uid}-mod-arrow)"/>`).join('')}
      ${topology.carriers.map(op => `<path class="oe-wire oe-out-wire" data-from="${op}" data-to="out" d="${carrierPath(op)}" marker-end="url(#${uid}-out-arrow)"/>`).join('')}
      <path class="oe-output-bus" d="M${busLeft} 419H${busRight}M190 419V434"/><path class="oe-wire oe-feedback-wire" data-feedback="${feedbackOp}" d="${loop}" marker-end="url(#${uid}-fb-arrow)"/></g>
      ${[6, 5, 4, 3, 2, 1].map(op => {
        const [x, y] = algorithm.positions[op], carrier = topology.carriers.includes(op);
        return `<g class="oe-node ${carrier ? 'oe-node-carrier' : 'oe-node-modulator'}" data-oe-node="${op}" transform="translate(${x},${y})" role="button" tabindex="0" aria-pressed="false" aria-label="Operator ${op}, ${carrier ? 'carrier: reaches the output' : `modulator: changes operator ${topology.edges.filter(([from]) => from === op).map(([, to]) => to).join(' and ')}`}${topology.feedback.includes(op) ? ', feedback available' : ''}"><rect class="oe-node-body" x="-43" y="-35" width="86" height="70" rx="12"/><text class="oe-node-label" x="0" y="-6" text-anchor="middle">OP ${op}</text><path class="oe-node-wave" d="M-25 17C-17 -1,-9 -1,0 17S17 35,25 17"/></g>`;
      }).join('')}
      <g class="oe-output" data-oe-node="out" role="button" tabindex="0" aria-pressed="false" aria-label="Inspect the sum of all carriers"><rect x="115" y="435" width="150" height="38" rx="19"/><text x="190" y="461" text-anchor="middle">Σ OUTPUT</text></g>
      </svg>`;
    map.querySelectorAll('[data-oe-node]').forEach(node => {
      const choose = () => { pause(); selected = node.dataset.oeNode === 'out' ? 'out' : Number(node.dataset.oeNode); step = sequence.indexOf(selected); renderSelection(); };
      on(node, 'click', choose);
      on(node, 'keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); }
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
          const target = sequence[(sequence.indexOf(node.dataset.oeNode === 'out' ? 'out' : Number(node.dataset.oeNode)) + delta + sequence.length) % sequence.length];
          map.querySelector(`[data-oe-node="${target}"]`).focus();
        }
      });
    });
    $('[data-oe-caption]').textContent = `ALGORITHM ${String(algorithm.number).padStart(2, '0')}`;
    $('[data-oe-source]').href = `${SOURCE}web/synth/dx7core.c#L${algorithm.line}`;
    $('.oe-source-bytes').innerHTML = algorithm.flags.map((flag, index) => `<span><b>OP ${6 - index}</b><code>0x${flag.toString(16).padStart(2, '0')}</code></span>`).join('');
  }

  function drawSketch() {
    const carrier = selected === 'out' || topology.carriers.includes(selected);
    const amplitude = carrier ? level * 42 : 31;
    const index = carrier ? 1 : level * 5;
    let path = '';
    for (let x = 0; x <= 360; x += 2) {
      const t = x / 360 * Math.PI * 6;
      const y = 55 - amplitude * Math.sin(t + index * Math.sin(t * 2));
      path += `${x ? 'L' : 'M'}${x} ${y.toFixed(2)}`;
    }
    $('[data-oe-wave]').setAttribute('d', path);
    $('[data-oe-level-value]').textContent = `${Math.round(level * 100)}%`;
    input.style.setProperty('--oe-fill', `${level * 100}%`);
    input.setAttribute('aria-valuetext', `${Math.round(level * 100)} percent, qualitative ${carrier ? 'amplitude' : 'timbre'} illustration`);
    $('.oe-sketch').setAttribute('aria-label', `${carrier ? 'Amplitude' : 'Timbre'} changes as the illustrative operator level changes`);
  }

  function renderSelection() {
    const isOutput = selected === 'out', carrier = topology.carriers.includes(selected);
    const outgoing = topology.edges.filter(([from]) => from === selected).map(([, to]) => to);
    const incoming = topology.edges.filter(([, to]) => to === selected).map(([from]) => from);
    const route = isOutput ? [...topology.carriers, 'out'] : pathToOutput(selected);
    const hasFeedback = topology.feedback.includes(selected);
    const role = isOutput ? 'THE SUM YOU HEAR' : carrier ? 'CARRIER' : 'MODULATOR';
    const action = isOutput ? `${topology.carriers.length} carrier${topology.carriers.length === 1 ? '' : 's'} meet here.` : carrier ? `OP ${selected} reaches the output.` : `OP ${selected} changes OP ${outgoing.join(' + OP ')}.`;
    const detail = isOutput ? 'The mix adds carrier signals; it does not add every operator directly.' : carrier ? `${incoming.length ? `Its phase is shaped by OP ${incoming.join(', OP ')}. ` : 'No other operator feeds its phase. '}Its level controls this layer’s loudness.` : `${incoming.length ? `OP ${incoming.join(' + OP ')} first shapes this operator. ` : ''}Its level changes how strongly it bends the next operator’s phase.`;
    inspector.innerHTML = `<div class="oe-selected-heading"><span class="oe-selected-number">${isOutput ? 'Σ' : String(selected).padStart(2, '0')}</span><div><span class="oe-role">${role}</span><h4>${isOutput ? 'Output mix' : `Operator ${selected}`}</h4></div>${hasFeedback ? '<span class="oe-feedback-tag" title="This operator has a self-feedback route">↺ feedback</span>' : ''}</div><p class="oe-action">${action}</p><p class="oe-detail">${detail}</p><div class="oe-route" aria-label="${isOutput ? 'Carriers mixed at output' : 'One route to the output'}">${route.map((part, index) => `${index ? `<span class="oe-route-arrow" aria-hidden="true">${isOutput && part !== 'out' ? '+' : '→'}</span>` : ''}<span class="oe-route-node${part === 'out' ? ' oe-route-output' : ''}">${part === 'out' ? 'OUT' : part}</span>`).join('')}</div>${hasFeedback ? '<p class="oe-feedback-note"><span aria-hidden="true">↺</span> When enabled, feedback returns this operator’s previous samples to its own phase input.</p>' : ''}`;
    $('[data-oe-level-title]').textContent = isOutput ? 'Explore the output level' : `Raise OP ${selected}’s level`;
    $('[data-oe-sketch-label]').textContent = isOutput || carrier ? 'AMPLITUDE CHANGES' : 'TIMBRE CHANGES';
    $('[data-oe-wave-caption]').textContent = isOutput ? 'Summed output' : carrier ? 'Carrier contribution' : 'Downstream carrier';
    $('[data-oe-observation]').textContent = isOutput ? algorithm.caption : carrier ? `A carrier is an audible layer. Raising its level changes its contribution to the mix.${hasFeedback ? ' With feedback enabled, its level can also change timbre.' : ''}` : 'A modulator is heard through its effect on a carrier. Raising its level can introduce more sidebands.';
    map.querySelectorAll('[data-oe-node]').forEach(node => {
      const active = node.dataset.oeNode === String(selected);
      node.classList.toggle('is-selected', active);
      node.setAttribute('aria-pressed', String(active));
    });
    const downstream = new Set(route.slice(0, -1).map(String));
    map.querySelectorAll('[data-from]').forEach(wire => {
      wire.classList.toggle('is-highlighted', isOutput ? wire.dataset.to === 'out' : downstream.has(wire.dataset.from));
      wire.classList.toggle('is-tracing', running && wire.dataset.from === String(selected));
    });
    map.querySelectorAll('[data-feedback]').forEach(wire => wire.classList.toggle('is-highlighted', wire.dataset.feedback === String(selected)));
    $('[data-oe-step]').textContent = step < 0 ? 'Read order: OP6 → OP1 → mix' : `${step + 1} / 7 · ${isOutput ? 'Sum the carriers' : `Compute OP ${selected}`}`;
    $('[data-oe-trace-note]').textContent = isOutput ? 'All operators have been evaluated. Their carrier contributions already form the output mix; this final view inspects that result. The animation is a conceptual trace.' : `The code evaluates OP6 first and OP1 last. ${incoming.length ? `OP ${selected} reads the modulation already produced by OP ${incoming.join(' and OP ')}.` : `OP ${selected} has no input from another operator.`}`;
    drawSketch();
  }

  function pause() {
    clearTimeout(timer);
    running = false;
    $('[data-oe-play]').setAttribute('aria-pressed', 'false');
    $('[data-oe-play]').innerHTML = 'Animate once <span aria-hidden="true">▷</span>';
    map.querySelectorAll('.is-tracing').forEach(wire => wire.classList.remove('is-tracing'));
  }

  function advance() {
    step = (step + 1) % sequence.length;
    selected = sequence[step];
    renderSelection();
  }

  function tick() {
    if (!running || destroyed || document.hidden || motion.matches) { pause(); return; }
    advance();
    if (step === sequence.length - 1) pause();
    else timer = setTimeout(tick, 1450);
  }

  root.querySelectorAll('[data-oe-algorithm]').forEach(button => on(button, 'click', () => {
    pause();
    algorithm = ALGORITHMS.find(item => item.number === Number(button.dataset.oeAlgorithm));
    topology = decode(algorithm.flags);
    selected = 6;
    step = 0;
    root.querySelectorAll('[data-oe-algorithm]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    renderMap();
    renderSelection();
  }));
  on($('[data-oe-next]'), 'click', () => { pause(); advance(); });
  on($('[data-oe-play]'), 'click', () => {
    if (running) { pause(); return; }
    if (motion.matches) { advance(); return; }
    step = -1;
    running = true;
    $('[data-oe-play]').setAttribute('aria-pressed', 'true');
    $('[data-oe-play]').innerHTML = 'Pause trace <span aria-hidden="true">Ⅱ</span>';
    tick();
  });
  on(input, 'input', () => { level = Number(input.value) / 100; drawSketch(); });
  on(document, 'visibilitychange', () => { if (document.hidden) pause(); });
  on(window, 'pagehide', pause);
  on(motion, 'change', () => { if (motion.matches) pause(); syncMotion(); });
  function syncMotion() {
    $('[data-oe-play]').hidden = motion.matches;
  }
  renderMap();
  renderSelection();
  syncMotion();
  return { stop: pause, destroy() { destroyed = true; pause(); aborter.abort(); container.replaceChildren(); } };
}
