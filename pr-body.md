## Summary
Applies the remaining design-system audit findings that were incomplete in the previous commit.

### Fixes applied
- **--warn token WCAG compliance**: Aligned with chart4 amber fix — changed from `oklch(70% 0.15 75)` to `oklch(65% 0.15 75)` in tokens.css and colors.js
- **border-radius token drift**: Replaced all remaining hardcoded `border-radius: 10px` with `var(--r-lg)` across academics.css, auth.css, classes.css, create.css, feedback-primitives.css, fees.css, front-desk.css, messaging.css, shell.css

### Previous fixes already in branch (commit 83198d33)
- `--surface-raised` → `--surface-2`
- chart4: `oklch(70%)` → `oklch(65%)`
- Shadow drift correction
- `--fs-26` token + usage
- Sentence case copy

### Reviewers
- Design System Agent — token consistency
- Content / UX Writer — copy review

Closes design-system audit findings for DK-600.
