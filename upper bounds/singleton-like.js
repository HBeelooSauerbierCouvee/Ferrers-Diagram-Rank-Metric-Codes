import { etzionSilbersteinUpper } from "../bounds/shared.js";

// Evaluate the universal Singleton-like upper bound.
export function evaluateSingletonLikeUpper(context) {
  return {
    id: "singleton_like_upper",
    value: etzionSilbersteinUpper(context.columns, context.d),
    ref: "singleton_like",
  };
}

// Register the Singleton-like upper-bound rule.
const singletonLikeUpperBound = {
  id: "singleton_like_upper",
  appliesTo() {
    return true;
  },
  evaluate: evaluateSingletonLikeUpper,
};

// Export the default upper-bound registration.
export default singletonLikeUpperBound;
