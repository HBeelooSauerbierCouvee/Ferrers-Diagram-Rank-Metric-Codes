import {
  MAX_FIELD_SIZE,
  MAX_ORDER,
  REFERENCE_LIBRARY,
  STORED_BOUNDS,
  buildConstructionDetails,
  characteristicInfoFor,
  createEvaluationContext,
  diagonalCellCounts,
  etzionSilbersteinUpper,
  expandToOrderTuple,
  ferrersCellCount,
  ferrersOrder,
  getStoredBounds,
  isConstantOnBlocks,
  isMonotone,
  isOrderNTriangular,
  isPowerOfPrime,
  isPrime,
  isPrimePower,
  isStrictlyMonotone,
  keyFor,
  maxPossibleRank,
  nuMin,
  pHeightAndContraction,
  parseColumns,
  parseOptionalPositiveInt,
  parsePositiveInt,
} from "./bounds/shared.js";
import { lowerBounds } from "./lower bounds/index.js";
import { upperBounds } from "./upper bounds/index.js";

// Re-export shared helpers for tests and other modules.
export {
  MAX_FIELD_SIZE,
  MAX_ORDER,
  REFERENCE_LIBRARY,
  STORED_BOUNDS,
  characteristicInfoFor,
  diagonalCellCounts,
  etzionSilbersteinUpper,
  expandToOrderTuple,
  ferrersCellCount,
  ferrersOrder,
  isConstantOnBlocks,
  isMonotone,
  isOrderNTriangular,
  isPowerOfPrime,
  isPrime,
  isPrimePower,
  isStrictlyMonotone,
  keyFor,
  maxPossibleRank,
  nuMin,
  pHeightAndContraction,
  parseColumns,
  parseOptionalPositiveInt,
  parsePositiveInt,
};

// Track the pending order-mode announcement timeout.
let orderModeAnnouncementTimer = null;

// Store the latest rendered query so the diagram can be redrawn.
const viewState = {
  columns: null,
  d: null,
  q: null,
  characteristic: null,
};

// Select the smallest applicable upper bound from the registry.
export function evaluateUpperBounds(context, registry = upperBounds) {
  let best = null;

  for (const bound of registry) {
    if (!bound.appliesTo(context)) {
      continue;
    }

    const result = bound.evaluate(context);
    if (!best || result.value < best.value) {
      best = result;
    }
  }

  return best;
}

// Select the largest applicable lower bound from the registry.
export function evaluateLowerBounds(context, registry = lowerBounds) {
  let best = null;

  for (const bound of registry) {
    if (!bound.appliesTo(context)) {
      continue;
    }

    const result = bound.evaluate(context);
    if (!best || result.value > best.value) {
      best = result;
    }
  }

  return best;
}

// Resolve the best available upper and lower bounds for one input.
export function classifyConstruction(columns, d, q, characteristicInfo) {
  const baseContext = createEvaluationContext(columns, d, q, characteristicInfo);
  const bestUpper = evaluateUpperBounds(baseContext);
  const bestLower = evaluateLowerBounds({ ...baseContext, bestUpper });

  if (!bestLower) {
    throw new Error("At least one applicable lower bound must be registered.");
  }

  const resolvedUpper = bestUpper || (bestLower.value === 0 ? { value: 0, ref: bestLower.ref } : null);
  if (!resolvedUpper) {
    throw new Error("At least one applicable upper bound must be registered.");
  }

  return {
    upper: resolvedUpper.value,
    lower: bestLower.value,
    upperRef: resolvedUpper.ref,
    lowerRef: bestLower.ref,
    source: "derived",
    construction: bestLower.construction,
  };
}

// Expose the derived-bound workflow as a named helper.
export function derivedBounds(columns, d, q, characteristicInfo) {
  return classifyConstruction(columns, d, q, characteristicInfo);
}

// Prefer stored exact values before falling back to derived bounds.
export function bestKnownBounds(columns, d, q, characteristicInfo) {
  const stored = getStoredBounds(columns, d, q);
  if (stored) {
    const context = createEvaluationContext(columns, d, q, characteristicInfo);
    return {
      upper: stored.upper,
      lower: stored.lower,
      upperRef: stored.upperRef,
      lowerRef: stored.lowerRef,
      source: "stored",
      construction: {
        attained: true,
        label: "Stored exact value",
        family: "catalogued exact case",
        details: buildConstructionDetails(context, {
          attained: true,
          familyMessages: ["Family check: catalogued exact case from the stored bounds table."],
        }),
      },
    };
  }

  return derivedBounds(columns, d, q, characteristicInfo);
}

// Return the human-readable construction details for a bound result.
export function describeConstruction(bounds) {
  return bounds.construction.details || [];
}

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

  for (let r = 1; r <= rows; r += 1) {
    const rowEl = document.createElement("div");
    rowEl.className = "diagram-row";

    for (let c = 0; c < cols; c += 1) {
      const cellEl = document.createElement("div");
      cellEl.className = "cell";
      if (columns[c] >= r) {
        cellEl.classList.add("filled");
      }
      rowEl.appendChild(cellEl);
    }

    diagramEl.appendChild(rowEl);
    textRows.push(
      Array.from({ length: cols }, (_, c) => (columns[c] >= r ? "█" : "·")).join(" ")
    );
  }

  document.getElementById("diagram-text").textContent = textRows.join("\n");
}

// Refresh the diagram section from the last computed result.
function rerenderDiagramSection(options = {}) {
  if (!viewState.columns) return;

  const orderMode = currentOrderMode();
  const columns = columnsForMode(viewState.columns, orderMode);
  const characteristicText = viewState.characteristic ? `, char(F_q) = ${viewState.characteristic}` : "";

  document.getElementById("summary").textContent =
    `F columns = [${columns.join(", ")}], d = ${viewState.d}, q = ${viewState.q}${characteristicText}.`;
  syncOrderModeUi(orderMode);
  renderDiagram(columns);

  if (options.announce) {
    announceOrderMode(orderMode);
  }
}

// Populate the result, construction, and reference panels.
function renderResult(columns, d, q, characteristicInfo, bounds) {
  viewState.columns = columns.slice();
  viewState.d = d;
  viewState.q = q;
  viewState.characteristic = characteristicInfo.characteristic;

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

  const constructionEl = document.getElementById("construction-details");
  constructionEl.innerHTML = "";
  for (const detail of describeConstruction(bounds)) {
    const li = document.createElement("li");
    li.textContent = detail;
    constructionEl.appendChild(li);
  }

  const refs = [bounds.upperRef, bounds.lowerRef]
    .map((id) => REFERENCE_LIBRARY[id])
    .filter(Boolean);
  const uniqueRefs = refs.filter((ref, index) => refs.indexOf(ref) === index);

  const refsEl = document.getElementById("references");
  refsEl.innerHTML = "";
  for (const ref of uniqueRefs) {
    const li = document.createElement("li");
    if (ref.url) {
      const a = document.createElement("a");
      a.href = ref.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = ref.label;
      li.appendChild(a);
    } else {
      li.textContent = ref.label;
    }
    refsEl.appendChild(li);
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

// Wire the page controls to the bounds calculator.
function main() {
  document.getElementById(
    "limits"
  ).textContent = `Configured limits: order N ≤ ${MAX_ORDER}, field size q ≤ ${MAX_FIELD_SIZE}.`;

  document.getElementById(
    "name_last_update"
  ).textContent = `This page is maintained by Hugo Beeloo-Sauerbier Couvee (hugo.sauerbier-couvee@tum.de). Last update: 2026-09-23`;

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

    const columnsResult = parseColumns(form.columns.value);
    if (columnsResult.error) {
      setError(columnsResult.error);
      return;
    }

    const columns = columnsResult.columns;
    const d = parsePositiveInt(form.distance.value);
    const q = parsePositiveInt(form.field.value);

    if (!d) {
      setError("Minimum distance d must be a positive integer.");
      return;
    }

    if (!q || q < 2) {
      setError("Field size q must be an integer at least 2.");
      return;
    }

    const order = ferrersOrder(columns);
    if (order > MAX_ORDER) {
      setError(`Ferrers diagram order ${order} exceeds N = ${MAX_ORDER}.`);
      return;
    }

    if (q > MAX_FIELD_SIZE) {
      setError(`Field size q must satisfy q ≤ ${MAX_FIELD_SIZE}.`);
      return;
    }

    if (!isPrimePower(q)) {
      setError("Field size q must be a prime power.");
      return;
    }

    const characteristicInfo = characteristicInfoFor(q, form.characteristic.value);
    if (characteristicInfo.error) {
      setError(characteristicInfo.error);
      return;
    }

    const bounds = bestKnownBounds(columns, d, q, characteristicInfo);
    renderResult(columns, d, q, characteristicInfo, bounds);
  });
}

// Start the UI only when running in a browser environment.
if (typeof document !== "undefined") {
  main();
}
