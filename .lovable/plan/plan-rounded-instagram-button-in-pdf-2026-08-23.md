# Plan - Rounded Instagram Button in PDF

Fix the Instagram social button in the generated PDF to have rounded corners (pill shape), consistent with the WhatsApp button.

## User Review Required

> [!IMPORTANT]
> This change only affects the **PDF generation**. The website preview already shows rounded buttons.

## Proposed Changes

### PDF Generator
#### [src/routes/gerador-catalogo.tsx](src/routes/gerador-catalogo.tsx)
- Update the Instagram button rendering logic inside `generatePdf`:
    - Use `ctx.roundRect` in the temporary canvas to create a pill-shaped background.
    - Change the image export format from `JPEG` to `PNG` to preserve transparency around the rounded corners.
    - Ensure the gradient transition is smooth across the button width.

## Technical Details

- **Canvas Update**: Modify the background drawing for `btn.gradient` to use `ctx.beginPath()`, `ctx.roundRect()`, and `ctx.fill()`.
- **Transparency**: Using `image/png` in `doc.addImage` is necessary because `jsPDF` does not support native CSS-like gradients with rounded corners directly; we must provide a pre-rendered image with alpha channel.
- **Consistency**: The radius will be set to match the WhatsApp button's pill shape (radius equal to half the height).
