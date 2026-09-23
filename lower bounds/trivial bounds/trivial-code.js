import { buildConstructionDetails } from "../../bounds/shared.js";

export function supportsTrivialCode() {
  return true;
}

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

const trivialLowerBound = {
  id: "trivial_code",
  appliesTo: supportsTrivialCode,
  evaluate: evaluateTrivialLowerBound,
};

export default trivialLowerBound;
