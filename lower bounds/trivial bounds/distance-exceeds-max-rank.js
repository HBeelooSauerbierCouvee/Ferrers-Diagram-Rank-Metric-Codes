import { buildConstructionDetails } from "../../bounds/shared.js";

export function exceedsMaximumRank(context) {
  return context.d > context.rMax;
}

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

const maximumRankLowerBound = {
  id: "max_rank_limit",
  appliesTo: exceedsMaximumRank,
  evaluate: evaluateMaximumRankLowerBound,
};

export default maximumRankLowerBound;
