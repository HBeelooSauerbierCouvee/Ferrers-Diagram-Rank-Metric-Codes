import { buildConstructionDetails } from "../../bounds/shared.js";

export function isMdsConstructibleFamily(context) {
  return (
    context.triangular &&
    context.diagonalLower !== null &&
    Boolean(context.bestUpper) &&
    context.diagonalLower === context.bestUpper.value
  );
}

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

const mdsConstructibleLowerBound = {
  id: "neri_2024_mds_constructible",
  appliesTo: isMdsConstructibleFamily,
  evaluate: evaluateMdsConstructibleLowerBound,
};

export default mdsConstructibleLowerBound;
