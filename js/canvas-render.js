function normalizeReactionModelForRender(model) {
  const operator = model.operator || "->";
  const showRate = model.showRate !== false;
  const left = Array.isArray(model.reactants) ? model.reactants.slice() : [];
  const right = Array.isArray(model.products) ? model.products.slice() : [];
  if (left.length === 0) left.push({ coeff: "", name: "[source]" });
  if (right.length === 0) right.push({ coeff: "", name: "[sink]" });
  return { ...model, reactants: left, products: right, operator, showRate };
}

function formatSpecies(side) { return side.map(item => `${item.coeff} ${item.name}`).join(" + "); }

function formatCommentText(commentText) {
  const text = String(commentText || "");
  return text.startsWith("#") ? text.slice(1).trimStart() : text;
}

function formatReactionRateLabel(model) {
  if (!model || model.showRate === false) return "";
  if (model.reactionKind === "rC") return "k(t)";
  if (model.reactionKind === "rA") return "A·exp(-E/T(t))";
  if (model.reactionKind === "rT") {
    const source = model.caloricSource || "CALORIC";
    return `A·exp(-E/T_${source})`;
  }
  return String(model.rate ?? "");
}

const RATE_SUBSCRIPT_PATTERNS = [
  { re: /^k\(t\)/, expand: () => [{ kind: "normal", text: "k" }, { kind: "sub", text: "t" }] },
  { re: /^T\(([^)]+)\)/, expand: (m) => [{ kind: "normal", text: "T" }, { kind: "sub", text: m[1] }] },
  { re: /^T_([A-Za-z0-9_]+)/, expand: (m) => [{ kind: "normal", text: "T" }, { kind: "sub", text: m[1] }] }
];

function parseRateLabelSegments(label) {
  const segments = [];
  let rest = String(label || "");
  while (rest.length > 0) {
    let matched = false;
    for (const pattern of RATE_SUBSCRIPT_PATTERNS) {
      const m = rest.match(pattern.re);
      if (!m) continue;
      segments.push(...pattern.expand(m));
      rest = rest.slice(m[0].length);
      matched = true;
      break;
    }
    if (matched) continue;
    const nextSpecial = rest.search(/k\(t\)|T\(|T_/);
    const end = nextSpecial === -1 ? rest.length : nextSpecial;
    if (end > 0) segments.push({ kind: "normal", text: rest.slice(0, end) });
    rest = rest.slice(end);
    if (nextSpecial === 0) {
      segments.push({ kind: "normal", text: rest[0] });
      rest = rest.slice(1);
    }
  }
  return segments.length > 0 ? segments : [{ kind: "normal", text: String(label || "") }];
}

function parseRateFontPx(rateFont) {
  const m = String(rateFont).match(/^(\d+(?:\.\d+)?)px/);
  return m ? Number(m[1]) : 18;
}

function parseRateFontFamily(rateFont) {
  const m = String(rateFont).match(/"([^"]+)"/);
  return m ? m[1] : "Arial";
}

function buildSubRateFont(rateFont) {
  const basePx = parseRateFontPx(rateFont);
  const subPx = Math.max(8, Math.round(basePx * 0.62));
  return `bold ${buildCanvasFont(subPx, parseRateFontFamily(rateFont))}`;
}

function rateLabelSubscriptDrop(rateFont) {
  return Math.max(3, Math.round(parseRateFontPx(rateFont) * 0.28));
}

function measureRateLabelWidth(ctx, segments, rateFont, subFont) {
  let width = 0;
  for (const seg of segments) {
    ctx.font = seg.kind === "sub" ? subFont : rateFont;
    width += ctx.measureText(seg.text).width;
  }
  return width;
}

function drawRateLabel(ctx, segments, x, y, rateFont, subFont, fillStyle) {
  const subDrop = rateLabelSubscriptDrop(rateFont);
  let cursorX = x;
  ctx.fillStyle = fillStyle;
  for (const seg of segments) {
    const isSub = seg.kind === "sub";
    ctx.font = isSub ? subFont : rateFont;
    const drawY = isSub ? y + subDrop : y;
    ctx.fillText(seg.text, cursorX, drawY);
    cursorX += ctx.measureText(seg.text).width;
  }
}

function drawSpeciesWithCoefficientColor(ctx, side, x, y, colors, fonts) {
  const coefficientColor = colors.coefficientColor || "#000000";
  const speciesColor = colors.speciesColor || "#222";
  ctx.font = fonts.species;
  let cursorX = x;
  for (let i = 0; i < side.length; i++) {
    const coeffText = `${side[i].coeff}`;
    const speciesText = ` ${side[i].name}`;
    ctx.fillStyle = coefficientColor;
    ctx.fillText(coeffText, cursorX, y);
    cursorX += ctx.measureText(coeffText).width;
    ctx.fillStyle = speciesColor;
    ctx.fillText(speciesText, cursorX, y);
    cursorX += ctx.measureText(speciesText).width;
    if (i < side.length - 1) {
      const plusText = " + ";
      ctx.fillText(plusText, cursorX, y);
      cursorX += ctx.measureText(plusText).width;
    }
  }
}

function calcReactionLayout(model, ctx, showEquationNumbers, fonts) {
  const normalizedModel = normalizeReactionModelForRender(model);
  const rateLabel = formatReactionRateLabel(normalizedModel);
  const rateLabelSegments = parseRateLabelSegments(rateLabel);
  const subRateFont = buildSubRateFont(fonts.rate);
  const left = formatSpecies(normalizedModel.reactants);
  const right = formatSpecies(normalizedModel.products);
  const padX = 6;
  const arrowGap = 22;
  const numberColumnWidth = showEquationNumbers ? 54 : 0;
  ctx.font = fonts.species;
  const leftW = ctx.measureText(left).width;
  const rightW = ctx.measureText(right).width;
  const rateW = normalizedModel.showRate
    ? measureRateLabelWidth(ctx, rateLabelSegments, fonts.rate, subRateFont)
    : 0;
  const arrowStartX = padX + leftW + 20;
  const arrowEndX = arrowStartX + Math.max(120, rateW + 50);
  const neededWidth = Math.ceil(arrowEndX + arrowGap + rightW + padX + numberColumnWidth);
  return {
    left,
    right,
    rateW,
    rateLabel,
    rateLabelSegments,
    subRateFont,
    arrowStartX,
    arrowEndX,
    neededWidth,
    operator: normalizedModel.operator,
    showRate: normalizedModel.showRate
  };
}

function drawReactionLine(ctx, layout, yOffset, equationNumber, model, options = {}) {
  const fonts = options.fonts || resolvePngFonts(options);
  const normalizedModel = normalizeReactionModelForRender(model);
  const padY = 6;
  const baselineY = 34;
  const speciesColor = options.speciesColor || "#222";
  const leftX = Number.isFinite(options.leftXOverride) ? options.leftXOverride : 6;
  drawSpeciesWithCoefficientColor(
    ctx, normalizedModel.reactants, leftX, yOffset + baselineY + padY,
    { coefficientColor: options.coefficientColor, speciesColor }, fonts
  );
  const y = yOffset + baselineY + padY - 8;
  if (layout.operator === "=") {
    ctx.font = fonts.equals;
    ctx.fillStyle = "#222";
    const eqX = layout.arrowStartX + (layout.arrowEndX - layout.arrowStartX) / 2 - ctx.measureText("=").width / 2;
    ctx.fillText("=", eqX, y + 10);
  } else {
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(layout.arrowStartX, y); ctx.lineTo(layout.arrowEndX, y); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(layout.arrowEndX, y); ctx.lineTo(layout.arrowEndX - 12, y - 8);
    ctx.moveTo(layout.arrowEndX, y); ctx.lineTo(layout.arrowEndX - 12, y + 8);
    ctx.stroke();
  }
  if (layout.showRate) {
    const rateX = layout.arrowStartX + (layout.arrowEndX - layout.arrowStartX - layout.rateW) / 2;
    drawRateLabel(
      ctx,
      layout.rateLabelSegments,
      rateX,
      y - 12,
      fonts.rate,
      layout.subRateFont,
      "#333"
    );
  }
  drawSpeciesWithCoefficientColor(
    ctx, normalizedModel.products, layout.arrowEndX + 24, yOffset + baselineY + padY,
    { coefficientColor: options.coefficientColor, speciesColor }, fonts
  );
  if (equationNumber !== null && equationNumber !== undefined) {
    ctx.font = fonts.equationNumber;
    ctx.fillStyle = options.equationNumberColor || "#000000";
    ctx.textAlign = "right";
    ctx.fillText(`(${equationNumber})`, ctx.canvas.width - 8, yOffset + baselineY + padY);
    ctx.textAlign = "left";
  }
}

function drawSingleReaction(canvas, ctx, model, options = {}) {
  const fonts = options.fonts || resolvePngFonts(options);
  const drawOptions = { ...options, fonts };
  const showEquationNumbers = !!options.showEquationNumbers;
  const layout = calcReactionLayout(model, ctx, showEquationNumbers, fonts);
  canvas.width = layout.neededWidth;
  canvas.height = 64;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawReactionLine(ctx, layout, 0, showEquationNumbers ? 1 : null, model, drawOptions);
}

function drawRenderableRows(canvas, ctx, rows, options = {}) {
  const fonts = options.fonts || resolvePngFonts(options);
  const drawOptions = { ...options, fonts };
  const showEquationNumbers = !!options.showEquationNumbers;
  const centerCommentLines = !!options.centerCommentLines;
  const alignEquationArrows = !!options.alignEquationArrows;
  const stickLeftToArrow = !!options.stickLeftToArrow && alignEquationArrows;
  const rowHeight = 64;
  const commentColor = options.commentColor || "#666666";
  const minWidth = 420;
  const layouts = [];
  const widths = [];
  for (const row of rows) {
    if (row.kind === "equation") {
      const layout = calcReactionLayout(row.model, ctx, showEquationNumbers, fonts);
      layouts.push(layout);
      widths.push(layout.neededWidth);
    } else {
      layouts.push(null);
      ctx.font = fonts.comment;
      const commentText = formatCommentText(row.text);
      widths.push(Math.max(minWidth, Math.ceil(ctx.measureText(commentText).width + 24)));
    }
  }
  if (alignEquationArrows) {
    const alignedArrowStartX = layouts.filter(Boolean).reduce((max, l) => Math.max(max, l.arrowStartX), 0);
    for (let i = 0; i < layouts.length; i++) {
      const layout = layouts[i];
      if (!layout) continue;
      const arrowSpan = layout.arrowEndX - layout.arrowStartX;
      const rightSideTail = layout.neededWidth - layout.arrowEndX;
      layout.arrowStartX = alignedArrowStartX;
      layout.arrowEndX = alignedArrowStartX + arrowSpan;
      layout.neededWidth = Math.ceil(layout.arrowEndX + rightSideTail);
      widths[i] = layout.neededWidth;
    }
  }
  canvas.width = Math.max(minWidth, ...widths);
  canvas.height = rowHeight * rows.length;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const yOffset = i * rowHeight;
    if (row.kind === "comment") {
      const commentText = formatCommentText(row.text);
      ctx.font = fonts.comment;
      ctx.fillStyle = commentColor;
      if (centerCommentLines) {
        const commentWidth = ctx.measureText(commentText).width;
        const x = Math.max(8, (canvas.width - commentWidth) / 2);
        ctx.fillText(commentText, x, yOffset + 40);
      } else {
        ctx.fillText(commentText, 8, yOffset + 40);
      }
      continue;
    }
    const equationNumber = showEquationNumbers ? rows.slice(0, i + 1).filter(r => r.kind === "equation").length : null;
    let leftXOverride;
    if (stickLeftToArrow) {
      ctx.font = fonts.species;
      const leftWidth = ctx.measureText(layouts[i].left).width;
      leftXOverride = Math.max(6, layouts[i].arrowStartX - 20 - leftWidth);
    }
    drawReactionLine(ctx, layouts[i], yOffset, equationNumber, row.model, { ...drawOptions, leftXOverride });
  }
}
