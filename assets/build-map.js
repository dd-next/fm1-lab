/** A source-backed view of FM1 Open's two build targets. No firmware runs here. */
const REV = '4c7496daac04a95ff10d1afdcc8f9ead2dbabc41';
const SOURCE = `https://github.com/m-vave/fm1_open/blob/${REV}/`;
const nodes = {
  app: {
    label: 'Open application', file: 'app/*.c', type: 'source', tag: 'Shared source', glyph: '{ }',
    caption: 'UI · MIDI routing · projects', topic: 3, lane: 'shared',
    title: 'The application supplies the instrument’s behavior.',
    input: 'Keys, MIDI messages and saved state', output: 'Control changes and engine API calls',
    note: 'Common application code is reused; the hardware board drivers and browser peripheral adapters differ.',
    sources: [['Application API', 'app/instrument.h', 10], ['MIDI routing', 'app/midi_router.c', 275]], path: ['app']
  },
  native: {
    label: 'PI32v2 compile', file: 'app/ + board drivers', type: 'source', tag: 'Build', glyph: 'C',
    caption: 'JieLi target · r3', topic: 4, lane: 'device',
    title: 'Compile the application for the actual processor.',
    input: 'Public application and board C sources', output: 'PI32v2 object code for the device',
    note: 'The native script uses the JieLi compiler and then links the supplied engine archive.',
    sources: [['Native source selection', 'sdk/Build.ps1', 346], ['Target and compiler flags', 'sdk/Build.ps1', 358]], path: ['app', 'native']
  },
  sdk: {
    label: 'Native engine SDK', file: 'libfm1_engine.a', type: 'binary', tag: 'Binary boundary', glyph: '▧',
    caption: 'Precompiled · separate terms', topic: 4, lane: 'device',
    title: 'The device engine arrives already compiled.',
    input: 'A supplied native library archive', output: 'Engine and platform code linked into firmware',
    note: 'Its proprietary source is not supplied. An open application does not make this native engine fully open.',
    sources: [['Binary SDK terms', 'THIRD_PARTY.md', 28], ['APP linking exception', 'LICENSE.md', 9]], path: ['sdk']
  },
  package: {
    label: 'Device firmware', file: '.fwsc package', type: 'output', tag: 'Link + package', glyph: '↓',
    caption: 'Application + SDK + boot resources', topic: 4, lane: 'device',
    title: 'Link the pieces, then package a firmware image.',
    input: 'Application objects, native SDK and boot/update resources', output: 'An FM-1 firmware package',
    note: 'This artifact targets the device. Building it does not establish compatibility with every FM-1 revision.',
    sources: [['Build and package instructions', 'README.md', 50], ['Native link inputs', 'sdk/Build.ps1', 421]], path: ['app', 'native', 'sdk', 'package']
  },
  device: {
    label: 'FM-1 audio output', file: 'Engine → mix → DMA', type: 'endpoint', tag: 'On the instrument', glyph: '∿',
    caption: 'Sample stream → analog output', topic: 2, lane: 'device',
    title: 'On hardware, a peripheral sets the deadline.',
    input: '128 stereo frames from the native engine', output: 'A continuous digital stream for the output stage',
    note: 'The public board code mixes and commits samples to a safe DMA half. The downstream converter makes voltage.',
    sources: [['Audio interrupt', 'app/board/audio.c', 27], ['Native render contract', 'sdk/include/fm1_engine_control.h', 5]], path: ['app', 'native', 'sdk', 'package', 'device']
  },
  web: {
    label: 'Public web engine', file: 'web/engine/ + web/synth/', type: 'source', tag: 'Add source', glyph: '+',
    caption: 'Portable C synthesis + simulation', topic: 5, lane: 'browser',
    title: 'The browser branch adds inspectable engine code.',
    input: 'Shared application plus portable engine and synth C', output: 'A browser-build source set',
    note: 'This is where you can read the published DX7 operators, voice rendering and sequencer implementation.',
    sources: [['Public rendering path', 'web/engine/sound.c', 1202], ['Operator routing', 'web/synth/dx7core.c', 36]], path: ['app', 'web']
  },
  wasm: {
    label: 'C → WebAssembly', file: 'WASI SDK → .wasm', type: 'output', tag: 'Browser build', glyph: '↘',
    caption: 'Compile for the browser runtime', topic: 4, lane: 'browser',
    title: 'A different compiler target produces WebAssembly.',
    input: 'Application, public web DSP and simulated peripherals', output: 'A .wasm module used by the workbench',
    note: 'The web build does not turn the proprietary PI32v2 engine archive into browser code.',
    sources: [['Web compilation inputs', 'tools/Build-Web.ps1', 78], ['Simulated render adapter', 'web/engine/Simulator.c', 353]], path: ['app', 'web', 'wasm']
  },
  browser: {
    label: 'Browser audio output', file: 'WASM → AudioWorklet', type: 'endpoint', tag: 'In the workbench', glyph: '∿',
    caption: 'Web Audio → your computer’s output', topic: 5, lane: 'browser',
    title: 'The workbench runs its engine on an audio thread.',
    input: 'Sample blocks rendered by the WebAssembly module', output: 'Web Audio samples sent to the computer’s output',
    note: 'A useful preview of the instrument, not proof of identical native timing or sample-for-sample hardware sound.',
    sources: [['AudioWorklet processor', 'sdk/Simulator.js', 143], ['Web Audio connection', 'sdk/Simulator.js', 574]], path: ['app', 'web', 'wasm', 'browser']
  }
};

let nextInstance = 0;
function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

export function mountBuildMap(container, { onSelectTopic } = {}) {
  if (!container) return;
  const id = `build-map-${++nextInstance}`;
  const root = el('div', 'build-map');
  root.setAttribute('aria-label', 'How FM1 Open becomes device firmware or a browser instrument');
  const top = el('div', 'build-map-heading');
  const headingCopy = el('div');
  headingCopy.append(el('p', 'build-map-kicker', 'FOLLOW THE BUILD'), el('h3', '', 'One application. Two paths to sound.'));
  top.append(headingCopy, el('p', 'build-map-hint', 'Select a block to see what goes in and what comes out.'));
  const diagram = el('div', 'build-map-diagram');
  const buttons = new Map();
  function block(key) {
    const n = nodes[key];
    const button = el('button', `build-map-node build-map-node-${n.type}`);
    button.type = 'button';
    button.dataset.buildNode = key;
    button.setAttribute('aria-controls', `${id}-detail`);
    button.setAttribute('aria-pressed', 'false');
    const badge = el('span', 'build-map-node-badge', n.tag);
    const title = el('span', 'build-map-node-title');
    const glyph = el('span', 'build-map-glyph', n.glyph);
    glyph.setAttribute('aria-hidden', 'true');
    title.append(glyph, el('strong', '', n.label));
    button.append(badge, title, el('code', 'build-map-file', n.file), el('span', 'build-map-caption', n.caption));
    button.addEventListener('click', () => select(key));
    buttons.set(key, button);
    return button;
  }
  function connector(kind = 'arrow') {
    const link = el('div', `build-map-${kind}`);
    link.setAttribute('aria-hidden', 'true');
    link.append(el('span'));
    return link;
  }
  const trunk = el('div', 'build-map-trunk');
  trunk.append(block('app'));
  diagram.append(trunk, connector('fork'));
  const lanes = el('div', 'build-map-lanes');
  function lane(key, eyebrow, title) {
    const section = el('section', `build-map-lane build-map-lane-${key}`);
    section.setAttribute('aria-label', title);
    const label = el('div', 'build-map-lane-label');
    label.append(el('span', '', eyebrow), el('h4', '', title));
    section.append(label);
    lanes.append(section);
    return section;
  }
  const deviceLane = lane('device', 'TARGET A', 'On your FM-1');
  const nativeInputs = el('div', 'build-map-native-inputs');
  nativeInputs.append(block('native'), block('sdk'));
  deviceLane.append(nativeInputs, connector('join'), block('package'), connector(), block('device'));
  const browserLane = lane('browser', 'TARGET B', 'In your browser');
  browserLane.append(block('web'), connector(), block('wasm'), connector(), block('browser'));
  diagram.append(lanes);
  const boundary = el('div', 'build-map-boundary');
  boundary.append(el('span', 'build-map-boundary-symbol', '≠'), el('p', '', 'Shared application behavior does not mean an identical sound engine. Each target has its own implementation and runtime.'));
  const detail = el('div', 'build-map-detail');
  detail.id = `${id}-detail`;
  detail.setAttribute('aria-live', 'polite');
  detail.setAttribute('aria-atomic', 'true');

  function select(key, notify = true) {
    const n = nodes[key];
    if (!n) return;
    buttons.forEach((button, nodeKey) => {
      button.setAttribute('aria-pressed', String(nodeKey === key));
      button.classList.toggle('is-in-path', n.path.includes(nodeKey));
    });
    deviceLane.classList.toggle('is-active-path', n.lane === 'device' || n.lane === 'shared');
    browserLane.classList.toggle('is-active-path', n.lane === 'browser' || n.lane === 'shared');
    const selected = el('div', 'build-map-selected');
    selected.append(el('span', 'build-map-kicker', n.tag), el('h4', '', n.title));
    const io = el('dl', 'build-map-io');
    for (const [label, text] of [['IN', n.input], ['OUT', n.output]]) {
      const row = el('div');
      row.append(el('dt', '', label), el('dd', '', text));
      io.append(row);
    }
    const lower = el('div', 'build-map-detail-footer');
    lower.append(el('p', '', n.note));
    const links = el('div', 'build-map-links');
    for (const [label, file, line] of n.sources) {
      const a = el('a', '', `${label} ↗`);
      a.href = `${SOURCE}${file}#L${line}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = `Pinned source: ${file}, line ${line} (opens in a new tab)`;
      links.append(a);
    }
    lower.append(links);
    detail.replaceChildren(selected, io, lower);
    if (notify && typeof onSelectTopic === 'function') onSelectTopic(n.topic);
  }
  root.append(top, diagram, boundary, detail);
  container.replaceChildren(root);
  select('app', false);
  return { select };
}
