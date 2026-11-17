/** Source-guided reading paths for the pinned official FM1 Open V14 tree.
 * All code shown here is original educational pseudocode, not copied firmware.
 */
const COMMIT = '4c7496daac04a95ff10d1afdcc8f9ead2dbabc41';
const BASE = `https://github.com/m-vave/fm1_open/blob/${COMMIT}/`;
const topics = [
  {
    id: 'board', number: '01', name: 'Board & startup', file: 'app/board/panel.c',
    title: 'Start at a callback, not an Arduino loop.',
    lead: 'FM1 Open links its public application to a native SDK. Startup and parts of the runtime live in that binary. The visible board layer is where the application meets physical pins, timers and peripheral registers.',
    code: `when the control subsystem starts:
    configure battery and master-pot ADC inputs
    prepare key / encoder scanner
    start timer-driven scanning

on each scan tick:
    collect one matrix column
    queue the next SPI / DMA transfer
    after a full scan, debounce and decode

when the control task asks for input:
    snapshot buttons, notes and encoder steps
    consume the accumulated encoder steps
    read master level and battery ADC values`,
    notes: [
      ['Two timescales', 'The timer ticks at 10 kHz and cycles through 11 columns. That does not mean every key is sampled 10,000 times per second.'],
      ['Why a snapshot?', 'An interrupt can update a key while the UI reads it. A brief interrupt guard makes the snapshot consistent; the screen can then process it outside the scan interrupt.'],
      ['An encoder is not a potentiometer', 'Seven encoders report relative rotation through quadrature transitions. The master potentiometer reports an absolute analog level through an ADC.']
    ],
    links: [
      ['Board initialization and input snapshot', 'app/board/panel.c', 13],
      ['Timer setup', 'app/board/device.c', 12],
      ['Matrix and encoder decoding', 'app/board/fm1_input.h', 72]
    ]
  },
  {
    id: 'midi', number: '02', name: 'Keys → MIDI', file: 'app/midi_router.c',
    title: 'A key press becomes a message.',
    lead: 'The panel does not directly wiggle an audio pin. The application translates a musical key transition into a MIDI event, then routes that event to the instrument. USB, BLE and the MIDI jack reach the instrument through related routing paths.',
    code: `on a newly pressed musical key:
    pitch = map_key_to_note(key, octave, track)
    event = NoteOn(track.input_channel, pitch, 100)
    route_local(event)

route_local(event):
    validate message length and data bytes
    find active tracks listening on its channel
    if Local is on: queue event for the engine
    if Key Out is on: queue external MIDI output

on key release:
    queue NoteOff(original_channel, original_pitch)`,
    notes: [
      ['MIDI carries intent', 'A Note On contains a channel, note number and velocity. It contains no samples. The active patch and synthesis engine decide what that instruction sounds like.'],
      ['Remember the original note', 'The release must match the earlier press even if the selected track or octave changes while the key is held. The panel tracks that ownership.'],
      ['A concrete detail', 'This Open V14 panel code sends local Note On velocity 100. An external MIDI keyboard can provide its own velocity values. This detail is not a universal rule for other firmware.']
    ],
    links: [
      ['Panel Note On / Note Off generation', 'app/screen.c', 2538],
      ['Local routing', 'app/midi_router.c', 275],
      ['Incoming port routing', 'app/midi_router.c', 319],
      ['Native MIDI queue contract', 'sdk/include/fm1.h', 40]
    ]
  },
  {
    id: 'audio', number: '03', name: 'The audio deadline', file: 'app/board/audio.c',
    title: '128 frames. About 2.90 milliseconds.',
    lead: 'The audio clock drives the instrument. At the nominal 44,100 stereo frames per second, a 128-frame block lasts about 2.90 ms. That is a processing interval, not a measured key-to-headphone latency. DMA transfers one buffer half while software prepares the next.',
    code: `on an audio DMA interrupt:
    acknowledge the interrupt
    check timing and find the free buffer half
    samples = native_engine.render(128 frames)
    samples = apply_master_and_mix_external_audio(samples)
    send samples to USB recording
    if buffer ownership and deadline are still valid:
        copy samples into the free transmit half
    else:
        count an overrun`,
    notes: [
      ['The source boundary is visible', 'fm1_engine_render() belongs to the binary SDK in a device build. Its public contract returns signed Q23 stereo output. The public application owns master gain, USB/Bluetooth mixing and the DMA handoff.'],
      ['One frame, two samples', 'A stereo frame contains left and right samples. A block therefore contains 128 × 2 = 256 values, held in 32-bit containers. Q23 describes the fixed-point output scale, not every intermediate DSP calculation.'],
      ['Why ordinary UI code stays out', 'Drawing, waiting for input, allocating memory or writing flash can take too long. Missing the audio deadline creates an overrun; it is more serious than drawing one screen late.']
    ],
    links: [
      ['DMA interrupt and buffer handoff', 'app/board/audio.c', 27],
      ['Block format', 'sdk/include/fm1_block.h', 5],
      ['Native render contract', 'sdk/include/fm1_engine_control.h', 5],
      ['Master and external-audio mixing', 'app/audio_output.c', 19]
    ]
  },
  {
    id: 'state', number: '04', name: 'Sequence & state', file: 'app/instrument.h',
    title: 'A track is not a voice.',
    lead: 'Open defines eight tracks and up to 64 steps. A track owns a sound source, mixer settings and a pattern. A voice is an individual sounding note inside a source. More tracks do not automatically mean more available processing power.',
    code: `on each audio block in the public web engine:
    advance sequence phase using the sample count
    emit due note and gate events
    render each active sound source
    mix tracks, effect sends and effects

when the user edits a project:
    validate the new state on the control side
    use a brief audio gate for a shared-state change

when saving:
    write a validated record with a checksum
    finish its commit marker
    keep sample-bank backups separate from projects`,
    notes: [
      ['A musical clock, not setInterval()', 'The public sequencer advances using block size and tempo. Its step and gate handling runs at block granularity. Browser wall-clock timers are not the source of its musical timing.'],
      ['A project is not an audio backup', 'An Open project stores arrangement and sound state; custom sample audio belongs to a separate sample bank. Export both before migrating. A DX7 .syx file covers a different subset again.'],
      ['Flash changes the execution rules', 'The API limits flash operations to the control task and notes that writes briefly silence audio. Real-time routines are placed in SRAM so they remain available during flash programming.']
    ],
    links: [
      ['Track, source and step definitions', 'app/instrument.h', 10],
      ['Public browser sequencer', 'web/engine/sequencer.c', 377],
      ['Storage records and checksums', 'app/project.c', 23],
      ['Flash execution contract', 'sdk/include/fm1.h', 141]
    ]
  },
  {
    id: 'build', number: '05', name: 'What gets built', file: 'sdk/Build.ps1',
    title: 'One repository, two different targets.',
    lead: 'The hardware build compiles the public application for JieLi PI32v2 and links a precompiled engine. The browser build compiles portable C into WebAssembly. A successful browser preview is useful evidence about behavior, but does not prove native timing or hardware compatibility.',
    code: `hardware target:
    public application C + board drivers
    + native libfm1_engine.a
    + boot / update resources
    → PI32v2 firmware package (.fwsc)

browser target:
    shared application C
    + public web engine and DSP C
    + simulated peripherals
    → WebAssembly + browser workbench`,
    notes: [
      ['Not the Arduino toolchain', 'This pinned revision expects Windows x64 and JieLi toolchain 2.5.3, using PI32v2 clang and the r3 CPU target. The web preview uses WASI SDK 27. Keep the SDK and toolchain manifest checks enabled.'],
      ['Open application, separate SDK', 'The APP is GPLv3 with an SDK linking exception. The proprietary native engine has separate FM1-specific terms. The public browser DSP is inspectable; it is not the missing native engine source.'],
      ['A good first change', 'Change a label or a control mapping, build the web preview and trace its behavior. Learn the build boundary before changing interrupt code, flash layout or a firmware package.']
    ],
    links: [
      ['Native source selection and target flags', 'sdk/Build.ps1', 346],
      ['WebAssembly compilation', 'tools/Build-Web.ps1', 78],
      ['APP license and linking exception', 'LICENSE.md', 1],
      ['Binary SDK and component terms', 'THIRD_PARTY.md', 28],
      ['Exact build instructions', 'README.md', 38]
    ]
  },
  {
    id: 'fm', number: '06', name: 'Inside an FM voice', file: 'web/synth/dx7core.c',
    title: 'An algorithm is a wiring diagram in data.',
    lead: 'The public browser FM engine stores 32 routing configurations for six operators. Each operator generates a sine-derived signal. Routing decides whether that signal modulates another operator or contributes to audible output.',
    code: `for each active voice, in 64-sample chunks:
    update operator envelopes and modulation
    routing = algorithms[selected_algorithm]
    for each operator in routing order:
        for each sample:
            input = read_modulation_bus(operator)
            value = sine(phase + input) × envelope
            write_or_add_to_output_bus(value)
            phase = wrap(phase + frequency_increment)
    sum the carrier outputs into the voice

repeat twice to fill the 128-frame audio block`,
    notes: [
      ['FM in name, phase modulation in this code', 'The incoming signal is added to oscillator phase before the sine calculation. A modulator’s level changes the spectrum; a carrier’s level changes its audible contribution. The same operator can take different roles in different algorithms.'],
      ['An envelope shapes timbre too', 'The DX7-style operator envelope has four rates and four levels. Releasing a note selects the fourth stage. This is richer than a simple ADSR; an additional overall ADSR is a separate feature.'],
      ['Read this as the public browser model', 'The source credits MSFA / Dexed, with M-VAVE’s C and fixed-point adaptations. The device uses its separately supplied native binary. The lab on this page is an explanatory model, not a bit-perfect FM-1 emulator.']
    ],
    links: [
      ['32 algorithm routing rows', 'web/synth/dx7core.c', 36],
      ['Phase-modulated operator loop', 'web/synth/dx7core.c', 176],
      ['64-sample FM chunks', 'web/synth/dx7synth.c', 497],
      ['Four-rate / four-level envelope', 'web/synth/dx7env.c', 27],
      ['Model attribution', 'THIRD_PARTY.md', 5]
    ]
  }
];

let instance = 0;
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountCodeExplorer(container) {
  if (!container) return;
  const prefix = `code-reader-${++instance}`;
  const root = element('div', 'code-explorer');
  const tabs = element('div', 'code-tabs');
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'FM1 Open source reading paths');
  const pane = element('div', 'code-pane');
  pane.id = `${prefix}-pane`;
  pane.setAttribute('role', 'tabpanel');
  pane.tabIndex = 0;
  let selected = 0;
  const buttons = topics.map((topic, index) => {
    const button = element('button', 'code-tab');
    button.type = 'button';
    button.id = `${prefix}-${topic.id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', pane.id);
    button.append(element('span', 'code-tab-number', topic.number), document.createTextNode(` ${topic.name}`));
    button.addEventListener('click', () => show(index));
    button.addEventListener('keydown', event => {
      let next = selected;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (selected + 1) % topics.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (selected + topics.length - 1) % topics.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = topics.length - 1;
      else return;
      event.preventDefault();
      show(next);
      buttons[next].focus();
    });
    tabs.append(button);
    return button;
  });

  function show(index) {
    selected = index;
    const topic = topics[index];
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      button.classList.toggle('is-active', i === index);
    });
    pane.setAttribute('aria-labelledby', buttons[index].id);
    const file = element('p', 'eyebrow code-file', topic.file);
    const heading = element('h3', '', topic.title);
    const lead = element('p', 'code-lead', topic.lead);
    const label = element('p', 'code-label', 'Educational pseudocode · simplified for reading');
    const pre = element('pre');
    pre.setAttribute('aria-label', `Educational pseudocode: ${topic.name}`);
    pre.append(element('code', '', topic.code));
    const notes = element('div', 'code-notes');
    topic.notes.forEach(([title, copy]) => {
      const note = element('p');
      note.append(element('strong', '', `${title}. `), document.createTextNode(copy));
      notes.append(note);
    });
    const links = element('nav', 'code-sources');
    links.setAttribute('aria-label', 'Pinned source references');
    links.append(element('p', 'eyebrow', 'Read the real source · 4c7496d'));
    const list = element('ul');
    topic.links.forEach(([title, path, line]) => {
      const item = element('li');
      const link = element('a', 'source-link', `${title} ↗`);
      link.href = `${BASE}${path}#L${line}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = `${path}, line ${line} — opens on GitHub in a new tab`;
      item.append(link);
      list.append(item);
    });
    links.append(list);
    pane.replaceChildren(file, heading, lead, label, pre, notes, links);
  }

  root.append(tabs, pane);
  container.replaceChildren(root);
  show(0);
  return { select: index => { if (Number.isInteger(index) && index >= 0 && index < topics.length) show(index); } };
}

export { topics as codeTopics };
