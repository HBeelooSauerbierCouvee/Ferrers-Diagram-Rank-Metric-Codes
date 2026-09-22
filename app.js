const LIMITS = Object.freeze({ order: 10, fieldSize: 13 });
const FIELD_SIZES = Object.freeze([2, 3, 4, 5, 7, 8, 9, 11, 13]);

const references = {
  etzionSilberstein: "T. Etzion and N. Silberstein, “Error-correcting codes in projective spaces via rank-metric codes and Ferrers diagrams,” IEEE Transactions on Information Theory 55 (2009), 2909–2919, Theorem 1.",
  delarte: "P. Delsarte, “Bilinear forms over a finite field, with applications to coding theory,” Journal of Combinatorial Theory, Series A 25 (1978), 226–241."
};

const form = document.querySelector("#bounds-form");
const field = document.querySelector("#field");
const error = document.querySelector("#form-error");
const result = document.querySelector("#result");

FIELD_SIZES.forEach((size) => field.add(new Option(`𝔽${size}`, size)));
field.value = "2";

function parseColumns(value) {
  const values = value.trim().split(/[\s,]+/).map(Number);
  if (!value.trim() || values.some((height) => !Number.isSafeInteger(height) || height < 1)) {
    throw new Error("Enter positive integer column lengths.");
  }
  if (values.length > LIMITS.order || values.some((height) => height > LIMITS.order)) {
    throw new Error(`The catalog supports at most ${LIMITS.order} columns and height ${LIMITS.order}.`);
  }
  const ascending = values.every((height, index) => index === 0 || values[index - 1] <= height);
  const descending = values.every((height, index) => index === 0 || values[index - 1] >= height);
  if (!ascending && !descending) throw new Error("Column lengths must be in ascending or descending order.");
  return ascending ? values : values.reverse();
}

function singletonBound(columns, distance) {
  return Math.min(...Array.from({ length: distance }, (_, removedRows) => {
    const retainedCount = Math.max(0, columns.length - (distance - 1 - removedRows));
    const retainedColumns = columns.slice(0, retainedCount);
    return retainedColumns.reduce((total, height) => total + Math.max(0, height - removedRows), 0);
  }));
}

function rectangleConstruction(columns, distance) {
  let best = { dimension: 0, height: 0, width: 0 };
  for (let height = 1; height <= columns.at(-1); height += 1) {
    const width = columns.filter((columnHeight) => columnHeight >= height).length;
    if (Math.min(height, width) >= distance) {
      const dimension = Math.max(height, width) * (Math.min(height, width) - distance + 1);
      if (dimension > best.dimension) best = { dimension, height, width };
    }
  }
  return best;
}

function renderDiagram(columns) {
  const diagram = document.querySelector("#diagram");
  diagram.replaceChildren();
  diagram.style.setProperty("--columns", columns.length);
  const top = columns.at(-1);
  for (let row = top; row >= 1; row -= 1) {
    columns.forEach((height) => {
      const cell = document.createElement("span");
      cell.className = height >= row ? "cell" : "cell empty";
      diagram.append(cell);
    });
  }
}

function renderBounds(columns, distance, q) {
  const upper = singletonBound(columns, distance);
  const lower = rectangleConstruction(columns, distance);
  const rectangle = lower.dimension
    ? `${lower.height} × ${lower.width} rectangular subdiagram; an MRD code is extended by zero outside it.`
    : "The zero-dimensional code is the catalogued construction for these parameters.";

  document.querySelector("#result-title").textContent = `F = (${columns.join(", ")}), d = ${distance}, q = ${q}`;
  document.querySelector("#summary").textContent = `0 ≤ k ≤ ${upper}`;
  document.querySelector("#upper-bound").textContent = upper;
  document.querySelector("#lower-bound").textContent = lower.dimension;
  document.querySelector("#upper-detail").textContent = "Etzion–Silberstein singleton-like bound.";
  document.querySelector("#lower-detail").textContent = rectangle;
  document.querySelector("#diagram-columns").textContent = `with columns (${columns.join(", ")})`;
  document.querySelector("#references-list").replaceChildren(
    ...[references.etzionSilberstein, references.delarte].map((reference) => {
      const item = document.createElement("li");
      item.textContent = reference;
      return item;
    })
  );
  renderDiagram(columns);
  result.hidden = false;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const columns = parseColumns(form.elements.columns.value);
    const distance = Number(form.elements.distance.value);
    if (!Number.isSafeInteger(distance) || distance < 1 || distance > LIMITS.order) {
      throw new Error(`Enter a minimum rank distance from 1 to ${LIMITS.order}.`);
    }
    error.hidden = true;
    renderBounds(columns, distance, Number(field.value));
  } catch (message) {
    error.textContent = message.message;
    error.hidden = false;
    result.hidden = true;
  }
});

form.requestSubmit();
