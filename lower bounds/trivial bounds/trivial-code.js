import { buildConstructionDetails } from "../../bounds/shared.js";

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
      details: buildConstructionDetails(context, {
        attained: false,
        familyMessages: ["Family check: no supported family certificate detected."],
      }),
    },
  };
}

// Register the trivial lower-bound rule.
const trivialLowerBound = {
  id: "trivial_code",
  appliesTo: supportsTrivialCode,
  evaluate: evaluateTrivialLowerBound,
};

// Export the default lower-bound registration.
export default trivialLowerBound;
