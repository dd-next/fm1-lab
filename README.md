# FM-1 Lab

**From silicon to sound.** An independent English-language field guide to the M-VAVE / Cuvave FM-1, for programmers discovering embedded audio.

**[Open the interactive guide](https://dd-next.github.io/fm1-lab/)**

Explore an illustrated signal atlas, a six-operator routing explorer, a real Web Audio synthesis lab, a visual firmware build map, seven firmware comparisons, and a first-experiment checklist.

The atlas follows four actions—playing a key, receiving USB MIDI, turning an encoder and loading a saved project—with step/play controls, moving connections and source-linked component notes. The operator explorer shows four verified algorithms from the public web engine. Its waveform sketches explain roles; the separate audio lab is the playable two-operator model.

## Run locally

No dependencies, bundler, account or API key are required. Use an HTTP server so browser ES modules can load:

```sh
npm run dev
# http://localhost:3000
```

Or run `python3 -m http.server 3000` in this folder. Validate JavaScript, local assets and anchor targets with `npm run check` (Node.js 20+).

## How it is organized

| File | Responsibility |
| --- | --- |
| `index.html` | Learning progression, synthesis primer, developer path and references |
| `assets/app.js` | Navigation, note trace, rendering-budget example, search and local progress |
| `assets/hardware.js` | Evidence-backed component explorer |
| `assets/signal-atlas.js` | Illustrated components, four causal scenarios and step/play transport |
| `assets/operator-explorer.js` | Six-operator graphs, evaluation order and qualitative waveform sketches |
| `assets/build-map.js` | Shared application, native SDK and public WebAssembly build paths |
| `assets/readability.css` | Larger reading and control typography throughout the guide |
| `assets/code-explorer.js` | Annotated reading routes with pinned upstream source links |
| `assets/firmwares.js` | Dated comparison data and goal filters |
| `assets/sound-lab.js` | Original two-operator browser teaching instrument |
| `docs/research.html` | Research provenance and verification limits |
| `docs/sources/` | Detailed research notes |

## Evidence and scope

Research checked **18 November 2026**. The official FM1 Open V14 code walkthrough is pinned to `4c7496daac04a95ff10d1afdcc8f9ead2dbabc41`. Community firmware entries link to their inspected revisions and release notes.

- Stock V16 and FM1 Open V14 have independent version histories.
- FM1 Open's application is public; its native engine is a binary SDK. Its public browser DSP is not proof of identical native implementation.
- The functional hardware map is not a PCB schematic. Unverified physical details remain explicit.
- The original browser sound lab is educational, not an FM-1 emulator or a recording of the instrument.
- No physical FM-1 was available for verification. This website does not flash or connect to a device.
- Firmware compatibility changes. Read the destination release's instructions and confirm the exact hardware before installing.

Progress and checklists use browser-local storage. Audio starts only after interaction and stops when the page is hidden. The site has no analytics, backend or runtime API calls. Fonts are loaded from Google Fonts with system fallbacks.

## Publishing

GitHub Pages serves `main` from the repository root. `.nojekyll` disables Jekyll processing. All site paths are relative, so project Pages URLs work without a build step. Update Settings → Pages → Deploy from a branch → `main` / `(root)` when setting up a fork.

## Attribution and licenses

Original website code and prose: **MIT**, see [LICENSE](LICENSE). This does not relicense any linked firmware, third-party source or product imagery.

The product photo is M-VAVE / Cuvave's official FM-1 image, sourced from [cuvave.com/images/products/fm-1.webp](https://www.cuvave.com/images/products/fm-1.webp), used for identification and education. It is excluded from this repository's MIT grant; rights remain with its owner.

The code explorer uses original educational pseudocode and links to upstream code. It does not redistribute the proprietary SDK or firmware packages. Firmware licenses and asset exceptions are documented individually in the comparison.

Not affiliated with or endorsed by M-VAVE / Cuvave. Corrections are welcome through GitHub issues or a pull request with a primary source.
