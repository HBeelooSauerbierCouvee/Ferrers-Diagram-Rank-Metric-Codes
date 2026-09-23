import fullSpaceLowerBound from "./d-one-full-space.js";
import maximumRankLowerBound from "./distance-exceeds-max-rank.js";
import trivialLowerBound from "./trivial-code.js";

// Re-export the trivial lower-bound helpers.
export { fullSpaceLowerBound, maximumRankLowerBound, trivialLowerBound };

// Expose the trivial lower-bound registry.
export const trivialBounds = [fullSpaceLowerBound, maximumRankLowerBound, trivialLowerBound];
