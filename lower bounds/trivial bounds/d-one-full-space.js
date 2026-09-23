import { buildConstructionDetails } from "../../bounds/shared.js";

export function isFullSpaceCase(context) {
  return context.d === 1;
}

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

const fullSpaceLowerBound = {
  id: "full_space_d1",
  appliesTo: isFullSpaceCase,
  evaluate: evaluateFullSpaceLowerBound,
};

export default fullSpaceLowerBound;
