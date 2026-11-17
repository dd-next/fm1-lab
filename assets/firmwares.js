/** Research snapshot: 2026-11-17. Descriptions are editorial summaries of linked primary sources. */
export const firmwareCatalog = [
  {
    id: 'stock', name: 'Stock firmware', version: 'V16', family: 'Manufacturer release',
    goals: ['fm', 'perform'], instrument: '8 FM parts · 20 shared voices',
    openness: 'Distributed firmware; native source not established',
    headline: 'The reference point for the instrument you ordered.',
    description: 'The official V16 announcement describes eight timbral parts with a shared pool of 20 voices, a 64-step sequencer and an arrangement matrix. Its global stereo effects chain includes filter, reverb, delay, distortion, chorus and phaser.',
    architecture: 'A part is a timbre and its controls. A voice is one sounding note. Eight parts do not mean eight independent pools of 20 voices: the announced budget is shared.',
    study: 'Start here to learn the panel and save a reference recording. Compare the same notes and patches after a firmware change, and distinguish a different engine from a different preset.',
    status: 'Manufacturer release announcement, 21 October 2026. These are V16 release claims, not measurements from our own hardware.',
    compatibility: 'FM1 Open V14 is a separate project, not the source tree of stock V16. Its version number cannot be compared numerically with the stock version.',
    license: 'Use the manufacturer’s distribution terms. The official open application’s GPL license is not evidence that stock V16 is GPL.',
    links: [
      ['Official V16 announcement', 'https://forum.m-vave.com/topic/23'],
      ['Manufacturer product & downloads', 'https://www.m-vave.com/product?id=fm-1'],
    ],
  },
  {
    id: 'open', name: 'FM1 Open', version: 'V14', family: 'Official application + SDK',
    goals: ['code', 'fm', 'perform'], instrument: '8 tracks · 6 engine types · 8 sample slots',
    openness: 'Open application + binary device engine',
    headline: 'Follow the manufacturer’s application from input to audio.',
    description: 'The official open project exposes the application, board drivers, sequencing, UI and portable browser DSP. Its engine types are DX7, 303, 808, PSG, PLUCK and SAMPLE. The workbench provides a browser preview and project, sample and DX7-library tools.',
    architecture: 'The hardware build links the native libfm1_engine.a SDK. Public browser synthesis code is valuable to study, but is not proof that the native library uses the same implementation. Eight tracks are not a guaranteed native polyphony figure.',
    study: 'Read app/board/device.c for hardware integration, app/instrument.h for the application contract and web/engine/ plus web/synth/ for the portable sound code. Trace an input event and an audio callback as separate paths.',
    status: 'Pinned source: 4c7496d. README identifies the project as FM1 Open V14. The workbench and its matching Source + SDK kit are the documented development route.',
    compatibility: 'Project exports do not include sample audio. Back up samples and the independent DX7 library separately. Firmware switching does not make their storage formats interchangeable.',
    license: 'Application: GPLv3 with the FM1 SDK linking exception. The device engine is a binary SDK under separate terms; retain third-party notices when distributing builds.',
    links: [
      ['Pinned official source', 'https://github.com/m-vave/fm1_open/tree/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41'],
      ['Build & compatibility notes', 'https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/README.md'],
      ['License boundary', 'https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/LICENSE.md'],
      ['Official workbench', 'https://open.m-vave.com/fm1-workbench'],
    ],
  },
  {
    id: 'felucca', name: 'Felucca', version: '1.8.2', family: 'Community platform',
    goals: ['code', 'fm', 'perform'], instrument: '4 flexible parts · 8 shared voices',
    openness: 'GPL-3.0-only + MIT engines + MPL board layer',
    headline: 'A broad synthesis platform with clear layers to explore.',
    description: 'Current Felucca gives each of four parts an engine, sound and pattern. They share an eight-voice budget, and DRUM can be selected on a part. This is different from older Felucca summaries that describe three synth tracks and a separate drum pool.',
    architecture: 'The application coordinates voices and sequencing. Six engines live in the MIT-licensed Felucca-Engines submodule; the FM-1 hardware layer lives in the MPL-2.0 felucca-bsp submodule. Other DSP ports retain their own licenses.',
    study: 'Start at firmware/src/core.h for tracks and voice limits, then firmware/src/felucca.c for integration. Follow the engine interface into a small oscillator engine before tackling FM6 or physical modeling. Clone with both submodules.',
    status: 'Stable 1.8.2, released 13 November 2026. Its release notes report a successful test on a unit with the newer UC25HQ80 flash chip.',
    compatibility: '1.8.2 recognizes UC25HQ80. On that chip, 1.8.1 and earlier cannot start an update; the release notes give a specific official-V15 recovery path. Read those instructions for the installed version.',
    license: 'Combined firmware: GPL-3.0-only. The MIT engine and MPL-2.0 board submodules keep their own terms; include them in corresponding source. Current sample pack: CC0.',
    links: [
      ['Source & voice budget', 'https://github.com/hugelton/Felucca/blob/ca1db43a78455ae747766a2738f8580380d40bc1/firmware/src/core.h#L3-L11'],
      ['1.8.2 release & chip notes', 'https://github.com/hugelton/Felucca/releases/tag/v1.8.2'],
      ['Build with submodules', 'https://github.com/hugelton/Felucca/blob/ca1db43a78455ae747766a2738f8580380d40bc1/BUILDING.md'],
      ['Play the browser demo', 'https://hugelton.github.io/Felucca/webapp/try/'],
    ],
  },
  {
    id: 'sloop', name: 'SLOOP', version: '2.8.5', family: 'Felucca-derived groovebox',
    goals: ['perform'], instrument: '3 synth tracks + drum machine',
    openness: 'GPL-3.0-only code; separate asset terms',
    headline: 'Turn the panel into a live performance workspace.',
    description: 'SLOOP emphasizes recording, overdubbing and playing song sections. Three synth tracks sit beside a dedicated drum machine. Parameter locks, microtiming, fills and momentary punch effects make the sequencer a central part of the instrument.',
    architecture: 'Its musical structure is deliberately different from current Felucca: dedicated synth and drum roles, live layers and song sections. A shared code ancestor does not make their present behavior or saved data equivalent.',
    study: 'Compare the event sequencer with the audio renderer: a step schedules a note or parameter change; the engine then renders that event into many audio samples. Use SLOOP’s manual to connect shortcuts to those events.',
    status: '2.8.5, released 4 November 2026. The project’s own README still describes it as beta. Twelve engines are listed in this snapshot.',
    compatibility: '2.8.5 adds UC25HQ80 recognition to storage and updates. Current restoration guidance directs users to M-UPGRADE with official V16, with a documented fallback if its USB identity is not listed.',
    license: 'Code: GPL-3.0-only. Consult the project’s own LICENSING.md for its DSP ports, fonts and sample assets.',
    links: [
      ['Pinned project & restoration guide', 'https://github.com/isod89/sloop-fm1/blob/bac9c05ea7627449405aa10e48da21d75b6c8c56/README.md'],
      ['2.8.5 release', 'https://github.com/isod89/sloop-fm1/releases/tag/v2.8.5'],
      ['Web editor', 'https://isod89.github.io/sloop-fm1/webapp/editor/'],
    ],
  },
  {
    id: 'clipper', name: 'Clipper', version: '1.3.1', family: 'SLOOP-derived synthesizer',
    goals: ['fm'], instrument: '1 instrument / 2 in MULTI · 23 engines',
    openness: 'GPL-3.0-only code; separate asset terms',
    headline: 'Spend the interface and CPU budget on the sound itself.',
    description: 'Clipper is a deep synthesizer with one instrument, or two in MULTI, rather than SLOOP’s track-and-drum arrangement. HYBRID combines three oscillators, two filters and a modulation matrix. FMX exposes six-operator routing and multiple operator modes.',
    architecture: 'It keeps useful platform, sequencing, MIDI and audio infrastructure while changing the instrument model. Layer, split, modulation sources and patch morphing matter more here than arranging a multi-track groove.',
    study: 'Compare ordinary parameter values with a modulation matrix: each route maps a time-varying source to a destination with an amount. Then inspect how voice count, unison and effects compete for CPU time.',
    status: '1.3.1, released 4 November 2026. The maintainer reports it runs on the FM-1, while calling out dense CPU loads, larger voice builds and power-cut storage behavior for further hardware testing.',
    compatibility: '1.3.1 recognizes both known flash IDs. An older Clipper loader on UC25HQ80 can reject even the fixed version; its release notes explain the official-firmware intermediate step.',
    license: 'Code: GPL-3.0-only. Retained DSP and asset notices must be checked in this fork’s licensing file; do not assume all assets share the code license.',
    links: [
      ['Pinned engine & workflow guide', 'https://github.com/isod89/clipper-fm1/blob/7bc15a950a8b3fd51aec280514905448e4faaf1b/README.md'],
      ['1.3.1 compatibility notes', 'https://github.com/isod89/clipper-fm1/releases/tag/v1.3.1'],
      ['Licensing', 'https://github.com/isod89/clipper-fm1/blob/7bc15a950a8b3fd51aec280514905448e4faaf1b/LICENSING.md'],
    ],
  },
  {
    id: 'melodee', name: 'Melodee', version: '1.6.1', family: 'Felucca 1.0-derived composer',
    goals: ['fm', 'perform'], instrument: '4 synth/MIDI parts + 4 MIDI-only tracks',
    openness: 'GPL-3.0-only code; ported DSP notices',
    headline: 'Arrange songs and explore distinct synthesis traditions.',
    description: 'Melodee combines Prophet-style, FM6, CZ-1 and SID engines with song arrangement. Four internal parts can be joined by four MIDI-only tracks for external instruments. The current branch adds longer songs, per-pattern sounds and shared audio effects.',
    architecture: 'These engine names represent different ways to compute a sound: subtractive oscillators and filters, six-operator FM, phase distortion and a register-style chip model. The common sequencer can address them without making their parameters identical.',
    study: 'Compare one note across its engine-specific patch data and the common track state. Then explore the difference between an internal audio part and a MIDI-only track that schedules messages for another instrument.',
    status: 'Stable 1.6.1, released 2 November 2026. Its clock-output and Song Position tests use models; the release explicitly says those features had not yet been tried with a real external follower.',
    compatibility: 'Version 1.6 changed project storage; older firmware cannot read its backups. Current switching guidance uses TransitFM1 0.1.3, with separate instructions for returning to official V15. Follow the selected release, not another fork’s recipe.',
    license: 'GPL-3.0-only, with separate notices for the DSP ports and other bundled material. Build attestations establish source provenance, not hardware validation.',
    links: [
      ['Canonical pinned source', 'https://github.com/keremimo/melodee/blob/165d177a425944f3d30b0b669255a6ed0050c3a5/README.md'],
      ['1.6.1 release & validation limits', 'https://github.com/keremimo/melodee/releases/tag/v1.6.1'],
      ['1.6 storage migration', 'https://github.com/keremimo/melodee/blob/165d177a425944f3d30b0b669255a6ed0050c3a5/docs/RELEASE_1.6.0.md'],
    ],
  },
  {
    id: 'dinghy', name: 'Dinghy', version: '0.5', family: 'Minimal developer starting point',
    goals: ['code'], instrument: '4-voice sine instrument',
    openness: 'GPL-3.0-only; documented platform',
    headline: 'Make your first audio-code change small enough to understand.',
    description: 'Dinghy deliberately starts with a four-voice sine instrument. Its small application file sits above an existing platform for the display, controls, MIDI, audio, storage and updates. Host mode produces a WAV and screen images without an FM-1.',
    architecture: 'app_audio() advances integer phases, smooths amplitude changes and adds each voice into interleaved stereo frames. The main loop handles note events separately. That split is an approachable first example of real-time embedded audio.',
    study: 'Read firmware/src/dinghy.c, then change an amplitude ramp or waveform in host mode and compare the WAV. Keep display work, flash writes and slow operations out of the audio callback.',
    status: '0.5, released 7 November 2026. The README distinguishes earlier direct Dinghy hardware tests from later platform tests in related firmware; that is not a claim that every 0.5 path was validated on hardware.',
    compatibility: '0.5 accepts UC25HQ80 as well as the older Puya ID. Its documented rescue and update platform are useful to study, but preserve them carefully when modifying the application.',
    license: 'GPL-3.0-only, with retained third-party notices. Follow the documented target-specific build; this site’s browser sound lab is not Dinghy firmware.',
    links: [
      ['Read the small application', 'https://github.com/zvenson/dinghy/blob/ea1b6bf5973b11f9b4b806d08155602aaa0b505e/firmware/src/dinghy.c'],
      ['Host mode & build guide', 'https://github.com/zvenson/dinghy/blob/ea1b6bf5973b11f9b4b806d08155602aaa0b505e/README.md'],
      ['0.5 release', 'https://github.com/zvenson/dinghy/releases/tag/v0.5'],
    ],
  },
];

const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

export function mountFirmwares(container) {
  let goal = 'all';
  let selected = 'open';
  const filters = [['all', 'All firmware'], ['code', 'Learn the code'], ['fm', 'Explore sound'], ['perform', 'Write & perform']];

  function render(focusKey) {
    const visible = firmwareCatalog.filter(entry => goal === 'all' || entry.goals.includes(goal));
    if (!visible.some(entry => entry.id === selected)) selected = visible[0].id;
    const current = firmwareCatalog.find(entry => entry.id === selected);
    container.innerHTML = `
      <div class="firmware-filters" role="group" aria-label="Filter firmware by learning goal">
        ${filters.map(([id, label]) => `<button type="button" data-goal="${id}" aria-pressed="${id === goal}" class="${id === goal ? 'active' : ''}">${label}</button>`).join('')}
      </div>
      <p class="firmware-results" aria-live="polite">${visible.length} ${visible.length === 1 ? 'project' : 'projects'} · Select a name to inspect its design.</p>
      <div class="comparison-table-wrap" tabindex="0" role="region" aria-label="Firmware comparison; scroll horizontally on small screens">
        <table class="comparison-table">
          <caption class="sr-only">FM-1 firmware comparison, researched 18 November 2026</caption>
          <thead><tr><th scope="col">Firmware</th><th scope="col">Instrument model</th><th scope="col">What is open?</th></tr></thead>
          <tbody>${visible.map(entry => `<tr class="${entry.id === selected ? 'is-selected' : ''}"><th scope="row"><button type="button" data-firmware="${entry.id}" aria-pressed="${entry.id === selected}" aria-controls="firmware-detail"><span>${escapeHTML(entry.name)}</span> <span class="tag">${escapeHTML(entry.version)}</span></button></th><td>${escapeHTML(entry.instrument)}</td><td>${escapeHTML(entry.openness)}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <article class="firmware-detail" id="firmware-detail" aria-live="polite" aria-atomic="true">
        <p class="eyebrow">${escapeHTML(current.family)} / ${escapeHTML(current.version)}</p>
        <h3>${escapeHTML(current.name)}: ${escapeHTML(current.headline)}</h3>
        <p>${escapeHTML(current.description)}</p>
        <div class="firmware-detail-grid">
          <div><h4>Inside the design</h4><p>${escapeHTML(current.architecture)}</p></div>
          <div><h4>What to study</h4><p>${escapeHTML(current.study)}</p></div>
          <div><h4>Evidence & maturity</h4><p>${escapeHTML(current.status)}</p></div>
          <div><h4>Before changing firmware</h4><p>${escapeHTML(current.compatibility)}</p></div>
        </div>
        <p class="firmware-license"><strong>Licensing.</strong> ${escapeHTML(current.license)}</p>
        <div class="firmware-source-links">${current.links.map(([label, href]) => `<a class="source-link" href="${href}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>`).join('')}</div>
      </article>
      <p class="firmware-snapshot">Source snapshot: 18 Nov 2026. Version and hardware claims are attributed to each project. This comparison does not flash your device. Shared ancestry does not imply interchangeable projects, samples or backups.</p>`;
    if (focusKey) container.querySelector(focusKey)?.focus({ preventScroll: true });
  }

  function onClick(event) {
    const filter = event.target.closest('[data-goal]');
    const entry = event.target.closest('[data-firmware]');
    if (filter && container.contains(filter)) {
      goal = filter.dataset.goal;
      render(`[data-goal="${goal}"]`);
    } else if (entry && container.contains(entry)) {
      selected = entry.dataset.firmware;
      render(`[data-firmware="${selected}"]`);
    }
  }
  render();
  container.addEventListener('click', onClick);
  return () => container.removeEventListener('click', onClick);
}
