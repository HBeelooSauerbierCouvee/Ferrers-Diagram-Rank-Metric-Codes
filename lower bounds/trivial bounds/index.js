import fullSpaceLowerBound from "./d-one-full-space.js";
import trivialLowerBound from "./trivial-code.js";

// Collect references cited by trivial lower-bound rules.
export const trivialBoundReferences = {
  trivial_code: {
    id: "trivial_code",
    label: "Trivial linear code construction: the zero subspace is always an [F, k=0, d]_q code.",
  },
  full_space_d1: {
    id: "full_space_d1",
    label: "For d=1, the full Ferrers-supported matrix space gives k = |F| exactly.",
  },
};



// Expose the trivial lower-bound registry.
export const trivialBounds = [fullSpaceLowerBound, trivialLowerBound];
