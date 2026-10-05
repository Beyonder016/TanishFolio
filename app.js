const desktop = document.getElementById("desktop");
const windows = Array.from(document.querySelectorAll(".window"));
const dockButtons = Array.from(document.querySelectorAll(".dock-icon"));
const desktopIcons = Array.from(document.querySelectorAll(".desktop-icon"));
const iconsContainer = document.querySelector(".desktop-icons");
const menuToggle = document.getElementById("menu-toggle");
const menuDropdown = document.getElementById("menu-dropdown");
const menuRoot = document.querySelector(".menu-root");
const menuOptions = Array.from(document.querySelectorAll(".menu-option"));
const appearanceOptions = Array.from(
  document.querySelectorAll(".appearance-option"),
);
const backgroundOptions = Array.from(document.querySelectorAll(".bg-option"));

let zIndexCounter = 10;

if (desktop) {
  desktop.dataset.bg = desktop.dataset.bg || "beach";
}

const bringToFront = (win) => {
  zIndexCounter += 1;
  win.style.zIndex = zIndexCounter;
};

const setDockActive = (id, isActive) => {
  dockButtons.forEach((button) => {
    if (button.dataset.window === id) {
      button.classList.toggle("active", isActive);
    }
  });
};

const openWindow = (id) => {
  const win = document.getElementById(id);
  if (!win) {
    return;
  }
  win.classList.add("is-open");
  win.classList.remove("is-minimized");
  win.setAttribute("aria-hidden", "false");
  bringToFront(win);
  setDockActive(id, true);
};

const closeWindow = (win) => {
  win.classList.remove("is-open", "is-minimized", "is-maximized");
  win.setAttribute("aria-hidden", "true");
  setDockActive(win.id, false);
};

const minimizeWindow = (win) => {
  win.classList.add("is-minimized");
  setDockActive(win.id, true);
};

const toggleMaximize = (win) => {
  win.classList.toggle("is-maximized");
};

windows.forEach((win) => {
  win.addEventListener("mousedown", () => bringToFront(win));
  const titlebar = win.querySelector(".window-titlebar");
  if (titlebar) {
    titlebar.addEventListener("mousedown", (event) => startDrag(event, win));
  }

  win.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const action = button.dataset.action;
      if (action === "close") {
        closeWindow(win);
      }
      if (action === "minimize") {
        minimizeWindow(win);
      }
      if (action === "maximize") {
        toggleMaximize(win);
      }
    });
  });
});

desktopIcons.forEach((icon) => {
  icon.addEventListener("dblclick", () => openWindow(icon.dataset.window));
});

const layoutDesktopIcons = () => {
  if (!iconsContainer || desktopIcons.length === 0) {
    return;
  }

  const containerRect = iconsContainer.getBoundingClientRect();
  const gapX = 96;
  const gapY = 96;
  let column = 0;
  let row = 0;

  desktopIcons.forEach((icon) => {
    const existingX = Number(icon.dataset.x);
    const existingY = Number(icon.dataset.y);
    const hasStoredPosition =
      Number.isFinite(existingX) && Number.isFinite(existingY);

    if (hasStoredPosition) {
      icon.style.left = `${existingX}px`;
      icon.style.top = `${existingY}px`;
      return;
    }

    const iconHeight = icon.offsetHeight || 80;
    let nextY = row * gapY;
    if (nextY + iconHeight > containerRect.height && row > 0) {
      row = 0;
      column += 1;
      nextY = 0;
    }
    const nextX = column * gapX;
    icon.style.left = `${nextX}px`;
    icon.style.top = `${nextY}px`;
    icon.dataset.x = `${nextX}`;
    icon.dataset.y = `${nextY}`;
    row += 1;
  });
};

const clampIconToBounds = (icon) => {
  if (!iconsContainer) {
    return;
  }
  const containerRect = iconsContainer.getBoundingClientRect();
  const maxX = Math.max(0, containerRect.width - icon.offsetWidth);
  const maxY = Math.max(0, containerRect.height - icon.offsetHeight);
  let x = Number(icon.dataset.x);
  let y = Number(icon.dataset.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }
  x = Math.max(0, Math.min(x, maxX));
  y = Math.max(0, Math.min(y, maxY));
  icon.dataset.x = `${x}`;
  icon.dataset.y = `${y}`;
  icon.style.left = `${x}px`;
  icon.style.top = `${y}px`;
};

let iconDragState = null;

const startIconDrag = (event, icon) => {
  if (event.button !== 0 || !iconsContainer) {
    return;
  }
  event.preventDefault();
  const containerRect = iconsContainer.getBoundingClientRect();
  const iconRect = icon.getBoundingClientRect();
  iconDragState = {
    icon,
    containerRect,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - iconRect.left,
    offsetY: event.clientY - iconRect.top,
    hasMoved: false,
  };
  icon.setPointerCapture(event.pointerId);
};

const moveIconDrag = (event) => {
  if (!iconDragState || event.pointerId !== iconDragState.pointerId) {
    return;
  }
  const { icon, containerRect, offsetX, offsetY, startX, startY } =
    iconDragState;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (!iconDragState.hasMoved && Math.hypot(dx, dy) < 4) {
    return;
  }
  if (!iconDragState.hasMoved) {
    iconDragState.hasMoved = true;
    icon.classList.add("is-dragging");
  }
  const maxX = Math.max(0, containerRect.width - icon.offsetWidth);
  const maxY = Math.max(0, containerRect.height - icon.offsetHeight);
  let nextX = event.clientX - containerRect.left - offsetX;
  let nextY = event.clientY - containerRect.top - offsetY;
  nextX = Math.max(0, Math.min(nextX, maxX));
  nextY = Math.max(0, Math.min(nextY, maxY));
  icon.style.left = `${nextX}px`;
  icon.style.top = `${nextY}px`;
  icon.dataset.x = `${Math.round(nextX)}`;
  icon.dataset.y = `${Math.round(nextY)}`;
};

const stopIconDrag = (event) => {
  if (!iconDragState || event.pointerId !== iconDragState.pointerId) {
    return;
  }
  iconDragState.icon.classList.remove("is-dragging");
  iconDragState = null;
};

desktopIcons.forEach((icon) => {
  icon.addEventListener("pointerdown", (event) => startIconDrag(event, icon));
});

window.addEventListener("pointermove", moveIconDrag);
window.addEventListener("pointerup", stopIconDrag);
window.addEventListener("pointercancel", stopIconDrag);

const syncIconBounds = () => {
  desktopIcons.forEach((icon) => clampIconToBounds(icon));
};

requestAnimationFrame(() => {
  layoutDesktopIcons();
  syncIconBounds();
});

window.addEventListener("resize", syncIconBounds);

dockButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.window;
    const win = document.getElementById(id);
    if (!win) {
      return;
    }
    const isOpen = win.classList.contains("is-open");
    const isMinimized = win.classList.contains("is-minimized");
    if (isOpen && !isMinimized) {
      minimizeWindow(win);
      return;
    }
    openWindow(id);
  });
});

const closeMenu = () => {
  if (!menuDropdown || !menuToggle) {
    return;
  }
  menuDropdown.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
};

if (menuToggle && menuDropdown) {
  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = menuDropdown.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (menuRoot && !menuRoot.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

menuOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const action = option.dataset.menuAction;
    if (action === "settings") {
      openWindow("window-settings");
    }
    if (action === "about") {
      openWindow("window-about");
    }
    if (action === "portfolio") {
      openWindow("window-computer");
    }
    closeMenu();
  });
});

let dragState = null;

const startDrag = (event, win) => {
  if (event.button !== 0) {
    return;
  }
  if (win.classList.contains("is-maximized")) {
    return;
  }
  if (event.target.closest(".window-controls")) {
    return;
  }
  event.preventDefault();
  const deskRect = desktop.getBoundingClientRect();
  const winRect = win.getBoundingClientRect();
  dragState = {
    win,
    deskRect,
    offsetX: event.clientX - winRect.left,
    offsetY: event.clientY - winRect.top,
  };
  bringToFront(win);
};

const dragMove = (event) => {
  if (!dragState) {
    return;
  }
  const { win, deskRect, offsetX, offsetY } = dragState;
  const maxX = deskRect.width - win.offsetWidth - 10;
  const maxY = deskRect.height - win.offsetHeight - 10;
  let nextX = event.clientX - deskRect.left - offsetX;
  let nextY = event.clientY - deskRect.top - offsetY;
  nextX = Math.max(10, Math.min(nextX, maxX));
  nextY = Math.max(60, Math.min(nextY, maxY));
  win.style.left = `${nextX}px`;
  win.style.top = `${nextY}px`;
};

const stopDrag = () => {
  dragState = null;
};

window.addEventListener("mousemove", dragMove);
window.addEventListener("mouseup", stopDrag);

const clockEl = document.getElementById("clock");

const updateClock = () => {
  const now = new Date();
  const weekday = now
    .toLocaleString("en-US", { weekday: "short" })
    .toUpperCase();
  const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = now.getDate();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  clockEl.textContent = `${weekday} ${month} ${day} ${hours}:${minutes} ${ampm}`;
};

updateClock();
setInterval(updateClock, 60000);

const computerBreadcrumb = document.getElementById("computer-breadcrumb");
const computerList = document.getElementById("computer-list");
const computerPreview = document.getElementById("computer-preview");
const computerBack = document.getElementById("computer-back");
const sidebarButtons = Array.from(document.querySelectorAll(".sidebar-item"));

const computerViews = {
  portfolio: {
    label: "Portfolio",
    items: [
      { title: "Selected Projects", openView: "projects" },
      { title: "Technical Skills", openView: "skills" },
      { title: "Education", openView: "education" },
      { title: "Recognition", openView: "recognition" },
    ],
  },
  projects: {
    label: "Selected Projects",
    items: [
      {
        title: "3DEXPERIENCE Manufacturing-Item Automation",
        subtitle: "Python, REST APIs, ENOVIA / DELMIA role | Nov. 2025",
        description:
          "Architected a standalone utility to automatically create Manufacturing Items linked to Engineering Items through out-of-the-box relationships. Bulk-input processing reduced the estimated manual execution timeline from two weeks to one day.",
        tags: ["Python", "REST APIs", "3DEXPERIENCE", "DELMIA"],
      },
      {
        title: "Automation of Description Standardization",
        subtitle: "Python, spaCy, Vault, SolidWorks, ERP | May 2026 - Present",
        description:
          "Built an engineering-data standardization workflow integrating Python pipelines with Autodesk Vault, SolidWorks, ERP data, and a controlled reference dictionary. Developed maintainable rule-based NLP logic to map legacy descriptions to standardized tokens.",
        tags: ["Python", "spaCy", "Autodesk Vault", "SolidWorks", "ERP"],
      },
      {
        title: "Cross-Platform CAD Metadata Configurator",
        subtitle: "VB.NET, WinForms, JSON | Aug. 2025 - Present",
        description:
          "Architected CAD add-ins for SolidWorks, Autodesk Inventor, and AutoCAD, replacing manual property entry with a configurable interface for ERP-integrated fields.",
        tags: ["VB.NET", "WinForms", "JSON", "CAD Automation"],
      },
    ],
  },
  skills: {
    label: "Technical Skills",
    items: [
      {
        title: "PLM / Product Data",
        subtitle: "Engineering product lifecycle management",
        description:
          "3DEXPERIENCE Cloud, ENOVIA, DELMIA role, EBOM, MBOM, M-Items, Engineering Change Management, and Autodesk Vault.",
        tags: ["3DEXPERIENCE", "ENOVIA", "DELMIA", "EBOM", "MBOM"],
      },
      {
        title: "Engineering Systems",
        subtitle: "CAD and connected engineering workflows",
        description:
          "AutoCAD, Autodesk Inventor, SolidWorks, CAD customization, engineering-data standardization, and ERP-connected workflows.",
        tags: ["AutoCAD", "Inventor", "SolidWorks", "ERP"],
      },
      {
        title: "Development",
        subtitle: "Automation and application development",
        description:
          "Python, C#, VB.NET, REST APIs, AutoCAD API, WinForms, and JSON.",
        tags: ["Python", "C#", "VB.NET", "REST APIs", "JSON"],
      },
      {
        title: "Tools",
        subtitle: "Workflow and data tooling",
        description:
          "Postman, Microsoft Power Apps, Power Automate, SharePoint, spaCy, and OpenRefine.",
        tags: ["Postman", "Power Apps", "Power Automate", "SharePoint", "spaCy"],
      },
    ],
  },
  education: {
    label: "Education",
    items: [
      {
        title: "M.Tech. Artificial Intelligence and Machine Learning",
        subtitle: "BITS Pilani Work Integrated Learning Programme | July 2026 - Present",
        description:
          "Postgraduate program focused on artificial intelligence and machine learning alongside professional practice.",
        tags: ["M.Tech.", "AI", "Machine Learning"],
      },
      {
        title: "Bachelor of Technology - Mechanical Engineering",
        subtitle: "Savitribai Phule Pune University | Dec. 2021 - June 2024",
        description: "Completed undergraduate studies in Mechanical Engineering.",
        tags: ["B.Tech.", "Mechanical Engineering"],
      },
      {
        title: "Technical Diploma in Mechanical Engineering",
        subtitle: "Maharashtra State Board of Technical Education | Aug. 2018 - July 2021",
        description: "Completed a technical diploma in Mechanical Engineering.",
        tags: ["Diploma", "Mechanical Engineering", "MSBTE"],
      },
    ],
  },
  recognition: {
    label: "Recognition",
    items: [
      {
        title: "Asia Pacific Win Every Day Award",
        subtitle: "Emerson Process Management",
        description:
          "Recognized for redesigning the Engineering Change Management process through a custom Power Apps solution and database.",
        tags: ["Award", "Engineering Change", "Power Apps"],
      },
    ],
  },
  about: {
    label: "About",
    items: [
      {
        title: "Tanish Hire",
        subtitle: "PLM Engineer",
        description:
          "Hands-on experience managing engineering product data and automating product-development workflows across 3DEXPERIENCE Cloud, Autodesk Vault, CAD, and ERP-connected systems.",
        tags: ["PLM", "Product Data", "Automation"],
      },
      {
        title: "Engineering Focus",
        subtitle: "BOM, document, master-data, and change workflows",
        description:
          "Builds Python, C#, and VB.NET tools that improve engineering-data quality, process speed, and downstream ERP readiness.",
        tags: ["BOM Automation", "CAD", "ERP", "Process Improvement"],
      },
    ],
  },
  contact: {
    label: "Contact",
    items: [
      {
        title: "Email",
        subtitle: "tanishhire5@gmail.com",
        description: "Primary email contact.",
        tags: ["Email"],
      },
      {
        title: "Phone",
        subtitle: "+91 95521 11096",
        description: "Direct contact number.",
        tags: ["Phone"],
      },
      {
        title: "Location",
        subtitle: "Pune, Maharashtra",
        description: "Current location.",
        tags: ["Location"],
      },
      {
        title: "LinkedIn",
        subtitle: "linkedin.com/in/tanish-hire/",
        description: "Professional profile.",
        tags: ["LinkedIn"],
      },
    ],
  },
  experience: {
    label: "Work Experience",
    items: [
      {
        title: "Engineer - PLM",
        subtitle: "Emerson Process Management | May 2025 - Present | Pune, MH",
        description:
          "Developed EBOMs and MBOMs in the DELMIA role of 3DEXPERIENCE Cloud using webservices and automation; built a C# .NET Autodesk Vault utility for controlled product-data migration; and designed CAD custom-property add-ins for ERP-ready engineering data.",
        tags: ["3DEXPERIENCE", "DELMIA", "C#", "Autodesk Vault"],
      },
      {
        title: "Engineering Intern",
        subtitle: "Emerson Process Management | Apr. 2024 - Dec. 2024 | Pune, MH",
        description:
          "Built an AutoCAD customization tool using the AutoCAD API, VB.NET, and C# to standardize more than 10,000 legacy drawing templates, resolving inconsistencies and enforcing updated engineering standards.",
        tags: ["AutoCAD API", "VB.NET", "C#", "CAD Standards"],
      },
    ],
  },
};

let viewStack = ["portfolio"];

const renderComputerView = () => {
  const viewId = viewStack[viewStack.length - 1];
  const view = computerViews[viewId];
  if (!view) {
    return;
  }

  computerBreadcrumb.textContent = viewStack
    .map((id) => computerViews[id].label.toUpperCase())
    .join(" / ");

  computerBack.disabled = viewStack.length <= 1;

  computerList.innerHTML = "";
  computerPreview.innerHTML =
    '<div class="empty-state">SELECT A FILE TO PREVIEW</div>';

  view.items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "file-item";
    button.innerHTML = `<svg class="icon small"><use href="#icon-folder"></use></svg><span>${item.title}</span>`;

    button.addEventListener("click", () => {
      const currentItems = Array.from(
        computerList.querySelectorAll(".file-item"),
      );
      currentItems.forEach((node) => node.classList.remove("active"));
      button.classList.add("active");

      if (item.openView) {
        viewStack.push(item.openView);
        renderComputerView();
        return;
      }
      showComputerPreview(viewId, item);
    });

    computerList.appendChild(button);
  });
};

const showComputerPreview = (viewId, item) => {
  const tags = item.tags
    ? `<div class="tags">${item.tags
        .map((tag) => `<span class="tag">${tag.toUpperCase()}</span>`)
        .join("")}</div>`
    : "";

  computerPreview.innerHTML = `
    <h3 class="pixel-title">${item.title.toUpperCase()}</h3>
    <p class="muted">${item.subtitle || ""}</p>
    <p>${item.description || ""}</p>
    ${tags}
  `;

  computerBreadcrumb.textContent = `${viewStack
    .map((id) => computerViews[id].label.toUpperCase())
    .join(" / ")} / ${item.title.toUpperCase()}`;
};

sidebarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.section;
    if (!computerViews[target]) {
      return;
    }
    sidebarButtons.forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    viewStack = [target];
    renderComputerView();
  });
});

computerBack.addEventListener("click", () => {
  if (viewStack.length > 1) {
    viewStack.pop();
    renderComputerView();
  }
});

renderComputerView();

const applyTheme = (theme) => {
  if (!document.body) {
    return;
  }
  document.body.dataset.theme = theme;
};

const initialThemeButton = appearanceOptions.find((button) =>
  button.classList.contains("active"),
);
applyTheme((initialThemeButton && initialThemeButton.dataset.theme) || "light");

appearanceOptions.forEach((button) => {
  button.addEventListener("click", () => {
    appearanceOptions.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyTheme(button.dataset.theme || "light");
  });
});

backgroundOptions.forEach((button) => {
  button.addEventListener("click", () => {
    backgroundOptions.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    if (desktop) {
      desktop.dataset.bg = button.dataset.bg || "beach";
    }
  });
});

const guestbookName = document.getElementById("guestbook-name");
const guestbookMessage = document.getElementById("guestbook-message");
const guestbookSubmit = document.getElementById("guestbook-submit");
const guestbookCount = document.getElementById("guestbook-count");
const guestbookEntries = document.getElementById("guestbook-entries");
const emojiButtons = Array.from(document.querySelectorAll(".emoji-button"));
const activeEmojiButton = emojiButtons.find((button) =>
  button.classList.contains("active"),
);

let selectedEmoji =
  (activeEmojiButton && activeEmojiButton.dataset.emoji) || ":)";

const updateGuestbookCount = () => {
  if (!guestbookMessage || !guestbookCount) {
    return;
  }
  guestbookCount.textContent = `${guestbookMessage.value.length}`;
};

const setSelectedEmoji = (button) => {
  if (!button) {
    return;
  }
  emojiButtons.forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  selectedEmoji = button.dataset.emoji || ":)";
};

emojiButtons.forEach((button) => {
  button.addEventListener("click", () => setSelectedEmoji(button));
});

const formatDate = (date) => {
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
};

const addGuestbookEntry = ({ name, message, emoji }) => {
  if (!guestbookEntries) {
    return;
  }
  const entry = document.createElement("div");
  entry.className = "guestbook-entry";

  const title = document.createElement("div");
  title.className = "entry-title";

  const emojiEl = document.createElement("span");
  emojiEl.className = "entry-emoji";
  emojiEl.textContent = emoji;

  const nameEl = document.createElement("span");
  nameEl.className = "entry-name";
  nameEl.textContent = name || "ANON";

  const dateEl = document.createElement("span");
  dateEl.className = "entry-date";
  dateEl.textContent = formatDate(new Date());

  title.append(emojiEl, nameEl, dateEl);

  const messageEl = document.createElement("div");
  messageEl.className = "entry-message";
  messageEl.textContent = message;

  entry.append(title, messageEl);
  guestbookEntries.prepend(entry);
};

if (guestbookMessage) {
  guestbookMessage.addEventListener("input", updateGuestbookCount);
}

if (guestbookSubmit) {
  guestbookSubmit.addEventListener("click", () => {
    if (!guestbookMessage) {
      return;
    }
    const nameValue = guestbookName && guestbookName.value.trim();
    const messageValue = guestbookMessage.value.trim();
    if (!messageValue) {
      guestbookMessage.focus();
      return;
    }
    addGuestbookEntry({
      name: nameValue ? nameValue.toUpperCase() : "ANON",
      message: messageValue.toUpperCase(),
      emoji: selectedEmoji,
    });
    guestbookMessage.value = "";
    updateGuestbookCount();
  });
}

updateGuestbookCount();

const musicTitle = document.getElementById("music-title");
const musicSubtitle = document.getElementById("music-subtitle");
const musicPlay = document.getElementById("music-play");
const volumeSlider = document.getElementById("music-volume");
const volumePercent = document.getElementById("music-volume-percent");
const stationButtons = Array.from(document.querySelectorAll(".station-item"));
const audioTracks = Array.from(
  document.querySelectorAll("#window-music audio"),
);

let activeStation =
  stationButtons.find((button) => button.classList.contains("active")) ||
  stationButtons[0];
let currentAudio = activeStation
  ? document.getElementById(activeStation.dataset.audio || "")
  : null;
let isPlaying = false;

const setVolume = () => {
  if (!volumeSlider) {
    return;
  }
  const volumeValue = Number(volumeSlider.value) / 100;
  audioTracks.forEach((audio) => {
    audio.volume = volumeValue;
  });
  if (volumePercent) {
    volumePercent.textContent = `${volumeSlider.value}%`;
  }
};

const updateMusicUI = () => {
  if (activeStation && musicTitle && musicSubtitle) {
    musicTitle.textContent = activeStation.dataset.track || "UNKNOWN";
    musicSubtitle.textContent = activeStation.dataset.genre || "RADIO";
  }
  if (musicPlay) {
    musicPlay.textContent = isPlaying ? "||" : ">";
  }
  stationButtons.forEach((button) => {
    button.classList.toggle(
      "is-playing",
      isPlaying && button === activeStation,
    );
  });
  setVolume();
};

const stopAudio = (audio) => {
  if (!audio) {
    return;
  }
  audio.pause();
  audio.currentTime = 0;
};

const playAudio = async (audio) => {
  if (!audio) {
    return;
  }
  try {
    await audio.play();
    isPlaying = true;
  } catch (error) {
    isPlaying = false;
  }
  updateMusicUI();
};

stationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    stationButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeStation = button;
    const nextAudio = document.getElementById(button.dataset.audio || "");
    if (currentAudio && currentAudio !== nextAudio) {
      stopAudio(currentAudio);
    }
    currentAudio = nextAudio;
    isPlaying = true;
    playAudio(currentAudio);
  });
});

if (musicPlay) {
  musicPlay.addEventListener("click", () => {
    if (!currentAudio && activeStation) {
      currentAudio = document.getElementById(activeStation.dataset.audio || "");
    }
    if (isPlaying) {
      stopAudio(currentAudio);
      isPlaying = false;
      updateMusicUI();
      return;
    }
    playAudio(currentAudio);
  });
}

if (volumeSlider) {
  volumeSlider.addEventListener("input", setVolume);
}

audioTracks.forEach((audio) => {
  audio.addEventListener("ended", () => {
    if (audio === currentAudio) {
      isPlaying = false;
      updateMusicUI();
    }
  });
});

updateMusicUI();

openWindow("window-computer");
