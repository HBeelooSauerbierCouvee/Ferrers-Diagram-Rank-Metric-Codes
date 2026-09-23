import { buildConstructionDetails, isStrictlyMonotone } from "../../bounds/shared.js";

export function isStrictlyMonotoneFamily(context) {
  return context.triangular && isStrictlyMonotone(context.orderTuple);
}

export function evaluateStrictlyMonotoneLowerBound(context) {
  return {
    id: "neri_2024_strictly_monotone",
    value: context.diagonalLower,
    ref: "neri_stanojkovski_2024",
    construction: {
      attained: true,
      label: "Explicit diagonal construction",
      family: "strictly monotone",
      details: buildConstructionDetails(context, {
        attained: true,
        familyMessages: [
          "Family check: strictly monotone in the normalized ascending column convention.",
        ],
      }),
    },
  };
}

const strictlyMonotoneLowerBound = {
  id: "neri_2024_strictly_monotone",
  appliesTo: isStrictlyMonotoneFamily,
  evaluate: evaluateStrictlyMonotoneLowerBound,
};

export default strictlyMonotoneLowerBound;
