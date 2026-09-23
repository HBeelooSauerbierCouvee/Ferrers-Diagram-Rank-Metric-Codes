import { buildConstructionDetails } from "../shared.js";

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
      details: buildConstructionDetails(context, {
        attained: true,
        familyMessages: [
          "Family check: MDS-constructible because ν_min(D,d) equals the best registered upper bound.",
        ],
      }),
    },
  };
}

// Register the MDS-constructible lower-bound rule.
const mdsConstructibleLowerBound = {
  id: "neri_2024_mds_constructible",
  appliesTo: isMdsConstructibleFamily,
  evaluate: evaluateMdsConstructibleLowerBound,
};

// Export the default lower-bound registration.
export default mdsConstructibleLowerBound;
