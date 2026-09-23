//import { buildConstructionDetails } from "../shared.js";

// Provide a fallback rule that always permits the zero code.
export function supportsTrivialCode() {
  return true;
}

// Build the conservative trivial lower bound.
export function evaluateTrivialLowerBound(context) {
  return {
    id: "trivial_code",
    value: 0,
    ref: "trivial_code",
    construction: {
      attained: false,
      label: null,
      family: null,
      /* details: buildConstructionDetails(context, {
        attained: false,
        familyMessages: ["Family check: no supported family certificate detected."],
      }), */
    },
  };
}

// Explain why the trivial lower bound always applies.
export function describeTrivialApplicability(context, evaluation) {
  return [
    `Applicable to every input because the zero code always gives the conservative lower bound k ≥ ${evaluation.value}.`,
  ];
}

// Register the trivial lower-bound rule.
const trivialLowerBound = {
  id: "trivial_code",
  label: "Trivial zero-code lower bound",
  referenceId: "trivial_code",
  appliesTo: supportsTrivialCode,
  describeApplicability: describeTrivialApplicability,
  evaluate: evaluateTrivialLowerBound,
};

// Export the default lower-bound registration.
export default trivialLowerBound;
