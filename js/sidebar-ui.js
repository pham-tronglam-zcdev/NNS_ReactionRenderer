const SIDEBAR_PANEL_CONFIG = {
  colors: {
    panelId: "colorPanel",
    title: "Color customization",
    triggerId: "colorCustomizationBtn",
    labelOn: "Color customization: On",
    labelOff: "Color customization: Off"
  },
  dev: {
    panelId: "devPanel",
    title: "Dev tools",
    triggerId: "devOnlyBtn",
    labelOn: "Dev tools: On",
    labelOff: "Dev tools: Off"
  },
  nested: {
    panelId: "nestedLoadPanel",
    title: "Load nested TXT",
    triggerId: "loadNestedTxtBtn",
    useToggleLabel: false,
    staticLabel: "Load TXT (handle also the case of pointing to other TXT files)"
  },
  typography: {
    panelId: "pngTypographyPanel",
    title: "PNG typography",
    triggerId: "pngTypographyBtn",
    labelOn: "PNG typography: On",
    labelOff: "PNG typography: Off"
  }
};

let activeSidebarPanelKey = null;

function getSidebarElements() {
  return {
    sidebar: document.getElementById("appSidebar"),
    backdrop: document.getElementById("sidebarBackdrop"),
    title: document.getElementById("sidebarTitle"),
    closeBtn: document.getElementById("sidebarCloseBtn")
  };
}

function getSidebarPanelElement(panelKey) {
  const config = SIDEBAR_PANEL_CONFIG[panelKey];
  if (!config) return null;
  return document.getElementById(config.panelId);
}

function isSidebarOpen() {
  return document.body.classList.contains("sidebar-open");
}

function isSidebarPanelOpen(panelKey) {
  return isSidebarOpen() && activeSidebarPanelKey === panelKey;
}

function syncSidebarTriggerLabels() {
  for (const [key, config] of Object.entries(SIDEBAR_PANEL_CONFIG)) {
    const trigger = document.getElementById(config.triggerId);
    if (!trigger) continue;
    if (config.useToggleLabel === false) {
      if (config.staticLabel) trigger.textContent = config.staticLabel;
      trigger.setAttribute("aria-expanded", isSidebarPanelOpen(key) ? "true" : "false");
      continue;
    }
    const isOn = isSidebarPanelOpen(key);
    trigger.textContent = isOn ? config.labelOn : config.labelOff;
    trigger.setAttribute("aria-expanded", isOn ? "true" : "false");
  }
}

function setActiveSidebarPanel(panelKey) {
  activeSidebarPanelKey = panelKey;
  for (const [key, config] of Object.entries(SIDEBAR_PANEL_CONFIG)) {
    const panel = document.getElementById(config.panelId);
    if (!panel) continue;
    const isActive = key === panelKey;
    panel.classList.toggle("is-active", isActive);
  }
  const config = SIDEBAR_PANEL_CONFIG[panelKey];
  const { title } = getSidebarElements();
  if (title && config) title.textContent = config.title;
}

function openSidebar(panelKey) {
  const config = SIDEBAR_PANEL_CONFIG[panelKey];
  const panel = getSidebarPanelElement(panelKey);
  if (!config || !panel) return false;
  const { sidebar, backdrop } = getSidebarElements();
  if (!sidebar) return false;

  setActiveSidebarPanel(panelKey);
  document.body.classList.add("sidebar-open");
  sidebar.setAttribute("aria-hidden", "false");
  if (backdrop) backdrop.hidden = false;
  syncSidebarTriggerLabels();
  return true;
}

function closeSidebar() {
  const { sidebar, backdrop } = getSidebarElements();
  document.body.classList.remove("sidebar-open");
  if (sidebar) sidebar.setAttribute("aria-hidden", "true");
  if (backdrop) backdrop.hidden = true;
  activeSidebarPanelKey = null;
  for (const config of Object.values(SIDEBAR_PANEL_CONFIG)) {
    const panel = document.getElementById(config.panelId);
    if (panel) panel.classList.remove("is-active");
  }
  syncSidebarTriggerLabels();
}

function toggleSidebar(panelKey) {
  if (isSidebarPanelOpen(panelKey)) {
    closeSidebar();
    return false;
  }
  openSidebar(panelKey);
  return true;
}

function initSidebarUi() {
  const { sidebar, backdrop, closeBtn } = getSidebarElements();
  if (!sidebar) return;

  closeSidebar();

  if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
  if (backdrop) backdrop.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isSidebarOpen()) closeSidebar();
  });
}
