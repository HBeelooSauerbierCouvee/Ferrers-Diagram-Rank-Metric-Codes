import {
  MAX_FIELD_SIZE,
  MAX_ORDER,
  evaluateQueryInput,
  nonTrivialImplementedReferences,
} from "./bounds-engine.js";

import { dualDiagram } from "./helper-functions.js";

// Track the pending order-mode announcement timeout.
let orderModeAnnouncementTimer = null;

// Store the latest rendered query so the diagram can be redrawn.
const viewState = {
  columns: null,
  d: null,
  q: null,
};

const LAST_VERSION = "2026-09-25";

const BOTTOM_TEXT = `This page is maintained by Hugo Beeloo-Sauerbier Couvée (hugo.sauerbier-couvee [at] tum.de). Last update: ${LAST_VERSION}.`;

const CITE_TEXT =
  `Beeloo-Sauerbier Couvée, H. (2026). FerrersDiagramCodeTables (version: ${LAST_VERSION}). https://hbeeloosauerbiercouvee.github.io/FerrersDiagramCodeTables/`;

const CITE_BIBTEX = `@misc{beeloo_2026_ferrers_diagram_code_tables,
  author       = {Beeloo-Sauerbier Couvée, Hugo},
  title        = {FerrersDiagramCodeTables},
  year         = {2026},
  note         = {(Version: ${LAST_VERSION})},
  url          = {https://hbeeloosauerbiercouvee.github.io/FerrersDiagramCodeTables/}
}`;

const CONTACT_TEXT = `For questions or feedback, contact: hugo.sauerbier-couvee [at] tum.de`;


const PAGE_IDS = ["home", "references", "cite", "contact"];

// Adapt normalized columns to the currently selected display order.
function columnsForMode(columns, orderMode) {
  return orderMode === "descending" ? columns.slice().reverse() : columns;
}

// Read the active diagram-order toggle from the page.
function currentOrderMode() {
  const toggle = document.getElementById("diagram-order-toggle");
  return toggle && toggle.checked ? "descending" : "ascending";
}

// Update the visible order-mode badge text.
function syncOrderModeUi(orderMode) {
  const badgeEl = document.getElementById("order-mode-badge");
  if (!badgeEl) return;
  badgeEl.textContent = orderMode === "descending" ? "Descending" : "Ascending";
}

// Announce order-mode changes for assistive feedback.
function announceOrderMode(orderMode) {
  const label = orderMode === "descending" ? "Descending" : "Ascending";
  const statusEl = document.getElementById("order-mode-status");
  if (!statusEl) return;
  window.clearTimeout(orderModeAnnouncementTimer);
  statusEl.textContent = "";
  orderModeAnnouncementTimer = window.setTimeout(() => {
    statusEl.textContent = `Diagram order set to ${label}`;
    orderModeAnnouncementTimer = null;
  }, 30);
}

// Render the Ferrers diagram as both grid cells and text rows.
function renderDiagram(columns) {
  const diagramEl = document.getElementById("diagram");
  diagramEl.innerHTML = "";

  const rows = Math.max(...columns);
  const cols = columns.length;
  const textRows = [];

  for (let row = 1; row <= rows; row += 1) {
    const rowEl = document.createElement("div");
    rowEl.className = "diagram-row";

    for (let column = 0; column < cols; column += 1) {
      const cellEl = document.createElement("div");
      cellEl.className = "cell";
      if (columns[column] >= row) {
        cellEl.classList.add("filled");
      }
      rowEl.appendChild(cellEl);
    }

    diagramEl.appendChild(rowEl);
    textRows.push(
      Array.from({ length: cols }, (_, column) => (columns[column] >= row ? "█" : "·")).join(" ")
    );
  }

  // document.getElementById("diagram-text").textContent = textRows.join("\n");
}

// Refresh the diagram section from the last computed result.
function rerenderDiagramSection(options = {}) {
  if (!viewState.columns) return;

  const orderMode = currentOrderMode();
  const columns = columnsForMode(viewState.columns, orderMode);
  //const characteristicText = viewState.characteristic ? `, char(F_q) = ${viewState.characteristic}` : "";

  const dualDiagramColumns = orderMode === "ascending" ? dualDiagram(columns) : dualDiagram(columns.slice().reverse()).reverse(); 
  

  document.getElementById("summary").textContent =
    `Diagram columns: [${columns.join(", ")}], dual diagram: [${dualDiagramColumns.join(", ")}],  d = ${viewState.d}, q = ${viewState.q}.`;
  syncOrderModeUi(orderMode);
  renderDiagram(columns);

  if (options.announce) {
    announceOrderMode(orderMode);
  }
}

// Format the displayed inequality for one applicability entry.
function describeBoundValue(item) {
  if (item.value === null) {
    return "";
  }
  if (item.direction === "upper") {
    return ` (k ≤ ${item.value})`;
  }
  if (item.direction === "lower") {
    return ` (k ≥ ${item.value})`;
  }
  return ` (k = ${item.value})`;
}

// Build the citation-number map and numbered references for displayed bounds.
function buildDisplayedReferenceData(bounds) {
  const displayedReferenceIds = [bounds.upperRef, bounds.lowerRef];

  for (const item of bounds.applicability.upper) {
    if (item.referenceId) {
      displayedReferenceIds.push(item.referenceId);
    }
  }

  for (const item of bounds.applicability.lower) {
    if (item.referenceId) {
      displayedReferenceIds.push(item.referenceId);
    }
  }

  const numberByReferenceId = new Map();
  let nextNumber = 1;
  for (const referenceId of displayedReferenceIds) {
    if (!referenceId || numberByReferenceId.has(referenceId)) {
      continue;
    }
    numberByReferenceId.set(referenceId, nextNumber);
    nextNumber += 1;
  }

  const references = [];
  for (const ref of bounds.references) {
    if (!numberByReferenceId.has(ref.id)) {
      continue;
    }

    references.push({ number: numberByReferenceId.get(ref.id), ...ref });
  }

  references.sort((a, b) => a.number - b.number);
  return { numberByReferenceId, references };
}

// Format a citation suffix for one reference id.
function citationSuffix(referenceId, numberByReferenceId) {
  if (!referenceId || !numberByReferenceId.has(referenceId)) {
    return "";
  }
  return ` [${numberByReferenceId.get(referenceId)}]`;
}


// Render one bound-applicability group.
function renderApplicabilityGroup(items, numberByReferenceId, options = {}) {
  const { showApplicabilityStatus = true } = options;
  const section = document.createElement("section");

  const list = document.createElement("ul");
  for (const item of items) {
    const entry = document.createElement("li");

    const label = document.createElement("strong");
    const statusText = showApplicabilityStatus
      ? `: ${item.applicable ? "applies" : "does not apply"}`
      : ": attains the best lower bound";
    label.textContent = `${item.label}${statusText}${describeBoundValue(item)}${citationSuffix(item.referenceId, numberByReferenceId)}`;
    entry.appendChild(label);

    if (item.details.length > 0) {
      const detailList = document.createElement("ul");
      for (const detail of item.details) {
        const detailItem = document.createElement("li");
        detailItem.textContent = detail;
        detailList.appendChild(detailItem);
      }
      entry.appendChild(detailList);
    }

    list.appendChild(entry);
  }

  section.appendChild(list);
  return section;
}

// Populate the applicability panel from the engine output.
function renderApplicabilityUpper(bounds, numberByReferenceId) {
  const container = document.getElementById("construction-details-upper");
  container.innerHTML = "";
  container.appendChild(renderApplicabilityGroup(bounds.applicability.upper, numberByReferenceId));
}

function renderApplicabilityLower(bounds, numberByReferenceId) {
  const container = document.getElementById("construction-details-lower");
  container.innerHTML = "";
  container.appendChild(
    renderApplicabilityGroup(bounds.applicability.lower, numberByReferenceId, {
      showApplicabilityStatus: false,
    })
  );
}

// Populate the result, applicability, and reference panels.
function renderResult(columns, d, q, bounds) {
  viewState.columns = columns.slice();
  viewState.d = d;
  viewState.q = q;
  //viewState.characteristic = characteristicInfo.characteristic;

  const boundsEl = document.getElementById("bounds");
  boundsEl.innerHTML = "";
  const { numberByReferenceId, references } = buildDisplayedReferenceData(bounds);

  const upperItem = document.createElement("li");
  upperItem.append("Best-known upper bound: ");
  const upperValue = document.createElement("b");
  upperValue.textContent = String(bounds.upper);
  upperItem.appendChild(upperValue);
  upperItem.append(citationSuffix(bounds.upperRef, numberByReferenceId));

  const lowerItem = document.createElement("li");
  lowerItem.append("Best-known lower bound: ");
  const lowerValue = document.createElement("b");
  lowerValue.textContent = String(bounds.lower);
  lowerItem.appendChild(lowerValue);
  lowerItem.append(citationSuffix(bounds.lowerRef, numberByReferenceId));

  boundsEl.appendChild(upperItem);
  boundsEl.appendChild(lowerItem);


  /* if (bounds.construction.attained) {
    const constructionItem = document.createElement("li");
    constructionItem.textContent = `${bounds.construction.label}: k = ${bounds.lower}`;
    boundsEl.appendChild(constructionItem);
  } */

  renderApplicabilityUpper(bounds, numberByReferenceId);
  renderApplicabilityLower(bounds, numberByReferenceId); 

  const refsEl = document.getElementById("references");
  refsEl.innerHTML = "";
  for (const ref of references) {
    const item = document.createElement("li");
    const prefix = document.createElement("span");
    prefix.textContent = `[${ref.number}] `;
    item.appendChild(prefix);
    if (ref.url) {
      const link = document.createElement("a");
      link.href = ref.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = ref.label;
      item.appendChild(link);
    } else {
      item.textContent = ref.label;
    }
    refsEl.appendChild(item);
  }

  rerenderDiagramSection();
  document.getElementById("results").hidden = false;
}

// Show or clear the current validation error message.
function setError(message) {
  document.getElementById("error").textContent = message || "";
  if (message) {
    document.getElementById("results").hidden = true;
  }
}

// Display one of the static pages and sync menu button styles.
function showPage(pageId) {
  for (const section of document.querySelectorAll(".page-section")) {
    section.hidden = section.id !== pageId;
  }

  for (const button of document.querySelectorAll("[data-page-target]")) {
    const isActive = button.dataset.pageTarget === pageId;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  }
}

// Resolve a valid page id from location hash.
function pageIdFromHash() {
  const hash = window.location.hash.replace("#", "");
  const pageId = hash || "home";
  return PAGE_IDS.includes(pageId) ? pageId : "home";
}

// Toggle the navigation menu while keeping the control available.
function syncMenuToggle(collapsed) {
  const layout = document.querySelector(".app-layout");
  const toggle = document.getElementById("menu-toggle");
  if (!layout || !toggle) return;

  layout.classList.toggle("menu-collapsed", collapsed);
  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.setAttribute("aria-label", collapsed ? "Show navigation menu" : "Hide navigation menu");
}

// Render all references for implemented non-trivial bounds.
function renderAllReferences() {
  const list = document.getElementById("all-references");
  if (!list) return;
  list.innerHTML = "";

  const references = nonTrivialImplementedReferences().sort((a, b) => a.label.localeCompare(b.label));
  if (references.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No non-trivial bound references are currently implemented.";
    list.appendChild(item);
    return;
  }

  for (const ref of references) {
    const item = document.createElement("li");
    if (ref.url) {
      const link = document.createElement("a");
      link.href = ref.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = ref.label;
      item.appendChild(link);
    } else {
      item.textContent = ref.label;
    }
    list.appendChild(item);
  }
}

// Wire the page controls to the bounds calculator.
function main() {
  document.getElementById(
    "limits"
  ).textContent = `Configured limits: order N ≤ ${MAX_ORDER}, field size q ≤ ${MAX_FIELD_SIZE}.`;

  document.getElementById("name_last_update").textContent = BOTTOM_TEXT;
  document.getElementById("cite-text").textContent = CITE_TEXT;
  document.getElementById("cite-bibtex").textContent = CITE_BIBTEX;
  document.getElementById("contact-info").textContent = CONTACT_TEXT;

  renderAllReferences();
  showPage(pageIdFromHash());
  syncMenuToggle(false);

  window.addEventListener("hashchange", () => {
    showPage(pageIdFromHash());
  });

  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      syncMenuToggle(!document.querySelector(".app-layout").classList.contains("menu-collapsed"));
    });
  }

  const form = document.getElementById("query-form");
  syncOrderModeUi(currentOrderMode());
  const orderToggle = document.getElementById("diagram-order-toggle");
  if (orderToggle) {
    orderToggle.addEventListener("change", () => {
      rerenderDiagramSection({ announce: true });
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setError("");

    const result = evaluateQueryInput({
      rawColumns: form.columns.value,
      rawDistance: form.distance.value,
      rawFieldSize: form.field.value,
     // rawCharacteristic: form.characteristic.value,
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    renderResult(result.columns, result.d, result.q, result.bounds);
  });
}

// Start the UI only when running in a browser environment.
if (typeof document !== "undefined") {
  main();
}
