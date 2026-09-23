import {
  describeCharacteristic,
  isMonotone,
  isPowerOfPrime,
  isStrictlyMonotone,
  pHeightAndContraction,
} from "../bound-helpers.js";

export { isMonotone, isPowerOfPrime, isStrictlyMonotone, pHeightAndContraction };

// Build the explanation lines shown for an attained lower-bound construction.
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
