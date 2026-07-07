# NNS Reaction Renderer

**Version 1.1.0**

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
| **Reset Example** | Restore the built-in demo text (all reaction types; see [Examples](#examples)) |
| **Show equation numbers** | Toggle reaction IDs on the right of each equation |
| **Comment align** | Left vs. centered comment lines |
| **Align equation arrows** | In multiline mode, align `→` across rows |
| **Left side stick to arrow** | With arrow alignment on, pull reactants toward the arrow (multiline only) |
| **Color customization** | Opens the color panel (coefficients, comments, equation numbers) |
| **Dev tools** | Standalone HTML export only |
| **PNG typography** | Font family and size per text role |
| **Load nested TXT** | Pick multiple related `.txt` files and choose the main file |

Below the buttons: **preview status** (`Up to date` / `Out of date`) and an **error** area for parse or load failures.

Multiline rendering and `rM` / `rC` / `rA` / `rT` three-line blocks are **on by default** (no toggle required). Special reaction types (`r1_+`, `r1_-`, `r+-=`) are always enabled.

### Main area

- **Intro line** — format reminder and how nested TXT loading works.
- **Editor** — line-numbered textarea for reaction lines and `#` comments.
- **Preview** — sticky canvas showing the rendered equation(s).

### Detail side panels

Click a toolbar button to open the matching panel; click again, press **Escape**, or click the backdrop to close.

- **Color customization** — color pickers for coefficients, comments, and equation numbers; **Reset Dev Colors**.
- **Dev tools** — **Export standalone HTML for clients** (and export hint text).
- **Load nested TXT** — after selecting files, choose the **main** TXT (the parent that references others but is not referenced back) and **Load selected main file**.
- **PNG typography** — per-role font and size (journal presets include Times New Roman, Arial, Helvetica); **Reset typography defaults**.

## Features

### Parsing and rendering

- **Standard NNS lines** — single-line `r{n}_{m}` reactions from `*Reaction` sections.
- **Comments** — lines starting with `#` render as text only (not parsed as equations, not numbered).
- **Multiline** — one PNG with many reactions stacked (default on).
- **`rM` blocks** — three-line reactions (header, rate line, products).
- **`rC` / `rA` / `rT` blocks** — three-line reactions from `*ReactionRateChange` (time-dependent or temperature-dependent rates).
- **Caloric / transfer** — `r+-=` instantaneous combination; standard lines may include `CALORIC_*` species.
- **Special reactions** — `r1_+`, `r1_-`, `r+-=` (always on).
- **Layout options** — equation numbers, comment alignment, aligned arrows, left-side stick (multiline), custom colors, PNG typography.

Species and rate labels use **plain canvas text** (not LaTeX). Rate-change types show **symbolic** arrow labels (see [Arrow labels](#arrow-labels-on-the-png)).

### File input

- **Load nested TXT** (toolbar) — select **all** related `.txt` files, pick the main file, then load. The loader merges `*Reaction` and `*ReactionRateChange` sections from the main file and nested references. Missing referenced files produce a warning but partial content still loads.

Example files:

| File | Contents |
|------|----------|
| [`InputExample/caloric_temp_013_02.txt`](InputExample/caloric_temp_013_02.txt) | Caloric elements, `r+-=`, `rA`, `rC`, `rT` |
| [`InputExample/Set_401.txt`](InputExample/Set_401.txt) | Nested set parent |
| [`InputExample/Set01_401.txt`](InputExample/Set01_401.txt), [`Set02_401.txt`](InputExample/Set02_401.txt) | Nested children |

Spec references in the repo: `NNS_ReactionRateChange_Spec_v2.txt`, `NNS_Reaction_Display_Design.txt`.

### Export

- **Export PNG** — downloads the current canvas.
- **Export standalone HTML** — bundles CSS/JS into one file for distribution.

---

## Reaction formats

All fields are **comma-separated**. Whitespace around commas is ignored. Lines starting with `**` in NNS input files are comments and are skipped when loading from TXT.

### Comments (editor / PNG)

```text
# Any line starting with # is a comment — rendered as text, not parsed as an equation.
```

### Standard reaction (`*Reaction`)

**Format (one line):**

```text
<type>, <sort_key>, <coeff>, <reactant>, ..., <rate>, <coeff>, <product>, ...
```

- **type** — `r{reactants}_{products}` (e.g. `r2_2`, `r1_1`, `r3_1`).
- **sort_key** — integer ordering hint (not shown on PNG).
- **coeff / species** — alternating pairs on left (reactants), then **rate**, then pairs on right (products).

**Arrow label:** the rate value as written (e.g. `k1`, `1e5`).

**Example:**

```text
r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+
```

Two reactants, rate `k1`, two products.

**Exothermic example (produces caloric):**

```text
r2_2, 10, 1e8, A, 1e7, B, 1e5, 1, C, 1e10, CALORIC_01
```

### `rM` — multi-line rate (three lines)

**Line 1 — header:** `rM, <sort_key>, <coeff>, <reactant>, ...` (all reactants; no fixed `r{n}_{m}` count).

**Line 2 — rate:** single value.

**Line 3 — products:** `<coeff>, <species>, ...`

**Example:**

```text
rM, 120::, 1, l::, 1, m::, 1, n::, 1, en_Y::
1e6
1, q::, 1, en_Y::
```

**Arrow label:** numeric rate from line 2 (e.g. `1e6`).

### `r+-=` — caloric transfer / combination (one line)

**Format:**

```text
r+-=, <sort_key>, <coeff>, <species>, ..., [=], <coeff>, <species>, ...
```

The `=` token may appear explicitly between reactant and product pairs, or the last coefficient/name pair is treated as the product side.

**Arrow label:** none (equals sign between sides).

**Example (from caloric demo):**

```text
r+-=, 30, 1, CALORIC_01, 1, CALORIC_03, =, 1, CALORIC
```

### `rC` — piecewise-linear time-dependent *k* (three lines)

From `*ReactionRateChange`.

**Line 1:** `rC, <sort_key>, <coeff>, <species>, ...` (reactants).

**Line 2:** `<t_0>, <k_0>, <t_1>, <k_1>, ...` (even number of tokens; linear interpolation between points).

**Line 3:** `<coeff>, <species>, ...` (products).

**Arrow label:** `k(t)`

**Example:**

```text
rC, 120, 1e2, A3, 1e1, B3, 1e9, CALORIC_03
0, 1e0, 1000, 1e-1, 10000, 1e1
1, C3
```

### `rA` — Arrhenius with time-scheduled *A*, *E*, *T* (three lines)

**Line 1:** `rA, <sort_key>, <coeff>, <species>, ...`

**Line 2:** `<t>, <A>, <E>, <T>, ...` (quadruplets; count divisible by 4).

**Line 3:** products.

**Arrow label:** `A(t)·exp(-E(t)/T(t))`

**Example:**

```text
rA, 110, 1, A2, 1, B2
0, 0.1, 1000, 273, 1e3, 0.1, 1000, 320, 3e3, 0.1, 1000, 350, 1e4, 0.1, 1000, 220
1, C2
```

### `rT` — Arrhenius with live temperature from *ElementCaloric* (three lines)

**Line 1:** `rT, <sort_key>, <coeff>, <species>, ...`

**Line 2:** `arrhenius, <A>, <E>, <CALORIC_name>` (exactly four tokens).

**Line 3:** products.

**Arrow label:** `A·exp(-E/T(<CALORIC_name>))` — e.g. `A·exp(-E/T(CALORIC))`.

**Example:**

```text
rT, 200, 1, A4, 1, B4
arrhenius, 1e-5, 10, CALORIC
1, C4
```

### `r1_+` — source / feed (one line)

**Formats:**

```text
r1_+, <id>, <rate>, <coeff>, <name>
r1_+, <id>, <rate>, <name>          # coeff defaults to 1
```

No reactants; one product. **Arrow label:** numeric rate.

**Example:**

```text
r1_+, 103, 0.02, 1, Feed
```

### `r1_-` — sink / waste (one line)

**Formats:**

```text
r1_-, <id>, <coeff>, <name>, <rate>
r1_-, <id>, <name>, <rate>           # coeff defaults to 1
```

One reactant; no products. **Arrow label:** numeric rate.

**Example:**

```text
r1_-, 104, 1, Waste, 0.01
```

### Arrow labels on the PNG

| Type | Arrow label | Meaning |
|------|-------------|---------|
| Standard | `<rate>` | Constant rate from the line |
| `rM` | `<rate>` | Constant rate from line 2 |
| `r+-=` | `=` | Instantaneous transfer |
| `rC` | `k(t)` | *k* scheduled over time |
| `rA` | `A(t)·exp(-E(t)/T(t))` | Arrhenius; prescribed temperature |
| `rT` | `A·exp(-E/T(CALORIC))` | Arrhenius; live caloric temperature |
| `r1_+` / `r1_-` | numeric rate | As in file |

---

## Examples

**Reset Example** in the app loads the full demo below (standard, `rM`, caloric, rate-change, and special types).

```text
# Demo: comment lines are rendered as text.
# Use # for notes and section separators.
# Equations below:
r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+
r1_1, 101, 1, A, 5e2, 1, B
r2_1, 102, 2, X, 1, Y, 0.5, 1, Z
rM,   120::, 1, l::, 1, m::, 1, n::, 1, en_Y::
             1e6
             1, q::, 1, en_Y::
r2_2, 10, 1e8, A, 1e7, B, 1e5, 1, C, 1e10, CALORIC_01
r+-=, 30, 1, CALORIC_01, 1, CALORIC_03, =, 1, CALORIC
rA,  110,  1, A2, 1, B2
0, 0.1, 1000, 273,  1e3, 0.1, 1000, 320, 3e3, 0.1, 1000, 350, 1e4, 0.1, 1000, 220
1, C2
rC,  120,  1e2, A3, 1e1, B3, 1e9, CALORIC_03
0, 1e0, 1000, 1e-1, 10000, 1e1
1 , C3
rT,  200, 1, A4, 1, B4
arrhenius, 1e-5, 10, CALORIC
1, C4
r1_+, 103, 0.02, 1, Feed
r1_-, 104, 1, Waste, 0.01
r+-=, 105, 2, A, 1, B, 1, balanceCheck
```

For a full NNS input file with `*Element`, `*ElementCaloric`, `*Reaction`, and `*ReactionRateChange`, see [`InputExample/caloric_temp_013_02.txt`](InputExample/caloric_temp_013_02.txt).

For the complete Binomial NNS input specification, see [doi:10.1101/2023.08.10.552732](https://doi.org/10.1101/2023.08.10.552732).

---

## Project layout

| Path | Role |
|------|------|
| `NNSReactionRenderer.html` | Entry page |
| `css/nns-reaction-renderer.css` | Styles |
| `js/config.js` | Version, defaults, feature flags |
| `js/parse-reaction.js` | Line parsers |
| `js/canvas-render.js` | Drawing and rate labels |
| `js/nns-file-io.js` | TXT / nested file loading |
| `js/sidebar-ui.js` | Side panel behavior |
| `js/bundle-export.js` | Standalone HTML export |
| `js/app.js` | UI wiring and render loop |
| `NNS_ReactionRateChange_Spec_v2.txt` | Rate-change format spec |
| `NNS_Reaction_Display_Design.txt` | PNG arrow-label design |
| `InputExample/` | Sample NNS text files |

### Version history

| Version | Notes |
|---------|--------|
| **v1.1.0** | Temperature / rate-change reactions (`rC`, `rA`, `rT`); caloric `r+-=`; symbolic rate labels with parenthesis notation; `*ReactionRateChange` in TXT load; expanded default demo; special edge cases always on; Dev tools trimmed to standalone export only. |
| **v1.0.0** | First stable public release: full renderer, toolbar UI, file I/O, standalone export, and documentation. |

## Authors

**NNS Reaction Renderer** — Copyright (c) 2026 [pham-tronglam-zcdev](https://github.com/pham-tronglam-zcdev)

**Binomial NNS (original simulator)** — Takashi Sato, Complex Reaction System Laboratory

## License

[MIT License](LICENSE)
