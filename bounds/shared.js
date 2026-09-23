// Define the supported order cap for user inputs.
export const MAX_ORDER = 12;

// Define the supported field-size cap for user inputs.
export const MAX_FIELD_SIZE = 97;

// Collect the citations used by computed and stored bounds.
export const REFERENCE_LIBRARY = {
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
    label: "For d=1, the full Ferrers-supported matrix space gives k = |F| exactly.",
  },
  max_rank_limit: {
    id: "max_rank_limit",
    label: "If d exceeds max possible rank on F, only the zero code is possible.",
  },
};

// Store exact bound values that are already catalogued.
export const STORED_BOUNDS = {
  "1,2,3,3|1|2": {
    upper: 9,
    lower: 9,
    upperRef: "singleton_like",
    lowerRef: "full_space_d1",
  },
};

// Parse and normalize Ferrers column input from the form.
export function parseColumns(raw) {
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
export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i += 1) {
    if (n % i === 0) return false;
  }
  return true;
}

// Check whether a field size is a prime power.
export function isPrimePower(q) {
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
export function isPowerOfPrime(q, p) {
  if (!Number.isInteger(q) || q < 2 || !isPrime(p)) return false;
  let n = q;
  while (n % p === 0) {
    n /= p;
  }
  return n === 1;
}

// Count the total number of cells in a Ferrers diagram.
export function ferrersCellCount(columns) {
  return columns.reduce((sum, c) => sum + c, 0);
}

// Compute the order n determined by the diagram dimensions.
export function ferrersOrder(columns) {
  const rows = Math.max(...columns);
  const cols = columns.length;
  return Math.max(rows, cols);
}

// Left-pad the column sequence to an order-n tuple.
export function expandToOrderTuple(columns) {
  const n = ferrersOrder(columns);
  return Array(n - columns.length)
    .fill(0)
    .concat(columns);
}

// Test whether an order-n tuple satisfies the triangular condition.
export function isOrderNTriangular(orderTuple) {
  return orderTuple.every((height, index) => height <= index + 1);
}

// Compute the largest rank that any supported matrix can attain.
export function maxPossibleRank(columns) {
  return Math.min(Math.max(...columns), columns.length);
}

// Evaluate the Etzion-Silberstein upper bound for the diagram.
export function etzionSilbersteinUpper(columns, d) {
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
export function diagonalCellCounts(columns) {
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
export function nuMin(columns, d) {
  return diagonalCellCounts(columns).reduce(
    (sum, count) => sum + Math.max(0, count - d + 1),
    0
  );
}

// Check whether the order-n tuple is monotone in the theorem sense.
export function isMonotone(orderTuple) {
  const n = orderTuple.length;
  for (let i = 0; i < n - 1; i += 1) {
    if (orderTuple[i] > 0 && orderTuple[i] < n && orderTuple[i + 1] <= orderTuple[i]) {
      return false;
    }
  }
  return true;
}

// Check whether the order-n tuple is strictly monotone.
export function isStrictlyMonotone(orderTuple) {
  for (let i = 0; i < orderTuple.length - 1; i += 1) {
    if (orderTuple[i] > 0 && orderTuple[i + 1] <= orderTuple[i]) {
      return false;
    }
  }
  return true;
}

// Check whether the tuple stays constant on fixed-size blocks.
export function isConstantOnBlocks(orderTuple, blockSize) {
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
export function pHeightAndContraction(orderTuple, p) {
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
export function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Parse an optional positive integer field.
export function parseOptionalPositiveInt(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return parsePositiveInt(value);
}

// Resolve and validate the characteristic associated with q.
export function characteristicInfoFor(q, rawCharacteristic) {
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
export function keyFor(columns, d, q) {
  return `${columns.join(",")}|${d}|${q}`;
}

// Retrieve an exact stored bound when one is available.
export function getStoredBounds(columns, d, q) {
  const key = keyFor(columns, d, q);
  return STORED_BOUNDS[key] || null;
}

// Describe how the characteristic value was determined.
export function describeCharacteristic(characteristicInfo) {
  if (!characteristicInfo.characteristic) {
    return "Characteristic not supplied; p-monotone detection is limited to prime q.";
  }
  if (characteristicInfo.source === "derived_from_prime_q") {
    return `Characteristic p = ${characteristicInfo.characteristic} inferred because q is prime.`;
  }
  return `Characteristic p = ${characteristicInfo.characteristic} supplied explicitly.`;
}

// Assemble the shared context object used by bound evaluators.
export function createEvaluationContext(columns, d, q, characteristicInfo) {
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
export function buildConstructionDetails(context, { familyMessages = [], attained = false } = {}) {
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
