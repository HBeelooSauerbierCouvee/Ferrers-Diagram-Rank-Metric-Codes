import { characteristicInfoFor, createEvaluationContext, ferrersOrder, isPrimePower, parseColumns, parsePositiveInt } from "./bound-helpers.js";
import { lowerBoundReferences, lowerBounds } from "./lower bounds/index.js";
import { upperBoundReferences, upperBounds } from "./upper bounds/index.js";

// Define the supported order cap for user inputs.
export const MAX_ORDER = 12;

// Define the supported field-size cap for user inputs.
export const MAX_FIELD_SIZE = 97;

// Collect bound references from the upper/lower registries.
const REFERENCE_LIBRARY = {
  ...upperBoundReferences,
  ...lowerBoundReferences,
};

/* // Store exact bound values that are already catalogued.
const STORED_BOUNDS = {
  "1,2,3,3|1|2": {
    upper: 9,
    lower: 9,
    upperRef: "singleton_like",
    lowerRef: "full_space_d1",
  },
}; */

/* // Build the lookup key used by the stored-bounds table.
function keyFor(columns, d, q) {
  return `${columns.join(",")}|${d}|${q}`;
} */

/* // Retrieve an exact stored bound when one is available.
function getStoredBounds(columns, d, q) {
  return STORED_BOUNDS[keyFor(columns, d, q)] || null;
} */

// Build one UI-facing applicability entry.
function createApplicabilityRecord(direction, bound, applicable, evaluation, details) {
  return {
    id: bound.id,
    label: bound.label,
    direction,
    applicable,
    value: evaluation ? evaluation.value : null,
    referenceId: evaluation?.ref || bound.referenceId || null,
    details,
  };
}

// Evaluate one registry and collect applicability notes for every bound.
function inspectBounds(context, registry, direction) {
  const applicability = [];
  let best = null;

  for (const bound of registry) {
    const applicable = bound.appliesTo(context);
    const evaluation = applicable ? bound.evaluate(context) : null;
    const details = bound.describeApplicability
      ? bound.describeApplicability(context, evaluation)
      : [applicable ? "Applicable." : "Not applicable."];

    applicability.push(createApplicabilityRecord(direction, bound, applicable, evaluation, details));

    if (!evaluation) {
      continue;
    }

    if (!best) {
      best = evaluation;
      continue;
    }

    if (direction === "upper" && evaluation.value < best.value) {
      best = evaluation;
      continue;
    }

    if (direction === "lower" && evaluation.value > best.value) {
      best = evaluation;
    }
  }

  return { best, applicability };
}

// Collect the reference objects relevant to the resolved result and applicability notes.
function collectReferences(bounds) {
  const ids = new Set([bounds.upperRef, bounds.lowerRef]);

  for (const item of bounds.applicability.upper) {
    if (item.referenceId) {
      ids.add(item.referenceId);
    }
  }

  for (const item of bounds.applicability.lower) {
    if (item.referenceId) {
      ids.add(item.referenceId);
    }
  }

  return Array.from(ids)
    .map((id) => REFERENCE_LIBRARY[id])
    .filter(Boolean);
}

// Resolve the best available upper and lower bounds for one input.
export function bestKnownBounds(columns, d, q, characteristicInfo) {
  const baseContext = createEvaluationContext(columns, d, q, characteristicInfo);
  const upperInspection = inspectBounds(baseContext, upperBounds, "upper");
  const lowerInspection = inspectBounds(
    { ...baseContext, bestUpper: upperInspection.best },
    lowerBounds,
    "lower"
  );

  if (!lowerInspection.best) {
    throw new Error("At least one applicable lower bound must be registered.");
  }

 // const stored = getStoredBounds(columns, d, q);
  const applicability = {
    upper: upperInspection.applicability,
    lower: lowerInspection.applicability.slice(),
  };

  let result;
  /* if (stored) {
    applicability.lower.unshift({
      id: "stored_exact_case",
      label: "Stored exact case",
      direction: "special",
      applicable: true,
      value: stored.lower,
      referenceId: stored.lowerRef,
      details: [
        `Applicable because this exact input appears in the catalogued bounds table, giving k = ${stored.lower}.`,
      ],
    });

    result = {
      upper: stored.upper,
      lower: stored.lower,
      upperRef: stored.upperRef,
      lowerRef: stored.lowerRef,
      source: "stored",
      construction: {
        attained: true,
        label: "Stored exact value",
        family: "catalogued exact case",
      },
      applicability,
    };
  } else { */ 
    const resolvedUpper =
      upperInspection.best ||
      (lowerInspection.best.value === 0 ? { value: 0, ref: lowerInspection.best.ref } : null);

    if (!resolvedUpper) {
      throw new Error("At least one applicable upper bound must be registered.");
    }

    result = {
      upper: resolvedUpper.value,
      lower: lowerInspection.best.value,
      upperRef: resolvedUpper.ref,
      lowerRef: lowerInspection.best.ref,
      source: "derived",
      construction: lowerInspection.best.construction,
      applicability,
    };
  //}

  return {
    ...result,
    references: collectReferences(result),
  };
}

// Parse, validate, and evaluate one form submission.
export function evaluateQueryInput({ rawColumns, rawDistance, rawFieldSize, rawCharacteristic }) {
  const columnsResult = parseColumns(rawColumns);
  if (columnsResult.error) {
    return { error: columnsResult.error };
  }

  const columns = columnsResult.columns;
  const d = parsePositiveInt(rawDistance);
  const q = parsePositiveInt(rawFieldSize);

  if (!d) {
    return { error: "Minimum distance d must be a positive integer." };
  }

  if (!q || q < 2) {
    return { error: "Field size q must be an integer at least 2." };
  }

  const order = ferrersOrder(columns);
  if (order > MAX_ORDER) {
    return { error: `Ferrers diagram order ${order} exceeds N = ${MAX_ORDER}.` };
  }

  if (q > MAX_FIELD_SIZE) {
    return { error: `Field size q must satisfy q ≤ ${MAX_FIELD_SIZE}.` };
  }

  if (!isPrimePower(q)) {
    return { error: "Field size q must be a prime power." };
  }

  const characteristicInfo = characteristicInfoFor(q, rawCharacteristic);
  if (characteristicInfo.error) {
    return { error: characteristicInfo.error };
  }

  return {
    columns,
    d,
    q,
    characteristicInfo,
    bounds: bestKnownBounds(columns, d, q, characteristicInfo),
  };
}
