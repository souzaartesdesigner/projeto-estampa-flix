# Spacing and Layout Refinement for Catalog Generator

This plan addresses the spacing issues in the "Gerador de Catálogo" (Catalog Generator) PDF and UI, ensuring a consistent and well-distributed layout for all users, including Premium users who may not be using all premium features (like logo or social buttons).

## Improvements

### 1. PDF Vertical Spacing & Distribution
- **Increase Base Spacing**: Increase the default vertical and horizontal gap between product items in the PDF from 4mm to 8mm to provide a cleaner, more professional look.
- **Universal Vertical Distribution**: Apply the vertical distribution logic to all users (Free and Premium). This ensures that if a page has few items (e.g., only one row), they are centered vertically between the header and footer instead of being stuck at the top with a large empty space at the bottom.
- **Refined Distribution Formula**: Use a formula that divides the available vertical space equally between the top margin, the rows of items, and the bottom margin/footer.

### 2. UI Preview Sync
- **Update Preview Grid**: Adjust the spacing in the UI's PDF preview to match the new 8mm PDF spacing (approx. `gap-8` or `gap-10` in Tailwind), maintaining visual parity between what the user sees and what is generated.

### 3. Layout Optimization
- **Header/Footer Space Check**: Ensure the header (logo/notice) and footer (social buttons/watermark) spacing is correctly calculated so that the vertical distribution doesn't overlap with these elements.

## Technical Details

### File: `src/routes/gerador-catalogo.tsx`
- Update `gap` constant in `generatePdf` from `4` to `8`.
- Remove the `!isPremium` check in the vertical distribution logic block (lines 390-403).
- Update the distribution formula to: `spacing = (availableH - (rowsOnPage * cellH)) / (rowsOnPage + 1)`.
- Apply this `spacing` as both the initial `y` offset (`y += spacing`) and the vertical gap between rows (`currentGapY = spacing`).
- Update the preview grid `className="grid gap-3"` to `className="grid gap-6"` (or equivalent) to reflect the increased spacing.

### Validation Plan
- Test PDF generation as a Free user (watermark only).
- Test PDF generation as a Premium user with Logo and Social buttons.
- Test PDF generation as a Premium user WITHOUT Logo/Social buttons (the "middle ground" scenario).
- Verify that items are centered vertically when pages are not full.
- Verify that the horizontal and vertical gaps are visibly larger.
