// Original teaching instrument. This is not a port or emulation of FM-1 firmware.
const PRESETS = {
  pure: { label: 'Pure sine', note: 57, ratio: 1, index: 0, attack: 0.02, decay: 0.4, sustain: 0.7, release: 0.35, hint: 'Index zero removes modulation. You hear only the carrier.' },
  bell: { label: 'Glass bell', note: 57, ratio: 3.5, index: 2.8, attack: 0.006, decay: 1.8, sustain: 0.03, release: 1.8, hint: 'A 3.5:1 ratio adds partials outside the carrier’s harmonic grid, while sharing a lower fundamental. The long decay creates a bell-like contour.' },
  bass: { label: 'Hollow bass', note: 40, ratio: 1, index: 2.5, attack: 0.008, decay: 0.25, sustain: 0.35, release: 0.2, hint: 'A 1:1 ratio puts the sidebands on a harmonic grid. Try moving the index slowly.' },
  metal: { label: 'Metallic', note: 52, ratio: 1.41, index: 6, attack: 0.01, decay: 0.7, sustain: 0.3, release: 0.7, hint: 'A near-irrational ratio breaks the harmonic grid. A larger index spreads energy across more partials.' },
};
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const frequency = note => 440 * 2 ** ((note - 69) / 12);
const noteName = note => `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
let instanceId = 0;

/** Mount a dependency-free Web Audio lab. Returns { stop, destroy }. */
export function mountSoundLab(container) {
  if (!container) throw new TypeError('mountSoundLab needs a container element');
  const id = `fm-lab-${++instanceId}`;
  const state = { ...PRESETS.bell };
  let context, analyser, master, voice, frame, autoRelease, destroyed = false, holding = false;
  let playRequest = 0;
  let audioStarted = false;
  const timers = new Set();
  const soundingVoices = new Set();
  const aborter = new AbortController();
  const listen = (element, event, callback) => element.addEventListener(event, callback, { signal: aborter.signal });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const control = (key, label, min, max, step, value, unit = '') => `
    <label class="sl-control" for="${id}-${key}">
      <span>${label}<output id="${id}-${key}-out" for="${id}-${key}">${value}${unit}</output></span>
      <input id="${id}-${key}" data-parameter="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">
    </label>`;

  container.innerHTML = `
    <div class="sound-lab" aria-label="Two-operator FM sound laboratory">
      <div class="sl-topline"><span class="sl-indicator" aria-hidden="true"></span><span>LIVE SYNTHESIS / TWO OPERATORS</span><span class="sl-model-tag">Teaching model</span></div>
      <div class="sl-preset-row" role="group" aria-label="Sound presets">
        ${Object.entries(PRESETS).map(([key, preset]) => `<button type="button" class="sl-preset${key === 'bell' ? ' is-selected' : ''}" data-preset="${key}" aria-pressed="${key === 'bell'}">${preset.label}</button>`).join('')}
      </div>
      <div class="sl-layout">
        <div class="sl-parameters">
          <div class="sl-operator"><span class="sl-op-number">01</span><div><span class="sl-kicker">CARRIER</span><strong>The tone you hear</strong></div><span class="sl-op-icon" aria-hidden="true">∿</span></div>
          ${control('note', 'Carrier pitch', 36, 84, 1, state.note)}
          <div class="sl-operator sl-modulator"><span class="sl-op-number">02</span><div><span class="sl-kicker">MODULATOR</span><strong>The tone that bends it</strong></div><span class="sl-op-icon" aria-hidden="true">↝</span></div>
          ${control('ratio', 'Frequency ratio', 0.5, 8, 0.01, state.ratio)}
          ${control('index', 'Modulation index', 0, 10, 0.1, state.index)}
          <div class="sl-route" aria-label="The modulator changes carrier frequency; only the carrier goes to the output"><span>MOD</span><span aria-hidden="true">→</span><span>CARRIER</span><span aria-hidden="true">→</span><span>OUT</span></div>
          <p class="sl-hint" data-hint>${state.hint}</p>
        </div>
        <div class="sl-monitor">
          <div class="sl-scope-head"><span>OSCILLOSCOPE</span><span data-scope-label>Mathematical preview</span></div>
          <canvas class="sl-wave" aria-label="Waveform visualization" role="img">Waveform of the current two-operator sound.</canvas>
          <div class="sl-spectrum-head"><span>FREQUENCY SPECTRUM</span><span>0 — 8 kHz</span></div>
          <canvas class="sl-spectrum" aria-label="Frequency spectrum visualization" role="img">Start a note to view its frequency spectrum.</canvas>
          <div class="sl-readouts"><div><span>CARRIER</span><strong data-carrier-hz></strong></div><div><span>MODULATOR</span><strong data-modulator-hz></strong></div><div><span>DEVIATION</span><strong data-depth-hz></strong></div></div>
        </div>
      </div>
      <details class="sl-envelope">
        <summary><span>Shape the amplitude envelope</span><span class="sl-envelope-caption">ATTACK · DECAY · SUSTAIN · RELEASE</span></summary>
        <div class="sl-envelope-controls">
          ${control('attack', 'Attack', 0.005, 2, 0.005, state.attack)}
          ${control('decay', 'Decay', 0.02, 3, 0.01, state.decay)}
          ${control('sustain', 'Sustain', 0, 1, 0.01, state.sustain)}
          ${control('release', 'Release', 0.02, 3, 0.01, state.release)}
        </div>
        <p>The envelope changes loudness. The index stays constant in this model; an independent modulator envelope can also change a real FM patch’s brightness over time. New attack and decay values apply on the next note.</p>
      </details>
      <div class="sl-transport">
        <button type="button" class="sl-play" aria-pressed="false"><span data-play-icon aria-hidden="true">▶</span><span data-play-label>Play sound</span></button>
        <button type="button" class="sl-stop" aria-label="Stop all sound immediately">Stop</button>
        <div class="sl-keyboard" role="group" aria-label="Audition a note">${[48, 50, 52, 53, 55, 57, 59, 60].map(note => `<button type="button" data-note="${note}" aria-label="Audition ${noteName(note)}">${noteName(note)}</button>`).join('')}</div>
        <span class="sl-status" role="status" aria-live="polite">Sound is off</span>
      </div>
      <div class="sl-explainer">
        <p><strong>Listen for the relationship.</strong> Start with Pure sine, raise the index, then compare ratios 1.00 and 1.41. Integer ratios align sidebands with the carrier’s harmonic grid; non-integer ratios can sound metallic. Half-integer ratios can still share a lower fundamental.</p>
        <details><summary>What is the browser actually calculating?</summary><div class="sl-math"><code>fₘ = ratio × f꜀<br>frequency deviation = index × fₘ<br>y(t) = A(t) × sin(2πf꜀t − index × cos(2πfₘt))</code><p>A sine oscillator modulates another oscillator’s frequency. For a constant sinusoidal modulator, this produces the same family of spectra as phase modulation (up to phase). The equation describes that ideal signal; Web Audio generates it in real time. This two-operator lesson does not reproduce FM-1’s six-operator engine, algorithms, envelopes, effects, DAC or aliasing. Higher settings can introduce browser-specific aliasing.</p></div></details>
      </div>
    </div>`;

  const root = container.querySelector('.sound-lab');
  const query = selector => root.querySelector(selector);
  const waveCanvas = query('.sl-wave');
  const spectrumCanvas = query('.sl-spectrum');
  const waveContext = waveCanvas.getContext('2d');
  const spectrumContext = spectrumCanvas.getContext('2d');
  const status = query('.sl-status');
  const play = query('.sl-play');
  const inputs = [...root.querySelectorAll('[data-parameter]')];
  const values = new Float32Array(2048);
  const bins = new Uint8Array(1024);

  function updateReadouts() {
    const carrierHz = frequency(state.note);
    query('[data-carrier-hz]').textContent = `${carrierHz.toFixed(1)} Hz`;
    query('[data-modulator-hz]').textContent = `${(carrierHz * state.ratio).toFixed(1)} Hz`;
    query('[data-depth-hz]').textContent = `±${(carrierHz * state.ratio * state.index).toFixed(0)} Hz`;
    for (const input of inputs) {
      const key = input.dataset.parameter;
      input.value = state[key];
      const label = key === 'note' ? `${noteName(state.note)} · MIDI ${state.note}` : key === 'ratio' ? `${state.ratio.toFixed(2)} : 1` : key === 'index' ? state.index.toFixed(1) : key === 'sustain' ? `${Math.round(state.sustain * 100)}%` : `${state[key].toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} s`;
      query(`#${id}-${key}-out`).textContent = label;
      input.setAttribute('aria-valuetext', label);
      const percent = (state[key] - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100;
      input.style.setProperty('--sl-fill', `${percent}%`);
    }
  }

  async function getAudio() {
    if (destroyed) return false;
    try {
      if (!context) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error('Web Audio is unavailable in this browser.');
        context = new AudioContextClass();
        master = context.createGain();
        master.gain.value = 0.1;
        analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.7;
        master.connect(analyser);
        analyser.connect(context.destination);
      }
      await context.resume();
      if (destroyed || document.hidden) return false;
      audioStarted = true;
      return true;
    } catch (error) {
      status.textContent = error.message || 'Audio could not start. Try another browser.';
      return false;
    }
  }

  function setPlaying(isPlaying) {
    holding = isPlaying;
    play.setAttribute('aria-pressed', String(isPlaying));
    query('[data-play-label]').textContent = isPlaying ? 'Release note' : 'Play sound';
    query('[data-play-icon]').textContent = isPlaying ? 'Ⅱ' : '▶';
    root.classList.toggle('is-playing', isPlaying);
  }

  function disposeVoice(oldVoice) {
    soundingVoices.delete(oldVoice);
    for (const oscillator of [oldVoice.carrier, oldVoice.modulator]) {
      try { oscillator.stop(); } catch { /* Oscillator may already be stopped. */ }
      oscillator.disconnect();
    }
    oldVoice.depth.disconnect();
    oldVoice.envelope.disconnect();
    if (!soundingVoices.size) draw();
  }

  function releaseVoice(oldVoice, duration) {
    if (oldVoice.cleanupTimer) {
      clearTimeout(oldVoice.cleanupTimer);
      timers.delete(oldVoice.cleanupTimer);
    }
    const now = context.currentTime;
    if (oldVoice.envelope.gain.cancelAndHoldAtTime) oldVoice.envelope.gain.cancelAndHoldAtTime(now);
    else {
      oldVoice.envelope.gain.cancelScheduledValues(now);
      oldVoice.envelope.gain.setValueAtTime(oldVoice.envelope.gain.value, now);
    }
    oldVoice.envelope.gain.linearRampToValueAtTime(0, now + duration);
    const timer = setTimeout(() => {
      disposeVoice(oldVoice);
      timers.delete(timer);
      if (!soundingVoices.size) status.textContent = 'Sound is off';
    }, (duration + 0.08) * 1000);
    oldVoice.cleanupTimer = timer;
    timers.add(timer);
  }

  function stop(immediate = true) {
    playRequest++;
    clearTimeout(autoRelease);
    setPlaying(false);
    if (context) {
      if (immediate) {
        for (const soundingVoice of soundingVoices) releaseVoice(soundingVoice, 0.015);
      } else if (voice) {
        releaseVoice(voice, state.release);
      }
      voice = null;
    }
    status.textContent = immediate ? 'Sound is off' : 'Envelope releasing';
  }

  async function startNote(timed = false) {
    const request = ++playRequest;
    if (!(await getAudio())) return;
    if (request !== playRequest || destroyed) return;
    stop(true);
    const carrier = context.createOscillator();
    const modulator = context.createOscillator();
    const depth = context.createGain();
    const envelope = context.createGain();
    const now = context.currentTime;
    const fc = frequency(state.note);
    carrier.type = 'sine';
    modulator.type = 'sine';
    carrier.frequency.value = fc;
    modulator.frequency.value = fc * state.ratio;
    depth.gain.value = state.index * fc * state.ratio;
    modulator.connect(depth);
    depth.connect(carrier.frequency);
    carrier.connect(envelope);
    envelope.connect(master);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + state.attack);
    envelope.gain.linearRampToValueAtTime(state.sustain, now + state.attack + state.decay);
    carrier.start(now);
    modulator.start(now);
    voice = { carrier, modulator, depth, envelope };
    soundingVoices.add(voice);
    setPlaying(true);
    status.textContent = `${noteName(state.note)} playing${timed ? ' · short audition' : ''}`;
    if (timed) autoRelease = setTimeout(() => stop(false), Math.min(3200, Math.max(900, (state.attack + state.decay) * 1000)));
    draw();
  }

  function updateVoice(key) {
    if (!voice || !context) return;
    const now = context.currentTime;
    const fc = frequency(state.note);
    voice.carrier.frequency.setTargetAtTime(fc, now, 0.02);
    voice.modulator.frequency.setTargetAtTime(fc * state.ratio, now, 0.02);
    voice.depth.gain.setTargetAtTime(state.index * fc * state.ratio, now, 0.02);
    if (key === 'sustain') {
      voice.envelope.gain.cancelScheduledValues(now);
      voice.envelope.gain.setTargetAtTime(state.sustain, now, 0.03);
    }
  }

  function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    return [width, height];
  }

  function grid(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(220,230,205,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += width / 12) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = height / 4; y < height; y += height / 4) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();
  }

  let lastDraw = 0;
  function draw(timestamp = 0) {
    cancelAnimationFrame(frame);
    if (destroyed) return;
    const hasAudio = audioStarted && soundingVoices.size > 0;
    const interval = reducedMotion.matches ? 250 : 33;
    if (timestamp && timestamp - lastDraw < interval) {
      if (!document.hidden && hasAudio) frame = requestAnimationFrame(draw);
      return;
    }
    lastDraw = timestamp;
    query('[data-scope-label]').textContent = hasAudio ? 'Live audio · low output level' : 'Mathematical preview';
    const [width, height] = resizeCanvas(waveCanvas);
    grid(waveContext, width, height);
    waveContext.strokeStyle = '#d9f66f';
    waveContext.lineWidth = 2 * Math.min(window.devicePixelRatio || 1, 2);
    waveContext.beginPath();
    if (analyser && hasAudio) {
      analyser.getFloatTimeDomainData(values);
      let start = 0;
      for (let i = 1; i < values.length / 2; i++) {
        if (values[i - 1] <= 0 && values[i] > 0) { start = i; break; }
      }
      const samples = Math.min(values.length - start, Math.round((context.sampleRate / frequency(state.note)) * 3));
      for (let x = 0; x < width; x++) {
        const value = values[start + Math.min(samples - 1, Math.floor(x / width * samples))] || 0;
        const y = height / 2 - value * height * 3.8;
        if (x === 0) waveContext.moveTo(x, y); else waveContext.lineTo(x, y);
      }
    } else {
      for (let x = 0; x < width; x++) {
        const phase = x / width * Math.PI * 6;
        const value = Math.sin(phase - state.index * Math.cos(phase * state.ratio));
        const y = height / 2 - value * height * 0.34;
        if (x === 0) waveContext.moveTo(x, y); else waveContext.lineTo(x, y);
      }
    }
    waveContext.stroke();
    const [sw, sh] = resizeCanvas(spectrumCanvas);
    grid(spectrumContext, sw, sh);
    if (analyser && hasAudio) {
      analyser.getByteFrequencyData(bins);
      const maxBin = Math.min(bins.length, Math.floor(8000 / (context.sampleRate / analyser.fftSize)));
      const barWidth = Math.max(2, sw / 120);
      spectrumContext.fillStyle = '#ef9b62';
      for (let x = 0; x < sw; x += barWidth) {
        const from = Math.floor(x / sw * maxBin);
        const to = Math.max(from + 1, Math.ceil((x + barWidth) / sw * maxBin));
        let peak = 0;
        for (let i = from; i < to; i++) peak = Math.max(peak, bins[i] || 0);
        const h = peak / 255 * sh * 0.92;
        spectrumContext.fillRect(x, sh - h, Math.max(1, barWidth - 1), h);
      }
    } else {
      spectrumContext.fillStyle = '#899182';
      spectrumContext.font = `${Math.max(10, sw / 45)}px ui-monospace, monospace`;
      spectrumContext.textAlign = 'center';
      spectrumContext.fillText('PLAY A SOUND TO SEE ITS PARTIALS', sw / 2, sh / 2);
    }
    if (!document.hidden && hasAudio) frame = requestAnimationFrame(draw);
  }

  inputs.forEach(input => listen(input, 'input', () => {
    state[input.dataset.parameter] = Number(input.value);
    updateReadouts();
    updateVoice(input.dataset.parameter);
    root.querySelectorAll('[data-preset]').forEach(button => { button.classList.remove('is-selected'); button.setAttribute('aria-pressed', 'false'); });
    query('[data-hint]').textContent = 'Your patch. Change one parameter at a time and listen to what moves.';
    draw();
  }));
  root.querySelectorAll('[data-preset]').forEach(button => listen(button, 'click', () => {
    Object.assign(state, PRESETS[button.dataset.preset]);
    updateReadouts();
    root.querySelectorAll('[data-preset]').forEach(other => { other.classList.toggle('is-selected', other === button); other.setAttribute('aria-pressed', String(other === button)); });
    query('[data-hint]').textContent = state.hint;
    if (holding) startNote();
    draw();
  }));
  listen(play, 'click', () => holding ? stop(false) : startNote());
  listen(query('.sl-stop'), 'click', () => stop(true));
  root.querySelectorAll('[data-note]').forEach(button => listen(button, 'click', () => {
    state.note = Number(button.dataset.note);
    updateReadouts();
    startNote(true);
  }));
  listen(document, 'visibilitychange', () => {
    if (document.hidden) { stop(true); cancelAnimationFrame(frame); context?.suspend(); }
    else draw();
  });
  listen(window, 'pagehide', () => { stop(true); cancelAnimationFrame(frame); context?.suspend(); });
  listen(window, 'resize', () => draw());
  updateReadouts();
  draw();
  return {
    stop: () => stop(true),
    destroy() {
      destroyed = true;
      stop(true);
      aborter.abort();
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      for (const soundingVoice of soundingVoices) disposeVoice(soundingVoice);
      context?.close();
      container.replaceChildren();
    },
  };
}
