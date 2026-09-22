const MAX_ORDER = 12;
const MAX_FIELD_SIZE = 97;
let orderModeAnnouncementTimer = null;

const REFERENCE_LIBRARY = {
  singleton_like: {
    id: "singleton_like",
    label:
      "Etzion, T.; Silberstein, N. (2009). Error-Correcting Codes in Projective Spaces via Rank-Metric Codes and Ferrers Diagrams.",
    url: "https://doi.org/10.1109/TIT.2009.2021376",
  },
  neri_stanojkovski_2024: {
    id: "neri_stanojkovski_2024",
    label:
      "Neri, A.; Stanojkovski, M. (2024). A proof of the Etzion-Silberstein conjecture for monotone and MDS-constructible Ferrers diagrams.",
    url: "https://doi.org/10.1016/j.jcta.2024.105937",
  },
  trivial_code: {
    id: "trivial_code",
    label:
      "Trivial linear code construction: the zero subspace is always an [F, k=0, d]_q code.",
  },
  full_space_d1: {
    id: "full_space_d1",
    label:
      "For d=1, the full Ferrers-supported matrix space gives k = |F| exactly.",
  },
  max_rank_limit: {
    id: "max_rank_limit",
    label:
      "If d exceeds max possible rank on F, only the zero code is possible.",
  },
};

// Optional exact/manual entries for known parameters.
const STORED_BOUNDS = {
  "1,2,3,3|1|2": {
    upper: 9,
    lower: 9,
    upperRef: "singleton_like",
    lowerRef: "full_space_d1",
  },
};

const viewState = {
  columns: null,
  d: null,
  q: null,
  characteristic: null,
};

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

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i += 1) {
    if (n % i === 0) return false;
  }
  return true;
}

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

function isPowerOfPrime(q, p) {
  if (!Number.isInteger(q) || q < 2 || !isPrime(p)) return false;
  let n = q;
  while (n % p === 0) {
    n /= p;
  }
  return n === 1;
}

function ferrersCellCount(columns) {
  return columns.reduce((sum, c) => sum + c, 0);
}

function ferrersOrder(columns) {
  const rows = Math.max(...columns);
  const cols = columns.length;
  return Math.max(rows, cols);
}

function expandToOrderTuple(columns) {
  const n = ferrersOrder(columns);
  return Array(n - columns.length)
    .fill(0)
    .concat(columns);
}

function isOrderNTriangular(orderTuple) {
  return orderTuple.every((height, index) => height <= index + 1);
}

function maxPossibleRank(columns) {
  return Math.min(Math.max(...columns), columns.length);
}

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

function nuMin(columns, d) {
  return diagonalCellCounts(columns).reduce(
    (sum, count) => sum + Math.max(0, count - d + 1),
    0
  );
}

function isMonotone(orderTuple) {
  const n = orderTuple.length;
  for (let i = 0; i < n - 1; i += 1) {
    if (orderTuple[i] > 0 && orderTuple[i] < n && orderTuple[i + 1] <= orderTuple[i]) {
      return false;
    }
  }
  return true;
}

function isStrictlyMonotone(orderTuple) {
  for (let i = 0; i < orderTuple.length - 1; i += 1) {
    if (orderTuple[i] > 0 && orderTuple[i + 1] <= orderTuple[i]) {
      return false;
    }
  }
  return true;
}

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

function classifyConstruction(columns, d, q, characteristicInfo) {
  const upper = etzionSilbersteinUpper(columns, d);
  const orderTuple = expandToOrderTuple(columns);
  const triangular = isOrderNTriangular(orderTuple);
  const diagonalCounts = triangular ? diagonalCellCounts(columns) : [];
  const diagonalLower = triangular ? nuMin(columns, d) : null;
  const strictlyMonotone = triangular && isStrictlyMonotone(orderTuple);

  let pMonotone = false;
  let pMonotoneData = null;
  if (triangular && characteristicInfo.characteristic) {
    pMonotoneData = pHeightAndContraction(orderTuple, characteristicInfo.characteristic);
    pMonotone =
      isPowerOfPrime(orderTuple.length, characteristicInfo.characteristic) &&
      isMonotone(pMonotoneData.contraction);
  }

  const mdsConstructible = diagonalLower !== null && diagonalLower === upper;

  if (mdsConstructible) {
    return {
      upper,
      lower: diagonalLower,
      upperRef: "singleton_like",
      lowerRef: "neri_stanojkovski_2024",
      source: "derived",
      construction: {
        attained: true,
        label: "MDS-constructible diagonal construction",
        family: "MDS-constructible",
        diagonalCounts,
        diagonalLower,
        orderTuple,
        triangular,
        strictlyMonotone,
        pMonotone,
        pMonotoneData,
        characteristicInfo,
      },
    };
  }

  if (strictlyMonotone) {
    return {
      upper,
      lower: diagonalLower,
      upperRef: "singleton_like",
      lowerRef: "neri_stanojkovski_2024",
      source: "derived",
      construction: {
        attained: true,
        label: "Explicit diagonal construction",
        family: "strictly monotone",
        diagonalCounts,
        diagonalLower,
        orderTuple,
        triangular,
        strictlyMonotone,
        pMonotone,
        pMonotoneData,
        characteristicInfo,
      },
    };
  }

  if (pMonotone) {
    return {
      upper,
      lower: diagonalLower,
      upperRef: "singleton_like",
      lowerRef: "neri_stanojkovski_2024",
      source: "derived",
      construction: {
        attained: true,
        label: "Explicit diagonal construction",
        family: "p-monotone",
        diagonalCounts,
        diagonalLower,
        orderTuple,
        triangular,
        strictlyMonotone,
        pMonotone,
        pMonotoneData,
        characteristicInfo,
      },
    };
  }

  return {
    upper,
    lower: 0,
    upperRef: "singleton_like",
    lowerRef: "trivial_code",
    source: "derived",
    construction: {
      attained: false,
      label: null,
      family: null,
      diagonalCounts,
      diagonalLower,
      orderTuple,
      triangular,
      strictlyMonotone,
      pMonotone,
      pMonotoneData,
      characteristicInfo,
    },
  };
}

function keyFor(columns, d, q) {
  return `${columns.join(",")}|${d}|${q}`;
}

function getStoredBounds(columns, d, q) {
  const key = keyFor(columns, d, q);
  return STORED_BOUNDS[key] || null;
}

function derivedBounds(columns, d, q, characteristicInfo) {
  const cells = ferrersCellCount(columns);
  const rMax = maxPossibleRank(columns);

  if (d === 1) {
    return {
      upper: cells,
      lower: cells,
      upperRef: "singleton_like",
      lowerRef: "full_space_d1",
      source: "derived",
      construction: {
        attained: true,
        label: "Full Ferrers-supported space",
        family: "d = 1 exact case",
        diagonalCounts: diagonalCellCounts(columns),
        diagonalLower: nuMin(columns, d),
        orderTuple: expandToOrderTuple(columns),
        triangular: isOrderNTriangular(expandToOrderTuple(columns)),
        strictlyMonotone: isStrictlyMonotone(expandToOrderTuple(columns)),
        pMonotone: false,
        pMonotoneData: null,
        characteristicInfo,
      },
    };
  }

  if (d > rMax) {
    return {
      upper: 0,
      lower: 0,
      upperRef: "max_rank_limit",
      lowerRef: "max_rank_limit",
      source: "derived",
      construction: {
        attained: true,
        label: "Only the zero code is possible",
        family: "distance exceeds maximum rank",
        diagonalCounts: [],
        diagonalLower: null,
        orderTuple: expandToOrderTuple(columns),
        triangular: isOrderNTriangular(expandToOrderTuple(columns)),
        strictlyMonotone: false,
        pMonotone: false,
        pMonotoneData: null,
        characteristicInfo,
      },
    };
  }

  return classifyConstruction(columns, d, q, characteristicInfo);
}

function bestKnownBounds(columns, d, q, characteristicInfo) {
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
        diagonalCounts: diagonalCellCounts(columns),
        diagonalLower: nuMin(columns, d),
        orderTuple: expandToOrderTuple(columns),
        triangular: isOrderNTriangular(expandToOrderTuple(columns)),
        strictlyMonotone: isStrictlyMonotone(expandToOrderTuple(columns)),
        pMonotone: false,
        pMonotoneData: null,
        characteristicInfo,
      },
    };
  }
  return derivedBounds(columns, d, q, characteristicInfo);
}

function describeCharacteristic(characteristicInfo) {
  if (!characteristicInfo.characteristic) {
    return "Characteristic not supplied; p-monotone detection is limited to prime q.";
  }
  if (characteristicInfo.source === "derived_from_prime_q") {
    return `Characteristic p = ${characteristicInfo.characteristic} inferred because q is prime.`;
  }
  return `Characteristic p = ${characteristicInfo.characteristic} supplied explicitly.`;
}

function describeConstruction(bounds) {
  const details = [];
  const { construction } = bounds;

  details.push(`Order-n tuple: [${construction.orderTuple.join(", ")}]`);

  if (!construction.triangular) {
    details.push(
      "This input is not in the order-n triangular convention c_i ≤ i, so the diagonal family test is not certified here."
    );
    return details;
  }

  details.push(`Diagonal sizes |D ∩ Δ_i^n|: [${construction.diagonalCounts.join(", ")}]`);
  details.push(`ν_min(D,d) = ${construction.diagonalLower}`);
  details.push(describeCharacteristic(construction.characteristicInfo));

  if (construction.strictlyMonotone) {
    details.push("Family check: strictly monotone in the normalized ascending column convention.");
  } else if (construction.pMonotone) {
    details.push(
      `Family check: p-monotone after p-contraction with p-height ${construction.pMonotoneData.height} and contraction [${construction.pMonotoneData.contraction.join(", ")}].`
    );
  } else {
    details.push("Family check: no supported strictly monotone or p-monotone certificate detected.");
  }

  if (!construction.attained) {
    details.push(
      "The site computes ν_min for comparison, but does not claim a theorem-backed explicit construction for this input."
    );
  }

  return details;
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
  const characteristicText = viewState.characteristic
    ? `, char(F_q) = ${viewState.characteristic}`
    : "";

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
    const attainedValue =
      bounds.construction.diagonalLower !== null ? bounds.construction.diagonalLower : bounds.lower;
    constructionItem.textContent = `${bounds.construction.label}: k = ${attainedValue}`;
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

function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseOptionalPositiveInt(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return parsePositiveInt(value);
}

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

function main() {
  document.getElementById(
    "limits"
  ).textContent = `Configured limits: order N ≤ ${MAX_ORDER}, field size q ≤ ${MAX_FIELD_SIZE}.`;

  document.getElementById(
    "name_last_update"
  ).textContent = `This page is maintained by Hugo Beeloo-Sauerbier Couvee (hugo.sauerbier-couvee@tum.de). Last update: 2026-09-22`;

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

if (typeof module !== "undefined") {
  module.exports = {
    REFERENCE_LIBRARY,
    STORED_BOUNDS,
    parseColumns,
    isPrime,
    isPrimePower,
    isPowerOfPrime,
    ferrersCellCount,
    ferrersOrder,
    expandToOrderTuple,
    isOrderNTriangular,
    maxPossibleRank,
    etzionSilbersteinUpper,
    diagonalCellCounts,
    nuMin,
    isMonotone,
    isStrictlyMonotone,
    isConstantOnBlocks,
    pHeightAndContraction,
    characteristicInfoFor,
    classifyConstruction,
    derivedBounds,
    bestKnownBounds,
  };
}
