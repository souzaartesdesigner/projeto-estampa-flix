# Plan: Optimize PDF Catalog Layout

Adjust the number of items per page in the PDF generator to follow specific grid rules (20 items for 4 columns, 12 items for 3 columns without branding) and ensure content fits the page by dynamic scaling.

## User Review Required

> [!IMPORTANT]
> - For 4 columns, the catalog will now show **20 items per page** (5 rows).
> - For 3 columns, if no logo or social buttons are used, it will show **12 items per page** (4 rows).
> - If a logo or social buttons are present in a 3-column layout, it will default to what fits best (typically **9 items / 3 rows**) to avoid overflow.
> - Artwork sizes will be automatically scaled down slightly if needed to ensure the requested number of rows fits on a single A4 page.

## Proposed Changes

### PDF Generator
#### [src/routes/gerador-catalogo.tsx](src/routes/gerador-catalogo.tsx)
- Modify `generatePdf` to calculate `rowsPerPage` and `itemsPerPage` based on columns and user settings.
- Implement logic to force 5 rows for 4 columns and 4 rows for 3 columns (when clean).
- Adjust `imgH` and `cellH` calculation to fit the target number of rows within the available vertical space (`availableH`).
- Update `itemsPerPage` to use the fixed grid values in the specified scenarios.

## Technical Details

- Calculate `startY` (header end) first.
- `availableH = (pageH - margin - 15) - startY`.
- Define `targetRows`:
  - `cols === 4` -> 5 rows.
  - `cols === 3 && !isPremiumWithLogo && !showSocial` -> 4 rows.
  - Else -> `Math.floor(availableH / (defaultCellH + gap))`.
- If `targetRows` is forced (5 or 4), calculate `cellH = (availableH - (targetRows - 1) * gap) / targetRows`.
- Derive `imgH = cellH - captionH` and `cellW` (keeping aspect ratio or capping width).
- Update the iteration loop to use the new `itemsPerPage` and `cellH` values.
