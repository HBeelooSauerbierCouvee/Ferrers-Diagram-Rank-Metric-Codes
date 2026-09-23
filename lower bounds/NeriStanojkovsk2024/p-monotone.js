import {
  isMonotone,
  isPowerOfPrime,
  pHeightAndContraction,
} from "./shared.js";

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
    },
  };
}

// Explain whether the p-monotone family applies to this input.
export function describePMonotoneApplicability(context, evaluation) {
  const characteristic = context.characteristicInfo.characteristic;
  if (!context.triangular) {
    return [
      `Not applicable because the order-n tuple [${context.orderTuple.join(", ")}] is not triangular.`,
    ];
  }

  if (!characteristic) {
    return ["Not applicable because the field characteristic is unavailable for the p-contraction test."];
  }

  if (!isPowerOfPrime(context.orderTuple.length, characteristic)) {
    return [
      `Not applicable because the order n = ${context.orderTuple.length} is not a power of p = ${characteristic}.`,
    ];
  }

  const contractionData = getPMonotoneData(context);
  if (!evaluation) {
    return [
      `Not applicable because the p-contraction with p = ${characteristic} has height ${contractionData.height} and contraction [${contractionData.contraction.join(", ")}], which is not monotone.`,
    ];
  }

  return [
    `Applicable because the p-contraction with p = ${characteristic} has height ${contractionData.height} and monotone contraction [${contractionData.contraction.join(", ")}].`,
  ];
}

// Register the p-monotone lower-bound rule.
const pMonotoneLowerBound = {
  id: "neri_2024_p_monotone",
  label: "p-monotone lower bound",
  referenceId: "neri_stanojkovski_2024",
  appliesTo: isPMonotoneFamily,
  describeApplicability: describePMonotoneApplicability,
  evaluate: evaluatePMonotoneLowerBound,
};

// Export the default lower-bound registration.
export default pMonotoneLowerBound;
