import {
  MAX_FIELD_SIZE,
  MAX_ORDER,
  evaluateQueryInput,
  nonTrivialImplementedReferences,
} from "./bounds-engine.js";

// Track the pending order-mode announcement timeout.
let orderModeAnnouncementTimer = null;

// Store the latest rendered query so the diagram can be redrawn.
const viewState = {
  columns: null,
  d: null,
  q: null,
};

const CITE_TEXT =
  "Beeloo-Sauerbier Couvée, H. (2026). Optimal Ferrers Diagram Rank-Metric Codes (web tool). https://github.com/HBeelooSauerbierCouvee/FerrersDiagramCodeTables";

const CITE_BIBTEX = `@misc{beeloo_sauerbier_couvee_2026_ferrers_tool,
  author       = {Beeloo-Sauerbier Couvée, Hugo},
  title        = {Optimal Ferrers Diagram Rank-Metric Codes},
  year         = {2026},
  howpublished = {Web tool},
  url          = {https://github.com/HBeelooSauerbierCouvee/FerrersDiagramCodeTables}
}`;

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

  document.getElementById("diagram-text").textContent = textRows.join("\n");
}

// Refresh the diagram section from the last computed result.
function rerenderDiagramSection(options = {}) {
  if (!viewState.columns) return;

  const orderMode = currentOrderMode();
  const columns = columnsForMode(viewState.columns, orderMode);
  //const characteristicText = viewState.characteristic ? `, char(F_q) = ${viewState.characteristic}` : "";

  document.getElementById("summary").textContent =
    `F columns = [${columns.join(", ")}], d = ${viewState.d}, q = ${viewState.q}.`;
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

// Render one bound-applicability group.
function renderApplicabilityGroup(title, items) {
  const section = document.createElement("section");
  const heading = document.createElement("h4");
  heading.textContent = title;
  section.appendChild(heading);

  const list = document.createElement("ul");
  for (const item of items) {
    const entry = document.createElement("li");

    const label = document.createElement("strong");
    label.textContent = `${item.label}: ${item.applicable ? "applies" : "does not apply"}${describeBoundValue(item)}`;
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
function renderApplicability(bounds) {
  const container = document.getElementById("construction-details");
  container.innerHTML = "";
  container.appendChild(renderApplicabilityGroup("Upper bounds", bounds.applicability.upper));
  container.appendChild(renderApplicabilityGroup("Lower bounds", bounds.applicability.lower));
}

// Populate the result, applicability, and reference panels.
function renderResult(columns, d, q, bounds) {
  viewState.columns = columns.slice();
  viewState.d = d;
  viewState.q = q;
  //viewState.characteristic = characteristicInfo.characteristic;

  const boundsEl = document.getElementById("bounds");
  boundsEl.innerHTML = "";

  const upperItem = document.createElement("li");
  upperItem.textContent = `Best-known upper bound: k ≤ ${bounds.upper}`;

  const lowerItem = document.createElement("li");
  lowerItem.textContent = `Best-known lower bound: k ≥ ${bounds.lower}`;

  boundsEl.appendChild(upperItem);
  boundsEl.appendChild(lowerItem);

  if (bounds.construction.attained) {
    const constructionItem = document.createElement("li");
    constructionItem.textContent = `${bounds.construction.label}: k = ${bounds.lower}`;
    boundsEl.appendChild(constructionItem);
  }

  renderApplicability(bounds);

  const refsEl = document.getElementById("references");
  refsEl.innerHTML = "";
  for (const ref of bounds.references) {
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
    section.hidden = section.id !== `page-${pageId}`;
  }

  for (const button of document.querySelectorAll("[data-page-target]")) {
    button.classList.toggle("active", button.dataset.pageTarget === pageId);
  }
}

// Render all references for implemented non-trivial bounds.
function renderAllReferences() {
  const list = document.getElementById("all-references");
  if (!list) return;
  list.innerHTML = "";

  const references = nonTrivialImplementedReferences();
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

  document.getElementById(
    "name_last_update"
  ).textContent = `This page is maintained by Hugo Beeloo-Sauerbier Couvée (hugo.sauerbier-couvee [at] tum.de). Last update: 2026-09-24`;
  document.getElementById("cite-text").textContent = CITE_TEXT;
  document.getElementById("cite-bibtex").textContent = CITE_BIBTEX;
  renderAllReferences();
  showPage("home");

  for (const button of document.querySelectorAll("[data-page-target]")) {
    button.addEventListener("click", () => {
      showPage(button.dataset.pageTarget);
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
