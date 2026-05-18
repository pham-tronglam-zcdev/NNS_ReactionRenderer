# NNS Reaction Renderer

Turn **Binomial NNS** reaction lines into **PNG images** of chemical-style equations. Species names appear as plain text—easy to paste into documents, slides, and reports.

This tool works alongside the [Binomial NNS simulator](https://doi.org/10.1101/2023.08.10.552732). It only draws reactions; it does not run simulations.

## How to use

Open [`NNSReactionRenderer.html`](NNSReactionRenderer.html) in your browser. The page shows a text editor, a preview, and buttons—everything you need is on that one screen.

1. Type or paste reaction lines in the editor (or keep the built-in examples).
2. The preview updates automatically as you edit.
3. Click **Export PNG** to save the image.

To try loading from real NNS input files: click **Load TXT (handle also the case of pointing to other TXT files)**, select **all** `.txt` files in the [`example`](example/) folder at once, choose the main file from the list, then click **Load selected main file**.

For a single file without nested references, open **Dev Only** → **Load Reaction TXT** and pick one `.txt` file.

## What you can do

- **Preview reactions** — see equations drawn on the canvas as you type
- **Multiline** — show many reactions in one image (toggle in **Dev Only**)
- **Comments** — lines starting with `#` appear as notes, not as equations
- **Standard NNS lines** — forms like `r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+`
- **`rM` blocks** — three-line reactions (header, rate, products); turn on **Handle rM 3-line format** in **Dev Only** if needed
- **Equation numbers** — show reaction IDs on the right
- **Colors** — change coefficient, comment, and number colors via **Color customization**
- **Aligned layout** — in **Dev Only**, align arrows across multiple rows or adjust comment alignment

## Reaction line format (brief)

Each equation line is comma-separated, as in NNS `*Reaction` sections. The reaction type and ID are in the file; the picture shows coefficients, species, rate, and products.

Example:

```text
r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+
```

This means: two reactants (`COONa`, `Cu2+`), rate `k1`, two products (`COOCu+`, `Na+`).

Lines starting with `#` are comments only.

For the full NNS input format, see [doi:10.1101/2023.08.10.552732](https://doi.org/10.1101/2023.08.10.552732).

## Authors

**NNS Reaction Renderer** — Copyright (c) 2026 [pham-tronglam-zcdev](https://github.com/pham-tronglam-zcdev)

**Binomial NNS (original simulator)** — Takashi Sato, Complex Reaction System Laboratory

## License

[MIT License](LICENSE)
