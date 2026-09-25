import { dualDiagram } from "./helper-functions.js";


const a = null;
const b = 0;
const c = 2;

let d = a || (b === 0 ? c : null);


console.log(d);