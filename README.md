# NNS Reaction Renderer

A browser-based tool that turns **Binomial NNS** reaction lines (from `*Reaction` sections in NNS input `.txt` files) into **PNG images** of chemical-style equations. Species names are drawn as plain text on an HTML5 canvas—no LaTeX, no build step, and no server required.

The entire app ships as one self-contained HTML file. Open it locally, edit reaction text, preview on a live canvas, and export a PNG.

This project complements the [Binomial NNS simulator](https://doi.org/10.1101/2023.08.10.552732) (Natural Number Simulation for complex reaction systems) by making reaction definitions easier to read in documents, slides, and reports.

## Features

- **Single-file deployment** — all UI, parsing, and rendering logic in [`NNSReactionRenderer.html`](NNSReactionRenderer.html)
- **Live canvas preview** with debounced auto-render (500 ms) as you edit
- **Preview status indicator** — shows whether the canvas matches the current editor text
- **Multiline mode** — render many reactions in one image, or first reaction only
- **Standard reaction types** — `r1_0` … `r3_3` (CSV-style lines from NNS input files)
- **`rM` three-line blocks** — header, rate, and product lines
- **Comment lines** — lines starting with `#` are shown as text (not parsed as reactions)
- **Load from NNS `.txt`** — extracts only the `*Reaction` section (Dev panel)
- **Nested TXT resolution** — follows `*Set_*` references across multiple files in one load
- **Export PNG** — download the current preview as `reaction.png`
- **Layout and styling** — equation numbers, aligned arrows, left-side stick-to-arrow, comment alignment, coefficient/comment/number colors

## Quick start

1. Clone or download this repository.
2. Open [`NNSReactionRenderer.html`](NNSReactionRenderer.html) in a modern browser (Chrome, Firefox, Edge, Safari).
3. Edit reaction lines in the text area, or use **Load TXT** to import from an NNS input file.
4. Click **Render** (or wait for auto-render) and **Export PNG** when satisfied.

No `npm install`, bundler, or local server is needed.

## Project structure

| Path | Role |
| --- | --- |
| [`NNSReactionRenderer.html`](NNSReactionRenderer.html) | Complete app: styles, editor, canvas renderer, parsers, file loaders |
| [`LICENSE`](LICENSE) | MIT License |
| [`.gitattributes`](.gitattributes) | Line-ending normalization for text files |

### Inside the HTML file

Logic is grouped in inline `<script>` blocks (no separate modules):

| Area | Responsibility |
| --- | --- |
| `appState` | User toggles, colors, and default sample input |
| `featureFlags` | Compile-time-style switches for optional capabilities |
| `parseReaction` / `parseRmReactionBlock` | Parse `rN_M` lines and `rM` three-line blocks |
| `parseSpecialReaction` | Experimental `r1_+`, `r1_-`, `r+-=` types |
| `classifyReactionInputLines` | Split comments, single lines, and `rM` blocks |
| `extractReactionSectionLines` | Read `*Reaction` from a full NNS `.txt` |
| `collectReactionLinesWithNested` | Resolve `*Set_*` nested `.txt` references |
| Canvas drawing helpers | Layout, arrows, multiline alignment, PNG export |

## Reaction line format

Each non-comment line follows the **NNS `*Reaction` CSV format** used by Binomial. The reaction ID (second field) is skipped for display; stoichiometric coefficients and species names are shown on the canvas.

**Example (`r2_2`):**

```text
r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+
```

Meaning: type `r2_2`, ID `100`, reactants `1 COONa + 1 Cu2+`, rate `k1`, products `1 COOCu+ + 1 Na+`.

The type prefix `rN_M` means *N* reactant pairs and *M* product pairs (`r2_2` → two reactants, two products).

**`rM` block (three lines):**

```text
rM,   120, 1, A, 1, B, 1, C
      1e6
      1, X, 1, Y
```

Enable **Handle rM 3-line format** in the Dev panel (on by default).

**Comments:** lines starting with `#` are rendered as annotations, not as reactions. When loading nested files, file markers such as `# [FILE] Set_401.txt` are inserted automatically.

**Special types** (`r1_+`, `r1_-`, `r+-=`): experimental; enable **Special reaction edge cases** in Dev mode. Correctness is not fully verified.

For the full NNS input specification (`*Time`, `*Element`, `*Reaction`, `*Plot`, etc.), see Takashi Sato’s paper: [doi:10.1101/2023.08.10.552732](https://doi.org/10.1101/2023.08.10.552732).

## Loading NNS input files

### Single file

1. Open **Dev Only** → **Load Reaction TXT**.
2. Choose a `.txt` file that contains a `*Reaction` section.
3. Only reaction lines from that section are loaded into the editor (blank lines, `#` comments, and `**` lines in the section are skipped).

### Nested files (`*Set_*`)

Some models split reactions across files referenced from `*Set_*` sections.

1. Click **Load TXT (handle also the case of pointing to other TXT files)**.
2. Select **all** related `.txt` files in one dialog (main file plus every referenced child).
3. Pick the **main** file from the dropdown—the one that references others but is not referenced itself.
4. Click **Load selected main file**. Reaction lines from the main file and nested references are merged. Missing references produce a warning but partial content still loads.

Nested resolution walks references up to depth 12 and avoids revisiting the same file name twice.

## UI overview

### Main toolbar

| Control | Description |
| --- | --- |
| **Render** | Refresh preview immediately |
| **Export PNG** | Save canvas as `reaction.png` (re-renders first if preview is out of date) |
| **Reset Example** | Restore built-in demo lines |
| **Show equation numbers** | Display reaction IDs on the right |
| **Comment align** | Left or center alignment for `#` comment lines |
| **Color customization** | Toggle panel for coefficient, comment, and equation-number colors |
| **Load TXT (nested)** | Multi-file import with `*Set_*` resolution |

### Dev panel (Dev Only)

| Control | Description |
| --- | --- |
| **Load Reaction TXT** | Single-file `*Reaction` import |
| **Multiline** | Render all lines vs. first reaction only |
| **Handle rM 3-line format** | Parse `rM` header / rate / product blocks |
| **Align equation arrows** | Align `→` across rows (multiline only) |
| **Left side stick to arrow** | Requires aligned arrows; pins reactants near the arrow |
| **Special reaction edge cases** | Enable `r1_+`, `r1_-`, `r+-=` parsing (adds demo lines when turned on) |

## Authors

**NNS Reaction Renderer (this repository)**  
Copyright (c) 2026 [pham-tronglam-zcdev](https://github.com/pham-tronglam-zcdev)

**Original NNS simulation (Binomial)**  
Takashi Sato — Complex Reaction System Laboratory  
Copyright (c) 2022– Takashi Sato

Reaction line syntax and simulator behavior are defined by the upstream Binomial NNS project. This renderer only visualizes `*Reaction` text; it does not run simulations.

## License

This project is licensed under the [MIT License](LICENSE).

The upstream **Binomial NNS** simulator is also released under the [MIT License](https://opensource.org/licenses/mit-license.php).
