function parseReaction(line, options = {}) {
  const specialEdgeCasesEnabled = !!options.specialEdgeCasesEnabled;
  const tokens = cleanCsvTokens(line);
  if (tokens.length < 1) throw new Error("Empty reaction line.");
  const reactionType = tokens[0];
  const isSpecial = reactionType === "r1_+" || reactionType === "r1_-" || reactionType === "r+-=";
  if (isSpecial) {
    if (!specialEdgeCasesEnabled) {
      throw new Error(`Special reaction type "${reactionType}" is disabled. Turn ON 'Special reaction edge cases' in Dev mode.`);
    }
    return parseSpecialReaction(line);
  }
  if (tokens.length < 7) throw new Error("Not enough fields. Expected reaction format with at least 7 tokens.");
  const parts = reactionType.split("_");
  if (parts.length !== 2 || !parts[0].startsWith("r")) throw new Error("Invalid reaction type. Expected forms like r1_1, r2_2, r3_1.");
  const reactantCount = parseInt(parts[0].slice(1), 10);
  const productCount = parseInt(parts[1], 10);
  if (!Number.isInteger(reactantCount) || !Number.isInteger(productCount) || reactantCount < 1 || productCount < 0) {
    throw new Error("Reaction type counts are invalid.");
  }
  let idx = 2;
  const reactants = [];
  for (let i = 0; i < reactantCount; i++) {
    const coeff = tokens[idx++];
    const name = tokens[idx++];
    if (coeff === undefined || name === undefined) throw new Error("Incomplete reactant pair in input.");
    reactants.push({ coeff, name });
  }
  const rate = tokens[idx++];
  if (rate === undefined) throw new Error("Missing rate value.");
  const products = [];
  for (let i = 0; i < productCount; i++) {
    const coeff = tokens[idx++];
    const name = tokens[idx++];
    if (coeff === undefined || name === undefined) throw new Error("Incomplete product pair in input.");
    products.push({ coeff, name });
  }
  return { reactants, rate, products, operator: "->", showRate: true };
}

function parseRmReactionBlock(headerLine, rateLine, productLine) {
  const headerTokens = cleanCsvTokens(headerLine);
  if (headerTokens.length < 4) throw new Error("rM header line is incomplete.");
  if (headerTokens[0] !== "rM") throw new Error("rM header must start with rM.");
  let idx = 2;
  const reactants = [];
  while (idx < headerTokens.length) {
    const coeff = headerTokens[idx++];
    const name = headerTokens[idx++];
    if (coeff === undefined || name === undefined) throw new Error("Incomplete reactant pair in rM header line.");
    reactants.push({ coeff, name });
  }
  if (reactants.length === 0) throw new Error("No reactants found in rM header line.");
  const rateTokens = cleanCsvTokens(rateLine);
  if (rateTokens.length !== 1) throw new Error("rM rate line must contain exactly one value.");
  const rate = rateTokens[0];
  const productTokens = cleanCsvTokens(productLine);
  if (productTokens.length < 2 || productTokens.length % 2 !== 0) throw new Error("rM product line must contain coefficient/name pairs.");
  const products = [];
  for (let i = 0; i < productTokens.length; i += 2) {
    products.push({ coeff: productTokens[i], name: productTokens[i + 1] });
  }
  return { reactants, rate, products };
}

function parseSpecialReaction(line) {
  const tokens = cleanCsvTokens(line);
  if (tokens.length < 3) throw new Error("Not enough fields for special reaction.");
  const reactionType = tokens[0];
  if (reactionType === "r1_+") return parseR1Plus(tokens);
  if (reactionType === "r1_-") return parseR1Minus(tokens);
  if (reactionType === "r+-=") return parseRPlusMinusEqual(tokens);
  throw new Error(`Unsupported special reaction type: ${reactionType}`);
}

function parseR1Plus(tokens) {
  if (tokens.length === 5) return { reactants: [], rate: tokens[2], products: [{ coeff: tokens[3], name: tokens[4] }], operator: "->", showRate: true };
  if (tokens.length === 4) return { reactants: [], rate: tokens[2], products: [{ coeff: "1", name: tokens[3] }], operator: "->", showRate: true };
  throw new Error("r1_+ expects: r1_+, id, rate, coeff, name (or rate, name).");
}

function parseR1Minus(tokens) {
  if (tokens.length === 5) return { reactants: [{ coeff: tokens[2], name: tokens[3] }], rate: tokens[4], products: [], operator: "->", showRate: true };
  if (tokens.length === 4) return { reactants: [{ coeff: "1", name: tokens[2] }], rate: tokens[3], products: [], operator: "->", showRate: true };
  throw new Error("r1_- expects: r1_-, id, coeff, name, rate (or name, rate).");
}

function parseRPlusMinusEqual(tokens) {
  const body = tokens.slice(2);
  if (body.length < 4 || body.length % 2 !== 0) throw new Error("r+-= expects coefficient/name pairs with at least one left pair and one right pair.");
  const pairs = [];
  for (let i = 0; i < body.length; i += 2) pairs.push({ coeff: body[i], name: body[i + 1] });
  if (pairs.length < 2) throw new Error("r+-= requires at least one source pair and one target pair.");
  return { reactants: pairs.slice(0, -1), products: [pairs[pairs.length - 1]], rate: "", operator: "=", showRate: false };
}

function classifyReactionInputLines(lines, rmBlockEnabled) {
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) { rows.push({ kind: "comment", text: trimmed }); continue; }
    const isRmHeader = trimmed.startsWith("rM,");
    if (rmBlockEnabled && isRmHeader) {
      const rateLine = lines[i + 1];
      const productLine = lines[i + 2];
      if (!rateLine || !productLine) throw new Error(`Line ${i + 1}: rM block is incomplete (needs 3 lines).`);
      rows.push({ kind: "equation", lineNumber: i + 1, line: trimmed, rmBlock: { headerLine: trimmed, rateLine: rateLine.trim(), productLine: productLine.trim() } });
      i += 2;
      continue;
    }
    rows.push({ kind: "equation", lineNumber: i + 1, line: trimmed });
  }
  return rows;
}

function parseRenderableRows(lines, rmBlockEnabled, options = {}) {
  const rows = [];
  for (const row of classifyReactionInputLines(lines, rmBlockEnabled)) {
    if (row.kind === "comment") { rows.push({ kind: "comment", text: row.text }); continue; }
    try {
      rows.push({
        kind: "equation",
        model: row.rmBlock
          ? parseRmReactionBlock(row.rmBlock.headerLine, row.rmBlock.rateLine, row.rmBlock.productLine)
          : parseReaction(row.line, options)
      });
    } catch (e) {
      throw new Error(`Line ${row.lineNumber}: ${e.message}`);
    }
  }
  return rows;
}

function parseFirstReactionFromLines(lines, rmBlockEnabled, options = {}) {
  const firstEquationRow = classifyReactionInputLines(lines, rmBlockEnabled).find(r => r.kind === "equation");
  if (!firstEquationRow) throw new Error("No reaction line found.");
  if (firstEquationRow.rmBlock) {
    return parseRmReactionBlock(firstEquationRow.rmBlock.headerLine, firstEquationRow.rmBlock.rateLine, firstEquationRow.rmBlock.productLine);
  }
  return parseReaction(firstEquationRow.line, options);
}
