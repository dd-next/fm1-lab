# FM-1 hardware research

Research snapshot: 2026-11-18. Manufacturer source inspected at `m-vave/fm1_open` commit `4c7496daac04a95ff10d1afdcc8f9ead2dbabc41`. All architecture statements below distinguish a board fact, an SDK capability, and a source-code implementation choice. This is a functional map, **not a verified PCB schematic**.

## Recommended core explanation

The FM-1 is a small computer with musical controls, running a synthesis program in real time. A key closes an electrical contact. The panel scanner turns contacts and encoder movements into digital state. The application turns that state (or incoming MIDI) into musical events and parameter changes. A sound engine calculates blocks of sample values. DMA feeds these blocks to the audio peripheral while the CPU prepares the next block. The output stage turns those numbers into voltage for headphones and the built-in speaker. The screen and LEDs show the current state; they do not generate the sound.

“Six operators” means six software oscillator/envelope paths per FM voice, not six dedicated oscillator chips. Changing the application can turn the same board into another kind of synthesizer. The limits then depend on that firmware's algorithms, RAM use and ability to finish each audio block on time.

## Confirmed manufacturer/product facts

The [manufacturer product page](https://www.cuvave.com/product?id=fm-1) is JavaScript-rendered. Its data is at [products-data.js](https://www.cuvave.com/products-data.js), FM-1 object (lines 369 onward when fetched). The [official manual](https://manualf.oss-cn-hongkong.aliyuncs.com/manual/MIDI-KEYBOARD/FM-1-manual.pdf), English pages 13–14 (printed page numbers), confirms:

- 27 silicone note keys; seven 360° controls plus a separate 300° master-volume knob.
- A 3.5 mm stereo audio output; headphones mute the internal speaker.
- A separate 3.5 mm MIDI input, USB Type-C, and a power switch.
- USB and battery power; battery rated 3.7 V / 2,000 mAh, model DTP704060. Manufacturer claim: about 12 hours. This is a claim, not our measurement.
- Dimensions 161.5 × 96.5 × 28.6 mm; mass 251 g.
- USB MIDI, BLE MIDI, and wired MIDI input. MIDI is control data, not an audio waveform. Wired MIDI rate is 31,250 baud.

**Version caveat:** the current marketing page still describes 12-voice polyphony and a 16-step sequencer. Treat these as the original advertised firmware behavior, not immutable hardware limits or the current feature list. The firmware researcher found an official V16 announcement; use its version-specific facts separately.

**Connector caveat:** the inspected manual specifies a 3.5 mm-to-MIDI adapter but does not state Type A/B wiring. Do not invent that detail. The audio and MIDI jacks serve different purposes.

## SoC and memory

- Board drivers explicitly identify the family as **JieLi AC791N / WL82**. Compiler tooling uses `pi32v2`; do not label this an STM32/ARM board.
- [JieLi's chip-family overview](https://doc.zh-jieli.com/AC79/zh-cn/master/getting_started/overview/index.html) documents a dual-core DSP with single-precision floating-point support, up to 320 MHz, caches/MMU, and a total 578 KB on-chip SRAM. These are **family capabilities**, not a measurement of every FM-1 configuration. Some packages support additional SDRAM, but that does not establish fitted FM-1 RAM.
- The official FM1 Open [linker layout](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/config/linker.ld.in#L16) sets `SDRAM_SIZE = 0`, puts its RAM window around `0x01c00000`–`0x01c7fe00` with reserved regions, and puts executable/read-only material in the `0x02000120` region. It also reclaims seven 4 KB cache ways as RAM. Good teaching distinction: SRAM is temporary working space; flash persists across power loss; a linker decides where code/data live.
- Clipper's maintainer confirms **1 MiB flash** on two device variants: Puya P25Q80 (`0x856014`) and UC25HQ80 (`0xB36014`). [Clipper 1.3.1 release](https://github.com/isod89/clipper-fm1/releases/tag/v1.3.1).
- Community sources report 360 MHz under the stock bootloader versus 320 MHz under some custom bootloaders. Do not put a universal “360 MHz” specification in the hero. If included, label it a community measurement affected by bootloader/configuration, not manufacturer rating.

### Unresolved physical detail

Community [hardware notes](https://github.com/aroum/fm1-custom-fw/blob/main/REVERSE_ENGINEERING.md) identify a QFN-48 device as AC7911B from board photography and discuss SiP flash; the [developers' wiki](https://sbegueria.github.io/fm1-dev-wiki/Hardware-Overview.html) flags disagreements about exact marking, packaging and RAM. We have no manufacturer's FM-1 schematic/BOM or physical unit. Therefore:

- Use **AC791N/WL82 family** as the confident label.
- Do not assert a complete physical pin-number diagram, exact fitted package variant, flash packaging or external RAM capacity.
- Reference JieLi development-board schematics as **reference designs**, never as the FM-1 board schematic.
- Do not imply that every capability of this general-purpose SoC (camera interfaces, Wi-Fi, ADC inputs) is exposed by the FM-1 or enabled by every firmware.

## The panel: contacts → state

Primary source: [app/board/fm1_input.h](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/fm1_input.h#L10).

The source defines 11 scan columns, 41 key/button contacts, and seven encoders. The first 14 contacts become function buttons; the remaining 27 become note bits. Two encoder contacts encode direction through quadrature transitions. Scan data is shifted over SPI2, latched, sampled, then decoded; LEDs share column scheduling. This reduces the GPIO count needed for many controls. Community board work identifies two 74HC595 shift registers, but the tutorial can teach the scanner without depending on an unverified package/pin drawing.

The scanner debounces contacts: it waits for repeated consistent readings before changing the reported state. That matters because real switches bounce mechanically. The source accumulates encoder movement and rejects ambiguous diagonal transitions. A schematic animation can show one selected column at a time, then a decoded key event.

Primary source: [app/board/device.c](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/device.c#L12) documents a 10 kHz input-scan timer. This is one scan tick, **not 10,000 complete keyboard scans per second**. At eleven columns per cycle, a full sweep is about 1.1 ms before debounce. It registers ADC channel 3 for battery (PB1) and channel 4 for master volume (PB6).

Primary source: [app/board/panel.c](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/panel.c#L28) snapshots note bits, button bits and encoder deltas, then reads the analog master/battery. The master pot is sampled into digital control state; do not draw it as a proven analog attenuator in the audio path.

## Screen: framebuffer data → SPI → pixels

Primary sources: [fm1_lcd_hw.h](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/fm1_lcd_hw.h), [lcd.inc](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/lcd.inc), [fm1.h](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/include/fm1.h#L109).

The official driver uses 240×240 pixels, ST7789 initialization, RGB565-format words, SPI1 DMA transfers, chip-select/data-command lines on port C and a backlight line on PA2. Screen work takes time and bus bandwidth; it must not block the time-critical audio task. The API supports bounded bands of at most 240×16 pixels rather than requiring every update to redraw a full screen.

## Audio: samples → DMA → output

Primary source: [app/board/fm1_audio.h](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/fm1_audio.h#L7).

The official open driver identifies WL82 **ALNK0**, a 24-bit stereo link with two DMA halves and **128 frames per interrupt**. The header states there is **no connected analog input**; the RX side supplies timing interrupts. Do not add a microphone/line-in to the hardware map just because a firmware can import or receive samples digitally.

Nominal software sample rate is 44,100 in [fm1_block.h](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/include/fm1_block.h#L5). The board driver uses **44,118** for its hardware deadline calculation. Phrase the main explanation as “about 44.1 kHz” and expose this precise difference in an advanced note. The deadline is approximately `128 / 44118 = 2.9013 ms`, not an end-to-end latency measurement.

A stereo frame has one left and one right sample. Here, 128 frames × 2 channels = 256 `int32_t` words per half; the source carries signed Q23 signal values. “24-bit path” describes the sample format, not a measured 24-bit noise floor or converter performance.

Primary source: [app/board/audio.c](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/app/board/audio.c#L28). The interrupt handler acknowledges the pending event, checks timing, asks the binary engine to render a block, mixes digital external sources, and commits the result only while the target half is still safe to write. It records overruns when work is late. This is a good interactive deadline demo: while DMA consumes A, CPU fills B; roles swap; work that runs too long causes an underrun/glitch risk.

**Converter caveat:** the code supports the digital audio-link path. It does not identify a converter part number or independently settle whether the final DAC is on-chip or separate. [The community audio wiki](https://sbegueria.github.io/fm1-dev-wiki/Audio-Output.html) explicitly documents contradictory descriptions. Label the next box simply “DAC / analog output stage — exact part unverified,” then headphones/speaker. Do not repeat the hub's “PC6 codec reset” assertion as a settled fact; the official header labels PC6 DAC.

## First-arrival / firmware-change guidance

This page should educate, not flash the unit automatically. A useful checklist is:

1. Record the installed firmware version and confirm the untouched unit works with headphones and MIDI.
2. Export any patches/projects/samples before changing firmware; different firmware families use different storage formats.
3. Identify the flash chip and check **the exact release** supports it, especially `0xB36014` on newer units.
4. Keep a known official recovery route and use a stable USB data cable/power supply; follow the chosen project's current installer instructions.
5. Try the firmware's browser preview first, understanding that a source simulator or CPU emulator does not validate every physical-device behavior.

[Clipper 1.3.1](https://github.com/isod89/clipper-fm1/releases/tag/v1.3.1) is a concrete case: older Clipper did not recognize the new chip, so saving and its update loader failed. The maintainer's stated remedy for an already-affected older Clipper is to return to official firmware before installing 1.3.1. Do not generalize this sequence to every firmware.

[M-Flasher 0.10.0 release](https://github.com/jvitkauskas/m-flasher/releases/tag/v0.10.0) says it displays old/new flash IDs and supports backups/restores. Its release notes disclose limited physical testing for some variants. Link to its current usage guide; do not encourage novice users to replace the bootloader merely to learn synthesis.

## Good interactive hardware hotspots

1. **Keys + encoder matrix** — scanned contacts; debounce; software mapping.
2. **Master + battery ADC** — continuous voltage becomes a number.
3. **AC791N / WL82 SoC** — CPU calculates voices; dual-core family; engine and timing matter.
4. **Flash vs SRAM** — persistence vs live state; firmware size/sample buffers compete for capacity.
5. **SPI display** — pixel transfer independent of sound generation.
6. **ALNK + DMA** — stereo frames and repeating block deadline.
7. **Analog output** — numerical samples become voltage; exact converter unverified.
8. **USB / BLE / wired MIDI** — event routes and USB audio depend on firmware; MIDI itself is not sound.

Do not visually pretend these functional blocks have measured PCB locations. An “architecture view” or “functional map” caption is accurate.
