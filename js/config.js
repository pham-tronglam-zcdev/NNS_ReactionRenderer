/** Application version (semver). */
const APP_VERSION = "1.1.0";

/** @typedef {{ coeff: string, name: string }} SpeciesSide */
/** @typedef {{ reactants: SpeciesSide[], rate: string, products: SpeciesSide[], operator?: string, showRate?: boolean, reactionKind?: string, caloricSource?: string }} ReactionModel */

const DEFAULT_INPUT = `# Demo: comment lines are rendered as text.
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
r+-=, 105, 2, A, 1, B, 1, balanceCheck`;

const appState = {
  multilineEnabled: true,
  rmBlockParsingEnabled: true,
  alignEquationArrowsEnabled: false,
  stickLeftToArrowEnabled: false,
  centerCommentLines: false,
  showEquationNumbers: false,
  coefficientColor: "#000000",
  commentColor: "#666666",
  equationNumberColor: "#000000",
  pngFontStyles: null,
  defaultInput: DEFAULT_INPUT
};

const featureFlags = {
  enableBasicReactionParsing: true,
  enableMultilineRendering: true,
  enableRMBlockParsing: true,
  enableSpecialReactionEdgeCases: true,
  enableTxtImport: true,
  enableNestedTxtResolution: true,
  enableEquationNumbers: true,
  enableEquationColors: true,
  enablePngFontSelection: true,
  enableStandaloneHtmlExport: true
};

const AUTO_RENDER_DEBOUNCE_MS = 500;

function isFileProtocol() {
  return window.location.protocol === "file:";
}
