import {
  buildConstructionDetails,
  isMonotone,
  isPowerOfPrime,
  pHeightAndContraction,
} from "../shared.js";

// Derive the contraction data needed for p-monotone checks.
export function getPMonotoneData(context) {
  const characteristic = context.characteristicInfo.characteristic;
  if (!context.triangular || !characteristic) {
    return null;
  }
  return pHeightAndContraction(context.orderTuple, characteristic);
}

// Detect whether the input satisfies the p-monotone family conditions.
export function isPMonotoneFamily(context) {
  const characteristic = context.characteristicInfo.characteristic;
  const contractionData = getPMonotoneData(context);

  return (
    Boolean(characteristic) &&
    Boolean(contractionData) &&
    isPowerOfPrime(context.orderTuple.length, characteristic) &&
    isMonotone(contractionData.contraction)
  );
}

// Build the attained lower bound for p-monotone diagrams.
export function evaluatePMonotoneLowerBound(context) {
  const contractionData = getPMonotoneData(context);

  return {
    id: "neri_2024_p_monotone",
    value: context.diagonalLower,
    ref: "neri_stanojkovski_2024",
    construction: {
      attained: true,
      label: "Explicit diagonal construction",
      family: "p-monotone",
      pMonotoneData: contractionData,
      details: buildConstructionDetails(context, {
        attained: true,
        familyMessages: [
          `Family check: p-monotone after p-contraction with p-height ${contractionData.height} and contraction [${contractionData.contraction.join(", ")}].`,
        ],
      }),
    },
  };
}

// Register the p-monotone lower-bound rule.
const pMonotoneLowerBound = {
  id: "neri_2024_p_monotone",
  appliesTo: isPMonotoneFamily,
  evaluate: evaluatePMonotoneLowerBound,
};

// Export the default lower-bound registration.
export default pMonotoneLowerBound;
