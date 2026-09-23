import { buildConstructionDetails } from "../shared.js";

// Detect when the requested distance exceeds every possible rank.
export function exceedsMaximumRank(context) {
  return context.d > context.rMax;
}

// Build the zero-code lower bound for impossible distances.
export function evaluateMaximumRankLowerBound(context) {
  return {
    id: "max_rank_limit",
    value: 0,
    ref: "max_rank_limit",
    construction: {
      attained: true,
      label: "Only the zero code is possible",
      family: "distance exceeds maximum rank",
      details: buildConstructionDetails(context, {
        attained: true,
        familyMessages: [
          "Family check: the requested distance exceeds the maximum possible rank on this Ferrers diagram.",
        ],
      }),
    },
  };
}

// Explain whether the maximum-rank obstruction applies to this input.
export function describeMaximumRankApplicability(context, evaluation) {
  if (!evaluation) {
    return [`Not applicable because d = ${context.d} does not exceed the maximum possible rank ${context.rMax}.`];
  }

  return [`Applicable because d = ${context.d} exceeds the maximum possible rank ${context.rMax}, so only the zero code remains.`];
}

// Register the maximum-rank lower-bound rule.
const maximumRankLowerBound = {
  id: "max_rank_limit",
  label: "Maximum-rank obstruction",
  referenceId: "max_rank_limit",
  appliesTo: exceedsMaximumRank,
  describeApplicability: describeMaximumRankApplicability,
  evaluate: evaluateMaximumRankLowerBound,
};

// Export the default lower-bound registration.
export default maximumRankLowerBound;
