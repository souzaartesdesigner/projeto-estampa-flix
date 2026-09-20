# Plan - Product SKU Standardization

We will update the individual product page to display the `product_code` (SKU) instead of the internal database ID (or its prefix), following the new standardization requirement.

## User Review Required

> [!IMPORTANT]
> - I have verified that `product_code` is already included in the `artworks` table and the current query in `src/routes/artes.$slug.tsx`.
> - The replacement will be applied to the `ProductInfoPanel` component which currently displays a truncated version of the database ID.

## Proposed Changes

### Frontend Implementation

#### `src/features/artwork/product-info-panel.tsx`
- Remove the legacy `code` variable derivation that uses a substring of `artwork.id`.
- Update the "Código do produto" row to display `artwork.product_code` directly.
- Ensure the label remains "Código do produto:".

### Verification Plan

#### Automated Tests
- Run a Playwright script to:
  1. Navigate to a specific product page.
  2. Verify that the text "Código do produto:" is present.
  3. Verify that the value displayed next to it matches a known `product_code` from the database (via `lovable supabase query`).

#### Manual Verification
- View the product page in the preview and check the "Informações do produto" section to confirm the SKU is visible and correctly formatted.
