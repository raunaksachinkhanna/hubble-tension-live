# CLAUDE.md — Hubble Tension Live

## What this project is
A public dashboard tracking measurements of the Hubble constant (H₀) and the
tension between early-universe and late-universe methods. It is a portfolio
project AND a learning project. Credibility is the entire value proposition:
one wrong number destroys it.

## Non-negotiable data integrity rules
1. Every measurement in `data/measurements.json` MUST cite the PRIMARY source —
   the paper where the collaboration reports the value. Never a review paper,
   news article, or blog post that quotes the number secondhand.
2. Never add, edit, or "fix" a measurement value, uncertainty, or arXiv ID from
   memory. If a value needs verifying, say so explicitly and stop — the human
   verifies against the actual paper. Do not guess arXiv IDs; a plausible-looking
   wrong ID is worse than a missing one.
3. Every value MUST carry its uncertainty. Never display or store H₀ without
   error bars, anywhere — including chart tooltips, README examples, and tests.
4. Never describe the tension as "resolved," "proof of new physics," or "proof
   the Big Bang is wrong" in any user-facing text. Approved framing: a serious,
   persistent discrepancy (~5σ) whose cause — measurement systematics or new
   physics — is not yet known.
5. The `family` field (early_universe / late_universe) drives all visualization
   color-coding. If a measurement doesn't clearly fit either family (e.g.
   standard sirens, cosmic chronometers), flag it for human decision rather
   than assigning one.

## Data schema (data/measurements.json)
Each entry: id, value, uncertainty_plus, uncertainty_minus, method, technique,
family ("early_universe" | "late_universe"), collaboration, year, arxiv, notes.
- `notes` is written by the human (it's a learning artifact) — leave it alone
  unless asked.
- IDs are kebab-case: collaboration + year, e.g. "planck-2018", "cchp-2024".

## Engineering conventions
- Keep the stack boring and legible: this repo is read by recruiters.
  Prefer plain, well-commented code over clever abstractions.
- Frontend: single-page dashboard. Chart requirements: every point shows error
  bars; early vs late universe use two consistent colors defined once as
  constants; a visible "data last updated" date sourced from the data file,
  never hardcoded.
- No fake "live" elements: no ticking counters, no simulated real-time updates.
  H₀ does not change second-to-second and the UI must not pretend it does.
- Commit messages: conventional style ("data:", "feat:", "fix:", "docs:").
- Do not add dependencies without stating why one is needed.

## Division of labor (important)
The human is using this project to learn cosmology. Therefore:
- Physics interpretation, reading papers, and writing `notes` fields = human.
- If the human asks you to summarize a paper's H₀ value for the dataset,
  provide it WITH the caveat that they must verify against the paper before
  committing.
- Scaffolding, chart code, build tooling, refactors = you, freely.

## Current phase
Building v1: manual dataset (4 entries: SH0ES, Planck 2018, DESI DR2, CCHP/
Freedman) + one chart with error bars, color-coded by family, plus per-method
explainer text. The LLM-based arXiv extraction pipeline is a LATER phase — do
not scaffold it yet.
