/** @typedef {{ coeff: string, name: string }} SpeciesSide */
/** @typedef {{ reactants: SpeciesSide[], rate: string, products: SpeciesSide[], operator?: string, showRate?: boolean }} ReactionModel */

const DEFAULT_INPUT = `# Demo: comment lines are rendered as text.
# Use # for notes and section separators.
# Equations below:
r2_2, 100, 1, COONa, 1, Cu2+, k1, 1, COOCu+, 1, Na+
r1_1, 101, 1, A, 5e2, 1, B
r2_1, 102, 2, X, 1, Y, 0.5, 1, Z
rM,   120::, 1, l::, 1, m::, 1, n::, 1, en_Y::
             1e6
             1, q::, 1, en_Y::`;

const appState = {
  multilineEnabled: true,
  rmBlockParsingEnabled: true,
  alignEquationArrowsEnabled: false,
  stickLeftToArrowEnabled: false,
  specialReactionEdgeCasesEnabled: false,
  centerCommentLines: false,
  showEquationNumbers: false,
  coefficientColor: "#000000",
  commentColor: "#666666",
  equationNumberColor: "#000000",
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
  enableEquationColors: true
};

const AUTO_RENDER_DEBOUNCE_MS = 500;

const specialCaseExampleLines = [
  "r1_+, 103, 0.02, 1, Feed",
  "r1_-, 104, 1, Waste, 0.01",
  "r+-=, 105, 2, A, 1, B, 1, balanceCheck"
];
