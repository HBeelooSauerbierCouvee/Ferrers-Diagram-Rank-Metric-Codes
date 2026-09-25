/* import {
  isMonotone,
  isPowerOfPrime,
  isStrictlyMonotone,
  pHeightAndContraction,
} from "../../helper-functions.js";

export { isMonotone, isPowerOfPrime, isStrictlyMonotone, pHeightAndContraction };
 */


export function isMonotone(context) {
  const columns = context.columns;
  const n = context.width;
  const h = context.height

  for (let i = 0; i < n - 1; i++) {
    if (columns[i] > 0 && columns[i] < h && !(columns[i + 1] > columns[i])) return false;
  }
  return true;
}

export function isStrictlyMonotone(context) {
  const columns = context.columns;
  const n = context.width;

  for (let i = 0; i < n - 1; i++) {
    if (columns[i] > 0  && !(columns[i + 1] > columns[i])) return false;
  }
  return true;
}