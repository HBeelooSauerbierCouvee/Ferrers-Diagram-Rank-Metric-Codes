import { 
  isStrictlyMonotone 
} from "./shared.js";

//export { isStrictlyMonotone };



// Build the attained lower bound for strictly monotone diagrams.
export function evaluateStrictlyMonotoneLowerBound(context) {
  return {
    id: "neri_2024_strictly_monotone",
    value: 1,
    ref: "neri_stanojkovski_2024",
    construction: {
      attained: true,
      label: "Explicit diagonal construction",
      family: "strictly monotone",
    },
  };
}

// Explain whether the strictly monotone family applies to this input.
export function describeStrictlyMonotoneApplicability(context, evaluation) {
  if (!evaluation) {
    return [
      `Not applicable because the ${context.isDual ? "dual" : "original"} diagram [${context.columns.join(", ")}] is not strictly monotone.`,
    ];
  }

  return [
    `Applicable because the ${context.isDual ? "dual" : "original"} diagram [${context.columns.join(", ")}] is strictly monotone.`,
  ];
}

// Register the strictly monotone lower-bound rule.
const strictlyMonotoneLowerBound = {
  id: "neri_2024_strictly_monotone",
  label: "Strictly monotone lower bound",
  referenceId: "neri_stanojkovski_2024",
  appliesTo: isStrictlyMonotone,
  describeApplicability: describeStrictlyMonotoneApplicability,
  evaluate: evaluateStrictlyMonotoneLowerBound,
};

// Export the default lower-bound registration.
export default strictlyMonotoneLowerBound;
