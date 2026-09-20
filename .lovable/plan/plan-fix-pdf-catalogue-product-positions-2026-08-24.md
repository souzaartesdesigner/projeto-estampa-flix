# Plan: Fix PDF Catalogue Product Positions

The goal is to fix the "disorganized" layout in the generated PDF when there are few products on a page. We will remove the dynamic vertical distribution logic that was previously added, ensuring the products always follow a standard top-aligned grid with consistent spacing, matching the visual behavior of a full page.

## Proposed Changes

### PDF Generation Logic
- **File:** `src/routes/gerador-catalogo.tsx`
- **Action:** Remove the dynamic vertical spacing calculation in the `generatePdf` function.
- **Details:** 
    - Revert the logic that calculates `extra` space and `spacing`.
    - Set `currentGapY` to the constant `gap` (8mm) instead of a dynamic value.
    - Ensure the starting vertical position `y` for the products grid remains at the standard header-end position without dynamic offsets.

## Technical Details
- The current implementation at lines 389-399 of `src/routes/gerador-catalogo.tsx` calculates a `spacing` variable based on `availableH - contentH` and applies it to both the initial `y` offset and the gap between rows.
- By removing this block, the code will fall back to using the default `gap = 8` and the `y` returned by `drawHeader()`, resulting in a consistent top-aligned grid.
- This change will make the PDF layout identical to the "full page" look, even when only a few items are present on a page.
