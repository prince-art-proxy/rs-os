(function () {
  const osState = {
    vfsFiles: [],
    vfsCurrentFolderId: null,
    notepadText:
      "This is a simple Notepad demo.\nYou can type here and it will stay until refresh/import.",
    browserTabs: [],
    browserActiveTabId: null,
    viewerFile: null,
    pinnedApps: [],
    recentItems: [],
    recycleBin: [],
    neverAutoPinApps: [],
    browserHistory: [],
    browserBookmarks: [],
    settings: {
      accent: "blue",
      wallpaperMode: "default",
      wallpaperUrl: "",
      wallpaperVfsId: null,
      homepage: "https://3hfkql-8080.csb.app",
    },
  };

  const appRenderers = {
    files: null,
    browser: null,
    chat: null,
    viewer: null,
    pictures: null,
    recycle: null,
    calculator: null,
    music: null,
    todo: null,
    cmd: null,
    about: null,
  };

  const appTitles = {
    browser: "Web Browser",
    chat: "ChatConnect",
    files: "File Explorer",
    notepad: "Notepad",
    pictures: "Pictures",
    settings: "Settings",
    viewer: "File Viewer",
    recycle: "Recycle Bin",
    calculator: "Calculator",
    music: "Music Player",
    todo: "To-do",
    cmd: "Command Prompt",
    about: "About This System",
  };

  const appTaskbarIcon = {
    browser: "🌐",
    chat: "💬",
    files: "📁",
    notepad: "📝",
    pictures: "🖼️",
    settings: "⚙️",
    viewer: "📄",
    recycle: "🗑️",
    calculator: "🧮",
    music: "🎵",
    todo: "✅",
    cmd: "💻",
    about: "ℹ️",
  };

  function applySettings() {
    if (!osState.settings) {
      osState.settings = {
        accent: "blue",
        wallpaperMode: "default",
        wallpaperUrl: "",
        wallpaperVfsId: null,
      };
    } else {
      if (!osState.settings.accent) osState.settings.accent = "blue";
      if (!osState.settings.wallpaperMode)
        osState.settings.wallpaperMode = "default";
      if (typeof osState.settings.wallpaperUrl !== "string")
        osState.settings.wallpaperUrl = "";
      if (
        !Object.prototype.hasOwnProperty.call(
          osState.settings,
          "wallpaperVfsId"
        )
      )
        osState.settings.wallpaperVfsId = null;
      if (!osState.settings.homepage)
        osState.settings.homepage = "https://8xy7zj-8080.csb.app";
    }

    const accentKey = osState.settings.accent || "blue";
    let accentColor = "#0a84ff";
    if (accentKey === "purple") accentColor = "#b43cff";
    else if (accentKey === "green") accentColor = "#00c38a";
    document.documentElement.style.setProperty("--accent", accentColor);

    // Keep the yin-yang background
    const desktopEl = document.querySelector(".desktop");
    if (desktopEl) {
      desktopEl.style.background = "#000000";
    }
  }

  function ensureBrowserDefaults() {
    if (!osState.browserTabs.length) {
      const id = "tab-" + Date.now();
      const home = osState.settings.homepage || "https://3hfkql-8080.csb.app";
      const url = home;
      osState.browserTabs.push({
        id,
        title: "Home",
        url,
      });
      osState.browserActiveTabId = id;
    } else if (
      !osState.browserActiveTabId ||
      !osState.browserTabs.find(
        (t) => t.id === osState.browserActiveTabId
      )
    ) {
      osState.browserActiveTabId = osState.browserTabs[0].id;
    }
  }

  /* VFS helpers - simplified for demo */
  function ensureVfsRoot() {
    if (!osState.vfsFiles.length) {
      osState.vfsFiles.push({
        id: "root",
        name: "This PC",
        isFolder: true,
        parentId: null,
      });
    }
  }

  function getVfsItem(id) {
    return osState.vfsFiles.find((i) => i.id === id);
  }

  function getVfsChildren(parentId) {
    return osState.vfsFiles.filter(
      (i) => i.parentId === parentId && i.id !== "root"
    );
  }

  function normalizeVfsAfterImport() {
    ensureVfsRoot();
  }

  function openFileInViewer(file) {
    if (!file) return;
    osState.viewerFile = file;
    if (appRenderers.viewer && appRenderers.viewer.render) {
      appRenderers.viewer.render();
    }
    openApp("viewer");
  }

  /* Desktop & selection */
  const desktop = document.getElementById("desktop");
  const icons = Array.from(document.querySelectorAll(".icon"));
  const selectionBox = document.getElementById("selection-box");
  const startMenu = document.getElementById("startMenu");
  const taskbarPinsContainer = document.querySelector(".taskbar-pins");
  const contextMenuEl = document.getElementById("contextMenu");
  const startMenuRecentsContainer = document.querySelector(
    ".start-menu-recents"
  );

  const desktopIconsContainer = document.getElementById("desktopIcons");

  // Grid constants
  const DESKTOP_GRID_CELL_W = 96;
  const DESKTOP_GRID_CELL_H = 88;

  // Load saved positions & hidden icons from localStorage
  let desktopIconPositions = {};
  try {
    desktopIconPositions = JSON.parse(
      localStorage.getItem("desktopIconPositions") || "{}"
    );
  } catch (e) {
    desktopIconPositions = {};
  }

  let desktopHiddenIcons = [];
  try {
    desktopHiddenIcons = JSON.parse(
      localStorage.getItem("desktopHiddenIcons") || "[]"
    );
  } catch (e) {
    desktopHiddenIcons = [];
  }

  function persistDesktopIconState() {
    localStorage.setItem(
      "desktopIconPositions",
      JSON.stringify(desktopIconPositions)
    );
    localStorage.setItem(
      "desktopHiddenIcons",
      JSON.stringify(desktopHiddenIcons)
    );
  }

  function applyDesktopIconState() {
    if (!desktopIconsContainer) return;

    icons.forEach((icon) => {
      const name = icon.dataset.name;
      if (desktopHiddenIcons.includes(name)) {
        icon.style.display = "none";
        return;
      } else {
        icon.style.display = "";
      }

      const pos = desktopIconPositions[name];
      if (
        pos &&
        typeof pos.left === "number" &&
        typeof pos.top === "number"
      ) {
        icon.style.position = "absolute";
        icon.style.left = pos.left + "px";
        icon.style.top = pos.top + "px";
      }
    });
  }

  applyDesktopIconState();

  function snapToGridSingle(left, top, icon, containerRect) {
    let col = Math.round(left / DESKTOP_GRID_CELL_W);
    let row = Math.round(top / DESKTOP_GRID_CELL_H);
    let snappedLeft = col * DESKTOP_GRID_CELL_W;
    let snappedTop = row * DESKTOP_GRID_CELL_H;

    const maxLeft = containerRect.width - icon.offsetWidth;
    const maxTop = containerRect.height - icon.offsetHeight;
    snappedLeft = Math.max(0, Math.min(snappedLeft, maxLeft));
    snappedTop = Math.max(0, Math.min(snappedTop, maxTop));
    return { left: snappedLeft, top: snappedTop, col, row };
  }

  const iconDragState = {
    active: false,
    items: [],
    mouseStartX: 0,
    mouseStartY: 0,
  };

  const iconContextMenu = document.createElement("div");
  iconContextMenu.className = "context-menu";
  iconContextMenu.style.display = "none";
  document.body.appendChild(iconContextMenu);
  let iconContextTarget = null;

  function hideIconContextMenu() {
    iconContextMenu.style.display = "none";
    iconContextTarget = null;
  }

  function deleteDesktopIcons(iconList) {
    if (!iconList || !iconList.length) return;
    iconList.forEach((icon) => {
      const name = icon.dataset.name;
      if (!desktopHiddenIcons.includes(name)) {
        desktopHiddenIcons.push(name);
      }
      icon.style.display = "none";
      delete desktopIconPositions[name];
    });
    persistDesktopIconState();
  }

  icons.forEach((icon) => {
    icon.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      const name = icon.dataset.name;
      if (desktopHiddenIcons.includes(name)) return;

      if (!desktopIconsContainer) return;
      const containerRect = desktopIconsContainer.getBoundingClientRect();

      const multiKey = e.ctrlKey || e.metaKey;
      if (multiKey) {
        icon.classList.toggle("selected");
      } else {
        if (!icon.classList.contains("selected")) {
          icons.forEach((i) => i.classList.remove("selected"));
          icon.classList.add("selected");
        }
      }

      const selectedIcons = icons.filter(
        (i) =>
          i.classList.contains("selected") && i.style.display !== "none"
      );
      const dragIcons = selectedIcons.length ? selectedIcons : [icon];

      const dragItems = [];
      dragIcons.forEach((ic) => {
        const rect = ic.getBoundingClientRect();
        if (getComputedStyle(ic).position !== "absolute") {
          ic.style.position = "absolute";
          ic.style.left = rect.left - containerRect.left + "px";
          ic.style.top = rect.top - containerRect.top + "px";
        }
        const newRect = ic.getBoundingClientRect();
        const startLeft = newRect.left - containerRect.left;
        const startTop = newRect.top - containerRect.top;
        const origCol = Math.round(startLeft / DESKTOP_GRID_CELL_W);
        const origRow = Math.round(startTop / DESKTOP_GRID_CELL_H);
        dragItems.push({
          icon: ic,
          startLeft,
          startTop,
          origCol,
          origRow,
        });
      });

      iconDragState.active = true;
      iconDragState.items = dragItems;
      iconDragState.mouseStartX = e.clientX;
      iconDragState.mouseStartY = e.clientY;

      e.stopPropagation();
    });

    icon.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const name = icon.dataset.name;
      if (desktopHiddenIcons.includes(name)) return;

      iconContextTarget = icon;
      iconContextMenu.innerHTML = "";

      const openItem = document.createElement("div");
      openItem.className = "context-menu-item";
      openItem.dataset.action = "open";
      openItem.textContent = "Open";

      const deleteItem = document.createElement("div");
      deleteItem.className = "context-menu-item";
      deleteItem.dataset.action = "delete";
      deleteItem.textContent = "Delete";

      iconContextMenu.appendChild(openItem);
      iconContextMenu.appendChild(deleteItem);

      iconContextMenu.style.left = e.clientX + "px";
      iconContextMenu.style.top = e.clientY + "px";
      iconContextMenu.style.display = "block";
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (
      !iconDragState.active ||
      !iconDragState.items.length ||
      !desktopIconsContainer
    )
      return;

    const containerRect = desktopIconsContainer.getBoundingClientRect();
    const dx = e.clientX - iconDragState.mouseStartX;
    const dy = e.clientY - iconDragState.mouseStartY;

    iconDragState.items.forEach((entry) => {
      const icon = entry.icon;
      let left = entry.startLeft + dx;
      let top = entry.startTop + dy;

      const maxLeft = containerRect.width - icon.offsetWidth;
      const maxTop = containerRect.height - icon.offsetHeight;

      left = Math.max(0, Math.min(left, maxLeft));
      top = Math.max(0, Math.min(top, maxTop));

      icon.style.left = left + "px";
      icon.style.top = top + "px";
    });
  });

  document.addEventListener("mouseup", () => {
    if (
      !iconDragState.active ||
      !iconDragState.items.length ||
      !desktopIconsContainer
    ) {
      iconDragState.active = false;
      iconDragState.items = [];
      return;
    }

    const containerRect = desktopIconsContainer.getBoundingClientRect();

    if (iconDragState.items.length === 1) {
      const entry = iconDragState.items[0];
      const icon = entry.icon;
      const rect = icon.getBoundingClientRect();
      const left = rect.left - containerRect.left;
      const top = rect.top - containerRect.top;
      const snapped = snapToGridSingle(left, top, icon, containerRect);

      icon.style.left = snapped.left + "px";
      icon.style.top = snapped.top + "px";

      const name = icon.dataset.name;
      desktopIconPositions[name] = {
        left: snapped.left,
        top: snapped.top,
      };
    } else {
      const baseEntry = iconDragState.items[0];
      const baseRect = baseEntry.icon.getBoundingClientRect();
      const baseLeft = baseRect.left - containerRect.left;
      const baseTop = baseRect.top - containerRect.top;
      const baseSnap = snapToGridSingle(
        baseLeft,
        baseTop,
        baseEntry.icon,
        containerRect
      );
      const baseColNew = baseSnap.col;
      const baseRowNew = baseSnap.row;

      iconDragState.items.forEach((entry) => {
        const icon = entry.icon;
        const colOffset = entry.origCol - baseEntry.origCol;
        const rowOffset = entry.origRow - baseEntry.origRow;
        let newCol = baseColNew + colOffset;
        let newRow = baseRowNew + rowOffset;

        let snappedLeft = newCol * DESKTOP_GRID_CELL_W;
        let snappedTop = newRow * DESKTOP_GRID_CELL_H;

        const maxLeft = containerRect.width - icon.offsetWidth;
        const maxTop = containerRect.height - icon.offsetHeight;
        snappedLeft = Math.max(0, Math.min(snappedLeft, maxLeft));
        snappedTop = Math.max(0, Math.min(snappedTop, maxTop));

        icon.style.left = snappedLeft + "px";
        icon.style.top = snappedTop + "px";

        const name = icon.dataset.name;
        desktopIconPositions[name] = {
          left: snappedLeft,
          top: snappedTop,
        };
      });
    }

    persistDesktopIconState();

    iconDragState.active = false;
    iconDragState.items = [];
  });

  document.addEventListener("mousedown", (e) => {
    if (
      iconContextMenu.style.display === "block" &&
      !e.target.closest(".context-menu")
    ) {
      hideIconContextMenu();
    }
  });

  iconContextMenu.addEventListener("click", (e) => {
    const item = e.target.closest(".context-menu-item");
    if (!item || !iconContextTarget) return;
    const action = item.dataset.action;
    const icon = iconContextTarget;
    const appId = icon.dataset.app;

    if (action === "open" && appId) {
      if (typeof openApp === "function") {
        openApp(appId);
      }
    } else if (action === "delete") {
      deleteDesktopIcons([icon]);
    }
    hideIconContextMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Delete") {
      const selected = icons.filter(
        (i) =>
          i.classList.contains("selected") && i.style.display !== "none"
      );
      if (!selected.length) return;
      deleteDesktopIcons(selected);
    }
  });

  let isSelecting = false;
  let startX = 0;
  let startY = 0;
  let topZ = 930;
  let startMenuOpen = false;

  function clearSelection() {
    icons.forEach((icon) => icon.classList.remove("selected"));
  }

  function rectsOverlap(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  function openStartMenu() {
    startMenu.style.display = "block";
    startMenuOpen = true;
  }

  function closeStartMenu() {
    startMenu.style.display = "none";
    startMenuOpen = false;
  }

  function toggleStartMenu() {
    if (startMenuOpen) closeStartMenu();
    else openStartMenu();
  }

  function renderStartMenuRecents() {
    if (!startMenuRecentsContainer) return;
    startMenuRecentsContainer.innerHTML = "";
    const items = osState.recentItems || [];

    if (!items.length) {
      const empty = document.createElement("div");
      empty.style.fontSize = "11px";
      empty.style.opacity = "0.8";
      empty.style.padding = "2px 0";
      empty.textContent = "No recent items yet.";
      startMenuRecentsContainer.appendChild(empty);
      return;
    }

    items.slice(0, 6).forEach((entry) => {
      const row = document.createElement("div");
      row.className = "start-menu-recent-item";

      const iconSpan = document.createElement("span");
      iconSpan.textContent = entry.icon || "📄";

      const labelSpan = document.createElement("span");
      labelSpan.textContent = entry.label || "Item";

      row.appendChild(iconSpan);
      row.appendChild(labelSpan);

      row.addEventListener("click", () => {
        if (entry.type === "app") {
          openApp(entry.appId);
        } else if (entry.type === "file" && entry.fileId) {
          const file = getVfsItem(entry.fileId);
          if (file) {
            openFileInViewer(file);
          } else {
            alert("File not found in current file system.");
          }
        }
      });

      startMenuRecentsContainer.appendChild(row);
    });
  }

  function addRecent(item) {
    if (!osState.recentItems) osState.recentItems = [];
    const key =
      item.type === "file"
        ? "fileId"
        : item.type === "app"
        ? "appId"
        : null;

    osState.recentItems = osState.recentItems.filter((existing) => {
      if (existing.type !== item.type) return true;
      if (!key) return true;
      return existing[key] !== item[key];
    });

    osState.recentItems.unshift(item);
    if (osState.recentItems.length > 8) {
      osState.recentItems.length = 8;
    }
    renderStartMenuRecents();
  }

  desktop.addEventListener("mousedown", (e) => {
    const clickedIcon = e.target.closest(".icon");
    const clickedTaskbar = e.target.closest(".taskbar");
    const clickedWindow = e.target.closest(".window");
    const clickedStartMenu = e.target.closest(".start-menu");
    if (clickedTaskbar || clickedWindow || clickedStartMenu) return;

    if (clickedIcon) {
      const multi = e.ctrlKey || e.metaKey;
      if (multi) {
        clickedIcon.classList.toggle("selected");
      } else {
        clearSelection();
        clickedIcon.classList.add("selected");
      }
      return;
    }

    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;

    clearSelection();

    selectionBox.style.display = "block";
    selectionBox.style.left = startX + "px";
    selectionBox.style.top = startY + "px";
    selectionBox.style.width = "0px";
    selectionBox.style.height = "0px";

    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const rootStyles = getComputedStyle(document.documentElement);
    const taskbarHeight =
      parseInt(rootStyles.getPropertyValue("--taskbar-height")) || 0;
    const maxBottom = window.innerHeight - taskbarHeight;

    const left = Math.max(0, Math.min(startX, currentX));
    const right = Math.min(window.innerWidth, Math.max(startX, currentX));
    const top = Math.max(0, Math.min(startY, currentY));
    const bottom = Math.min(maxBottom, Math.max(startY, currentY));

    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);

    selectionBox.style.left = left + "px";
    selectionBox.style.top = top + "px";
    selectionBox.style.width = width + "px";
    selectionBox.style.height = height + "px";

    const selectionRect = selectionBox.getBoundingClientRect();
    icons.forEach((icon) => {
      const rect = icon.getBoundingClientRect();
      if (rectsOverlap(selectionRect, rect)) {
        icon.classList.add("selected");
      } else {
        icon.classList.remove("selected");
      }
    });
  });

  document.addEventListener("mouseup", () => {
    if (!isSelecting) return;
    isSelecting = false;
    selectionBox.style.display = "none";
  });

  document.addEventListener("mousedown", (e) => {
    if (!startMenuOpen) return;
    const inStartMenu = e.target.closest(".start-menu");
    const inStartButton = e.target.closest(".taskbar-start-btn");
    if (!inStartMenu && !inStartButton) {
      closeStartMenu();
    }
  });

  /* Window helpers */
  function bringToFront(win) {
    topZ += 1;
    win.style.zIndex = topZ;
    
    document.querySelectorAll('.window').forEach(w => {
      w.classList.remove('active-window');
    });
    
    win.classList.add('active-window');
  }

  function attachDragHandlers(win, titleBar) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    titleBar.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (win.dataset.maximized === "true") return;

      const tabsRoot = e.target.closest(".browser-tabs");
      const tabInteractive = e.target.closest(
        ".browser-tab, .browser-add-tab"
      );
      if (tabsRoot && tabInteractive) return;

      dragging = true;
      bringToFront(win);
      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      titleBar.style.cursor = "grabbing";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      let x = e.clientX - offsetX;
      let y = e.clientY - offsetY;
      const margin = 0;
      const taskbarH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--taskbar-height"
        )
      );
      const maxX = window.innerWidth - win.offsetWidth;
      const maxY = window.innerHeight - taskbarH - win.offsetHeight;
      x = Math.min(Math.max(margin, x), Math.max(margin, maxX));
      y = Math.min(Math.max(margin, y), Math.max(margin, maxY));
      win.style.left = x + "px";
      win.style.top = y + "px";
    });

    document.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      titleBar.style.cursor = "grab";
    });
  }

  const resizeState = {
    active: false,
    win: null,
    dir: "",
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    startL: 0,
    startT: 0,
  };

  function attachResizeHandlers(win) {
    const handles = win.querySelectorAll(".resize-handle");
    handles.forEach((handle) => {
      handle.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        if (win.dataset.maximized === "true") return;
        const dir = handle.dataset.resizeDir || "";
        const rect = win.getBoundingClientRect();
        resizeState.active = true;
        resizeState.win = win;
        resizeState.dir = dir;
        resizeState.startX = e.clientX;
        resizeState.startY = e.clientY;
        resizeState.startW = rect.width;
        resizeState.startH = rect.height;
        resizeState.startL = rect.left;
        resizeState.startT = rect.top;
        e.preventDefault();
        e.stopPropagation();
      });
    });
  }

  /* FIX WINDOW STACKING */
  function makeWindowFocusable(win) {
    win.addEventListener('mousedown', function(e) {
      const isResizeHandle = e.target.closest('.resize-handle');
      
      if (!isResizeHandle) {
        bringToFront(win);
      }
    });
    
    const resizeHandles = win.querySelectorAll('.resize-handle');
    resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', function(e) {
        bringToFront(win);
      });
    });
  }

  document.addEventListener("mousemove", (e) => {
    if (!resizeState.active || !resizeState.win) return;
    const dx = e.clientX - resizeState.startX;
    const dy = e.clientY - resizeState.startY;
    let newW = resizeState.startW;
    let newH = resizeState.startH;
    let newL = resizeState.startL;
    let newT = resizeState.startT;
    const dir = resizeState.dir;

    const rootStyles = getComputedStyle(document.documentElement);
    const taskbarH =
      parseInt(rootStyles.getPropertyValue("--taskbar-height")) || 0;

    if (dir.includes("e")) newW = resizeState.startW + dx;
    if (dir.includes("s")) newH = resizeState.startH + dy;
    if (dir.includes("w")) {
      newW = resizeState.startW - dx;
      newL = resizeState.startL + dx;
    }
    if (dir.includes("n")) {
      newH = resizeState.startH - dy;
      newT = resizeState.startT + dy;
    }

    const minW = 320;
    const minH = 220;
    const maxW = window.innerWidth;
    const maxH = window.innerHeight - taskbarH;

    if (newW < minW) {
      if (dir.includes("w")) newL += newW - minW;
      newW = minW;
    }
    if (newH < minH) {
      if (dir.includes("n")) newT += newH - minH;
      newH = minH;
    }
    if (newW > maxW) {
      if (dir.includes("w")) newL += newW - maxW;
      newW = maxW;
    }
    if (newH > maxH) {
      if (dir.includes("n")) newT += newH - maxH;
      newH = maxH;
    }
    if (newL < 0) {
      if (dir.includes("w")) newW += newL;
      newL = 0;
    }
    if (newT < 0) {
      if (dir.includes("n")) newH += newT;
      newT = 0;
    }

    const win = resizeState.win;
    win.style.left = newL + "px";
    win.style.top = newT + "px";
    win.style.width = newW + "px";
    win.style.height = newH + "px";
  });

  document.addEventListener("mouseup", () => {
    if (resizeState.active) {
      resizeState.active = false;
      resizeState.win = null;
    }
  });

  /* Taskbar helpers */
  function getTaskbarApp(appId) {
    return document.querySelector(`.taskbar-app[data-app="${appId}"]`);
  }

  function ensureTaskbarApp(appId) {
    if (appId === "start") return getTaskbarApp("start");
    let btn = getTaskbarApp(appId);
    if (!btn) {
      btn = document.createElement("div");
      btn.className = "taskbar-app";
      btn.dataset.app = appId;
      if (osState.pinnedApps.includes(appId)) {
        btn.dataset.pinned = "true";
      }
      const span = document.createElement("span");
      span.textContent = appTaskbarIcon[appId] || "📦";
      btn.appendChild(span);
      taskbarPinsContainer.appendChild(btn);
      attachTaskbarAppHandlers(btn);
    }
    return btn;
  }

  function setTaskbarDot(appId, on) {
    if (appId === "start") return;
    let btn = getTaskbarApp(appId);
    if (on) {
      if (!btn) btn = ensureTaskbarApp(appId);
      let dot = btn.querySelector(".taskbar-app-dot");
      if (!dot) {
        dot = document.createElement("div");
        dot.className = "taskbar-app-dot";
        btn.appendChild(dot);
      }
    } else {
      if (!btn) return;
      const dot = btn.querySelector(".taskbar-app-dot");
      if (dot) dot.remove();
    }
  }

  function updateTaskbarDotForApp(appId) {
    if (appId === "start") return;
    const anyWin = document.querySelector(`.window[data-app="${appId}"]`);
    if (anyWin) {
      setTaskbarDot(appId, true);
    } else {
      setTaskbarDot(appId, false);
      const btn = getTaskbarApp(appId);
      if (btn && !osState.pinnedApps.includes(appId)) {
        btn.remove();
      }
    }
  }

  function findTopmostWindow(appId) {
    const wins = Array.from(
      document.querySelectorAll(`.window[data-app="${appId}"]`)
    );
    if (!wins.length) return null;
    wins.sort(
      (a, b) =>
        (parseInt(a.style.zIndex || 0) || 0) -
        (parseInt(b.style.zIndex || 0) || 0)
    );
    return wins[wins.length - 1];
  }

  function syncTaskbarPinsFromState() {
    const existing = Array.from(
      document.querySelectorAll(
        '.taskbar-app[data-app]:not([data-app="start"])'
      )
    );
    existing.forEach((btn) => {
      const appId = btn.dataset.app;
      if (osState.pinnedApps.includes(appId)) {
        btn.remove();
      }
    });

    if (!Array.isArray(osState.pinnedApps)) osState.pinnedApps = [];
    osState.pinnedApps = Array.from(new Set(osState.pinnedApps));

    osState.pinnedApps.forEach((appId) => {
      let btn = getTaskbarApp(appId);
      if (btn) {
        btn.dataset.pinned = "true";
        return;
      }
      btn = document.createElement("div");
      btn.className = "taskbar-app";
      btn.dataset.app = appId;
      btn.dataset.pinned = "true";
      const span = document.createElement("span");
      span.textContent = appTaskbarIcon[appId] || "📦";
      btn.appendChild(span);
      taskbarPinsContainer.appendChild(btn);
      attachTaskbarAppHandlers(btn);
    });
  }

  function pinApp(appId) {
    if (appId === "start") return;
    if (!Array.isArray(osState.pinnedApps)) osState.pinnedApps = [];
    if (!osState.pinnedApps.includes(appId)) {
      osState.pinnedApps.push(appId);
      osState.neverAutoPinApps = osState.neverAutoPinApps.filter(
        (id) => id !== appId
      );
      syncTaskbarPinsFromState();
    }
  }

  function unpinApp(appId) {
    if (appId === "start") return;
    if (!Array.isArray(osState.pinnedApps)) osState.pinnedApps = [];
    osState.pinnedApps = osState.pinnedApps.filter((id) => id !== appId);
    if (!osState.neverAutoPinApps.includes(appId)) {
      osState.neverAutoPinApps.push(appId);
    }
    syncTaskbarPinsFromState();
    const btn = getTaskbarApp(appId);
    const anyWin = document.querySelector(`.window[data-app="${appId}"]`);
    if (!anyWin && btn) btn.remove();
  }

  /* App content builders */
  function createAppContent(appId) {
    switch (appId) {
      case "browser": {
        ensureBrowserDefaults();

        const wrapper = document.createElement("div");
        wrapper.className = "window-content";
        wrapper.style.overflow = "hidden";
        wrapper.style.padding = "8px";

        const tabsBar = document.createElement("div");
        tabsBar.className = "browser-tabs";

        const addTabBtn = document.createElement("button");
        addTabBtn.className = "browser-add-tab";
        addTabBtn.textContent = "+";

        const frameHost = document.createElement("div");
        frameHost.style.flex = "1";
        frameHost.style.display = "flex";
        frameHost.style.position = "relative";
        frameHost.style.borderRadius = "10px";
        frameHost.style.overflow = "hidden";
        frameHost.style.marginTop = "4px";
        frameHost.style.boxShadow =
          "inset 0 0 0 1px rgba(255,255,255,0.1)";

        const resizeGrip = document.createElement("div");
        resizeGrip.className = "window-resize-handle";
        wrapper.appendChild(resizeGrip);

        const iframeMap = new Map();

        function getOrCreateIframe(tab) {
          let iframe = iframeMap.get(tab.id);
          if (!iframe) {
            iframe = document.createElement("iframe");
            iframe.className = "browser-frame";
            iframe.setAttribute(
              "sandbox",
              "allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            );
            iframe.src = tab.url;
            iframe.style.display = "none";

            iframe.addEventListener("load", () => {
              try {
                const doc = iframe.contentDocument;
                const realTitle = doc && doc.title;
                if (
                  realTitle &&
                  realTitle.trim() &&
                  tab.title !== realTitle.trim()
                ) {
                  tab.title = realTitle.trim();
                  renderBrowserUI();
                }
              } catch (e) {}
            });

            iframeMap.set(tab.id, iframe);
            frameHost.appendChild(iframe);
          }
          return iframe;
        }

        function getActiveBrowserTab() {
          return (
            osState.browserTabs.find(
              (t) => t.id === osState.browserActiveTabId
            ) || null
          );
        }

        function updateFrames() {
          ensureBrowserDefaults();
          const activeTab = osState.browserTabs.find(
            (t) => t.id === osState.browserActiveTabId
          );

          iframeMap.forEach((iframe, id) => {
            iframe.style.display =
              id === osState.browserActiveTabId ? "block" : "none";
          });

          if (activeTab) {
            const iframe = getOrCreateIframe(activeTab);
            iframe.style.display = "block";
          }
        }

        function getBrowserTabLabel(tab) {
          if (tab.title && tab.title.trim() && tab.title !== tab.url) {
            return tab.title.trim();
          }
          if (tab.url) {
            try {
              const u = new URL(tab.url);
              let label = u.hostname;
              if (label.length > 30) label = label.slice(0, 27) + "...";
              return label || "Tab";
            } catch (e) {
              return "Tab";
            }
          }
          return "Tab";
        }

        function renderBrowserUI() {
          ensureBrowserDefaults();
          tabsBar.innerHTML = "";

          osState.browserTabs.forEach((tab) => {
            const tabEl = document.createElement("div");
            tabEl.className = "browser-tab";
            if (tab.id === osState.browserActiveTabId) {
              tabEl.classList.add("active");
            }

            const label = getBrowserTabLabel(tab);
            const labelSpan = document.createElement("span");
            labelSpan.textContent = label;
            labelSpan.title = label;

            const closeSpan = document.createElement("span");
            closeSpan.className = "browser-tab-close";
            closeSpan.textContent = "×";

            tabEl.appendChild(labelSpan);
            tabEl.appendChild(closeSpan);

            closeSpan.addEventListener("click", (e) => {
              e.stopPropagation();
              closeTab(tab.id);
            });

            tabEl.addEventListener("click", () => {
              osState.browserActiveTabId = tab.id;
              renderBrowserUI();
            });

            tabsBar.appendChild(tabEl);
          });

          tabsBar.appendChild(addTabBtn);
          updateFrames();
        }

        function addTab(url) {
          const id =
            "tab-" +
            Date.now() +
            "-" +
            Math.random().toString(16).slice(2);
          const home = osState.settings.homepage || "https://8xy7zj-8080.csb.app";
          const tab = {
            id,
            title: "New Tab",
            url: home,
          };
          osState.browserTabs.push(tab);
          osState.browserActiveTabId = id;
          renderBrowserUI();
        }

        function closeTab(id) {
          const idx = osState.browserTabs.findIndex((t) => t.id === id);
          if (idx === -1) return;
          osState.browserTabs.splice(idx, 1);
          const iframe = iframeMap.get(id);
          if (iframe) {
            iframe.remove();
            iframeMap.delete(id);
          }
          if (!osState.browserTabs.length) {
            addTab();
          } else if (osState.browserActiveTabId === id) {
            osState.browserActiveTabId =
              osState.browserTabs[Math.max(0, idx - 1)].id;
          }
          renderBrowserUI();
        }

        addTabBtn.addEventListener("click", () => {
          addTab();
        });

        wrapper.appendChild(tabsBar);
        wrapper.appendChild(frameHost);

        appRenderers.browser = {
          render: renderBrowserUI,
          openUrlInNewTab: addTab,
        };
        wrapper._browserTabsBar = tabsBar;
        renderBrowserUI();

        return wrapper;
      }
      
      case "chat": {
        const wrapper = document.createElement("div");
        wrapper.className = "window-content";
        wrapper.style.padding = "0";
        wrapper.style.overflow = "hidden";
        
        const chatFrame = document.createElement("iframe");
        chatFrame.className = "chat-frame";
        chatFrame.src = "https://chat-connect-b27eac4d.base44.app/SignIn";
        chatFrame.style.width = "100%";
        chatFrame.style.height = "100%";
        chatFrame.style.border = "none";
        chatFrame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
        chatFrame.setAttribute("allowfullscreen", "true");
        
        wrapper.appendChild(chatFrame);
        
        const resizeGrip = document.createElement("div");
        resizeGrip.className = "window-resize-handle";
        wrapper.appendChild(resizeGrip);
        
        appRenderers.chat = {
          render: () => {}
        };
        
        return wrapper;
      }

      case "files": {
        const wrapper = document.createElement("div");
        wrapper.className = "window-content";
        wrapper.innerHTML = "<h2>File Explorer</h2><p>This is a simplified file explorer demo.</p>";
        const resizeGrip = document.createElement("div");
        resizeGrip.className = "window-resize-handle";
        wrapper.appendChild(resizeGrip);
        return wrapper;
      }

      case "notepad": {
        const wrapper = document.createElement("div");
        wrapper.className = "window-content";
        const h = document.createElement("h2");
        h.textContent = "Untitled - Notepad";
        const textarea = document.createElement("textarea");
        textarea.className = "notepad-textarea";
        textarea.value = osState.notepadText || "";
        textarea.spellcheck = false;
        textarea.addEventListener("input", () => {
          osState.notepadText = textarea.value;
        });
        const resizeGrip = document.createElement("div");
        resizeGrip.className = "window-resize-handle";
        wrapper.appendChild(h);
        wrapper.appendChild(textarea);
        wrapper.appendChild(resizeGrip);
        return wrapper;
      }

      case "calculator": {
        const wrapper = document.createElement("div");
        wrapper.className = "window-content";

        const h = document.createElement("h2");
        h.textContent = "Calculator";

        const root = document.createElement("div");
        root.className = "calculator-root";

        const displayWrapper = document.createElement("div");
        displayWrapper.className = "calculator-display-wrapper";

        const subDisplay = document.createElement("div");
        subDisplay.className = "calculator-subdisplay";

        const display = document.createElement("div");
        display.className = "calculator-display";
        display.textContent = "0";

        displayWrapper.appendChild(subDisplay);
        displayWrapper.appendChild(display);

        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "calculator-buttons";

        let current = "0";
        let pending = "";

        function updateDisplay() {
          subDisplay.textContent = pending;
          display.textContent = current;
        }

        function clearAll() {
          current = "0";
          pending = "";
          updateDisplay();
        }

        function backspace() {
          if (
            current.length <= 1 ||
            (current.length === 2 && current.startsWith("-"))
          ) {
            current = "0";
          } else {
            current = current.slice(0, -1);
          }
          updateDisplay();
        }

        function toggleSign() {
          if (current === "0") return;
          if (current.startsWith("-")) {
            current = current.slice(1);
          } else {
            current = "-" + current;
          }
          updateDisplay();
        }

        function appendDigit(d) {
          if (d === ".") {
            if (current.includes(".")) return;
            current = current + ".";
          } else {
            if (current === "0") {
              current = d;
            } else {
              current = current + d;
            }
          }
          updateDisplay();
        }

        function pushOp(op) {
          if (pending) {
            pending = pending.replace(/\s*[+\-*/]\s*$/, "");
          }
          pending = (pending ? pending + " " : "") + current + " " + op;
          current = "0";
          updateDisplay();
        }

        function evalExpression() {
          const expr = pending ? pending + " " + current : current;
          if (!expr.trim()) return;

          const safeExpr = expr.replace(/[^0-9+\-*/. ]/g, "");
          try {
            const result = eval(safeExpr);
            if (typeof result === "number" && isFinite(result)) {
              current = String(result);
              pending = "";
              updateDisplay();
            }
          } catch (e) {
            current = "Error";
            pending = "";
            updateDisplay();
            setTimeout(() => {
              clearAll();
            }, 800);
          }
        }

        const buttons = [
          { label: "C", action: () => clearAll() },
          { label: "⌫", action: () => backspace() },
          { label: "±", action: () => toggleSign() },
          { label: "÷", action: () => pushOp("/"), op: "/" },

          { label: "7", action: () => appendDigit("7") },
          { label: "8", action: () => appendDigit("8") },
          { label: "9", action: () => appendDigit("9") },
          { label: "×", action: () => pushOp("*"), op: "*" },

          { label: "4", action: () => appendDigit("4") },
          { label: "5", action: () => appendDigit("5") },
          { label: "6", action: () => appendDigit("6") },
          { label: "−", action: () => pushOp("-"), op: "-" },

          { label: "1", action: () => appendDigit("1") },
          { label: "2", action: () => appendDigit("2") },
          { label: "3", action: () => appendDigit("3") },
          { label: "+", action: () => pushOp("+"), op: "+" },

          { label: "0", action: () => appendDigit("0") },
          { label: ".", action: () => appendDigit(".") },
          { label: "=", action: () => evalExpression(), op: "=" },
        ];

        buttons.forEach((btnDef) => {
          const b = document.createElement("button");
          b.textContent = btnDef.label;
          if (btnDef.op) {
            b.dataset.op = btnDef.op;
          }
          b.addEventListener("click", btnDef.action);
          buttonsContainer.appendChild(b);
        });

        const resizeGrip = document.createElement("div");
        resizeGrip.className = "window-resize-handle";

        root.appendChild(displayWrapper);
        root.appendChild(buttonsContainer);

        wrapper.appendChild(h);
        wrapper.appendChild(root);
        wrapper.appendChild(resizeGrip);

        return wrapper;
      }

      case "about": {
        const wrapper = document.createElement("div");
        wrapper.className = "window-content";

        const h = document.createElement("h2");
        h.textContent = "About This System";

        const p1 = document.createElement("p");
        p1.textContent =
          "This is Royal Source OS, a demo in-browser desktop environment.";

        const p2 = document.createElement("p");
        p2.textContent =
          "Features include: draggable and resizable windows, a Start menu, taskbar with pinned apps, a file explorer, web browser, chat app, notepad, calculator, and more.";

        wrapper.appendChild(h);
        wrapper.appendChild(p1);
        wrapper.appendChild(p2);

        const resizeGrip = document.createElement("div");
        resizeGrip.className = "window-resize-handle";
        wrapper.appendChild(resizeGrip);

        return wrapper;
      }

      default: {
        const wrapper = document.createElement("div");
        wrapper.className = "window-content";
        wrapper.innerHTML = `<h2>${appTitles[appId] || "App"}</h2><p>This app is under construction.</p>`;
        const resizeGrip = document.createElement("div");
        resizeGrip.className = "window-resize-handle";
        wrapper.appendChild(resizeGrip);
        return wrapper;
      }
    }
  }

  /* Taskbar context menu handlers */
  function attachTaskbarAppHandlers(btn) {
    const appId = btn.dataset.app;
    btn.addEventListener("click", () => openApp(appId));
  }

  function openApp(appId, options = {}) {
    if (appId === "start") {
      toggleStartMenu();
      return;
    }
    closeStartMenu();

    const newInstance = options.newInstance === true;

    if (!newInstance) {
      const existing = findTopmostWindow(appId);
      if (existing) {
        if (existing.dataset.minimized === "true") {
          existing.style.display = "flex";
          delete existing.dataset.minimized;
        }
        bringToFront(existing);
        updateTaskbarDotForApp(appId);
        return;
      }
    }

    if (!osState.neverAutoPinApps.includes(appId)) {
      pinApp(appId);
    }

    let win = document.createElement("div");
    win.className = "window";
    win.dataset.app = appId;

    const titleBar = document.createElement("div");
    titleBar.className = "window-titlebar";

    const title = document.createElement("div");
    title.className = "window-title";
    title.textContent = appTitles[appId] || "App";

    const controls = document.createElement("div");
    controls.className = "window-controls";

    const minBtn = document.createElement("div");
    minBtn.className = "window-btn min";
    minBtn.dataset.action = "minimize";
    minBtn.innerHTML = '<div class="window-btn-glyph win-min"></div>';

    const maxBtn = document.createElement("div");
    maxBtn.className = "window-btn max";
    maxBtn.dataset.action = "maximize";
    maxBtn.innerHTML = '<div class="window-btn-glyph win-max"></div>';

    const closeBtn = document.createElement("div");
    closeBtn.className = "window-btn close";
    closeBtn.dataset.action = "close";
    closeBtn.innerHTML = '<div class="window-btn-glyph win-close"></div>';

    controls.appendChild(minBtn);
    controls.appendChild(maxBtn);
    controls.appendChild(closeBtn);

    titleBar.appendChild(title);
    titleBar.appendChild(controls);

    const content = createAppContent(appId);

    win.appendChild(titleBar);
    win.appendChild(content);

    const handleDefs = [
      { dir: "n", class: "resize-handle edge n" },
      { dir: "s", class: "resize-handle edge s" },
      { dir: "e", class: "resize-handle edge e" },
      { dir: "w", class: "resize-handle edge w" },
      { dir: "ne", class: "resize-handle corner ne" },
      { dir: "nw", class: "resize-handle corner nw" },
      { dir: "se", class: "resize-handle corner se" },
      { dir: "sw", class: "resize-handle corner sw" },
    ];
    handleDefs.forEach((h) => {
      const div = document.createElement("div");
      div.className = h.class;
      div.dataset.resizeDir = h.dir;
      win.appendChild(div);
    });

    desktop.appendChild(win);
    makeWindowFocusable(win);

    const initialWidth = Math.min(640, window.innerWidth - 40);
    const initialHeight = Math.min(420, window.innerHeight - 120);
    win.style.width = initialWidth + "px";
    win.style.height = initialHeight + "px";
    win.style.left = (window.innerWidth - initialWidth) / 2 + "px";
    win.style.top = (window.innerHeight - initialHeight) / 2 - 40 + "px";

    bringToFront(win);
    attachDragHandlers(win, titleBar);
    attachResizeHandlers(win);

    if (appId !== "start") {
      updateTaskbarDotForApp(appId);
    }

    minBtn.addEventListener("click", () => {
      win.style.display = "none";
      win.dataset.minimized = "true";
    });

    maxBtn.addEventListener("click", () => {
      const taskbarH = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--taskbar-height"
        )
      );
      if (win.dataset.maximized === "true") {
        const prev = win._prevRect;
        if (prev) {
          win.style.left = prev.left + "px";
          win.style.top = prev.top + "px";
          win.style.width = prev.width + "px";
          win.style.height = prev.height + "px";
        }
        delete win.dataset.maximized;
      } else {
        const rect = win.getBoundingClientRect();
        win._prevRect = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
        win.style.left = "0px";
        win.style.top = "0px";
        win.style.width = window.innerWidth + "px";
        win.style.height = window.innerHeight - taskbarH + "px";
        win.dataset.maximized = "true";
      }
    });

    closeBtn.addEventListener("click", () => {
      const closingApp = win.dataset.app;
      win.remove();
      updateTaskbarDotForApp(closingApp);
    });

    win.addEventListener("mousedown", () => bringToFront(win));

    addRecent({
      type: "app",
      appId,
      label: appTitles[appId] || "App",
      icon: appTaskbarIcon[appId] || "📦",
    });
  }

  // Initialize pinned apps
  const initialPinnedButtons = Array.from(
    document.querySelectorAll(
      '.taskbar-app[data-app]:not([data-app="start"])'
    )
  );
  osState.pinnedApps = Array.from(
    new Set(initialPinnedButtons.map((btn) => btn.dataset.app))
  );

  // Make openApp globally available
  window.openApp = openApp;

  // Desktop icons double-click
  icons.forEach((icon) => {
    icon.addEventListener("dblclick", () => {
      const appId = icon.dataset.app;
      if (appId) {
        openApp(appId);
      }
    });
  });

  // Start menu apps
  document.querySelectorAll(".start-menu-app").forEach((btn) => {
    btn.addEventListener("click", () => {
      const appId = btn.dataset.app;
      openApp(appId);
    });
  });

  const powerBtn = document.querySelector(".start-menu-power");
  if (powerBtn) {
    powerBtn.addEventListener("click", () => {
      const sure = confirm(
        "Shut down Web OS? This will close all open windows."
      );
      if (!sure) return;
      document.querySelectorAll(".window").forEach((w) => w.remove());
      document
        .querySelectorAll(".taskbar-app-dot")
        .forEach((dot) => dot.remove());
      closeStartMenu();
    });
  }

  // Clock update using 12-hour format (non-military)
  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const timeStr = `${hours}:${minutes} ${ampm}`;
    
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const year = now.getFullYear();
    const dateStr = `${month}/${day}/${year}`;

    document.getElementById("trayTime").textContent = timeStr;
    document.getElementById("trayDate").textContent = dateStr;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // Initialize
  normalizeVfsAfterImport();
  applySettings();
  syncTaskbarPinsFromState();
  renderStartMenuRecents();
})();
