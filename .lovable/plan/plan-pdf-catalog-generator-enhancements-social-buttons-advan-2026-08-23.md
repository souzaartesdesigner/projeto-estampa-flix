# Plan: PDF Catalog Generator Enhancements (Social Buttons & Advanced Footer)

Implement new social configuration options, freemium locks, and interactive social buttons (WhatsApp/Instagram) in the generated PDF and its preview.

## User Review Required

> [!IMPORTANT]
> The social buttons will be added to the footer of every page in the PDF. Users can toggle them individually and provide their Instagram username.

- **WhatsApp Button**: Background `#00d757`, white text.
- **Instagram Button**: Background `#E1306C`, white text.
- **Freemium logic**: These fields will be locked for free users.

## Proposed Changes

### Configuration UI (`src/routes/gerador-catalogo.tsx`)
- Add new states: `instagramUser`, `showWaButton`, and `showInstaButton`.
- Add a new section in the sidebar for "Social Networks":
    - Instagram Username input (disabled if not premium).
    - Toggle for "Display WhatsApp button" (disabled if not premium).
    - Toggle for "Display Instagram button" (disabled if not premium).
- Ensure clicking these locked fields opens the `PremiumFeatureModal`.
- Add the new options to the "Premium Advantages" info box for free users.

### PDF Generation Logic (`src/routes/gerador-catalogo.tsx`)
- Update `generatePdf` to:
    - Handle the new footer section.
    - Draw "Siga nossas redes e faça seu pedido!" text centered at the bottom.
    - Render the WhatsApp and Instagram buttons as rounded "pills" side-by-side.
    - Use the provided SVG path for the WhatsApp icon (rendered as a small image or path).
    - Use a standard Instagram icon for the Instagram button.
    - Add clickable links (`doc.link`) over the button areas.
    - WhatsApp link: `https://api.whatsapp.com/send?phone=[PHONE]&text=[MESSAGE]`.
    - Instagram link: `https://instagram.com/[USERNAME]`.

### UI Preview (`src/routes/gerador-catalogo.tsx`)
- Update the on-screen PDF preview to reflect the new social buttons in the footer.
- Use Tailwind for the preview buttons to match the requested look:
    - WhatsApp: `bg-[#00d757]`.
    - Instagram: `bg-[#E1306C]`.

## Technical Details
- **Button rendering in PDF**: Use `doc.setFillColor()` and `doc.roundedRect()` to create the pill shape.
- **Icons**: Since `jsPDF` doesn't natively render Lucide icons easily, I will either use simple path drawing or embed small data URLs for the icons.
- **Layout calculations**: Adjust the bottom margin of the PDF to accommodate the new footer buttons.
- **Variable substitution**: Ensure `[USERNAME]` is correctly replaced in the Instagram button text.
