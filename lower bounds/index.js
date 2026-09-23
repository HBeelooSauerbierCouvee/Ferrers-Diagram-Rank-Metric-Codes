import {
  neriStanojkovsk2024Bounds,
  neriStanojkovsk2024References,
} from "./NeriStanojkovsk2024/index.js";

import {
  trivialBounds,
  trivialBoundReferences,
} from "./trivial bounds/index.js";

// Expose lower bounds in priority order.
export const lowerBounds = [
  ...trivialBounds,
  ...neriStanojkovsk2024Bounds,
];

// Collect lower-bound references from each subfolder registry.
export const lowerBoundReferences = {
  ...trivialBoundReferences,
  ...neriStanojkovsk2024References,
};
