# SEO Persistence and Site Title/Description Update Plan

Fix the SEO metadata persistence issues in the admin panel and ensure the global site title and description are correctly applied across the application while respecting the user's preference to keep current values.

## Proposed Changes

### Database (Supabase)
- Ensure a singleton record exists in the `site_settings` table (where `id = true`).
- If no record exists, seed the initial row with the current site defaults.

### Admin Panel (Backend/Persistence)
- Fix the `save` mutation in `src/routes/_authenticated/admin/configuracoes.tsx` to handle the singleton logic correctly.
- Add an `upsert: true` or manual check to ensure the `site_settings` row is created if missing when saving.
- Verify the field names in the `form` state match the database column names exactly.

### SEO Injection (Frontend)
- Fix the data fetching in `src/routes/__root.tsx` loader to correctly retrieve and provide site settings to all routes.
- Ensure the `head` function in `src/routes/__root.tsx` uses the stored SEO metadata, falling back to the current defaults as requested.
- Update `src/routes/index.tsx` and other content routes to correctly inherit or override metadata from the site settings.
- Ensure `og:` and `twitter:` tags correctly mirror the final titles and descriptions.

### Analytics (Safe Zone)
- **Constraint**: No changes will be made to any code related to Analytics, Google Tag Manager, or tracking scripts. The isolation of these features will be strictly maintained.

## Technical Details

### Database Initialization
```sql
INSERT INTO public.site_settings (id, site_name, seo_title, seo_description)
VALUES (true, 'Estampa Flix', 'Estampa Flix — Artes digitais para sublimação e DTF', 'Milhares de artes digitais em alta qualidade (300 DPI) para sublimação, DTF e estamparia.')
ON CONFLICT (id) DO NOTHING;
```

### Admin Form Fix
Update the save logic in `src/routes/_authenticated/admin/configuracoes.tsx`:
```typescript
const save = useMutation({
  mutationFn: async () => {
    // Ensure we are upserting to the singleton row
    const { error } = await supabase
      .from("site_settings")
      .upsert({ ...form, id: true }, { onConflict: 'id' });
    if (error) throw error;
  },
  // ... success/error handlers
});
```

### Global Head Metadata
Refine `src/routes/__root.tsx` to ensure the `RootSeo` object is always populated and correctly used by the `head` function.
