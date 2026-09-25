import {isPrimePower, characteristicOfPrimePower, ferrersCellCount, diagramWidth, diagramHeight, diagramOrder, expandToOrderN, dualDiagram, etzionSilbersteinUpper} from "./helper-functions.js";
import { lowerBoundReferences, lowerBounds } from "./lower bounds/index.js";
import { upperBoundReferences, upperBounds } from "./upper bounds/index.js";

// Define the supported order cap for user inputs.
export const MAX_ORDER = 15;

// Define the supported field-size cap for user inputs.
export const MAX_FIELD_SIZE = 97;

// Collect bound references from the upper/lower registries.
export const REFERENCE_LIBRARY = {
  ...upperBoundReferences,
  ...lowerBoundReferences,
};

const TRIVIAL_REFERENCE_IDS = new Set(["trivial_code", "full_space_d1"]);
const TRIVIAL_BOUND_IDS = new Set(["trivial_code", "full_space_d1"]);

// Determine whether a bound should be treated as trivial.
function isTrivialBound(bound) {
  return TRIVIAL_BOUND_IDS.has(bound.id) || TRIVIAL_REFERENCE_IDS.has(bound.referenceId);
}

// List references attached to currently implemented non-trivial bounds.
export function nonTrivialImplementedReferences() {
  const ids = new Set();

  for (const bound of upperBounds) {
    if (!bound.referenceId || isTrivialBound(bound)) {
      continue;
    }
    ids.add(bound.referenceId);
  }

  for (const bound of lowerBounds) {
    if (!bound.referenceId || isTrivialBound(bound)) {
      continue;
    }
    ids.add(bound.referenceId);
  }

  return Array.from(ids)
    .map((id) => REFERENCE_LIBRARY[id])
    .filter(Boolean);
}


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


// Assemble the shared context object used by bound evaluators.
export function createEvaluationContext(columns, d, q, isDual) {
  return {
    columns: columns.slice(),
    isDual,
    d,
    q,
    char: characteristicOfPrimePower(q),
    cells: ferrersCellCount(columns),
    width: diagramWidth(columns),
    height: diagramHeight(columns),
    order: diagramOrder(columns),
    nuMin: etzionSilbersteinUpper(columns, d),
    orderTuple: expandToOrderN(columns),
  };
}



// Resolve the best available upper and lower bounds for one input, and take best bounds comparing the diagram and its dual diagram
export function bestKnownBounds(columns, d, q) {
  const baseContext = createEvaluationContext(columns, d, q, false);
  const baseContextDual = createEvaluationContext(dualDiagram(columns), d, q, true);

  const upperInspection = inspectBounds(baseContext, upperBounds, "upper");
  const upperInspectionDual = inspectBounds(baseContextDual, upperBounds, "upper");

  if (!upperInspection.best || !upperInspectionDual.best) {
    throw new Error("At least one applicable upper bound must be registered.");
  }

  const lowerInspection = inspectBounds(baseContext,lowerBounds,"lower");
  const lowerInspectionDual = inspectBounds(baseContextDual,lowerBounds,"lower");

  if (!lowerInspection.best || !lowerInspectionDual.best) {
    throw new Error("At least one applicable lower bound must be registered.");
  }

  const bestUpper = upperInspection.best.value <= upperInspectionDual.best.value ? upperInspection : upperInspectionDual;

  const bestLower = lowerInspection.best.value >= lowerInspectionDual.best.value ? lowerInspection : lowerInspectionDual;

  const applicability = {
    upper: bestUpper.applicability,
    lower: bestLower.applicability.slice(),
  };

  
    const result = {
      upper: bestUpper.best.value,
      lower: bestLower.best.value,
      upperRef: bestUpper.best.ref,
      lowerRef: bestLower.best.ref,
      source: "derived",
      construction: bestLower.best.construction,
      applicability,
    };

  return {
    ...result,
    references: collectReferences(result),
  };
}



// Parse a required positive integer.
export function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Parse an optional positive integer field.
export function parseOptionalPositiveInt(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  return parsePositiveInt(value);
}


// Parse and normalize Ferrers column input from a query.
function parseColumns(raw) {
  const parts = raw
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { error: "Please provide at least one column length." };
  }

  const columns = parts.map((part) => Number(part));
  if (columns.some((column) => !Number.isInteger(column) || column <= 0)) {
    return { error: "Column lengths must be positive integers." };
  }

  const nondecreasing = columns.every((column, index) => index === 0 || columns[index - 1] <= column);
  const nonincreasing = columns.every((column, index) => index === 0 || columns[index - 1] >= column);
  if (!nondecreasing && !nonincreasing) {
    return { error: "Column lengths must be in ascending or descending order." };
  }

  return { columns: nondecreasing ? columns : columns.slice().reverse() };
}



// Parse, validate, and evaluate one form submission.
export function evaluateQueryInput({ rawColumns, rawDistance, rawFieldSize }) {
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

  const order = diagramOrder(columns);
  if (order > MAX_ORDER) {
    return { error: `Ferrers diagram order ${order} exceeds N = ${MAX_ORDER}.` };
  }

  if (q > MAX_FIELD_SIZE) {
    return { error: `Field size q must satisfy q ≤ ${MAX_FIELD_SIZE}.` };
  }

  if (!isPrimePower(q)) {
    return { error: "Field size q must be a prime power." };
  }

  /* const characteristicInfo = characteristicInfoFor(q, rawCharacteristic);
  if (characteristicInfo.error) {
    return { error: characteristicInfo.error };
  } */

  return {
    columns,
    d,
    q,
    //characteristicInfo,
    bounds: bestKnownBounds(columns, d, q),
  };
}
