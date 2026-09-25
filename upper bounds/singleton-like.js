// Collect references cited by this upper-bound rule.
export const singletonLikeReferences = {
  singleton_like: {
    id: "singleton_like",
    label:
      "Etzion, T.; Silberstein, N. (2009). Error-Correcting Codes in Projective Spaces via Rank-Metric Codes and Ferrers Diagrams.",
    url: "https://doi.org/10.1109/TIT.2009.2021376",
  },
};

// Evaluate the universal Singleton-like upper bound.
export function evaluateSingletonLikeUpper(context) {
  return {
    id: "singleton_like_upper",
    value: context.nuMin,
    ref: "singleton_like",
  };
}

// Explain why the Singleton-like upper bound does or does not apply.
export function describeSingletonLikeApplicability(context, evaluation) {
  return [
    `Applicable to every Ferrers diagram; the Etzion-Silberstein formula gives k ≤ ${evaluation.value} for this input.`,
  ];
}

// Register the Singleton-like upper-bound rule.
const singletonLikeUpperBound = {
  id: "singleton_like_upper",
  label: "Singleton-like upper bound",
  referenceId: "singleton_like",
  appliesTo() {
    return true;
  },
  describeApplicability: describeSingletonLikeApplicability,
  evaluate: evaluateSingletonLikeUpper,
};

// Export the default upper-bound registration.
export default singletonLikeUpperBound;
