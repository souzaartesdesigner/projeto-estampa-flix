# Plan: Google Ads Integration

Implement Google Ads conversion tracking for the Estampa Flix platform.

## Changes

### Database
- Add `google_ads_id` and `google_ads_purchase_label` to the `site_settings` table. (Completed)

### Frontend
- **Root Route (`src/routes/__root.tsx`)**:
  - Update SEO loader to fetch new Google Ads settings.
  - Inject the Global Site Tag (gtag.js) for Google Ads if an ID is provided.
  - Store Ads configuration in `window` for access by tracking utilities.
- **Analytics Utility (`src/lib/analytics.ts`)**:
  - Add Google Ads conversion tracking logic for the `purchase` event.
- **Admin Panel (`src/routes/_authenticated/admin/configuracoes.tsx`)**:
  - Add fields in the "SEO / Analytics" tab to manage the Google Ads Conversion ID and Purchase Label.

## Verification
- Verify that scripts are correctly injected in the page head.
- Ensure the Admin panel saves and retrieves the new settings.
- Confirm that the `trackPurchase` function now includes Google Ads conversion calls.
