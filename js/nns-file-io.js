function extractReactionSectionLines(fileText) {
  const rawLines = fileText.split(/\r?\n/);
  let inReaction = false;
  const sectionLines = [];
  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!inReaction) {
      if (trimmed.startsWith("*Reaction")) inReaction = true;
      continue;
    }
    if (trimmed.startsWith("*")) break;
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("**")) continue;
    sectionLines.push(raw.trim());
  }
  if (!inReaction) throw new Error("No *Reaction section found in file.");
  if (sectionLines.length === 0) throw new Error("*Reaction section was found, but it has no reaction lines.");
  return sectionLines;
}

function extractReferencedTxtNames(fileText) {
  const refs = [];
  const lines = fileText.split(/\r?\n/);
  let currentSection = "";
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("**")) continue;
    if (trimmed.startsWith("*")) { currentSection = trimmed; continue; }
    if (!currentSection.startsWith("*Set_")) continue;
    for (const token of cleanCsvTokens(trimmed)) {
      if (token.toLowerCase().endsWith(".txt")) refs.push(token);
    }
  }
  return refs;
}

function buildFileMap(files) {
  const byName = new Map();
  for (const file of files) byName.set(file.name, file);
  return byName;
}

async function collectReactionLinesWithNested(rootFile, fileMap, options = {}) {
  const maxDepth = options.maxDepth ?? 12;
  const visited = new Set();
  const missing = [];
  const mergedReactionLines = [];
  async function walk(file, depth) {
    if (!file || visited.has(file.name)) return;
    if (depth > maxDepth) throw new Error(`Max nested depth exceeded at ${file.name}.`);
    visited.add(file.name);
    const text = await file.text();
    try {
      const lines = extractReactionSectionLines(text);
      if (lines.length > 0) {
        mergedReactionLines.push(`# [FILE] ${file.name}`);
        mergedReactionLines.push(...lines);
      }
    } catch (_) {}
    for (const refName of extractReferencedTxtNames(text)) {
      const refFile = fileMap.get(refName);
      if (!refFile) { missing.push(refName); continue; }
      await walk(refFile, depth + 1);
    }
  }
  await walk(rootFile, 0);
  return { mergedReactionLines, missing };
}
