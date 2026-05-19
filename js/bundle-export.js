/** Folder prefixes for assets merged into the standalone HTML export. */
const STANDALONE_CSS_PREFIX = "css/";
const STANDALONE_JS_PREFIX = "js/";
const PAGE_HTML_NAME = "NNSReactionRenderer.html";
const STANDALONE_DOWNLOAD_NAME = "NNSReactionRenderer-standalone.html";
const STANDALONE_FILE_BANNER =
  "<!-- NNS Reaction Renderer (standalone). Double-click this file to run. No install, server, or extra files. -->\n";

function normalizeAssetPath(path) {
  if (!path) return "";
  const trimmed = path.trim().split("#")[0].split("?")[0];
  if (trimmed.startsWith("./")) return trimmed.slice(2);
  return trimmed;
}

function isCssAsset(href) {
  return normalizeAssetPath(href).startsWith(STANDALONE_CSS_PREFIX);
}

function isJsAsset(src) {
  return normalizeAssetPath(src).startsWith(STANDALONE_JS_PREFIX);
}

function resolveAssetUrl(relativePath) {
  return new URL(relativePath, document.baseURI || window.location.href).href;
}

function isNetworkFetchError(err) {
  return err instanceof TypeError || /failed to fetch/i.test(String(err.message || err));
}

function suggestedProjectFolderHint() {
  if (!isFileProtocol()) return "";
  try {
    const pathname = decodeURIComponent(new URL(window.location.href).pathname);
    const dir = pathname.replace(/\/[^/]*$/, "").replace(/^\//, "");
    if (!dir) return "";
    return `Select the folder that contains ${PAGE_HTML_NAME}, css/, and js/ (same folder as this file: ${dir}).`;
  } catch (_) {
    return `Select the folder that contains ${PAGE_HTML_NAME}, css/, and js/.`;
  }
}

function getStandaloneExportButtonLabel() {
  if (isFileProtocol()) {
    return "Export standalone HTML for clients (select project folder…)";
  }
  return "Export standalone HTML for clients (single file)";
}

async function fetchTextUrl(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

async function fetchAssetText(relativePath) {
  return fetchTextUrl(resolveAssetUrl(relativePath));
}

function pickProjectFolderFiles() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
    input.style.display = "none";
    input.addEventListener("change", () => {
      input.remove();
      const files = input.files;
      if (!files || files.length === 0) {
        reject(new Error("No folder selected."));
        return;
      }
      resolve(files);
    });
    document.body.appendChild(input);
    input.click();
  });
}

/** @returns {Promise<Map<string, File>>} */
async function loadProjectFilesFromFolderPicker() {
  const fileList = await pickProjectFolderFiles();
  const byPath = new Map();
  for (const file of fileList) {
    const rel = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
    byPath.set(rel, file);
    const base = rel.includes("/") ? rel.slice(rel.indexOf("/") + 1) : rel;
    if (!byPath.has(base)) byPath.set(base, file);
  }
  return byPath;
}

function findFileInProjectMap(projectFiles, relativePath) {
  const normalized = normalizeAssetPath(relativePath);
  if (projectFiles.has(normalized)) return projectFiles.get(normalized);
  for (const [key, file] of projectFiles) {
    if (key === normalized || key.endsWith("/" + normalized)) return file;
  }
  return null;
}

async function readProjectFile(projectFiles, relativePath) {
  const file = findFileInProjectMap(projectFiles, relativePath);
  if (!file) throw new Error(`Missing file in selected folder: ${relativePath}`);
  return file.text();
}

async function loadPageHtmlTemplate(projectFiles) {
  if (projectFiles) {
    const htmlFile =
      findFileInProjectMap(projectFiles, PAGE_HTML_NAME) ||
      [...projectFiles.values()].find(f => f.name === PAGE_HTML_NAME);
    if (!htmlFile) {
      throw new Error(`Selected folder does not contain ${PAGE_HTML_NAME}. Choose the project root folder.`);
    }
    return htmlFile.text();
  }

  const baseUrl = document.baseURI || window.location.href;
  const candidates = [
    new URL(PAGE_HTML_NAME, baseUrl).href,
    window.location.href
  ];
  let lastError = null;
  for (const url of candidates) {
    try {
      return await fetchTextUrl(url);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Could not load page HTML.");
}

async function loadAssetText(relativePath, projectFiles) {
  if (projectFiles) return readProjectFile(projectFiles, relativePath);
  return fetchAssetText(relativePath);
}

function downloadHtmlFile(filename, html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

async function buildStandaloneDocument(htmlTemplate, loadText) {
  const doc = new DOMParser().parseFromString(htmlTemplate, "text/html");

  const stylesheetLinks = [...doc.querySelectorAll('link[rel="stylesheet"]')].filter(link => {
    return isCssAsset(link.getAttribute("href"));
  });

  const cssParts = [];
  for (const link of stylesheetLinks) {
    const href = link.getAttribute("href");
    cssParts.push(`/* --- ${normalizeAssetPath(href)} --- */\n${await loadText(href)}`);
    link.remove();
  }

  if (cssParts.length > 0) {
    const styleEl = doc.createElement("style");
    styleEl.textContent = cssParts.join("\n\n");
    doc.head.appendChild(styleEl);
  }

  const externalScripts = [...doc.querySelectorAll("script[src]")].filter(script => {
    if (script.hasAttribute("data-standalone-exclude")) return false;
    return isJsAsset(script.getAttribute("src"));
  });

  const jsParts = [];
  for (const script of externalScripts) {
    const src = script.getAttribute("src");
    jsParts.push(`/* --- ${normalizeAssetPath(src)} --- */\n${await loadText(src)}`);
    script.remove();
  }

  doc.querySelectorAll("script[data-standalone-exclude]").forEach(node => node.remove());
  doc.querySelectorAll("[data-standalone-exclude]").forEach(node => node.remove());

  for (const js of jsParts) {
    const inlineScript = doc.createElement("script");
    inlineScript.textContent = js;
    doc.body.appendChild(inlineScript);
  }

  const titleEl = doc.querySelector("title");
  if (titleEl && !titleEl.textContent.includes("(Single File)")) {
    titleEl.textContent = `${titleEl.textContent} (Single File)`;
  }

  return `${STANDALONE_FILE_BANNER}<!doctype html>\n${doc.documentElement.outerHTML}\n`;
}

async function exportStandaloneHtmlFromProjectFolder(statusEl) {
  const hint = suggestedProjectFolderHint();
  if (statusEl && hint) statusEl.textContent = hint;
  const projectFiles = await loadProjectFilesFromFolderPicker();
  const htmlTemplate = await loadPageHtmlTemplate(projectFiles);
  const html = await buildStandaloneDocument(htmlTemplate, path => loadAssetText(path, projectFiles));
  downloadHtmlFile(STANDALONE_DOWNLOAD_NAME, html);
}

/**
 * Builds one self-contained HTML file by inlining linked css/ and js/ assets.
 * On file:// (double-click), uses folder picker — no server or install required.
 */
async function exportStandaloneHtml(statusEl) {
  if (isFileProtocol()) {
    await exportStandaloneHtmlFromProjectFolder(statusEl);
    return;
  }

  try {
    const htmlTemplate = await loadPageHtmlTemplate(null);
    const html = await buildStandaloneDocument(htmlTemplate, path => loadAssetText(path, null));
    downloadHtmlFile(STANDALONE_DOWNLOAD_NAME, html);
  } catch (err) {
    if (!isNetworkFetchError(err)) throw err;
    await exportStandaloneHtmlFromProjectFolder(statusEl);
  }
}
