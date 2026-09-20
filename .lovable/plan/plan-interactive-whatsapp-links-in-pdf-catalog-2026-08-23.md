# Plan: Interactive WhatsApp Links in PDF Catalog

Add interactive WhatsApp links to the generated PDF catalog, allowing customers to click on product images to initiate a WhatsApp message to the seller.

## User Review Required

> [!IMPORTANT]
> The WhatsApp number provided in the generator will be embedded in the PDF. Ensure you enter the full number including the area code (DDD), without any spaces or special characters.

## Proposed Changes

### Generator Interface
- Add a new "WhatsApp (com DDD)" input field in the sidebar of the Catalog Generator page (`/gerador-catalogo`).
- Implement numeric-only validation for this field.
- Add a brief helper text explaining that this number makes PDF images clickable.

### PDF Generation Logic
- Update the `generatePdf` function in `src/routes/gerador-catalogo.tsx` to include interactive links.
- For each artwork in the PDF:
    - Construct a WhatsApp API URL: `https://api.whatsapp.com/send?phone=[NUMBER]&text=[MESSAGE]`.
    - The message will be: "Olá! Gostaria de encomendar um produto com esta estampa: Ref: [CÓDIGO_DO_PRODUTO]".
    - Calculate the exact coordinates (x, y, width, height) of each rendered image on the PDF page.
    - Use `jsPDF`'s `doc.link()` method to overlay an invisible clickable link over the image area.

## Technical Details
- **File**: `src/routes/gerador-catalogo.tsx`
- **State**: Add `whatsapp` state using `useState`.
- **Validation**: Use `.replace(/\D/g, "")` to sanitize the phone number input.
- **Link Implementation**:
    ```typescript
    const cleanPhone = whatsapp.replace(/\D/g, "");
    if (cleanPhone) {
      const code = art.product_code?.trim() || "";
      const msg = `Olá! Gostaria de encomendar um produto com esta estampa: Ref: ${code}`;
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
      doc.link(imgX, imgY, w, h, { url });
    }
    ```
- **Preview**: (Optional) Add a subtle indicator or hover state in the preview to show it will be interactive, though the primary requirement is the PDF itself.
