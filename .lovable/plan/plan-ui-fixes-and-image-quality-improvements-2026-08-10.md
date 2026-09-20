# Plan: UI Fixes and Image Quality Improvements

## 1. Cart Page: "Esvaziar carrinho" Button Color
- **Goal**: Change the "Clear Cart" button to red.
- **Action**: Modify `src/routes/_authenticated/carrinho.tsx`. Change the `Button` variant from `ghost` to `destructive` for the "Esvaziar carrinho" action. Alternatively, use a custom class for better styling matching the current theme if `destructive` feels too "loud" (though usually that's what's expected for a clear action). I'll use `variant="ghost" className="... text-destructive hover:bg-destructive/10 hover:text-destructive"` to keep it elegant but clearly red.

## 2. My Account Page: Mobile Navigation Fix
- **Goal**: Fix the lateral clipping of the first tab ("Downloads") on mobile.
- **Action**: Modify `src/routes/_authenticated/minha-conta.tsx`. 
    - Adjust the `TabsList` padding and ensure it doesn't clip the first item.
    - I'll increase the horizontal padding of the `TabsList` and ensure individual triggers have enough space.
    - I will also check if a parent container has `overflow-hidden` that might be clipping the focus/selection ring or the item itself.

## 3. Image Quality Optimization
- **Goal**: Improve the quality of category and product images.
- **Action**: Modify `src/lib/image-cdn.ts`.
    - Increase default quality `q` from `74` to `88`.
    - Update `CARD_WIDTHS` from `[400, 800]` to `[480, 960]` to provide higher resolution options for mobile 1-column layouts and high-DPR screens.
    - Increase `THUMB_WIDTHS` to `[240]` (from `160`) to ensure category thumbnails look sharp.
- **Action**: Verify `SmartImage` in `src/components/smart-image.tsx` uses the updated defaults.

## Validation Plan
- I will run the Playwright script again (if possible with a mock session or just by checking public pages that use images) to verify image URLs have the higher `q` parameter.
- I will inspect the code changes to ensure the CSS classes are correct.
