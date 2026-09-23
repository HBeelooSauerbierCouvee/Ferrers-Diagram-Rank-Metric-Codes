import singletonLikeUpperBound, { singletonLikeReferences } from "./singleton-like.js";

// Expose the full upper-bound registry.
export const upperBounds = [singletonLikeUpperBound];

// Collect upper-bound references from each subfolder registry.
export const upperBoundReferences = {
  ...singletonLikeReferences,
};
