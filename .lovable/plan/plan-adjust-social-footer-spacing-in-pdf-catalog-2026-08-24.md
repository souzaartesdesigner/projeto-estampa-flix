# Plan: Adjust Social Footer Spacing in PDF Catalog

The user wants to decrease the distance between the text "Siga nossas redes e faça seu pedido!" and the social buttons in the generated PDF catalog, making them closer together.

## Proposed Changes

### PDF Generation

- **File**: `src/routes/gerador-catalogo.tsx`
- **Location**: Inside the `drawSocialButtons` function.
- **Change**: Adjust the Y coordinate of the text "Siga nossas redes e faça seu pedido!".
- **Current logic**: `doc.text("Siga nossas redes...", pageW / 2, footerY - 8, ...)`
- **New logic**: `doc.text("Siga nossas redes...", pageW / 2, footerY - 3, ...)` (reducing gap from 8mm to 3mm).

### UI Preview (Optional but good for consistency)

- **File**: `src/routes/gerador-catalogo.tsx`
- **Location**: Inside the `CatalogGeneratorPage` component's JSX preview area.
- **Change**: Adjust the margin-bottom of the paragraph containing the text.
- **Current logic**: `<p className="mb-4 text-xs font-medium" ...>` (Line 944)
- **New logic**: `<p className="mb-1 text-xs font-medium" ...>` (reducing `mb-4` to `mb-1`).

## Technical Details

- The PDF coordinates are in millimeters (`mm`). Reducing the subtraction from `8` to `3` will move the text 5mm closer to the buttons.
- The UI uses Tailwind CSS. Changing `mb-4` (1rem) to `mb-1` (0.25rem) will move the text closer in the web preview as well.

## Verification Plan

### Automated Verification
- No specific automated tests for PDF output exist, but I will check `build-errors.log` to ensure no syntax errors.

### Manual Verification
1. Open the Catalog Generator.
2. Select some artworks.
3. Enable social buttons (WhatsApp/Instagram) in the settings.
4. Observe the spacing in the preview area.
5. Generate the PDF and verify the spacing between the text and buttons at the bottom of the pages.
