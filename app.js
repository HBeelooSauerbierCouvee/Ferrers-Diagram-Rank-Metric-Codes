const MAX_ORDER = 12;
const MAX_FIELD_SIZE = 97;

const REFERENCE_LIBRARY = {
  singleton_like: {
    id: "singleton_like",
    label:
      "Etzion, T.; Silberstein, N. (2009). Error-Correcting Codes in Projective Spaces via Rank-Metric Codes and Ferrers Diagrams.",
    url: "https://doi.org/10.1109/TIT.2009.2021379",
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

function ferrersCellCount(columns) {
  return columns.reduce((sum, c) => sum + c, 0);
}

function ferrersOrder(columns) {
  const rows = Math.max(...columns);
  const cols = columns.length;
  return Math.max(rows, cols);
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

function keyFor(columns, d, q) {
  return `${columns.join(",")}|${d}|${q}`;
}

function getStoredBounds(columns, d, q) {
  const key = keyFor(columns, d, q);
  return STORED_BOUNDS[key] || null;
}

function derivedBounds(columns, d) {
  const cells = ferrersCellCount(columns);
  const rMax = maxPossibleRank(columns);

  if (d === 1) {
    return {
      upper: cells,
      lower: cells,
      upperRef: "singleton_like",
      lowerRef: "full_space_d1",
      source: "derived",
    };
  }

  if (d > rMax) {
    return {
      upper: 0,
      lower: 0,
      upperRef: "max_rank_limit",
      lowerRef: "max_rank_limit",
      source: "derived",
    };
  }

  return {
    upper: etzionSilbersteinUpper(columns, d),
    lower: 0,
    upperRef: "singleton_like",
    lowerRef: "trivial_code",
    source: "derived",
  };
}

function bestKnownBounds(columns, d, q) {
  const stored = getStoredBounds(columns, d, q);
  if (stored) {
    return {
      upper: stored.upper,
      lower: stored.lower,
      upperRef: stored.upperRef,
      lowerRef: stored.lowerRef,
      source: "stored",
    };
  }
  return derivedBounds(columns, d);
}

function renderDiagram(columns) {
  const diagramEl = document.getElementById("diagram");
  diagramEl.innerHTML = "";

  const rows = Math.max(...columns);
  const cols = columns.length;

  for (let r = rows; r >= 1; r -= 1) {
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
  }
}

function renderResult(columns, d, q, bounds) {
  document.getElementById("summary").textContent =
    `F columns = [${columns.join(", ")}], d = ${d}, q = ${q}.`;

  const boundsEl = document.getElementById("bounds");
  boundsEl.innerHTML = "";

  const upperItem = document.createElement("li");
  upperItem.textContent = `Best-known upper bound: k ≤ ${bounds.upper}`;

  const lowerItem = document.createElement("li");
  lowerItem.textContent = `Best-known lower bound: k ≥ ${bounds.lower}`;

  boundsEl.appendChild(upperItem);
  boundsEl.appendChild(lowerItem);

  const refs = [bounds.upperRef, bounds.lowerRef].map((id) => REFERENCE_LIBRARY[id]);
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

  renderDiagram(columns);
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

function main() {
  document.getElementById(
    "limits"
  ).textContent = `Configured limits: order N ≤ ${MAX_ORDER}, field size q ≤ ${MAX_FIELD_SIZE}.`;

  const form = document.getElementById("query-form");
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

    if (!q) {
      setError("Field size q must be a positive integer.");
      return;
    }

    const order = ferrersOrder(columns);
    if (order > MAX_ORDER) {
      setError(`Ferrers diagram order ${order} exceeds N = ${MAX_ORDER}.`);
      return;
    }

    if (d > MAX_ORDER) {
      setError(`Minimum distance d must satisfy d ≤ N = ${MAX_ORDER}.`);
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

    const bounds = bestKnownBounds(columns, d, q);
    renderResult(columns, d, q, bounds);
  });
}

main();
