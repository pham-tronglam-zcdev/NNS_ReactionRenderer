/** Journal-friendly families for equation PNG / canvas preview. */
const JOURNAL_PNG_FONTS = [
  { id: "Times New Roman", label: "Times New Roman" },
  { id: "Arial", label: "Arial" },
  { id: "Helvetica", label: "Helvetica" }
];

/** @typedef {{ family: string, size: number }} PngFontStyle */
/** @typedef {Record<string, PngFontStyle>} PngFontStyles */

const PNG_FONT_ROLES = [
  {
    id: "species",
    label: "Species (reactants & products)",
    defaultFamily: "Arial",
    defaultSize: 24,
    minSize: 10,
    maxSize: 48
  },
  {
    id: "rate",
    label: "Rate constant (above arrow)",
    defaultFamily: "Arial",
    defaultSize: 18,
    minSize: 8,
    maxSize: 36
  },
  {
    id: "comment",
    label: "Comment lines (# notes)",
    defaultFamily: "Arial",
    defaultSize: 20,
    minSize: 8,
    maxSize: 36
  },
  {
    id: "equationNumber",
    label: "Equation numbers (1) (2) …",
    defaultFamily: "Arial",
    defaultSize: 20,
    minSize: 8,
    maxSize: 36
  },
  {
    id: "equals",
    label: "Equals sign (r+-= reactions)",
    defaultFamily: "Arial",
    defaultSize: 28,
    minSize: 12,
    maxSize: 48
  }
];

function fontGenericFallback(fontFamily) {
  return /times/i.test(fontFamily) ? "serif" : "sans-serif";
}

function buildCanvasFont(sizePx, fontFamily) {
  const family = fontFamily || "Arial";
  return `${sizePx}px "${family}", ${fontGenericFallback(family)}`;
}

function isAllowedJournalPngFont(fontFamily) {
  return JOURNAL_PNG_FONTS.some(entry => entry.id === fontFamily);
}

function getPngFontRole(roleId) {
  return PNG_FONT_ROLES.find(role => role.id === roleId);
}

function clampPngFontSize(roleId, size) {
  const role = getPngFontRole(roleId);
  const n = Number(size);
  if (!role || !Number.isFinite(n)) return role ? role.defaultSize : 16;
  return Math.min(role.maxSize, Math.max(role.minSize, Math.round(n)));
}

function createDefaultPngFontStyles() {
  /** @type {PngFontStyles} */
  const styles = {};
  for (const role of PNG_FONT_ROLES) {
    styles[role.id] = { family: role.defaultFamily, size: role.defaultSize };
  }
  return styles;
}

function normalizePngFontStyles(styles) {
  const defaults = createDefaultPngFontStyles();
  if (!styles || typeof styles !== "object") return defaults;
  /** @type {PngFontStyles} */
  const normalized = {};
  for (const role of PNG_FONT_ROLES) {
    const raw = styles[role.id] || {};
    normalized[role.id] = {
      family: isAllowedJournalPngFont(raw.family) ? raw.family : defaults[role.id].family,
      size: clampPngFontSize(role.id, raw.size)
    };
  }
  return normalized;
}

function resolvePngFonts(options) {
  const styles = normalizePngFontStyles(options && options.pngFontStyles);
  /** @type {Record<string, string>} */
  const fonts = {};
  for (const role of PNG_FONT_ROLES) {
    const style = styles[role.id];
    fonts[role.id] = buildCanvasFont(style.size, style.family);
  }
  return fonts;
}
