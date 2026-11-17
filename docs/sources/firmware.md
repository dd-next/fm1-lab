# FM-1 official firmware research

Research snapshot: 2026-11-18. Primary code snapshot: official FM1 Open repository at the commit below.

## Version identities: never collapse these into one firmware

1. **Original stock FM-1 firmware** is the retail instrument. The manufacturer's product description still says 12-note polyphony and 16-step sequencing. Those are earlier-stock specifications, not limits of the silicon.
2. **Stock V16** is a separate official release. [M-VAVE's release announcement](https://forum.m-vave.com/topic/23), published 2026-10-21, explicitly compares V16 with V15: 8 timbral parts and **20 total dynamically shared synthesis voices**, 64 steps per pattern, 16-pattern pool, eight-row/eight-column arrangement, and one shared stereo effects chain. The six effects are Filter, Reverb, Delay, Distortion, Chorus and Phaser. It also changes FX MIDI CC mapping to 70–93. Keep this summary compact; don't reproduce the entire announcement.
3. **FM1 Open V14** is the official developer-oriented multi-engine instrument, source + SDK + web workbench. Its version number is independent of stock V16. [Manufacturer introduction](https://forum.m-vave.com/topic/4), [official repository](https://github.com/m-vave/fm1_open), [workbench](https://open.m-vave.com/fm1-workbench).

Pinned official Open revision: `4c7496daac04a95ff10d1afdcc8f9ead2dbabc41`, commit date 2026-10-21, title “Fix Quick Edit display and support JieLi 2.5.3”. [Version file](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/version.h#L5) declares V14 and product identity `FM-1_8000014`.

## What Open actually opens

**Public application + open browser engine + proprietary native engine SDK**, not a fully open native firmware implementation.

- Public `app/`: UI, board scanning and LCD/audio drivers, MIDI routing, project/sample/patch storage and transfer.
- Public `web/engine/` and `web/synth/`: portable C implementation used by the browser preview, including DX7 FM synthesis, mixer, sequence engine and effects.
- `sdk/lib/libfm1_engine.a`: precompiled native instrument/platform engine. Proprietary source is not supplied.
- Native build walks `app` for C/assembly sources, excludes `app/synth`, then links the binary engine. [Build boundary, lines 346–358](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/Build.ps1#L346).
- Browser build compiles public C with WASI SDK, host-test/browser defines and separate `web/engine`/`web/synth` include paths. [Browser compilation, lines 78–84](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/tools/Build-Web.ps1#L78).

**Teaching consequence:** show browser DX7 source to explain the actual published DSP model. Do not label it a source listing for the hidden native implementation or claim browser/native audio is bit-identical. There is no public conventional `app/main.c` to start at; start with API contracts, callbacks and the build script.

### License boundary

[LICENSE.md](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/LICENSE.md#L1): company APP sources GPL-3.0-only with an explicit FM1 SDK linking exception. A derivative APP remains GPL; provide matching APP source and build/install scripts when distributing covered builds. Some components have other licenses.

[THIRD_PARTY.md](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/THIRD_PARTY.md#L28): proprietary SDK permission permits development/use and binary redistribution for FM1 devices; does not provide SDK source. Boot/update resources and bundled V15 recovery image have separate Apache-2.0 terms. The FM1 device restriction applies to the proprietary engine grant, not GPL APP code.

The FM model derives from MSFA / Dexed (Apache-2.0), 303 from Open303 (MIT), selected 808/pluck models from DaisySP (MIT), PSG from emu2149 (MIT), and sample codec from SEA (MIT). [Component table](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/THIRD_PARTY.md#L5).

## Open's instrument model

[app/instrument.h lines 10–26](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/instrument.h#L10) declares eight tracks, 64 steps, and six source types: DX7, 303, 808, PSG, PLUCK and SAMPLE. A track is a timbral/mixer/sequencer part; a voice is one currently sounding note. Do not multiply track count by advertised per-engine voice caps and call that guaranteed hardware polyphony.

Roles NORMAL / PLAY / OFF, independent input MIDI channels and project behavior are documented in [instrument.h lines 84–94](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/instrument.h#L84). Default channels: 1–7 address tracks 1–7 and channel 10 track 8. PLAY tracks preserve their instrument and held notes across project switches; OFF releases engine resources.

The README states 128 DX7 library voices in four groups of 32, single-voice/bank `.syx` support, eight sample slots sharing about 19.55 seconds of **new** storage at this revision, 30–300 BPM, project backups separate from sample-bank backups. Do not use older forum capacity (~20.45 s) for this newer V14 snapshot. [Pinned README](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/README.md).

## From touch to sound: verified source path

### 1. Read physical state; don't generate sound in the button interrupt

`fm1_controls_init` sets master-pot/battery inputs, initializes scanner, starts timer callback. [panel.c L13](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/panel.c#L13).

`fm1_device_start` configures TIMER4 as 24 MHz timebase and TIMER5 as 10 kHz input scanner. [device.c L12](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/device.c#L12). 10 kHz is the scanner **tick** rate; 11 columns are cycled, so do not claim each key is scanned at 10 kHz.

`fm1_input_tick` rotates columns with SPI/DMA and only decodes a complete scan after column 10. `fm1_scan_decode` debounces contacts and decodes encoder quadrature. The map has 41 keys/buttons, 27 of which are musical keys, and seven encoders. [fm1_input.h L9](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/fm1_input.h#L9), [L72](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/fm1_input.h#L72), [L112](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/fm1_input.h#L112).

`fm1_controls_read` atomically snapshots bitfields and encoder steps, clears consumed steps, and reads ADC master/battery. [panel.c L28](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/panel.c#L28).

### 2. Turn a key transition into a MIDI message

`groove_screen_control` reads controls and dispatches UI/key actions. The key loop emits Note Off `0x80|channel` and Note On `0x90|channel` with local velocity **100**. [screen.c L2538](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/screen.c#L2538). This is a firmware fact, not proof that all other firmwares use the same key velocity.

The small helper `post()` calls `groove_midi_local`. [screen.c L321](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/screen.c#L321).

`groove_midi_local` validates the message, resolves active tracks by channel, respects Local Off, posts into the engine, and optionally sends external MIDI. Incoming DIN/USB/BLE short messages enter `fm1_app_midi_received`, which checks selected clock source and queues input/Thru. [midi_router.c L275](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/midi_router.c#L275), [L319](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/midi_router.c#L319).

`fm1_midi_post` is the boundary into the native engine, takes complete short messages and reports invalid/overflow cases. [fm1.h L40](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/include/fm1.h#L40). MIDI is instructions (pitch, velocity, controllers), not an audio waveform.

### 3. Produce blocks against the audio clock

[fm1_block.h](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/include/fm1_block.h#L5): sample rate 44,100 Hz; 128 frames per block; two channels. Derived block interval = 128/44100 = **2.90249 ms**, about **344.53 blocks/s**. This is a processing interval, not a measured end-to-end latency specification.

[fm1_engine_control.h L5](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/include/fm1_engine_control.h#L5) states `fm1_engine_render` is called once per block from I2S/DMA interrupt, non-concurrently. It fills signed Q23 interleaved stereo samples (32-bit containers). Master gain/external audio/USB recording are APP responsibilities.

[app/board/audio.c L27](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/audio.c#L27): `fm1_audio_irq` acknowledges interrupt; validates interval; asks engine for block; calls APP output mix; copies to a free transmit half only while ownership/deadline still valid. There are double-buffered receive and transmit arrays; DMA moves data while CPU prepares next block. Buffer ownership and deadline handling prevent writing the half hardware is currently using.

### 4. Mix output; send samples to the converter

[app/audio_output.c L19](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/audio_output.c#L19): smooth master gain by at most eight control units per block, mix USB playback, clamp to signed 24-bit range, mix Bluetooth input, and hand resulting block to USB recording. That is Open V14 code behavior; do not substitute stock V16's separately documented USB Loopback setting.

[app/board/audio.c L86](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/audio.c#L86) configures audio-link DMA and port C signals, selecting 11.2896 MHz (256 × 44.1 kHz) clock. Digital PCM only becomes analog voltage at the downstream codec/DAC, then reaches the output amplifier/jack. Hardware agent handles chip identity and schematic evidence.

### 5. Keep control/storage away from the real-time deadline

`fm1_engine_pause`/`resume` are brief control-task edit gates. Flash APIs are control-only and writes briefly silence audio. [fm1.h L140](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/include/fm1.h#L140). `FM1_AUDIO_CODE` places code in internal SRAM so audio callees are safe while Flash is programmed ([fm1.h L13](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/include/fm1.h#L13)).

`project.c` implements record headers with generation, CRC and commit markers, validates flash records and journals settings/tuning changes; `transfer.c` separates MIDI SysEx reception from later control-side work. [project.c L23](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/project.c#L23), [transfer.c L38](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/transfer.c#L38), [L234](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/transfer.c#L234).

## Reading the public browser synthesis engine

Treat this as the official portable preview code, with a clearly labeled native binary boundary.

- `web/engine/sound.c`: tracks/source allocation/MIDI/voice rendering/mixing. Each track owns an engine instance. `render_stereo` renders each source, applies LFO/level/pan, accumulates dry buses and post-fader delay/reverb sends, then effects. [L1071](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/engine/sound.c#L1071).
- `render` advances the sequencer before rendering audio. [L1147](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/engine/sound.c#L1147). `fm1_engine_render` then adds metronome and master processing ([L1202](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/engine/sound.c#L1202)).
- `web/engine/sequencer.c`: sample-count phase accumulators rather than browser timers; [groove_sequence_render L377](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/engine/sequencer.c#L377). Step events and gates occur at block granularity in this implementation; avoid saying every note onset is sample-exact inside the block.
- `web/synth/dx7synth.c`: voice allocation, sustain/mono/glide, per-voice state, rendering. Audio callback is 128 frames but DX7 envelopes/LFO/rendering retain a **64-sample quantum**, called twice: [L497](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/synth/dx7synth.c#L497).
- `web/synth/dx7note.c`: patch/velocity/key scaling, per-operator envelopes, phase/frequency setup; [dx7note_init L98](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/synth/dx7note.c#L98), [compute L133](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/synth/dx7note.c#L133).
- `web/synth/dx7core.c`: **32 rows × 6 operators** encode routing bus flags and feedback, [L36](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/synth/dx7core.c#L36). Operator calculation adds incoming modulation into phase before sine lookup, advances phase, and adds/replaces a bus: [L176](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/synth/dx7core.c#L176). This is phase modulation, the implementation convention behind DX-style “FM”. Feedback recirculates previous output into phase ([L216](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/synth/dx7core.c#L216)). A modulator's level controls timbre; a carrier's level controls its audible contribution. Carriers and modulators are roles determined by routing, not permanently different oscillators.
- `web/synth/dx7env.c`: **four rates/four levels**, not plain ADSR. Key release jumps to stage 4; [L27](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/synth/dx7env.c#L27), [L62](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/synth/dx7env.c#L62). Additional overall ADSR exists in the synth wrapper; don't replace per-operator envelope explanation with it.
- `web/engine/Simulator.c`: fake peripherals and browser exports; `sim_render` returns float-converted previous output, drains queued MIDI, renders next block, mixes output, advances simulated time and polls control. [L353](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/web/engine/Simulator.c#L353).

## Build and learn before touching hardware

The pinned official README requires Windows x64 + PowerShell + curl.exe/tar.exe and **JieLi Windows toolchain 2.5.3**, PI32v2 clang 4.0.1, `r3` target. Set `FM1_PI32_TOOLCHAIN` to the pi32 folder containing bin/clang.exe. Build checks hash 22 toolchain files and SDK manifest; preserve these checks. This is not ARM GCC / Arduino / ESP32 toolchain.

- Local web preview: `.\tools\Build-Web.ps1 -LocalPreview` (WASI SDK 27 downloaded on first build).
- Local native firmware: `./sdk/Build.ps1 -FirmwareOnly -Toolchain 'C:\JL\pi32'`.
- Distribution: set `FM1_SOURCE_URL` to exact matching HTTPS source archive, then `build.bat --web` and `build.bat --package`. A moving tree/main is not a matching archive.
- Native output path `build/dx7/generated/FM1_OFFICIAL_OPEN.fwsc`; preview `build/preview/index.html`.

No native build or flash was attempted during research; no physical device available. Browser teaching audio made for the site should be explicitly labeled a conceptual DSP lab, not FM-1 output capture or firmware emulation.

Before choosing a custom firmware, identify exact unit/flash support and read its exact version's migration/recovery instructions. Don't promise that a universal key combination or M-UPGRADE always rescues every failure. See hardware research and alternatives research for UC25HQ80/newer-unit compatibility specifics. Keep native recovery image/package and exported project/sample/voice backups separately.
