const inputEl = document.getElementById("input");
const errorBox = document.getElementById("errorBox");
const canvas = document.getElementById("reactionCanvas");
const ctx = canvas.getContext("2d");
const multilineBtn = document.getElementById("multilineBtn");
const rmBlockBtn = document.getElementById("rmBlockBtn");
const alignArrowsBtn = document.getElementById("alignArrowsBtn");
const stickLeftToArrowBtn = document.getElementById("stickLeftToArrowBtn");
const specialReactionBtn = document.getElementById("specialReactionBtn");
const commentAlignBtn = document.getElementById("commentAlignBtn");
const colorCustomizationBtn = document.getElementById("colorCustomizationBtn");
const devOnlyBtn = document.getElementById("devOnlyBtn");
const devPanel = document.getElementById("devPanel");
const colorPanel = document.getElementById("colorPanel");
const equationNumbersBtn = document.getElementById("equationNumbersBtn");
const coefficientColorInput = document.getElementById("coefficientColorInput");
const commentColorInput = document.getElementById("commentColorInput");
const equationNumberColorInput = document.getElementById("equationNumberColorInput");
const resetDevColorsBtn = document.getElementById("resetDevColorsBtn");
const lineNumbersEl = document.getElementById("lineNumbers");
const loadTxtBtn = document.getElementById("loadTxtBtn");
const txtFileInput = document.getElementById("txtFileInput");
const loadNestedTxtBtn = document.getElementById("loadNestedTxtBtn");
const nestedTxtFileInput = document.getElementById("nestedTxtFileInput");
const nestedRootRow = document.getElementById("nestedRootRow");
const nestedRootSelect = document.getElementById("nestedRootSelect");
const confirmNestedRootBtn = document.getElementById("confirmNestedRootBtn");
const previewStatusEl = document.getElementById("previewStatus");
const pngTypographyBtn = document.getElementById("pngTypographyBtn");
const pngTypographyPanel = document.getElementById("pngTypographyPanel");
const pngTypographyControls = document.getElementById("pngTypographyControls");
const resetPngTypographyBtn = document.getElementById("resetPngTypographyBtn");

let pendingNestedFiles = [];
let isPreviewDirty = false;
let autoRenderTimer = null;

function applySpecialExamplesToInput(enabled) {
  const lines = inputEl.value.split(/\r?\n/);
  const filtered = lines.filter(line => !specialCaseExampleLines.includes(line.trim()));
  if (!enabled) { inputEl.value = filtered.join("\n"); return; }
  const rmIndex = filtered.findIndex(line => line.trim().startsWith("rM,"));
  if (rmIndex === -1) filtered.push(...specialCaseExampleLines);
  else filtered.splice(rmIndex, 0, ...specialCaseExampleLines);
  inputEl.value = filtered.join("\n");
}

function refreshLineNumbers() {
  const lineCount = Math.max(1, inputEl.value.split(/\r?\n/).length);
  let text = "";
  for (let i = 1; i <= lineCount; i++) text += i + (i < lineCount ? "\n" : "");
  lineNumbersEl.textContent = text;
  lineNumbersEl.scrollTop = inputEl.scrollTop;
}

function setPreviewDirty(dirty) {
  isPreviewDirty = dirty;
  previewStatusEl.classList.toggle("out-of-date", dirty);
  previewStatusEl.classList.toggle("up-to-date", !dirty);
  previewStatusEl.textContent = dirty ? "Preview status: Out of date" : "Preview status: Up to date";
}

function scheduleAutoRender() {
  if (autoRenderTimer) clearTimeout(autoRenderTimer);
  autoRenderTimer = setTimeout(() => { autoRenderTimer = null; render(); }, AUTO_RENDER_DEBOUNCE_MS);
}

function render() {
  errorBox.textContent = "";
  try {
    if (!featureFlags.enableBasicReactionParsing) throw new Error("Basic reaction parsing is disabled by feature flags.");
    const multilineActive = featureFlags.enableMultilineRendering && appState.multilineEnabled;
    const showEquationNumbers = featureFlags.enableEquationNumbers && appState.showEquationNumbers;
    const coefficientColor = featureFlags.enableEquationColors ? appState.coefficientColor : "#000000";
    const commentColor = featureFlags.enableEquationColors ? appState.commentColor : "#666666";
    const equationNumberColor = featureFlags.enableEquationColors ? appState.equationNumberColor : "#000000";
    const rmBlockActive = featureFlags.enableRMBlockParsing && appState.rmBlockParsingEnabled;
    const specialEdgeCasesActive = featureFlags.enableSpecialReactionEdgeCases && appState.specialReactionEdgeCasesEnabled;
    const pngFontStyles = featureFlags.enablePngFontSelection
      ? normalizePngFontStyles(appState.pngFontStyles)
      : createDefaultPngFontStyles();
    const renderOptions = {
      showEquationNumbers,
      coefficientColor,
      commentColor,
      equationNumberColor,
      pngFontStyles
    };
    const lines = splitNonEmptyLines(inputEl.value);
    if (multilineActive) {
      if (lines.length === 0) throw new Error("Multiline mode is ON, but no reaction lines were found.");
      const rows = parseRenderableRows(lines, rmBlockActive, { specialEdgeCasesEnabled: specialEdgeCasesActive });
      drawRenderableRows(canvas, ctx, rows, {
        ...renderOptions,
        centerCommentLines: appState.centerCommentLines,
        alignEquationArrows: appState.alignEquationArrowsEnabled,
        stickLeftToArrow: appState.stickLeftToArrowEnabled
      });
    } else {
      drawSingleReaction(
        canvas, ctx, parseFirstReactionFromLines(lines, rmBlockActive, { specialEdgeCasesEnabled: specialEdgeCasesActive }),
        renderOptions
      );
    }
    setPreviewDirty(false);
    return true;
  } catch (err) {
    errorBox.textContent = err.message;
    setPreviewDirty(true);
    return false;
  }
}

function exportPng() {
  if (isPreviewDirty) {
    const ok = render();
    if (!ok) return;
  }
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "reaction.png";
  a.click();
}

async function loadReactionTxtFile(file) {
  if (!file) return;
  const text = await file.text();
  const reactionLines = extractReactionSectionLines(text);
  inputEl.value = reactionLines.join("\n");
  refreshLineNumbers();
  setPreviewDirty(true);
  render();
}

async function loadReactionTxtWithNested(files) {
  if (!files || files.length === 0) return;
  const allFiles = Array.from(files);
  const rootName = nestedRootSelect.value;
  const rootFile = allFiles.find(f => f.name === rootName);
  if (!rootFile) throw new Error("Please choose a valid main TXT file.");
  const fileMap = buildFileMap(allFiles);
  const { mergedReactionLines, missing } = await collectReactionLinesWithNested(rootFile, fileMap);
  if (mergedReactionLines.length === 0) throw new Error(`No reaction lines found from ${rootFile.name} and nested references.`);
  inputEl.value = mergedReactionLines.join("\n");
  refreshLineNumbers();
  setPreviewDirty(true);
  render();
  if (missing.length > 0) {
    const uniqueMissing = [...new Set(missing)];
    errorBox.textContent = `Loaded with warnings. Missing referenced TXT files: ${uniqueMissing.join(", ")}`;
  }
}

function bindUi() {
  document.getElementById("renderBtn").addEventListener("click", () => {
    if (autoRenderTimer) { clearTimeout(autoRenderTimer); autoRenderTimer = null; }
    render();
  });
  document.getElementById("exportBtn").addEventListener("click", exportPng);
  document.getElementById("resetBtn").addEventListener("click", () => {
    inputEl.value = appState.defaultInput;
    refreshLineNumbers();
    setPreviewDirty(true);
    render();
  });
  devOnlyBtn.addEventListener("click", () => {
    toggleSidebar("dev");
  });
  colorCustomizationBtn.addEventListener("click", () => {
    toggleSidebar("colors");
  });
  inputEl.addEventListener("input", () => {
    refreshLineNumbers();
    setPreviewDirty(true);
    scheduleAutoRender();
  });
  inputEl.addEventListener("scroll", () => { lineNumbersEl.scrollTop = inputEl.scrollTop; });
  multilineBtn.addEventListener("click", () => {
    if (!featureFlags.enableMultilineRendering) return;
    appState.multilineEnabled = !appState.multilineEnabled;
    multilineBtn.textContent = `Multiline: ${appState.multilineEnabled ? "On" : "Off"}`;
    render();
  });
  rmBlockBtn.addEventListener("click", () => {
    if (!featureFlags.enableRMBlockParsing) return;
    appState.rmBlockParsingEnabled = !appState.rmBlockParsingEnabled;
    rmBlockBtn.textContent = `Handle rM 3-line format: ${appState.rmBlockParsingEnabled ? "On" : "Off"}`;
    render();
  });
  alignArrowsBtn.addEventListener("click", () => {
    appState.alignEquationArrowsEnabled = !appState.alignEquationArrowsEnabled;
    alignArrowsBtn.textContent = `Align equation arrows: ${appState.alignEquationArrowsEnabled ? "On" : "Off"}`;
    if (!appState.alignEquationArrowsEnabled) appState.stickLeftToArrowEnabled = false;
    stickLeftToArrowBtn.disabled = !appState.alignEquationArrowsEnabled;
    stickLeftToArrowBtn.textContent = `Left side stick to arrow: ${appState.stickLeftToArrowEnabled ? "On" : "Off"}`;
    setPreviewDirty(true);
    render();
  });
  stickLeftToArrowBtn.addEventListener("click", () => {
    if (!appState.alignEquationArrowsEnabled) return;
    appState.stickLeftToArrowEnabled = !appState.stickLeftToArrowEnabled;
    stickLeftToArrowBtn.textContent = `Left side stick to arrow: ${appState.stickLeftToArrowEnabled ? "On" : "Off"}`;
    setPreviewDirty(true);
    render();
  });
  specialReactionBtn.addEventListener("click", () => {
    if (!featureFlags.enableSpecialReactionEdgeCases) return;
    appState.specialReactionEdgeCasesEnabled = !appState.specialReactionEdgeCasesEnabled;
    specialReactionBtn.textContent = `Special reaction edge cases (not verified correctness yet): ${appState.specialReactionEdgeCasesEnabled ? "On" : "Off"}`;
    applySpecialExamplesToInput(appState.specialReactionEdgeCasesEnabled);
    refreshLineNumbers();
    setPreviewDirty(true);
    render();
  });
  commentAlignBtn.addEventListener("click", () => {
    appState.centerCommentLines = !appState.centerCommentLines;
    commentAlignBtn.textContent = `Comment align: ${appState.centerCommentLines ? "Center" : "Left"}`;
    setPreviewDirty(true);
    render();
  });
  equationNumbersBtn.addEventListener("click", () => {
    if (!featureFlags.enableEquationNumbers) return;
    appState.showEquationNumbers = !appState.showEquationNumbers;
    equationNumbersBtn.textContent = `Show equation numbers: ${appState.showEquationNumbers ? "On" : "Off"}`;
    render();
  });
  coefficientColorInput.addEventListener("input", () => {
    if (!featureFlags.enableEquationColors) return;
    appState.coefficientColor = coefficientColorInput.value;
    render();
  });
  commentColorInput.addEventListener("input", () => {
    if (!featureFlags.enableEquationColors) return;
    appState.commentColor = commentColorInput.value;
    render();
  });
  equationNumberColorInput.addEventListener("input", () => {
    if (!featureFlags.enableEquationColors) return;
    appState.equationNumberColor = equationNumberColorInput.value;
    render();
  });
  resetDevColorsBtn.addEventListener("click", () => {
    if (!featureFlags.enableEquationColors) return;
    appState.coefficientColor = "#000000";
    appState.commentColor = "#666666";
    appState.equationNumberColor = "#000000";
    coefficientColorInput.value = appState.coefficientColor;
    commentColorInput.value = appState.commentColor;
    equationNumberColorInput.value = appState.equationNumberColor;
    render();
  });
  loadTxtBtn.addEventListener("click", () => {
    if (!featureFlags.enableTxtImport) return;
    txtFileInput.click();
  });
  txtFileInput.addEventListener("change", async () => {
    try {
      errorBox.textContent = "";
      await loadReactionTxtFile(txtFileInput.files[0]);
    } catch (err) {
      errorBox.textContent = err.message;
    } finally {
      txtFileInput.value = "";
    }
  });
  loadNestedTxtBtn.addEventListener("click", () => {
    if (!featureFlags.enableNestedTxtResolution) return;
    nestedTxtFileInput.click();
  });
  nestedTxtFileInput.addEventListener("change", async () => {
    pendingNestedFiles = Array.from(nestedTxtFileInput.files || []);
    nestedTxtFileInput.value = "";
    if (pendingNestedFiles.length === 0) return;
    nestedRootSelect.innerHTML = "";
    for (const file of pendingNestedFiles) {
      const option = document.createElement("option");
      option.value = file.name;
      option.textContent = file.name;
      nestedRootSelect.appendChild(option);
    }
    openSidebar("nested");
  });
  confirmNestedRootBtn.addEventListener("click", async () => {
    try {
      errorBox.textContent = "";
      await loadReactionTxtWithNested(pendingNestedFiles);
      pendingNestedFiles = [];
      closeSidebar();
    } catch (err) {
      errorBox.textContent = err.message;
    }
  });
if (pngTypographyControls) {
    pngTypographyControls.addEventListener("change", onPngTypographyControlChange);
    pngTypographyControls.addEventListener("input", onPngTypographyControlChange);
  }
  if (resetPngTypographyBtn) {
    resetPngTypographyBtn.addEventListener("click", () => {
      if (!featureFlags.enablePngFontSelection) return;
      appState.pngFontStyles = createDefaultPngFontStyles();
      syncPngTypographyControlsFromState();
      render();
    });
  }
  if (pngTypographyBtn) {
    pngTypographyBtn.addEventListener("click", () => {
      toggleSidebar("typography");
    });
  }
}

function onPngTypographyControlChange(event) {
  if (!featureFlags.enablePngFontSelection) return;
  const target = event.target;
  if (!target || !target.dataset || !target.dataset.role) return;
  const roleId = target.dataset.role;
  const prop = target.dataset.prop;
  if (!getPngFontRole(roleId)) return;
  appState.pngFontStyles = normalizePngFontStyles(appState.pngFontStyles);
  if (prop === "family") {
    appState.pngFontStyles[roleId].family = isAllowedJournalPngFont(target.value)
      ? target.value
      : getPngFontRole(roleId).defaultFamily;
  } else if (prop === "size") {
    appState.pngFontStyles[roleId].size = clampPngFontSize(roleId, target.value);
    target.value = String(appState.pngFontStyles[roleId].size);
  }
  render();
}

function appendJournalFontOptions(selectEl, selectedFamily) {
  selectEl.innerHTML = "";
  for (const entry of JOURNAL_PNG_FONTS) {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = entry.label;
    selectEl.appendChild(option);
  }
  selectEl.value = isAllowedJournalPngFont(selectedFamily) ? selectedFamily : "Arial";
}

function buildPngTypographyPanel() {
  if (!pngTypographyControls) return;
  pngTypographyControls.innerHTML = "";
  const styles = normalizePngFontStyles(appState.pngFontStyles);
  for (const role of PNG_FONT_ROLES) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "dev-typography-role";
    const legend = document.createElement("legend");
    legend.textContent = role.label;
    fieldset.appendChild(legend);

    const row = document.createElement("div");
    row.className = "dev-typography-role__controls";

    const fontLabel = document.createElement("label");
    fontLabel.className = "dev-typography-field";
    const fontSelect = document.createElement("select");
    fontSelect.dataset.role = role.id;
    fontSelect.dataset.prop = "family";
    fontSelect.setAttribute("aria-label", `${role.label} font`);
    appendJournalFontOptions(fontSelect, styles[role.id].family);
    fontLabel.append("Font ", fontSelect);

    const sizeLabel = document.createElement("label");
    sizeLabel.className = "dev-typography-field";
    const sizeInput = document.createElement("input");
    sizeInput.type = "number";
    sizeInput.min = String(role.minSize);
    sizeInput.max = String(role.maxSize);
    sizeInput.step = "1";
    sizeInput.dataset.role = role.id;
    sizeInput.dataset.prop = "size";
    sizeInput.value = String(styles[role.id].size);
    sizeInput.setAttribute("aria-label", `${role.label} size in pixels`);
    sizeLabel.append("Size (px) ", sizeInput);

    row.append(fontLabel, sizeLabel);
    fieldset.appendChild(row);
    pngTypographyControls.appendChild(fieldset);
  }
}

function syncPngTypographyControlsFromState() {
  if (!pngTypographyControls) return;
  const styles = normalizePngFontStyles(appState.pngFontStyles);
  for (const role of PNG_FONT_ROLES) {
    const fontSelect = pngTypographyControls.querySelector(`select[data-role="${role.id}"][data-prop="family"]`);
    const sizeInput = pngTypographyControls.querySelector(`input[data-role="${role.id}"][data-prop="size"]`);
    if (fontSelect) appendJournalFontOptions(fontSelect, styles[role.id].family);
    if (sizeInput) sizeInput.value = String(styles[role.id].size);
  }
}


function syncSidebarUiState() {
  const colorsOpen = isSidebarPanelOpen("colors");
  const devOpen = isSidebarPanelOpen("dev");
  const typographyOpen = isSidebarPanelOpen("typography");
  colorCustomizationBtn.textContent = `Color customization: ${colorsOpen ? "On" : "Off"}`;
  colorCustomizationBtn.classList.toggle("is-active", colorsOpen);
  devOnlyBtn.classList.toggle("is-active", devOpen);
  if (pngTypographyBtn) {
    pngTypographyBtn.textContent = `PNG typography: ${typographyOpen ? "On" : "Off"}`;
    pngTypographyBtn.classList.toggle("is-active", typographyOpen);
  }
}

function applyFeatureFlagUi() {
  if (!featureFlags.enableRMBlockParsing) rmBlockBtn.disabled = true;
  if (!featureFlags.enableMultilineRendering) { alignArrowsBtn.disabled = true; stickLeftToArrowBtn.disabled = true; }
  if (!featureFlags.enableSpecialReactionEdgeCases) specialReactionBtn.disabled = true;
  if (!featureFlags.enableTxtImport) loadTxtBtn.disabled = true;
  if (!featureFlags.enableNestedTxtResolution) {
    loadNestedTxtBtn.disabled = true;
    confirmNestedRootBtn.disabled = true;
    nestedRootSelect.disabled = true;
  }
  if (!featureFlags.enableEquationNumbers) equationNumbersBtn.disabled = true;
  if (!featureFlags.enableEquationColors) {
    coefficientColorInput.disabled = true;
    commentColorInput.disabled = true;
    equationNumberColorInput.disabled = true;
    resetDevColorsBtn.disabled = true;
  }
  if (!featureFlags.enablePngFontSelection) {
    if (pngTypographyBtn) pngTypographyBtn.disabled = true;
    if (resetPngTypographyBtn) resetPngTypographyBtn.disabled = true;
    if (pngTypographyControls) {
      pngTypographyControls.querySelectorAll("select, input").forEach(el => { el.disabled = true; });
    }
  }
}

function syncControlLabels() {
  coefficientColorInput.value = appState.coefficientColor;
  commentColorInput.value = appState.commentColor;
  equationNumberColorInput.value = appState.equationNumberColor;
  alignArrowsBtn.textContent = `Align equation arrows: ${appState.alignEquationArrowsEnabled ? "On" : "Off"}`;
  stickLeftToArrowBtn.disabled = !appState.alignEquationArrowsEnabled;
  stickLeftToArrowBtn.textContent = `Left side stick to arrow: ${appState.stickLeftToArrowEnabled ? "On" : "Off"}`;
  specialReactionBtn.textContent = `Special reaction edge cases (not verified correctness yet): ${appState.specialReactionEdgeCasesEnabled ? "On" : "Off"}`;
  commentAlignBtn.textContent = `Comment align: ${appState.centerCommentLines ? "Center" : "Left"}`;
  syncSidebarUiState();
}

function initApp() {
  appState.pngFontStyles = createDefaultPngFontStyles();
  buildPngTypographyPanel();
  initSidebarUi();
  bindUi();
  applyFeatureFlagUi();
  syncControlLabels();
  refreshLineNumbers();
  setPreviewDirty(true);
  render();
}

initApp();
