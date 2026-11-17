import { mountHardware, hardwareNodes } from './hardware.js';
import { mountSoundLab } from './sound-lab.js';
import { mountCodeExplorer, codeTopics } from './code-explorer.js';
import { mountFirmwares, firmwareCatalog } from './firmwares.js';
import { mountSignalAtlas, atlasScenarios } from './signal-atlas.js';
import { mountOperatorExplorer } from './operator-explorer.js';
import { mountBuildMap } from './build-map.js';

function mountSafely(mount, selector, options) {
  try { return mount(document.querySelector(selector), options); }
  catch (error) { console.error(`Could not initialize ${selector}`, error); return null; }
}
mountSafely(mountHardware, '#hardware-explorer');
mountSafely(mountSoundLab, '#sound-lab');
const codeExplorer = mountSafely(mountCodeExplorer, '#code-explorer');
mountSafely(mountFirmwares, '#firmware-explorer');
mountSafely(mountSignalAtlas, '#signal-atlas', { onInspectHardware: id => document.querySelector(`[data-hardware="${id}"]`)?.click() });
mountSafely(mountOperatorExplorer, '#operator-explorer');
mountSafely(mountBuildMap, '#build-map', { onSelectTopic: index => codeExplorer?.select(index) });

const sourceBase = 'https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/';
const stages = [
  { title: 'A contact becomes an event.', code: 'NoteOn(channel, pitch, velocity)', text: 'The scanner debounces a physical contact. The panel maps the key to a note and sends a MIDI-style event through local routing. Open V14 uses velocity 100 for its panel keys; external MIDI can provide other velocities.', file: 'app/screen.c#L2538', label: 'Panel → MIDI source' },
  { title: 'The event meets an instrument.', code: 'MIDI channel → active track → engine', text: 'Routing decides which active track receives the event. Its selected sound, tuning and controller state determine what happens next. A note needs a voice; tracks and voices are different resources. The native SDK handles the internal allocation behind its public API.', file: 'app/midi_router.c#L275', label: 'Local routing source' },
  { title: 'The engine calculates samples.', code: 'fm1_engine_render(buffer, 128)', text: 'On the audio interrupt, the application asks the engine for 128 stereo frames in signed Q23 format. On the device this call enters a prebuilt SDK. The public browser implementation lets you inspect voice synthesis, envelope updates, sequencing and mixing separately.', file: 'sdk/include/fm1_engine_control.h#L5', label: 'Read the render contract' },
  { title: 'A block joins the audio stream.', code: 'engine → output mix → free DMA half', text: 'The open output layer applies master gain and external-audio mixing. The board interrupt code copies the result into the free transmit half only while buffer ownership and timing permit. DMA then transfers the samples to the audio peripheral.', file: 'app/board/audio.c#L27', label: 'Follow the DMA interrupt' },
  { title: 'Numbers become voltage.', code: 'digital audio → conversion → output', text: 'The digital link feeds the conversion and output stage. Headphones or the speaker turn the electrical waveform into air pressure. The inspected source establishes the link format, but does not establish the exact DAC part number or analog schematic.', file: 'app/board/fm1_audio.h#L7', label: 'Read the hardware audio notes' },
];
const stageButtons = [...document.querySelectorAll('[data-stage]')];
let traceTimer;
let traceGeneration = 0;
function selectStage(index) {
  const stage = stages[index];
  stageButtons.forEach((button, position) => {
    button.classList.toggle('selected', position === index);
    button.setAttribute('aria-pressed', String(position === index));
  });
  document.querySelector('#signal-detail').innerHTML = `<div><h3>${stage.title}</h3><code>${stage.code}</code></div><div><p>${stage.text}</p><a class="source-link" href="${sourceBase}${stage.file}">${stage.label} ↗</a></div>`;
}
function cancelTrace() { clearTimeout(traceTimer); traceGeneration++; document.querySelector('#trace-play').textContent = '▶ Trace a note'; }
stageButtons.forEach((button, index) => button.addEventListener('click', () => { cancelTrace(); selectStage(index); }));
document.querySelector('#trace-play').addEventListener('click', () => {
  cancelTrace();
  const generation = traceGeneration;
  let stage = 0;
  const advance = () => {
    if (generation !== traceGeneration) return;
    selectStage(stage++);
    document.querySelector('#trace-play').textContent = stage < stages.length ? '↻ Following the note…' : '↻ Trace again';
    if (stage < stages.length) traceTimer = setTimeout(advance, 1600);
  };
  advance();
});
selectStage(0);

const renderSlider = document.querySelector('#render-time');
function updateBudget() {
  const elapsed = Number(renderSlider.value), deadline = 128 / 44100 * 1000;
  document.querySelector('#render-label').textContent = `${elapsed.toFixed(2)} ms`;
  const bar = document.querySelector('#render-budget');
  bar.style.width = `${elapsed / 4 * 100}%`;
  bar.style.background = elapsed >= deadline ? '#d9916d' : '#b2cb7e';
  document.querySelector('#budget-result').textContent = elapsed < deadline ? `${(deadline - elapsed).toFixed(2)} ms of headroom. This hypothetical render finishes before the next block is due.` : `${(elapsed - deadline).toFixed(2)} ms past the deadline. The system cannot sustain this workload at this block rate.`;
}
renderSlider.addEventListener('input', updateBudget);
updateBudget();

const storageKey = 'fm1-lab-progress-v1';
let saved = {};
try { const value = JSON.parse(localStorage.getItem(storageKey) || '{}'); if (value && typeof value === 'object' && !Array.isArray(value)) saved = value; } catch { /* Progress remains usable without persistent storage. */ }
function persist() { try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* Browser storage may be blocked. */ } }
function updateProgress() {
  let completed = 0;
  document.querySelectorAll('[data-complete]').forEach(button => {
    const checked = saved[`chapter:${button.dataset.complete}`] === true;
    completed += Number(checked);
    button.setAttribute('aria-pressed', String(checked));
    button.querySelector('span').textContent = checked ? '✓' : '○';
  });
  document.querySelector('#progress-count').textContent = `${completed} / 6`;
  document.querySelector('#progress-bar').style.width = `${completed / 6 * 100}%`;
}
document.querySelectorAll('[data-complete]').forEach(button => button.addEventListener('click', () => { const key = `chapter:${button.dataset.complete}`; saved[key] = !saved[key]; persist(); updateProgress(); }));
document.querySelectorAll('[data-check]').forEach(input => {
  input.checked = saved[`check:${input.dataset.check}`] === true;
  input.addEventListener('change', () => { saved[`check:${input.dataset.check}`] = input.checked; persist(); });
});
updateProgress();

const sidebar = document.querySelector('.sidebar'), menu = document.querySelector('#mobile-menu');
const mobileLayout = matchMedia('(max-width: 720px)');
function syncMenuAccessibility() {
  const closed = mobileLayout.matches && !sidebar.classList.contains('open');
  if (closed && sidebar.contains(document.activeElement)) menu.focus();
  sidebar.inert = closed;
  if (closed) sidebar.setAttribute('aria-hidden', 'true'); else sidebar.removeAttribute('aria-hidden');
}
function closeMenu() { sidebar.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); syncMenuAccessibility(); }
menu.addEventListener('click', () => { const open = sidebar.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); syncMenuAccessibility(); });
mobileLayout.addEventListener('change', closeMenu);
syncMenuAccessibility();
sidebar.querySelectorAll('nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => { if (!sidebar.contains(event.target) && !menu.contains(event.target)) closeMenu(); });
const navLinks = [...document.querySelectorAll('.sidebar nav a')];
const chapters = [...document.querySelectorAll('section.chapter')];
function setActiveSection() {
  const boundary = window.innerHeight * .28;
  const current = [...chapters].reverse().find(section => section.getBoundingClientRect().top < boundary) || chapters[0];
  navLinks.forEach(link => { const active = link.hash === `#${current.id}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
}
let scrollFrame;
window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; setActiveSection(); }); }, { passive: true });
setActiveSection();

const dialog = document.querySelector('#search-dialog'), search = document.querySelector('#guide-search'), results = document.querySelector('#search-results');
const extraIndex = [
  ['overview', 'Signal explorer · key press · USB MIDI · encoder · preset · SRAM · flash · DMA · display', atlasScenarios.map(scenario => `${scenario.name} ${scenario.intro}`).join(' ')],
  ['hardware', 'DMA · ADC · SPI · AC791N · flash · screen · SRAM · battery · UC25HQ80', 'Inspect the functional map and select a component to read its code and evidence.'],
  ['code', 'Boot · startup · MIDI · interrupt · engine · build · DX7 · operator · sequencer · envelope · screen.c', 'Six source-reading routes explain board startup, messages, the audio deadline, state, build boundaries and FM DSP.'],
  ['firmware', 'Stock V16 · FM1 Open V14 · Felucca · SLOOP · Clipper · Melodee · Dinghy · firmware · GPL · MIT', 'Filter seven projects by your goal, then select one for architecture, compatibility and source references.'],
];
const searchIndex = chapters.map(section => ({ id: section.id, title: section.querySelector('h1,h2')?.innerText.replace(/\s+/g, ' ') || section.id, text: section.textContent.replace(/\s+/g, ' ') }));
extraIndex.forEach(([id, keywords, text]) => { const item = searchIndex.find(row => row.id === id); item.text += ` ${keywords} ${text}`; });
for (const [id, rows] of [['hardware', hardwareNodes], ['code', codeTopics], ['firmware', firmwareCatalog]]) {
  searchIndex.find(item => item.id === id).text += ' ' + rows.map(row => Object.values(row).flat(3).join(' ')).join(' ');
}
function searchGuide() {
  const term = search.value.trim().toLowerCase();
  const matches = term ? searchIndex.filter(item => item.text.toLowerCase().includes(term)) : searchIndex;
  results.replaceChildren();
  if (!matches.length) { const p = document.createElement('p'); p.textContent = 'No matching chapter. Try “MIDI”, “flash”, “sound” or a firmware name.'; results.append(p); }
  matches.forEach(item => {
    const a = document.createElement('a'), title = document.createElement('b'), text = document.createElement('p');
    a.href = `#${item.id}`;
    title.textContent = `${String(chapters.findIndex(section => section.id === item.id)).padStart(2, '0')} / ${item.title}`;
    const at = term ? item.text.toLowerCase().indexOf(term) : 0;
    const start = Math.max(0, at - 45);
    text.textContent = `${start ? '…' : ''}${item.text.slice(start, start + 175).trim()}…`;
    a.append(title, text); a.addEventListener('click', () => { dialog.close(); closeMenu(); }); results.append(a);
  });
}
function openSearch() { search.value = ''; searchGuide(); dialog.showModal(); search.focus(); }
document.querySelector('#open-search').addEventListener('click', openSearch);
search.addEventListener('input', searchGuide);
search.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); results.querySelector('a')?.click(); } });
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
  if (event.key === '/' && !dialog.open && !event.ctrlKey && !event.metaKey && !event.altKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { event.preventDefault(); openSearch(); }
});
