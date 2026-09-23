import { neriStanojkovsk2024Bounds } from "./NeriStanojkovsk2024/index.js";
import { trivialBounds } from "./trivial bounds/index.js";

export const lowerBounds = [...trivialBounds.slice(0, 2), ...neriStanojkovsk2024Bounds, trivialBounds[2]];
