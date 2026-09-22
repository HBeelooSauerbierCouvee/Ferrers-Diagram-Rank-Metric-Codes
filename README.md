# Optimal-Ferrers-Diagram-Rank-Metric-Codes

Static website for looking up best-known upper and lower bounds on the dimension `k` of Ferrers-diagram rank-metric codes.

## Usage

Open `/index.html` (or host with GitHub Pages), then provide:
- a comma-separated ascending or descending list of column lengths of a Ferrers diagram,
- minimum rank distance `d`,
- field size `q`.

The page validates limits `N` and `q` (configured in `app.js`), renders the diagram, and reports upper/lower bounds with references.
