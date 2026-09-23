import { neriStanojkovsk2024Bounds } from "./NeriStanojkovsk2024/index.js";
import {
  fullSpaceLowerBound,
  maximumRankLowerBound,
  trivialLowerBound,
} from "./trivial bounds/index.js";

export const lowerBounds = [
  fullSpaceLowerBound,
  maximumRankLowerBound,
  ...neriStanojkovsk2024Bounds,
  trivialLowerBound,
];
