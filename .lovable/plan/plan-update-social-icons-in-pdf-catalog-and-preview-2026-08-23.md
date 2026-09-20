# Plan - Update Social Icons in PDF Catalog and Preview

Update the Instagram and WhatsApp logos in both the PDF generation and the preview interface using the SVG paths and styling provided by the user.

## User Requirements
- Use new SVG paths for Instagram and WhatsApp.
- Apply Instagram gradient styling: `linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)`.
- Use WhatsApp brand color: `#00d757`.
- Ensure buttons in the PDF include the new logos and links.

## Proposed Changes

### 1. Preview UI Updates (`src/routes/gerador-catalogo.tsx`)
- Replace the Instagram icon in the preview with a `div` or `span` that has the multi-color gradient background.
- Update the SVG paths for both icons to match the user's provided snippets.
- Ensure the preview layout matches the "pill" style described (icon + text).

### 2. PDF Generation Enhancements (`src/routes/gerador-catalogo.tsx`)
- Implement a helper function to render SVG paths into a canvas `dataUrl` for inclusion in the PDF via `jsPDF`.
- Update the `drawSocialButtons` function inside `generatePdf` to:
    - Draw the social icon next to the text label.
    - For Instagram, draw a simple multi-color gradient background (or the dominant colors) behind the icon if possible, or at least use the provided brand colors.
    - Position the icon and text correctly within the button pill.
    - Ensure the links are still correctly attached to the button areas.

## Technical Details
- **SVG Paths**:
    - Instagram (24x24): `M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6zm8.9 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z`
    - WhatsApp (16x16): `M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z`
- **Canvas Helper**:
    ```typescript
    async function renderSocialIcon(type: 'wa' | 'insta'): Promise<string> {
      const canvas = document.createElement('canvas');
      canvas.width = 120; // High res
      canvas.height = 120;
      const ctx = canvas.getContext('2d')!;
      // Draw background and path
      return canvas.toDataURL();
    }
    ```
- **jsPDF Gradient**: Since jsPDF has limited gradient support for backgrounds in rounded rects, I will use a pre-rendered image for the button background or a multi-stop color approximation. Given the icon itself is small, rendering the whole "pill" as an image if it has complex gradients might be easier, but I'll stick to rendering just the icon if that suffices for the user's "logo" request.
- The user's provided buttons have text like "@souzaartesbr" and "Whatsapp". I'll use the dynamic username/phone provided by the user in the generator.
