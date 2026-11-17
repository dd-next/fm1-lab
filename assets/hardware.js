const OFFICIAL = 'https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/';
const source = (path, label) => `<a class="source-link" href="${OFFICIAL}${path}">${label} ↗</a>`;

const nodes = [
  {
    id: 'controls', step: '01', icon: '⌘', title: 'Controls', subtitle: 'Contacts → events', kind: 'main',
    tag: 'Confirmed in board code', heading: 'A key press starts as a contact.',
    body: 'The panel has 27 note keys, 14 function buttons and seven encoders. The scanner selects one of 11 columns, reads its contacts, then moves on. It debounces switches and decodes each encoder’s two-contact quadrature pattern before reporting useful state to the application.',
    detail: 'The input timer ticks at 10 kHz. That is one column tick, not a complete keyboard scan: eleven columns take about 1.1 ms, before debounce. LEDs share the scan schedule. Turning an encoder changes a number; what that number controls is a firmware decision.',
    code: 'fm1_input_tick() → fm1_scan_decode() → fm1_controls_read()',
    links: source('app/board/fm1_input.h#L10', 'Read the scanner') + source('app/board/device.c#L12', 'Check the timer'),
  },
  {
    id: 'processor', step: '02', icon: '▦', title: 'AC791N / WL82', subtitle: 'Events → sample blocks', kind: 'main',
    tag: 'Chip family + implementation', heading: 'The instrument is a program.',
    body: 'The JieLi chip runs the instrument’s code. Voices, envelopes, sequencer events and effects compete for processing time. Six FM operators are software signal generators inside a voice—not six separate oscillator chips on the board.',
    detail: 'JieLi documents a dual-core DSP family with single-precision floating point and a rated maximum of 320 MHz. Community measurements report other clocks under some bootloaders. Clock speed, core use and voice count are configuration-dependent; they are not interchangeable specifications.',
    code: 'fm1_engine_render(rendered, FM1_BLOCK_FRAMES)',
    links: source('app/board/audio.c#L43', 'See the render boundary') + '<a class="source-link" href="https://doc.zh-jieli.com/AC79/zh-cn/master/getting_started/overview/index.html">JieLi chip-family documentation ↗</a>',
  },
  {
    id: 'audio', step: '03', icon: '≈', title: 'Audio link + DMA', subtitle: 'Blocks → continuous stream', kind: 'main',
    tag: 'Confirmed in board code', heading: 'Two buffers keep the sound moving.',
    body: 'ALNK0 transfers stereo sample data while the CPU computes the next block. The official open driver uses two DMA halves, each holding 128 stereo frames. The interrupt handler renders into a temporary buffer and commits only while the destination half is still safe to write.',
    detail: 'At the driver’s 44,118 Hz timing rate, each half lasts about 2.90 ms. This is a rendering deadline, not total key-to-sound latency. The nominal engine rate is 44,100 Hz. Samples travel in a 24-bit stereo format; that says nothing about the measured noise floor of the analog output.',
    code: '128 frames × 2 channels = 256 words per half',
    links: source('app/board/fm1_audio.h#L7', 'Inspect the audio hardware contract') + source('app/board/audio.c#L28', 'Follow the interrupt handler'),
  },
  {
    id: 'output', step: '04', icon: '◖', title: 'Analog output', subtitle: 'Numbers → voltage → air', kind: 'main',
    tag: 'Output confirmed · exact DAC unverified', heading: 'The final step is physical.',
    body: 'A digital-to-analog conversion and output stage turn the sample stream into an electrical signal. Headphones or the built-in speaker turn that signal into air pressure. The manufacturer specifies a 3.5 mm stereo output, with the speaker muted when headphones are connected.',
    detail: 'The inspected board source confirms the digital audio path but does not identify the converter’s part number. Community descriptions disagree about its physical implementation. This map intentionally leaves the exact DAC unverified. The audio driver also states that the FM-1 has no connected analog input.',
    code: 'ALNK0 → DAC / output stage → headphones or speaker',
    links: source('app/board/fm1_audio.h#L7', 'Read the board’s audio notes') + '<a class="source-link" href="https://manualf.oss-cn-hongkong.aliyuncs.com/manual/MIDI-KEYBOARD/FM-1-manual.pdf">Official manual · rear panel ↗</a>',
  },
  {
    id: 'memory', step: '↔', icon: '▤', title: 'Flash + SRAM', subtitle: 'Stored program / live state', kind: 'support',
    tag: 'Code + maintainer hardware report', heading: 'Memory has two different jobs.',
    body: 'Flash keeps firmware and saved data when power is off. SRAM holds changing state: active voices, audio buffers, UI data and working memory. Bigger delay lines, more sample data and more voices all need space. The official linker configures no SDRAM region.',
    detail: 'Known FM-1 units have 1 MiB flash. Recent units can use UC25HQ80 (JEDEC 0xB36014) instead of Puya P25Q80 (0x856014). An exact firmware release must support the fitted chip: older Clipper releases could run on the newer chip yet fail to save or update. The chip-family SRAM total is not the same as free application RAM.',
    code: 'Flash: persistent · SRAM: working state · linker: placement',
    links: source('sdk/config/linker.ld.in#L14', 'Explore the memory layout') + '<a class="source-link" href="https://github.com/isod89/clipper-fm1/releases/tag/v1.3.1">Read the flash-compatibility case ↗</a>',
  },
  {
    id: 'display', step: '↔', icon: '▣', title: 'Display + LEDs', subtitle: 'State → visual feedback', kind: 'support',
    tag: 'Confirmed in board code', heading: 'The screen is another peripheral.',
    body: 'The official display driver initializes an ST7789-style controller for 240 × 240 pixels, sends RGB565 pixel data over SPI1 and controls the backlight separately. A display update moves bytes; it does not create the audio waveform you hear.',
    detail: 'The screen API supports transfers in bounded bands of up to 240 × 16 pixels. That lets the application update part of the screen while respecting other work. Slow drawing or long interrupt blocking can still compete with real-time sound generation.',
    code: 'UI state → RGB565 pixels → SPI1 DMA → TFT',
    links: source('app/board/lcd.inc#L76', 'Inspect display initialization') + source('sdk/include/fm1.h#L109', 'Read the display API'),
  },
  {
    id: 'midi', step: '→', icon: '⇄', title: 'USB / BLE / MIDI', subtitle: 'External musical events', kind: 'support',
    tag: 'Manufacturer + SDK API', heading: 'MIDI tells the synth what to play.',
    body: 'USB MIDI, Bluetooth LE MIDI and the separate 3.5 mm MIDI input can supply notes and control messages. These messages enter the instrument’s event path. A Note On describes a note and velocity; it does not contain a recording of that note.',
    detail: 'USB audio, Bluetooth music, host behavior and supported MIDI messages depend on the installed firmware. Keep the 3.5 mm MIDI jack distinct from the headphone jack. The inspected manual calls for a 3.5 mm MIDI adapter but does not establish its Type A/B wiring.',
    code: 'MIDI event → routing → voice allocation → synthesis',
    links: source('sdk/include/fm1.h#L22', 'Explore transport APIs') + '<a class="source-link" href="https://manualf.oss-cn-hongkong.aliyuncs.com/manual/MIDI-KEYBOARD/FM-1-manual.pdf">Official MIDI and rear-panel guide ↗</a>',
  },
  {
    id: 'power', step: '→', icon: '⏚', title: 'Power + analog controls', subtitle: 'Voltage → digital readings', kind: 'support',
    tag: 'Manufacturer + board code', heading: 'The master knob is read by an ADC.',
    body: 'The battery and USB supply the board. The manufacturer rates the battery at 3.7 V / 2,000 mAh and claims about 12 hours of use. An analog-to-digital converter reads the master potentiometer and a battery-voltage divider, so software can act on those values.',
    detail: 'The official panel adapter reads master volume on PB6 / ADC channel 4 and battery on PB1 / ADC channel 3. This evidence supports an ADC-controlled volume input; it does not prove a simple analog attenuator sits in the output path. Runtime varies with use and firmware.',
    code: 'Potentiometer voltage → ADC channel 4 → control state',
    links: source('app/board/panel.c#L16', 'Inspect the analog inputs') + source('app/board/panel.c#L42', 'Follow the ADC readings'),
  },
];

let instanceCount = 0;

/** Mount the functional hardware explorer. No hardware connection is made. */
export function mountHardware(container) {
  if (!(container instanceof HTMLElement)) throw new TypeError('A hardware container is required.');
  const id = `hardware-detail-${++instanceCount}`;
  container.innerHTML = `
    <p class="eyebrow">FUNCTIONAL MAP · NOT A PCB SCHEMATIC</p>
    <p class="hardware-instruction">Follow the top row from a pressed key to sound. Select any block to inspect its job, code and evidence.</p>
    <div class="hardware-map" role="group" aria-label="Explore FM-1 hardware blocks">
      ${nodes.map((node, index) => `<button type="button" class="hardware-node ${node.kind === 'main' ? 'hardware-node-main' : 'hardware-node-support'}" data-hardware="${node.id}" aria-controls="${id}" aria-pressed="${index === 0}">
        <span class="hardware-node-index" aria-hidden="true">${node.step}</span>
        <span class="hardware-node-title">${node.title}</span>
        <span class="hardware-node-subtitle">${node.subtitle}</span>
      </button>`).join('')}
    </div>
    <article class="hardware-detail" id="${id}" aria-label="Selected hardware block"></article>
    <p class="hardware-evidence-note">Evidence key: board code describes an implementation; manufacturer documents describe the product; unverified physical details stay explicit. Source snapshot: <code>4c7496d</code>.</p>`;

  const detail = container.querySelector('.hardware-detail');
  const buttons = [...container.querySelectorAll('[data-hardware]')];
  function select(index) {
    const node = nodes[index];
    buttons.forEach((button, position) => button.setAttribute('aria-pressed', String(position === index)));
    detail.innerHTML = `
      <span class="tag">${node.tag}</span>
      <h3>${node.heading}</h3>
      <p>${node.body}</p>
      <p>${node.detail}</p>
      <p class="hardware-code"><code>${node.code}</code></p>
      <div class="hardware-sources">${node.links}</div>`;
    detail.setAttribute('aria-label', `${node.title}: explanation and sources`);
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % nodes.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + nodes.length) % nodes.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = nodes.length - 1;
      else return;
      event.preventDefault();
      buttons[next].focus();
      select(next);
    });
  });
  select(0);
}

export { nodes as hardwareNodes };
