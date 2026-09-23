import { lowerBoundReferences, lowerBounds } from "./lower bounds/index.js";
import { upperBoundReferences, upperBounds } from "./upper bounds/index.js";

// Define the supported order cap for user inputs.
const MAX_ORDER = 12;

// Define the supported field-size cap for user inputs.
const MAX_FIELD_SIZE = 97;

// Collect bound references from the upper/lower registries.
const REFERENCE_LIBRARY = {
  ...upperBoundReferences,
  ...lowerBoundReferences,
};

// Store exact bound values that are already catalogued.
const STORED_BOUNDS = {
  "1,2,3,3|1|2": {
    upper: 9,
    lower: 9,
    upperRef: "singleton_like",
    lowerRef: "full_space_d1",
  },
};

// Parse and normalize Ferrers column input from the form.
function parseColumns(raw) {
  const parts = raw
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { error: "Please provide at least one column length." };
  }

  const cols = parts.map((p) => Number(p));
  if (cols.some((c) => !Number.isInteger(c) || c <= 0)) {
    return { error: "Column lengths must be positive integers." };
  }

  const nondecreasing = cols.every((c, i) => i === 0 || cols[i - 1] <= c);
  const nonincreasing = cols.every((c, i) => i === 0 || cols[i - 1] >= c);
  if (!nondecreasing && !nonincreasing) {
    return { error: "Column lengths must be in ascending or descending order." };
  }

  return { columns: nondecreasing ? cols : cols.slice().reverse() };
}

// Check whether an integer is prime.
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i += 1) {
    if (n % i === 0) return false;
  }
  return true;
}

// Check whether a field size is a prime power.
function isPrimePower(q) {
  if (!Number.isInteger(q) || q < 2) return false;
  for (let p = 2; p * p <= q; p += 1) {
    if (q % p !== 0) continue;
    let n = q;
    while (n % p === 0) n /= p;
    return n === 1;
  }
  return true;
}

// Check whether q is a power of the supplied prime p.
function isPowerOfPrime(q, p) {
  if (!Number.isInteger(q) || q < 2 || !isPrime(p)) return false;
  let n = q;
  while (n % p === 0) {
    n /= p;
  }
  return n === 1;
}

// Count the total number of cells in a Ferrers diagram.
function ferrersCellCount(columns) {
  return columns.reduce((sum, c) => sum + c, 0);
}

// Compute the order n determined by the diagram dimensions.
function ferrersOrder(columns) {
  const rows = Math.max(...columns);
  const cols = columns.length;
  return Math.max(rows, cols);
}

// Left-pad the column sequence to an order-n tuple.
function expandToOrderTuple(columns) {
  const n = ferrersOrder(columns);
  return Array(n - columns.length)
    .fill(0)
    .concat(columns);
}

// Test whether an order-n tuple satisfies the triangular condition.
function isOrderNTriangular(orderTuple) {
  return orderTuple.every((height, index) => height <= index + 1);
}

// Compute the largest rank that any supported matrix can attain.
function maxPossibleRank(columns) {
  return Math.min(Math.max(...columns), columns.length);
}

// Evaluate the Etzion-Silberstein upper bound for the diagram.
function etzionSilbersteinUpper(columns, d) {
  const n = columns.length;
  let best = Number.POSITIVE_INFINITY;

  for (let i = 0; i < d; i += 1) {
    const keepColumns = n - (d - 1 - i);
    if (keepColumns <= 0) {
      best = 0;
      continue;
    }

    let count = 0;
    for (let col = 0; col < keepColumns; col += 1) {
      count += Math.max(columns[col] - i, 0);
    }
    best = Math.min(best, count);
  }

  return Math.max(0, Number.isFinite(best) ? best : 0);
}

// Count occupied cells on each diagonal of the order-n diagram.
function diagonalCellCounts(columns) {
  const orderTuple = expandToOrderTuple(columns);
  const n = orderTuple.length;
  const counts = [];

  for (let diagonal = 1; diagonal <= n; diagonal += 1) {
    let count = 0;
    for (let row = 1; row <= n - diagonal + 1; row += 1) {
      if (orderTuple[row + diagonal - 2] >= row) {
        count += 1;
      }
    }
    counts.push(count);
  }

  return counts;
}

// Compute the diagonal lower-bound quantity ν_min(D,d).
function nuMin(columns, d) {
  return diagonalCellCounts(columns).reduce(
    (sum, count) => sum + Math.max(0, count - d + 1),
    0
  );
}

// Check whether the order-n tuple is monotone in the theorem sense.
function isMonotone(orderTuple) {
  const n = orderTuple.length;
  for (let i = 0; i < n - 1; i += 1) {
    if (orderTuple[i] > 0 && orderTuple[i] < n && orderTuple[i + 1] <= orderTuple[i]) {
      return false;
    }
  }
  return true;
}

// Check whether the order-n tuple is strictly monotone.
function isStrictlyMonotone(orderTuple) {
  for (let i = 0; i < orderTuple.length - 1; i += 1) {
    if (orderTuple[i] > 0 && orderTuple[i + 1] <= orderTuple[i]) {
      return false;
    }
  }
  return true;
}

// Check whether the tuple stays constant on fixed-size blocks.
function isConstantOnBlocks(orderTuple, blockSize) {
  for (let start = 0; start < orderTuple.length; start += blockSize) {
    const value = orderTuple[start];
    for (let offset = 1; offset < blockSize; offset += 1) {
      if (orderTuple[start + offset] !== value) {
        return false;
      }
    }
  }
  return true;
}

// Compute the p-height and contracted tuple for p-monotone tests.
function pHeightAndContraction(orderTuple, p) {
  let height = 0;
  let blockSize = 1;

  while (true) {
    const nextBlockSize = blockSize * p;
    const divisibleByBlockSize = orderTuple.every((value) => value % nextBlockSize === 0);
    if (
      orderTuple.length % nextBlockSize !== 0 ||
      !divisibleByBlockSize ||
      !isConstantOnBlocks(orderTuple, nextBlockSize)
    ) {
      break;
    }
    height += 1;
    blockSize = nextBlockSize;
  }

  const contraction = [];
  for (let i = 0; i < orderTuple.length; i += blockSize) {
    contraction.push(orderTuple[i] / blockSize);
  }

  return {
    p,
    height,
    blockSize,
    contraction,
  };
}

// Parse a required positive integer.
function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Parse an optional positive integer field.
function parseOptionalPositiveInt(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return parsePositiveInt(value);
}

// Resolve and validate the characteristic associated with q.
function characteristicInfoFor(q, rawCharacteristic) {
  const characteristic = parseOptionalPositiveInt(rawCharacteristic);

  if (rawCharacteristic !== "" && characteristic === null) {
    return { error: "Field characteristic p must be a positive integer when provided." };
  }

  if (characteristic !== null) {
    if (!isPrime(characteristic)) {
      return { error: "Field characteristic p must be prime." };
    }
    if (!isPowerOfPrime(q, characteristic)) {
      return { error: `Field size q = ${q} is not a power of the supplied characteristic p = ${characteristic}.` };
    }
    return { characteristic, source: "explicit" };
  }

  if (isPrime(q)) {
    return { characteristic: q, source: "derived_from_prime_q" };
  }

  return { characteristic: null, source: "unknown" };
}

// Build the lookup key used by the stored-bounds table.
function keyFor(columns, d, q) {
  return `${columns.join(",")}|${d}|${q}`;
}

// Retrieve an exact stored bound when one is available.
function getStoredBounds(columns, d, q) {
  const key = keyFor(columns, d, q);
  return STORED_BOUNDS[key] || null;
}

// Describe how the characteristic value was determined.
function describeCharacteristic(characteristicInfo) {
  if (!characteristicInfo.characteristic) {
    return "Characteristic not supplied; p-monotone detection is limited to prime q.";
  }
  if (characteristicInfo.source === "derived_from_prime_q") {
    return `Characteristic p = ${characteristicInfo.characteristic} inferred because q is prime.`;
  }
  return `Characteristic p = ${characteristicInfo.characteristic} supplied explicitly.`;
}

// Assemble the shared context object used by bound evaluators.
function createEvaluationContext(columns, d, q, characteristicInfo) {
  const orderTuple = expandToOrderTuple(columns);
  const triangular = isOrderNTriangular(orderTuple);

  return {
    columns: columns.slice(),
    d,
    q,
    characteristicInfo,
    cells: ferrersCellCount(columns),
    rMax: maxPossibleRank(columns),
    orderTuple,
    triangular,
    diagonalCounts: triangular ? diagonalCellCounts(columns) : [],
    diagonalLower: triangular ? nuMin(columns, d) : null,
  };
}

// Build the explanation lines shown for a lower-bound construction.
function buildConstructionDetails(context, { familyMessages = [], attained = false } = {}) {
  const details = [];

  details.push(`Order-n tuple: [${context.orderTuple.join(", ")}]`);

  if (!context.triangular) {
    details.push(
      "This input is not in the order-n triangular convention c_i ≤ i, so the diagonal family test is not certified here."
    );
    return details;
  }

  details.push(`Diagonal sizes |D ∩ Δ_i^n|: [${context.diagonalCounts.join(", ")}]`);
  details.push(`ν_min(D,d) = ${context.diagonalLower}`);
  details.push(describeCharacteristic(context.characteristicInfo));
  details.push(...familyMessages);

  if (!attained) {
    details.push(
      "The site computes ν_min for comparison, but does not claim a theorem-backed explicit construction for this input."
    );
  }

  return details;
}

// Export shared helpers for tests and bound modules.
export {
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
