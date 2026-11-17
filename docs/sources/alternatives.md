# FM-1 alternatives — verified source snapshot

Research date: 17 November 2026. Read the canonical repositories and release notes directly; search indexes and aggregator tables were materially stale. This is a teaching comparison, not a universal installation recommendation. Hardware was not available for this research.

## The architectural distinction

Custom firmware can replace the application, synthesis engines, sequencing model, hardware abstraction, storage layout, update loader and USB identity. It is not just a new preset bank. A shared Felucca ancestor does not make files or flash layouts interchangeable. A software test or signed build provenance is also different from a test on a real FM-1.

## Six useful projects

| Project | Verified snapshot | Main reason to study it | Architecture / musical workflow | Qualification |
| --- | --- | --- | --- | --- |
| Felucca | Stable 1.8.2; main `ca1db43a78455ae747766a2738f8580380d40bc1` | Broad synthesis platform with separated engine and board layers | Four flexible parts share an eight-voice budget; drums can be an engine on any part. Six engines are in a separate MIT submodule; board support is an MPL-2.0 submodule. The combined firmware is GPL-3.0-only. | The current code differs from older summaries describing three synth tracks plus a separate six-voice drum track. Use current `core.h`, not that inherited description. |
| SLOOP | 2.8.5; `bac9c05ea7627449405aa10e48da21d75b6c8c56` | Playing a complete groove live | Felucca-derived four-track groovebox: three synth parts and a dedicated drum machine; parameter locks, microtiming, song sections and momentary punch effects. Its README describes 12 synthesis engines. | README still calls it beta although GitHub's release metadata is not marked prerelease. |
| Clipper | 1.3.1; `7bc15a950a8b3fd51aec280514905448e4faaf1b` | Deep patch programming | SLOOP-derived synthesizer, with 23 engines and one instrument or two in MULTI. No groovebox track arrangement or drum-machine workflow. HYBRID combines three oscillators, two filters and a matrix; FMX exposes six-operator routing with multiple operator modes. | The maintainer reports it runs on hardware, while explicitly leaving dense CPU loads, high voice counts and power-cut persistence for more testing. |
| Melodee | Stable 1.6.1; `165d177a425944f3d30b0b669255a6ed0050c3a5` | Composition and vintage-style engines | Felucca 1.0-derived; four internal synth/MIDI parts plus four MIDI-only parts, longer songs and shared effects. Main engines include Prophet, FM6, CZ-1 and SID; the sequencing and patch formats have diverged significantly. | 1.6.1 clock output and Song Position were tested with models but not yet with a real external follower, per its release notes. Older versions cannot read 1.6 storage/backups. |
| Dinghy | 0.5; `ea1b6bf5973b11f9b4b806d08155602aaa0b505e` | First embedded-audio code change | Minimal four-voice sine instrument. `firmware/src/dinghy.c` holds the application; `platform.c` handles audio interrupts, USB, MIDI, panel, storage and updates. Host mode renders WAV audio and screen images. | Its documentation distinguishes direct Dinghy 0.3 hardware tests from later platform tests in related firmware. Do not turn those into a blanket guarantee for every 0.5 behavior. |
| sloopDX | 4.0.1 release; `8c1035b79d860edcb6f23556910206332669dac8` | Compare a focused FM engine with a general groovebox | SLOOP workflow with Dexed/msfa-derived six-operator FM for melodic parts and programmable FM drums. Other synthesis and sampled engines removed. | README explicitly says 3.5 was played on a real unit while 4.0's two-core changes had not been tested on hardware. Included as an optional deeper-reading link, not the beginner's default choice. |

All six main firmware codebases above declare GPL-3.0-only. Bundled DSP, fonts, samples, SDK files and submodules retain separate terms; link the selected version's licensing file rather than copying the license claim from another fork. Clipper's retained licensing document still contains older asset language, which is another reason not to redistribute its assets casually.

## Primary links

### Felucca

- [Pinned README](https://github.com/hugelton/Felucca/blob/ca1db43a78455ae747766a2738f8580380d40bc1/README.md)
- [Four parts / eight shared voices in core.h](https://github.com/hugelton/Felucca/blob/ca1db43a78455ae747766a2738f8580380d40bc1/firmware/src/core.h#L3-L11)
- [Build guide: clone both submodules](https://github.com/hugelton/Felucca/blob/ca1db43a78455ae747766a2738f8580380d40bc1/BUILDING.md)
- [Licensing boundaries](https://github.com/hugelton/Felucca/blob/ca1db43a78455ae747766a2738f8580380d40bc1/LICENSING.md)
- [1.8.2 release, 13 Nov 2026](https://github.com/hugelton/Felucca/releases/tag/v1.8.2)
- [Browser demo](https://hugelton.github.io/Felucca/webapp/try/)

### SLOOP

- [Pinned README, including restoration](https://github.com/isod89/sloop-fm1/blob/bac9c05ea7627449405aa10e48da21d75b6c8c56/README.md)
- [2.8.5 release, 4 Nov 2026](https://github.com/isod89/sloop-fm1/releases/tag/v2.8.5)
- [Web editor](https://isod89.github.io/sloop-fm1/webapp/editor/)

### Clipper

- [Pinned README](https://github.com/isod89/clipper-fm1/blob/7bc15a950a8b3fd51aec280514905448e4faaf1b/README.md)
- [1.3.1 flash compatibility and restoration notes, 4 Nov 2026](https://github.com/isod89/clipper-fm1/releases/tag/v1.3.1)
- [Pinned licensing](https://github.com/isod89/clipper-fm1/blob/7bc15a950a8b3fd51aec280514905448e4faaf1b/LICENSING.md)

### Melodee

- [Canonical pinned README](https://github.com/keremimo/melodee/blob/165d177a425944f3d30b0b669255a6ed0050c3a5/README.md)
- [1.6.1 release and test limitations, 2 Nov 2026](https://github.com/keremimo/melodee/releases/tag/v1.6.1)
- [1.6 storage migration and hardware-validation limits](https://github.com/keremimo/melodee/blob/165d177a425944f3d30b0b669255a6ed0050c3a5/docs/RELEASE_1.6.0.md)
- [Build and recovery](https://github.com/keremimo/melodee/blob/165d177a425944f3d30b0b669255a6ed0050c3a5/BUILDING.md)

### Dinghy

- [Pinned README and build steps](https://github.com/zvenson/dinghy/blob/ea1b6bf5973b11f9b4b806d08155602aaa0b505e/README.md)
- [Application: phase accumulator, amplitude ramp, voice allocation](https://github.com/zvenson/dinghy/blob/ea1b6bf5973b11f9b4b806d08155602aaa0b505e/firmware/src/dinghy.c)
- [0.5 release, 7 Nov 2026](https://github.com/zvenson/dinghy/releases/tag/v0.5)

### sloopDX

- [Pinned README and hardware status](https://github.com/zvenson/dxsloop/blob/8c1035b79d860edcb6f23556910206332669dac8/README.md)
- [4.0.1 release, 3 Nov 2026](https://github.com/zvenson/dxsloop/releases/tag/v4.0.1)

## The recently changed flash chip

Some newer FM-1 units have a UC25HQ80 flash chip, JEDEC ID `0xB36014`, instead of Puya `0x856014`. Clipper 1.3.1 release notes say both parts are 1 MiB and use the same SPI NOR commands. Firmware that only accepts the older ID can reject storage and update operations. A loader can reject a newer corrected application too, because the old loader still performs that check.

Verified version-specific fixes: Felucca 1.8.2 (release says tested on the new chip), SLOOP 2.8.5, Clipper 1.3.1 and Dinghy 0.5. Melodee's README credits a UC25HQ80 contribution, but I have not pinned the exact earliest release or full test coverage: do not label all Melodee releases compatible from that alone.

This is relevant to a device that has not arrived: do not infer its chip from the model name, seller or shipment date. Read the exact release's compatibility procedure once the unit is available.

## There is no single universal rollback recipe

- Current Felucca installer offers official V15 or V16. For a new-chip unit already stuck on Felucca 1.8.1 or earlier, 1.8.2 notes specify entering the chip's update mode, restoring V15, then installing 1.8.2. The cited release is the authority for the key combination.
- SLOOP's current README says back up in its editor, then use M-VAVE M-UPGRADE with V16; it gives Clipper's return-to-official page as a fallback when M-UPGRADE does not list SLOOP's USB identity.
- Clipper 1.3.1 notes say old Clipper on the new flash may refuse the update; restore official firmware first, then install 1.3.1.
- Melodee's current README recommends TransitFM1 0.1.3 as the intermediate step for switching custom firmware, while separately retaining official V15 restoration. This must not be generalized to every firmware or replaced with old directory advice.

The teaching site should link these procedures rather than implement a flasher. Backups, exact model/build compatibility, stable power and the correct package remain prerequisites. A browser emulator tests app logic; it cannot validate a hardware flash controller, USB timing or an interrupted boot-sector write.

## Good code-learning route

Start with Dinghy's `app_audio()`: a phase increment encodes frequency, integer sine approximation produces amplitude, a ramp prevents abrupt note edges, and samples are accumulated into interleaved left/right frames. Then inspect its main-loop note allocation separately from its interrupt callback. Move to official FM1 Open for the documented application/SDK boundary, and Felucca for an open synthesis-engine implementation with real voice and CPU budgets. Do the first modifications in host or browser mode before considering a hardware package.
