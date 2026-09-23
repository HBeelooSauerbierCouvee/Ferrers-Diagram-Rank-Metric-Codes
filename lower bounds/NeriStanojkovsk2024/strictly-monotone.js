import { buildConstructionDetails, isStrictlyMonotone } from "../shared.js";

// Detect whether the input is strictly monotone.
export function isStrictlyMonotoneFamily(context) {
  return context.triangular && isStrictlyMonotone(context.orderTuple);
}

// Build the attained lower bound for strictly monotone diagrams.
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

// Explain whether the strictly monotone family applies to this input.
export function describeStrictlyMonotoneApplicability(context, evaluation) {
  if (!context.triangular) {
    return [
      `Not applicable because the order-n tuple [${context.orderTuple.join(", ")}] is not triangular.`,
    ];
  }

  if (!evaluation) {
    return [
      `Not applicable because the order-n tuple [${context.orderTuple.join(", ")}] is not strictly monotone.`,
    ];
  }

  return [
    `Applicable because the order-n tuple [${context.orderTuple.join(", ")}] is strictly monotone.`,
  ];
}

// Register the strictly monotone lower-bound rule.
const strictlyMonotoneLowerBound = {
  id: "neri_2024_strictly_monotone",
  label: "Strictly monotone lower bound",
  referenceId: "neri_stanojkovski_2024",
  appliesTo: isStrictlyMonotoneFamily,
  describeApplicability: describeStrictlyMonotoneApplicability,
  evaluate: evaluateStrictlyMonotoneLowerBound,
};

// Export the default lower-bound registration.
export default strictlyMonotoneLowerBound;
