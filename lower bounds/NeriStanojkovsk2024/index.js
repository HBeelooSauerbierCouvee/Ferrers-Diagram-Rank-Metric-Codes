import mdsConstructibleLowerBound from "./mds-constructible.js";
import strictlyMonotoneLowerBound from "./strictly-monotone.js";
import pMonotoneLowerBound from "./p-monotone.js";

export const neriStanojkovsk2024Bounds = [
  mdsConstructibleLowerBound,
  strictlyMonotoneLowerBound,
  pMonotoneLowerBound,
];
