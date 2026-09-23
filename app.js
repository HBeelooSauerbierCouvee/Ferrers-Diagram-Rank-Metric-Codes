import {
  MAX_FIELD_SIZE,
  MAX_ORDER,
  REFERENCE_LIBRARY,
  STORED_BOUNDS,
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

let orderModeAnnouncementTimer = null;

const viewState = {
  columns: null,
  d: null,
  q: null,
  characteristic: null,
};

export function evaluateUpperBounds(context) {
  let best = null;

  for (const bound of upperBounds) {
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

export function evaluateLowerBounds(context) {
  let best = null;

  for (const bound of lowerBounds) {
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

export function classifyConstruction(columns, d, q, characteristicInfo) {
  const baseContext = createEvaluationContext(columns, d, q, characteristicInfo);
  const bestUpper = evaluateUpperBounds(baseContext);
  const bestLower = evaluateLowerBounds({ ...baseContext, bestUpper });

  return {
    upper: bestUpper.value,
    lower: bestLower.value,
    upperRef: bestUpper.ref,
    lowerRef: bestLower.ref,
    source: "derived",
    construction: bestLower.construction,
  };
}

export function derivedBounds(columns, d, q, characteristicInfo) {
  return classifyConstruction(columns, d, q, characteristicInfo);
}

export function bestKnownBounds(columns, d, q, characteristicInfo) {
  const stored = getStoredBounds(columns, d, q);
  if (stored) {
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
        details: [],
      },
    };
  }

  return derivedBounds(columns, d, q, characteristicInfo);
}

export function describeConstruction(bounds) {
  return bounds.construction.details || [];
}

function columnsForMode(columns, orderMode) {
  return orderMode === "descending" ? columns.slice().reverse() : columns;
}

function currentOrderMode() {
  const toggle = document.getElementById("diagram-order-toggle");
  return toggle && toggle.checked ? "descending" : "ascending";
}

function syncOrderModeUi(orderMode) {
  const badgeEl = document.getElementById("order-mode-badge");
  if (!badgeEl) return;
  badgeEl.textContent = orderMode === "descending" ? "Descending" : "Ascending";
}

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

function setError(message) {
  document.getElementById("error").textContent = message || "";
  if (message) {
    document.getElementById("results").hidden = true;
  }
}

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

if (typeof document !== "undefined") {
  main();
}
