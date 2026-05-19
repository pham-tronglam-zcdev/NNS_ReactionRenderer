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

function drawSpeciesWithCoefficientColor(ctx, side, x, y, colors) {
  const coefficientColor = colors.coefficientColor || "#000000";
  const speciesColor = colors.speciesColor || "#222";
  ctx.font = "24px Arial, sans-serif";
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

function calcReactionLayout(model, ctx, showEquationNumbers) {
  const normalizedModel = normalizeReactionModelForRender(model);
  const left = formatSpecies(normalizedModel.reactants);
  const right = formatSpecies(normalizedModel.products);
  const padX = 6;
  const arrowGap = 22;
  const numberColumnWidth = showEquationNumbers ? 54 : 0;
  ctx.font = "24px Arial, sans-serif";
  const leftW = ctx.measureText(left).width;
  const rightW = ctx.measureText(right).width;
  const rateW = normalizedModel.showRate ? ctx.measureText(String(normalizedModel.rate)).width : 0;
  const arrowStartX = padX + leftW + 20;
  const arrowEndX = arrowStartX + Math.max(120, rateW + 50);
  const neededWidth = Math.ceil(arrowEndX + arrowGap + rightW + padX + numberColumnWidth);
  return { left, right, rateW, arrowStartX, arrowEndX, neededWidth, operator: normalizedModel.operator, showRate: normalizedModel.showRate };
}

function drawReactionLine(ctx, layout, rate, yOffset, equationNumber, model, options = {}) {
  const normalizedModel = normalizeReactionModelForRender(model);
  const padY = 6;
  const baselineY = 34;
  const speciesColor = options.speciesColor || "#222";
  const leftX = Number.isFinite(options.leftXOverride) ? options.leftXOverride : 6;
  drawSpeciesWithCoefficientColor(ctx, normalizedModel.reactants, leftX, yOffset + baselineY + padY, { coefficientColor: options.coefficientColor, speciesColor });
  const y = yOffset + baselineY + padY - 8;
  if (layout.operator === "=") {
    ctx.font = "28px Arial, sans-serif";
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
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "#333";
    const rateX = layout.arrowStartX + (layout.arrowEndX - layout.arrowStartX - layout.rateW) / 2;
    ctx.fillText(String(rate), rateX, y - 12);
  }
  drawSpeciesWithCoefficientColor(ctx, normalizedModel.products, layout.arrowEndX + 24, yOffset + baselineY + padY, { coefficientColor: options.coefficientColor, speciesColor });
  if (equationNumber !== null && equationNumber !== undefined) {
    ctx.font = "20px Arial, sans-serif";
    ctx.fillStyle = options.equationNumberColor || "#000000";
    ctx.textAlign = "right";
    ctx.fillText(`(${equationNumber})`, ctx.canvas.width - 8, yOffset + baselineY + padY);
    ctx.textAlign = "left";
  }
}

function drawSingleReaction(canvas, ctx, model, options = {}) {
  const showEquationNumbers = !!options.showEquationNumbers;
  const layout = calcReactionLayout(model, ctx, showEquationNumbers);
  canvas.width = layout.neededWidth;
  canvas.height = 64;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawReactionLine(ctx, layout, model.rate, 0, showEquationNumbers ? 1 : null, model, options);
}

function drawRenderableRows(canvas, ctx, rows, options = {}) {
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
      const layout = calcReactionLayout(row.model, ctx, showEquationNumbers);
      layouts.push(layout);
      widths.push(layout.neededWidth);
    } else {
      layouts.push(null);
      ctx.font = "20px Arial, sans-serif";
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
      ctx.font = "20px Arial, sans-serif";
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
      ctx.font = "24px Arial, sans-serif";
      const leftWidth = ctx.measureText(layouts[i].left).width;
      leftXOverride = Math.max(6, layouts[i].arrowStartX - 20 - leftWidth);
    }
    drawReactionLine(ctx, layouts[i], row.model.rate, yOffset, equationNumber, row.model, { ...options, leftXOverride });
  }
}
