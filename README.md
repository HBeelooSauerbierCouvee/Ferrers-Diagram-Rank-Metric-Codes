# Optimal-Ferrers-Diagram-Rank-Metric-Codes

Static website for looking up best-known upper and lower bounds on the dimension `k` of Ferrers-diagram rank-metric codes.
https://hbeeloosauerbiercouvee.github.io/FerrersDiagramCodeTables/

## Usage

Open `/index.html` (or host with GitHub Pages), then provide:
- a comma-separated ascending or descending list of column lengths of a Ferrers diagram,
- minimum rank distance `d`,
- field size `q`,
- optionally the field characteristic `p` when you want `p`-monotone family detection for non-prime `q`.

The page validates limits `N` and `q`, renders the diagram, and reports upper/lower bounds with references.

## Implemented bounds

### Folder structure

- `upper bounds/`: registered upper bounds
- `lower bounds/trivial bounds/`: exact and conservative trivial lower bounds
- `lower bounds/NeriStanojkovsk2024/`: currently implemented optimal families from Neri--Stanojkovski (2024)

### Upper bound

The Singleton-like Etzion-Silberstein upper bound now lives in `upper bounds/singleton-like.js`.

### Explicit lower-bound constructions implemented here

This version adds the diagonal quantity used in:
- A. Neri and M. Stanojkovski, *A proof of the Etzion-Silberstein conjecture for monotone and MDS-constructible Ferrers diagrams*, Journal of Combinatorial Theory, Series A (2024), DOI: <https://doi.org/10.1016/j.jcta.2024.105937>

For normalized ascending columns, the site first expands the input to an order-`n` tuple by left-padding zeros until the tuple length equals
`n = max(number of columns, largest column height)`.

On that order-`n` tuple `D = (c_1, ..., c_n)`, the diagonal quantity is

`ν_min(D,d) = Σ_{i=1}^n max(0, |D ∩ Δ_i^n| - d + 1)`

with

`Δ_i^n = {(j, j + i - 1) : 1 ≤ j ≤ n - i + 1}`.

The implementation counts these diagonals in the same normalized ascending-column convention used internally by the shared bounds utilities; the optional descending display mode only reverses presentation.

## When the site certifies the diagonal construction

The site is intentionally conservative and does **not** claim the 2024 construction for every Ferrers diagram.

It certifies `k = ν_min(D,d)` only when at least one of the following supported cases applies:
- **MDS-constructible (conservative test):** `ν_min(D,d)` equals the existing Singleton-type upper bound.
- **Strictly monotone:** after normalization to ascending columns, every positive column is strictly smaller than the next one.
- **`p`-monotone:** after expanding to an order-`n` tuple in the paper's convention, the tuple has a valid `p`-height / `p`-contraction and the contraction is monotone. For non-prime `q`, the UI requires an explicit characteristic input `p` before attempting this classification.

The site also preserves the existing exact/trivial cases in `lower bounds/trivial bounds/`:
- `d = 1`: full Ferrers-supported space, so `k = |F|`.
- `d` larger than the maximum possible rank: only the zero code is possible.

## Important limitations

- The general Etzion-Silberstein conjecture is **not** solved here for arbitrary input diagrams.
- The 2024 diagonal-family checks are only applied in the paper's order-`n` triangular convention (`c_i ≤ i` after order-`n` expansion). If the input falls outside that convention, the site shows `ν_min(D,d)` only as diagnostic construction metadata and keeps the conservative proven lower bound.
- For unsupported cases, the lower bound remains the trivial proven lower bound `0` unless one of the older exact/trivial cases applies.
- The site uses integer arithmetic only.


