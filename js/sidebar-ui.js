const SIDEBAR_PANEL_CONFIG = {
  colors: { panelId: "colorPanel", title: "Color customization" },
  dev: { panelId: "devPanel", title: "Dev tools" },
  nested: { panelId: "nestedLoadPanel", title: "Load nested TXT" },
  typography: { panelId: "pngTypographyPanel", title: "PNG typography" }
};

let activeSidebarPanelKey = null;

function getSidebarElements() {
  return {
    body: document.body,
    sidebar: document.getElementById("appSidebar"),
    backdrop: document.getElementById("sidebarBackdrop"),
    closeBtn: document.getElementById("sidebarCloseBtn"),
    titleEl: document.getElementById("sidebarTitle")
  };
}

function setActiveSidebarPanel(panelKey) {
  const config = SIDEBAR_PANEL_CONFIG[panelKey];
  if (!config) return;

  activeSidebarPanelKey = panelKey;
  document.querySelectorAll(".sidebar-panel").forEach(panel => {
    panel.classList.toggle("is-active", panel.id === config.panelId);
  });

  const { titleEl } = getSidebarElements();
  if (titleEl) titleEl.textContent = config.title;
}

function openSidebar(panelKey) {
  if (!SIDEBAR_PANEL_CONFIG[panelKey]) return;
  setActiveSidebarPanel(panelKey);
  const { body, backdrop } = getSidebarElements();
  body.classList.add("sidebar-open");
  if (backdrop) backdrop.setAttribute("aria-hidden", "false");
}

function closeSidebar() {
  activeSidebarPanelKey = null;
  const { body, backdrop } = getSidebarElements();
  body.classList.remove("sidebar-open");
  if (backdrop) backdrop.setAttribute("aria-hidden", "true");
  document.querySelectorAll(".sidebar-panel").forEach(panel => {
    panel.classList.remove("is-active");
  });
}

function toggleSidebar(panelKey) {
  if (
    activeSidebarPanelKey === panelKey &&
    document.body.classList.contains("sidebar-open")
  ) {
    closeSidebar();
    return;
  }
  openSidebar(panelKey);
}

function isSidebarPanelOpen(panelKey) {
  const config = SIDEBAR_PANEL_CONFIG[panelKey];
  if (!config || !document.body.classList.contains("sidebar-open")) return false;
  const panel = document.getElementById(config.panelId);
  return Boolean(panel && panel.classList.contains("is-active"));
}

function initSidebarUi() {
  const { backdrop, closeBtn } = getSidebarElements();
  closeSidebar();

  backdrop?.addEventListener("click", closeSidebar);
  closeBtn?.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSidebar();
  });
}
