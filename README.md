# NNS Reaction Renderer

A browser-based tool that turns **Binomial NNS** reaction lines (from `*Reaction` sections in NNS input `.txt` files) into **PNG images** of chemical-style equations. Species names are drawn as plain text on an HTML5 canvas—no LaTeX, no build step, and no server required.

This project complements the [Binomial NNS simulator](https://doi.org/10.1101/2023.08.10.552732) (Natural Number Simulation for complex reaction systems) by making reaction definitions easier to read in documents, slides, and reports.

## Features

- **Live canvas preview** with debounced auto-render as you edit
- **Multiline mode** — render many reactions in one image
- **Standard reaction types** — `r1_0` … `r3_3` (CSV-style lines from NNS input files)
- **`rM` three-line blocks** — header, rate, and product lines
- **Comment lines** — lines starting with `#` are shown as text (not parsed as reactions)
- **Load from NNS `.txt`** — extracts only the `*Reaction` section
- **Nested TXT resolution** — follows `*Set_*` references across multiple files (see `InputExample/`)
- **Export PNG** — download the current preview as `reaction.png`
- **Optional layout tools** — aligned arrows, equation numbers, coefficient/comment colors (Dev panel)

## Quick start

1. Clone or download this repository.
2. Open [`reaction_renderer_v1.1.html`](reaction_renderer_v1.1.html) in a modern browser (Chrome, Firefox, Edge, Safari).
3. Edit reaction lines in the text area, or use **Load Reaction TXT** / **Load TXT** (nested) to import from an NNS input file.
4. Click **Render** (or wait for auto-render) and **Export PNG** when satisfied.

No `npm install`, bundler, or local server is needed.

## Project structure

| Path | Role |
|------|------|
| [`reaction_renderer_v1.1.html`](reaction_renderer_v1.1.html) | Main UI (editor, controls, canvas) |
| [`js/main.js`](js/main.js) | UI wiring, render/export, file loading |
| [`js/canvas-renderer.js`](js/canvas-renderer.js) | Canvas layout and drawing |
| [`js/reaction-parser.js`](js/reaction-parser.js) | Parser for `rN_M` reaction lines |
| [`js/reaction-parser-rm-block.js`](js/reaction-parser-rm-block.js) | Parser for `rM` three-line blocks |
| [`js/reaction-parser-dispatch.js`](js/reaction-parser-dispatch.js) | Chooses parser per line/block |
| [`js/reaction-section.js`](js/reaction-section.js) | Extracts `*Reaction` from full NNS `.txt` |
| [`js/nested-txt-resolver.js`](js/nested-txt-resolver.js) | Resolves `*Set_*` nested file references |
| [`js/app-state.js`](js/app-state.js) | User toggles and default sample input |
| [`js/feature-flags.js`](js/feature-flags.js) | Feature switches |
| [`InputExample/`](InputExample/) | Sample NNS inputs with nested `*Set_*` files |
| [`SyntaxInfo.txt`](SyntaxInfo.txt) | Upstream NNS / Binomial format reference (v0.16) |

## Reaction line format

Each non-comment line follows the **NNS `*Reaction` CSV format** used by Binomial. The reaction ID (second field) is skipped for display; stoichiometric coefficients and species names are shown on the canvas.

**Example (`r2_2`):**

```text
r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+
```

Meaning: type `r2_2`, ID `100`, reactants `1 COONa + 1 Cu2+`, rate `k1`, products `1 COOCu+ + 1 Na+`.

**`rM` block (three lines):**

```text
rM,   120, 1, A, 1, B, 1, C
      1e6
      1, X, 1, Y
```

Enable **Handle rM 3-line format** in the Dev panel (on by default).

**Comments:** lines starting with `#` are rendered as annotations, not as reactions.

**Special types** (`r1_+`, `r1_-`, `r+-=`): experimental; enable **Special reaction edge cases** in Dev mode. Correctness is not fully verified.

For the full NNS input specification (`*Time`, `*Element`, `*Reaction`, `*Plot`, etc.), see [`SyntaxInfo.txt`](SyntaxInfo.txt) and Takashi Sato’s paper: [doi:10.1101/2023.08.10.552732](https://doi.org/10.1101/2023.08.10.552732).

## Loading NNS input files

### Single file

1. Open **Dev Only** → **Load Reaction TXT**.
2. Choose a `.txt` file that contains a `*Reaction` section.
3. Only reaction lines from that section are loaded into the editor.

### Nested files (`*Set_*`)

Some models split reactions across files referenced from `*Set_*` sections (see `InputExample/Set_401.txt`).

1. Click **Load TXT (handle also the case of pointing to other TXT files)**.
2. Select **all** related `.txt` files in one dialog (main + children).
3. Pick the **main** file (the one that references others but is not referenced itself).
4. Click **Load selected main file**. Reaction lines from the main file and nested references are merged.

## UI overview

| Control | Description |
|---------|-------------|
| **Render** | Refresh preview immediately |
| **Export PNG** | Save canvas as `reaction.png` |
| **Reset Example** | Restore built-in demo lines |
| **Multiline** | Render all lines vs. first reaction only |
| **Show equation numbers** | Display reaction IDs on the right |
| **Align equation arrows** | Align `→` across rows (multiline) |
| **Color customization** | Coefficient, comment, and equation-number colors |

## Authors

**NNS Reaction Renderer (this repository)**  
Copyright (c) 2026 [pham-tronglam-zcdev](https://github.com/pham-tronglam-zcdev)

**Original NNS simulation (Binomial)**  
Takashi Sato — Complex Reaction System Laboratory  
Copyright (c) 2022– Takashi Sato

Reaction line syntax and simulator behavior are defined by the upstream Binomial NNS project. This renderer only visualizes `*Reaction` text; it does not run simulations.

## License

This project is licensed under the [MIT License](LICENSE).

The upstream **Binomial NNS** simulator (v0.16) is also released under the [MIT License](https://opensource.org/licenses/mit-license.php). See [`SyntaxInfo.txt`](SyntaxInfo.txt) for the upstream README and format documentation.
