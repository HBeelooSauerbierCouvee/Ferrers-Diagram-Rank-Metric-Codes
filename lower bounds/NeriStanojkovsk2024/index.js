import mdsConstructibleLowerBound from "./mds-constructible.js";
import strictlyMonotoneLowerBound from "./strictly-monotone.js";
import pMonotoneLowerBound from "./p-monotone.js";

// Expose the NeriStanojkovsk2024 lower-bound family registry.
export const neriStanojkovsk2024Bounds = [
  mdsConstructibleLowerBound,
  strictlyMonotoneLowerBound,
  pMonotoneLowerBound,
];
