import { buildConstructionDetails } from "../shared.js";

// Detect the exact full-space case with minimum distance one.
export function isFullSpaceCase(context) {
  return context.d === 1;
}

// Build the exact lower bound for the full-space case.
export function evaluateFullSpaceLowerBound(context) {
  return {
    id: "full_space_d1",
    value: context.cells,
    ref: "full_space_d1",
    construction: {
      attained: true,
      label: "Full Ferrers-supported space",
      family: "d = 1 exact case",
      details: buildConstructionDetails(context, {
        attained: true,
        familyMessages: ["Family check: exact d = 1 full-space case."],
      }),
    },
  };
}

// Register the full-space lower-bound rule.
const fullSpaceLowerBound = {
  id: "full_space_d1",
  appliesTo: isFullSpaceCase,
  evaluate: evaluateFullSpaceLowerBound,
};

// Export the default lower-bound registration.
export default fullSpaceLowerBound;
