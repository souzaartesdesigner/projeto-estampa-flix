# Plan: Dynamic Vertical Spacing for Free Users in PDF Catalog

Optimize the PDF layout for free users by dynamically distributing product rows vertically when they are "Grátis" (non-premium), avoiding empty space at the bottom and centering the content.

## User Review Required

> [!IMPORTANT]
> The dynamic spacing will only apply to free users. Premium users will keep the standard compact layout (which they can customize with their logo and social buttons).

## Proposed Changes

### PDF Generation Logic
- **File:** `src/routes/gerador-catalogo.tsx`
- Refactor the `generatePdf` loop to process items page-by-page.
- Before rendering each page, calculate how many items fit using the default layout.
- For free users (`!isPremium`):
    - Calculate the total available vertical height on the page (excluding margins and watermark space).
    - Calculate the height occupied by the rows of products.
    - Distribute the remaining vertical space as an increased gap between rows and an initial top offset, effectively centering the content.
- For premium users:
    - Maintain the current compact layout to ensure space for the logo, notice, and social buttons.

## Technical Details

- **Page Calculation**: Pre-calculate `itemsOnPage` by simulating the layout constraints (margins, column count, cell height).
- **Dynamic Spacing Formula**:
  ```typescript
  const availableH = (pageH - margin - 15) - startY; // 15mm reserved for footer
  const contentH = rowsOnPage * cellH;
  if (availableH > contentH) {
    const extra = availableH - contentH;
    const spacing = extra / (rowsOnPage + 1);
    startY += spacing;
    currentGapY = spacing;
  }
  ```
- **Loop Refactor**: Use a `while` loop to consume the `selectedList` chunk by chunk (page by page), rather than a single `for` loop that checks for page breaks mid-way.

## Verification Plan

### Manual Verification
1. Open the "Gerador de Catálogo" as a free user.
2. Select a small number of items (e.g., 1 to 3 items).
3. Generate the PDF and verify they are centered vertically rather than squeezed at the top.
4. Select a larger number of items (e.g., 9 items) and verify they are distributed evenly across the page.
5. Repeat as a Premium user and verify the layout remains compact to accommodate the logo and social buttons.
