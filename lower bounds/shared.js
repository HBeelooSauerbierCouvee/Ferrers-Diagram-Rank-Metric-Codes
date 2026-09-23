// Check whether an integer is prime.
function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i += 1) {
    if (n % i === 0) return false;
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
