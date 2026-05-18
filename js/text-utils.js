function splitNonEmptyLines(text) {
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function firstNonEmptyLine(text) {
  return splitNonEmptyLines(text)[0];
}

function cleanCsvTokens(line) {
  return line.split(",").map(s => s.trim()).filter(Boolean);
}
