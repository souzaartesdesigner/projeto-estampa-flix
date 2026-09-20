# Plan for adding border radius to PDF catalog images

Add an 8px border radius to product images generated in the PDF catalog.

## Proposed Changes

### Frontend - Catalog Generator
- **Location**: `src/routes/gerador-catalogo.tsx`
- **Modify `toDataUrl` function**:
    - Update the function to apply a clipping path with rounded corners before drawing the image onto the canvas.
    - Calculate the radius relative to the canvas size to maintain a consistent 8px look in the final PDF.
    - Use `ctx.beginPath()`, `ctx.roundRect()` (or a fallback), and `ctx.clip()`.
- **Modify Preview UI**:
    - Add `rounded-[8px]` to the image container in the PDF preview section to match the generated output.

## Technical Details
- The radius calculation will account for the canvas resolution (which is capped at 1400px).
- Clipping will happen after filling the background color, ensuring the "rounded corners" are filled with the catalog's background color (avoiding transparency issues in JPEGs).
- Browser support for `ctx.roundRect` is broad in 2026, but I will ensure it's used safely.
