function parseReaction(line, options = {}) {
  const specialEdgeCasesEnabled = !!options.specialEdgeCasesEnabled;
  const tokens = cleanCsvTokens(line);
  if (tokens.length < 1) throw new Error("Empty reaction line.");
  const reactionType = tokens[0];
  const isSpecial = reactionType === "r1_+" || reactionType === "r1_-" || reactionType === "r+-=";
  if (isSpecial) {
    if (!specialEdgeCasesEnabled) {
      throw new Error(`Special reaction type "${reactionType}" is disabled. Turn ON 'Special reaction edge cases' in the left toolbar.`);
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

const RATE_LABEL_RC = "k(t)";
const RATE_LABEL_RA = "A·exp(-E/T(t))";

function parseSpeciesPairsFromTokens(tokens, startIdx, contextLabel) {
  if (tokens.length < startIdx + 2) throw new Error(`No ${contextLabel} found.`);
  if ((tokens.length - startIdx) % 2 !== 0) {
    throw new Error(`${contextLabel} must be coefficient/name pairs.`);
  }
  const species = [];
  for (let i = startIdx; i < tokens.length; i += 2) {
    const coeff = tokens[i];
    const name = tokens[i + 1];
    if (coeff === undefined || name === undefined) {
      throw new Error(`Incomplete ${contextLabel} pair in input.`);
    }
    species.push({ coeff, name });
  }
  return species;
}

function formatRtRateLabel(caloricName) {
  return `A·exp(-E/T_${caloricName})`;
}

function isRateChangeBlockHeader(trimmed) {
  return trimmed.startsWith("rC,") || trimmed.startsWith("rA,") || trimmed.startsWith("rT,");
}

function parseRcReactionBlock(headerLine, rateLine, productLine) {
  const headerTokens = cleanCsvTokens(headerLine);
  if (headerTokens[0] !== "rC") throw new Error("rC header must start with rC.");
  const reactants = parseSpeciesPairsFromTokens(headerTokens, 2, "reactants");
  if (reactants.length === 0) throw new Error("No reactants found in rC header line.");
  const rateTokens = cleanCsvTokens(rateLine);
  if (rateTokens.length < 2 || rateTokens.length % 2 !== 0) {
    throw new Error("rC rate line must contain even-count (time, k) pairs.");
  }
  const products = parseSpeciesPairsFromTokens(cleanCsvTokens(productLine), 0, "products");
  if (products.length === 0) throw new Error("No products found in rC product line.");
  return { reactants, rate: RATE_LABEL_RC, products, operator: "->", showRate: true, reactionKind: "rC" };
}

function parseRaReactionBlock(headerLine, rateLine, productLine) {
  const headerTokens = cleanCsvTokens(headerLine);
  if (headerTokens[0] !== "rA") throw new Error("rA header must start with rA.");
  const reactants = parseSpeciesPairsFromTokens(headerTokens, 2, "reactants");
  if (reactants.length === 0) throw new Error("No reactants found in rA header line.");
  const rateTokens = cleanCsvTokens(rateLine);
  if (rateTokens.length < 4 || rateTokens.length % 4 !== 0) {
    throw new Error("rA rate line must contain (time, A, E, T) quadruplets.");
  }
  const products = parseSpeciesPairsFromTokens(cleanCsvTokens(productLine), 0, "products");
  if (products.length === 0) throw new Error("No products found in rA product line.");
  return { reactants, rate: RATE_LABEL_RA, products, operator: "->", showRate: true, reactionKind: "rA" };
}

function parseRtReactionBlock(headerLine, rateLine, productLine) {
  const headerTokens = cleanCsvTokens(headerLine);
  if (headerTokens[0] !== "rT") throw new Error("rT header must start with rT.");
  const reactants = parseSpeciesPairsFromTokens(headerTokens, 2, "reactants");
  if (reactants.length === 0) throw new Error("No reactants found in rT header line.");
  const rateTokens = cleanCsvTokens(rateLine);
  if (rateTokens.length !== 4) {
    throw new Error('rT rate line must be: arrhenius, A, E, <CALORIC_name>.');
  }
  if (rateTokens[0].toLowerCase() !== "arrhenius") {
    throw new Error('rT rate line must start with keyword "arrhenius".');
  }
  const caloricName = rateTokens[3];
  if (!caloricName) throw new Error("rT rate line is missing CALORIC element name.");
  const products = parseSpeciesPairsFromTokens(cleanCsvTokens(productLine), 0, "products");
  if (products.length === 0) throw new Error("No products found in rT product line.");
  return {
    reactants,
    rate: formatRtRateLabel(caloricName),
    products,
    operator: "->",
    showRate: true,
    reactionKind: "rT",
    caloricSource: caloricName
  };
}

function parseRateChangeReactionBlock(headerLine, rateLine, productLine) {
  const type = cleanCsvTokens(headerLine)[0];
  if (type === "rC") return parseRcReactionBlock(headerLine, rateLine, productLine);
  if (type === "rA") return parseRaReactionBlock(headerLine, rateLine, productLine);
  if (type === "rT") return parseRtReactionBlock(headerLine, rateLine, productLine);
  throw new Error(`Unsupported rate-change reaction type: ${type}`);
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
  const eqIdx = body.indexOf("=");
  const leftBody = eqIdx === -1 ? body.slice(0, -2) : body.slice(0, eqIdx);
  const rightBody = eqIdx === -1 ? body.slice(-2) : body.slice(eqIdx + 1);
  if (leftBody.length < 2 || leftBody.length % 2 !== 0) {
    throw new Error("r+-= left side must be coefficient/name pairs.");
  }
  if (rightBody.length < 2 || rightBody.length % 2 !== 0) {
    throw new Error("r+-= right side must be coefficient/name pairs.");
  }
  const reactants = [];
  for (let i = 0; i < leftBody.length; i += 2) {
    reactants.push({ coeff: leftBody[i], name: leftBody[i + 1] });
  }
  const products = [];
  for (let i = 0; i < rightBody.length; i += 2) {
    products.push({ coeff: rightBody[i], name: rightBody[i + 1] });
  }
  if (reactants.length === 0 || products.length === 0) {
    throw new Error("r+-= requires at least one reactant pair and one product pair.");
  }
  return { reactants, products, rate: "", operator: "=", showRate: false };
}

function classifyReactionInputLines(lines, rmBlockEnabled) {
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) { rows.push({ kind: "comment", text: trimmed }); continue; }
    const isRmHeader = trimmed.startsWith("rM,");
    const isRateChangeHeader = isRateChangeBlockHeader(trimmed);
    if ((rmBlockEnabled && isRmHeader) || isRateChangeHeader) {
      const rateLine = lines[i + 1];
      const productLine = lines[i + 2];
      const blockKind = isRateChangeHeader ? "rateChange" : "rM";
      if (!rateLine || !productLine) {
        throw new Error(`Line ${i + 1}: ${blockKind} block is incomplete (needs 3 lines).`);
      }
      rows.push({
        kind: "equation",
        lineNumber: i + 1,
        line: trimmed,
        threeLineBlock: {
          kind: blockKind,
          headerLine: trimmed,
          rateLine: rateLine.trim(),
          productLine: productLine.trim()
        }
      });
      i += 2;
      continue;
    }
    rows.push({ kind: "equation", lineNumber: i + 1, line: trimmed });
  }
  return rows;
}

function parseThreeLineReactionBlock(block) {
  if (block.kind === "rM") {
    return parseRmReactionBlock(block.headerLine, block.rateLine, block.productLine);
  }
  return parseRateChangeReactionBlock(block.headerLine, block.rateLine, block.productLine);
}

function parseRenderableRows(lines, rmBlockEnabled, options = {}) {
  const rows = [];
  for (const row of classifyReactionInputLines(lines, rmBlockEnabled)) {
    if (row.kind === "comment") { rows.push({ kind: "comment", text: row.text }); continue; }
    try {
      rows.push({
        kind: "equation",
        model: row.threeLineBlock
          ? parseThreeLineReactionBlock(row.threeLineBlock)
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
  if (firstEquationRow.threeLineBlock) {
    return parseThreeLineReactionBlock(firstEquationRow.threeLineBlock);
  }
  return parseReaction(firstEquationRow.line, options);
}
