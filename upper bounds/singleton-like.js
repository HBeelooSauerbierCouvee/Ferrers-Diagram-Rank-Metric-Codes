import { etzionSilbersteinUpper } from "../bounds/shared.js";

export function evaluateSingletonLikeUpper(context) {
  return {
    id: "singleton_like_upper",
    value: etzionSilbersteinUpper(context.columns, context.d),
    ref: "singleton_like",
  };
}

const singletonLikeUpperBound = {
  id: "singleton_like_upper",
  appliesTo() {
    return true;
  },
  evaluate: evaluateSingletonLikeUpper,
};

export default singletonLikeUpperBound;
