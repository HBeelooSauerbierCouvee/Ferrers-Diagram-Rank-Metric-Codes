// Detect when the diagonal construction meets the best upper bound.
export function isMdsConstructibleFamily(context) {
  return (
    context.triangular &&
    context.diagonalLower !== null &&
    Boolean(context.bestUpper) &&
    context.diagonalLower === context.bestUpper.value
  );
}

// Build the attained lower bound for MDS-constructible diagrams.
export function evaluateMdsConstructibleLowerBound(context) {
  return {
    id: "neri_2024_mds_constructible",
    value: context.diagonalLower,
    ref: "neri_stanojkovski_2024",
    construction: {
      attained: true,
      label: "MDS-constructible diagonal construction",
      family: "MDS-constructible",
    },
  };
}

// Explain whether the MDS-constructible family applies to this input.
export function describeMdsConstructibleApplicability(context, evaluation) {
  if (!context.triangular) {
    return [
      `Not applicable because the order-n tuple [${context.orderTuple.join(", ")}] is not triangular.`,
    ];
  }

  if (!context.bestUpper) {
    return ["Not applicable because no upper bound was available for comparison."];
  }

  if (!evaluation) {
    return [
      `Not applicable because ν_min(D,d) = ${context.diagonalLower} does not match the best registered upper bound ${context.bestUpper.value}.`,
    ];
  }

  return [
    `Applicable because ν_min(D,d) = ${context.diagonalLower} matches the best registered upper bound ${context.bestUpper.value}.`,
  ];
}

// Register the MDS-constructible lower-bound rule.
const mdsConstructibleLowerBound = {
  id: "neri_2024_mds_constructible",
  label: "MDS-constructible lower bound",
  referenceId: "neri_stanojkovski_2024",
  appliesTo: isMdsConstructibleFamily,
  describeApplicability: describeMdsConstructibleApplicability,
  evaluate: evaluateMdsConstructibleLowerBound,
};

// Export the default lower-bound registration.
export default mdsConstructibleLowerBound;
