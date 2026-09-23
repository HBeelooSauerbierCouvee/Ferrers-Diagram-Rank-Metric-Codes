import { neriStanojkovsk2024Bounds } from "./NeriStanojkovsk2024/index.js";
import {
  fullSpaceLowerBound,
  maximumRankLowerBound,
  trivialLowerBound,
} from "./trivial bounds/index.js";

// Expose lower bounds in priority order.
export const lowerBounds = [
  fullSpaceLowerBound,
  maximumRankLowerBound,
  ...neriStanojkovsk2024Bounds,
  trivialLowerBound,
];
