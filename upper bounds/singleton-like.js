// Evaluate the Etzion-Silberstein upper bound for the diagram.
function etzionSilbersteinUpper(columns, d) {
  const n = columns.length;
  let best = Number.POSITIVE_INFINITY;

  for (let i = 0; i < d; i += 1) {
    const keepColumns = n - (d - 1 - i);
    if (keepColumns <= 0) {
      best = 0;
      continue;
    }

    let count = 0;
    for (let col = 0; col < keepColumns; col += 1) {
      count += Math.max(columns[col] - i, 0);
    }
    best = Math.min(best, count);
  }

  return Math.max(0, Number.isFinite(best) ? best : 0);
}

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
    value: etzionSilbersteinUpper(context.columns, context.d),
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
