# NNS Reaction Renderer

Turn **Binomial NNS** reaction lines into **PNG images** of chemical-style equations. Species names are drawn as plain text—easy to paste into documents, slides, and reports.

This tool works alongside the [Binomial NNS simulator](https://doi.org/10.1101/2023.08.10.552732). It **only renders** reactions from text; it does **not** run simulations.

## How to run

1. Open [`NNSReactionRenderer.html`](NNSReactionRenderer.html) in a modern browser (double-click is fine for daily use).
2. Edit reaction lines in the text area; the canvas preview updates automatically after a short pause, or click **Render** for an immediate refresh.
3. Click **Export PNG** to download `reaction.png`.

**Standalone HTML for clients:** open **Dev tools** → **Export standalone HTML for clients**. When the page was opened from disk (`file://`), the browser will ask you to pick the project folder (the one containing `css/` and `js/`). The result is `NNSReactionRenderer-standalone.html`—a single file clients can double-click with no install or server. If you serve the app over HTTP (for example `npx serve .`), the export can fetch assets without that folder picker.

## User interface

The app is a single-page layout: a **left toolbar**, a **main editor and preview**, and optional **detail side panels** that slide in from the right.

### Left toolbar

Primary actions and toggles live in the left sidebar:

| Control | Purpose |
|--------|---------|
| **Render** | Redraw the preview immediately |
| **Export PNG** | Save the current canvas as PNG (re-renders first if the preview is out of date) |
| **Reset Example** | Restore the built-in demo text |
| **Show equation numbers** | Toggle reaction IDs on the right of each equation |
| **Comment align** | Left vs. centered comment lines |
| **Align equation arrows** | In multiline mode, align `→` across rows |
| **Left side stick to arrow** | With arrow alignment on, pull reactants toward the arrow (multiline only) |
| **Special reaction edge cases** | Enable experimental parsers for `r1_+`, `r1_-`, `r+-=` (correctness not fully verified) |
| **Color customization** | Opens the color panel (coefficients, comments, equation numbers) |
| **Dev tools** | Opens developer options (see below) |
| **PNG typography** | Font family and size per text role |
| **Load nested TXT** | Pick multiple related `.txt` files and choose the main file |

Below the buttons: **preview status** (`Up to date` / `Out of date`) and an **error** area for parse or load failures.

A short hint under the alignment toggles notes that **Align equation arrows** and **Left side stick to arrow** apply only when **Multiline** is on (multiline is configured in Dev tools).

### Main area

- **Intro line** — format reminder and how nested TXT loading works.
- **Editor** — line-numbered textarea for reaction lines and `#` comments.
- **Preview** — sticky canvas showing the rendered equation(s).

### Detail side panels

Click a toolbar button to open the matching panel; click again, press **Escape**, or click the backdrop to close.

- **Color customization** — color pickers for coefficients, comments, and equation numbers; **Reset Dev Colors**.
- **Dev tools** — **Export standalone HTML for clients**; **Load Reaction TXT** (single file, `*Reaction` section only); **Multiline**; **Handle rM 3-line format**.
- **Load nested TXT** — after selecting files, choose the **main** TXT (the parent that references others but is not referenced back) and **Load selected main file**.
- **PNG typography** — per-role font and size (journal presets include Times New Roman, Arial, Helvetica); **Reset typography defaults**.

## Features

### Parsing and rendering

- **Standard NNS lines** — comma-separated rows such as `r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+` (`r{reactants}_{products}`).
- **Comments** — lines starting with `#` render as text only (not parsed as equations, not numbered).
- **Multiline** — one PNG with many reactions stacked (default **On** in Dev tools).
- **`rM` blocks** — three-line reactions (header, rate line, products); toggle **Handle rM 3-line format** in Dev tools.
- **Special reaction edge cases** — optional support for `r1_+`, `r1_-`, `r+-=`; turning this on can inject demo lines into the editor.
- **Layout options** — equation numbers, comment alignment, aligned arrows, left-side stick (multiline), custom colors, PNG typography.

Species are rendered as normal text, not LaTeX.

### File input

- **Load Reaction TXT** (Dev tools) — one `.txt` file; extracts the `*Reaction` section into the editor.
- **Load nested TXT** (toolbar) — select **all** related `.txt` files (for example everything in [`InputExample/`](InputExample/)), pick the main file, then load. Missing referenced files produce a warning but partial content still loads.

Example nested sets live under [`InputExample/`](InputExample/) (`Set_401.txt`, `Set01_401.txt`, `Set02_401.txt`, etc.).

### Export

- **Export PNG** — downloads the current canvas.
- **Export standalone HTML** — bundles CSS/JS into one file for distribution.

## Reaction line format (brief)

Each equation line is comma-separated, as in NNS `*Reaction` sections. The reaction type token (`r2_2`, `r1_1`, …) sets reactant and product counts; the renderer shows coefficients, species, rate, and products.

Example:

```text
r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+
```

Two reactants (`COONa`, `Cu2+`), rate `k1`, two products (`COOCu+`, `Na+`).

Lines starting with `#` are comments only.

For the full NNS input format, see [doi:10.1101/2023.08.10.552732](https://doi.org/10.1101/2023.08.10.552732).

## Project layout

| Path | Role |
|------|------|
| `NNSReactionRenderer.html` | Entry page |
| `css/nns-reaction-renderer.css` | Styles |
| `js/config.js` | Defaults and feature flags |
| `js/parse-reaction.js` | Line parsers |
| `js/canvas-render.js` | Drawing |
| `js/nns-file-io.js` | TXT / nested file loading |
| `js/sidebar-ui.js` | Side panel behavior |
| `js/bundle-export.js` | Standalone HTML export |
| `js/app.js` | UI wiring and render loop |
| `InputExample/` | Sample nested NNS text files |

## Release notes

### Release: **v1.0.0**

**Rationale ([SemVer](https://semver.org/)):** This is the **first tagged, production-ready release**. There is no prior public version or git tag. Per SemVer, **1.0.0** denotes the initial stable API/feature set—not a minor bump over an earlier 1.0.x line. Future **MINOR** releases add backward-compatible features; **PATCH** releases are bug fixes; **MAJOR** releases indicate incompatible changes.

**Suggested GitHub release title:** `v1.0.0 — First stable release of NNS Reaction Renderer`

**Suggested tag:** `v1.0.0`

**Suggested changelog (for GitHub release body):**

- **Core purpose** — Render Binomial NNS reaction lines as PNG equation images (plain-text species, no LaTeX); companion to the [Binomial NNS simulator](https://doi.org/10.1101/2023.08.10.552732), render-only (no simulation).
- **UI** — Left toolbar for Render, Export PNG, Reset, equation numbers, comment alignment, multiline arrow alignment, left-side stick, special-case toggles, color customization, Dev tools, PNG typography, and nested TXT load; detail side panels for colors, dev options, nested file picker, and typography.
- **Parsing and rendering** — Standard NNS comma-separated lines, `#` comments, multiline stacked PNG, `rM` three-line blocks, optional special reaction edge cases (`r1_+`, `r1_-`, `r+-=`), layout and typography options.
- **File I/O** — Single-file `*Reaction` TXT load (Dev tools); nested multi-file TXT with main-file selection (toolbar).
- **Standalone export** — Bundle CSS/JS into one HTML file for client distribution (Dev tools).
- **Static, zero-dependency app** — Open `NNSReactionRenderer.html` in a browser; no install, build step, or server required for daily use.

### Version history

| Version | Notes |
|---------|--------|
| **v1.0.0** | First stable public release: full renderer, toolbar UI, file I/O, standalone export, and documentation. |

## Authors

**NNS Reaction Renderer** — Copyright (c) 2026 [pham-tronglam-zcdev](https://github.com/pham-tronglam-zcdev)

**Binomial NNS (original simulator)** — Takashi Sato, Complex Reaction System Laboratory

## License

[MIT License](LICENSE)
