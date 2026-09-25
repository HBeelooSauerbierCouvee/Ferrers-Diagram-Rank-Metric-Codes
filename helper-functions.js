

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

// Compute characteristic p of a prime power q.
export function characteristicOfPrimePower(q) {
  if (!Number.isInteger(q) || q < 2) return null;
  for (let p = 2; p * p <= q; p += 1) {
    if (q % p !== 0) continue;
    let n = q;
    while (n % p === 0) n /= p;
    if (n === 1) return p;
  }
  return null;
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
  return columns.reduce((sum, column) => sum + column, 0);
}

// Compute the width of the Ferrers diagram.
export function diagramWidth(columns) {
  return columns.length;
}

// Compute the height of the Ferrers diagram.
export function diagramHeight(columns) {
  return Math.max(...columns);
}

// Compute the order n determined by the diagram dimensions.
export function diagramOrder(columns) {
  return Math.max(diagramHeight(columns), diagramWidth(columns));
}

// Left-pad the column sequence to an order-n tuple.
export function expandToOrderN(columns) {
  const n = diagramOrder(columns);
  return Array(n - columns.length)
    .fill(0)
    .concat(columns);
}

// Compute the dual Ferrers diagram.
export function dualDiagram(columns) {
  const n = columns.at(-1);
  const out = new Array(n);
  for (let j = 1; j <= n; j++) {
    const threshold = n + 1 - j;
    out[j - 1] = columns.filter((v) => v >= threshold).length;
  }
  return out;
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


/* // Test whether an order-n tuple satisfies the triangular condition.
export function isOrderNTriangular(orderTuple) {
  return orderTuple.every((height, index) => height <= index + 1);
} */

/* // Compute the largest rank that any supported matrix can attain.
export function maxPossibleRank(columns) {
  return Math.min(Math.max(...columns), columns.length);
}
 */

/* // Count occupied cells on each diagonal of the order-n diagram.
export function diagonalCellCounts(columns) {
  const orderTuple = expandToOrderN(columns);
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
} */

/* // Compute the diagonal lower-bound quantity ν_min(D,d).
export function nuMin(columns, d) {
  return diagonalCellCounts(columns).reduce(
    (sum, count) => sum + Math.max(0, count - d + 1),
    0
  );
} */

/* // Check whether the order-n tuple is monotone in the theorem sense.
export function isMonotone(orderTuple) {
  const n = orderTuple.length;
  for (let i = 0; i < n - 1; i += 1) {
    if (orderTuple[i] > 0 && orderTuple[i] < n && orderTuple[i + 1] <= orderTuple[i]) {
      return false;
    }
  }
  return true;
} */

/* // Check whether the order-n tuple is strictly monotone.
export function isStrictlyMonotone(orderTuple) {
  for (let i = 0; i < orderTuple.length - 1; i += 1) {
    if (orderTuple[i] > 0 && orderTuple[i + 1] <= orderTuple[i]) {
      return false;
    }
  }
  return true;
} */

/* // Check whether the tuple stays constant on fixed-size blocks.
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
} */

/* // Compute the p-height and contracted tuple for p-monotone tests.
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
} */



/* // Resolve and validate the characteristic associated with q.
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
} */

/* // Describe how the characteristic value was determined.
export function describeCharacteristic(characteristicInfo) {
  if (!characteristicInfo.characteristic) {
    return "Characteristic not supplied; p-monotone detection is limited to prime q.";
  }
  if (characteristicInfo.source === "derived_from_prime_q") {
    return `Characteristic p = ${characteristicInfo.characteristic} inferred because q is prime.`;
  }
  return `Characteristic p = ${characteristicInfo.characteristic} supplied explicitly.`;
} */

/* // Assemble the shared context object used by bound evaluators.
export function createEvaluationContext(columns, d, q) {
 // const orderTuple = expandToOrderN(columns);
  //const triangular = isOrderNTriangular(orderTuple);

  return {
    columns: columns.slice(),
    d,
    q,
    char: characteristicOfPrimePower(q),
    cells: ferrersCellCount(columns),
    order: ferrersOrder(columns),
    orderTuple: expandToOrderN(columns),
   // triangular,
   // diagonalCounts: triangular ? diagonalCellCounts(columns) : [],
   // diagonalLower: triangular ? nuMin(columns, d) : null,
  };
} */
