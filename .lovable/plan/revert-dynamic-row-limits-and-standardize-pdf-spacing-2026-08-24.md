# Revert Dynamic Row Limits and Standardize PDF Spacing

Revert the PDF generation logic in the Catalog Generator to use standard row calculation instead of hardcoded limits (12 for 3 cols, 20 for 4 cols). Ensure that premium users without active features (logo, social buttons, etc.) get the same "perfect" spacing as free users.

## Proposed Changes

### PDF Generation Logic
- Remove hardcoded row counts (4x5 for 4 cols, 3x4 for 3 cols) from `src/routes/gerador-catalogo.tsx`.
- Standardize `targetRows` calculation using the formula: `Math.floor((availableH + gap) / (cellW + captionH + gap))`.
- Ensure `availableH` correctly accounts for both header (logo, notice) and footer (watermark or social buttons) dynamically.
- Maintain consistent 8mm gap between items.

### Visual Edits
- Apply the literal text replacement requested for the specific element mentioned in the prompt.

## Technical Details
- In `generatePdf`, unify the `targetRows` calculation for all column counts and user tiers.
- The `availableH` already subtracts 15mm for the footer; this should be sufficient to accommodate both the "free" watermark and the "premium" social buttons.
- By using `Math.floor` on the available height, we ensure products don't overflow the page while keeping spacing consistent.
