import fullSpaceLowerBound from "./d-one-full-space.js";
import maximumRankLowerBound from "./distance-exceeds-max-rank.js";
import trivialLowerBound from "./trivial-code.js";

export const trivialBounds = [fullSpaceLowerBound, maximumRankLowerBound, trivialLowerBound];
