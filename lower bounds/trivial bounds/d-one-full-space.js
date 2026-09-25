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
    },
  };
}

// Explain whether the d = 1 exact case applies to this input.
export function describeFullSpaceApplicability(context, evaluation) {
  if (!evaluation) {
    return [`Not applicable because d = ${context.d} instead of d = 1.`];
  }

  return [`Applicable because d = 1, so the full Ferrers-supported space gives k = ${evaluation.value}.`];
}

// Register the full-space lower-bound rule.
const fullSpaceLowerBound = {
  id: "full_space_d1",
  label: "Full-space exact construction",
  referenceId: "full_space_d1",
  appliesTo: isFullSpaceCase,
  describeApplicability: describeFullSpaceApplicability,
  evaluate: evaluateFullSpaceLowerBound,
};

// Export the default lower-bound registration.
export default fullSpaceLowerBound;
