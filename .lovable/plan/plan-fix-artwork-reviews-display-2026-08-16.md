# Plan - Fix Artwork Reviews Display

The user reports that even after approving a review in the admin panel, the product page still shows the "No reviews yet" message.

## Proposed Changes

### Database & Permissions
- Verify that the `reviews` table has the correct `is_approved` flag set for the reviews.
- Ensure RLS policies on the `reviews` table allow `SELECT` for `anon` and `authenticated` roles when `is_approved = true`.
- Check if the `artwork_id` passed to the component matches the `id` of the artwork in the database.

### Frontend - Artwork Reviews Component
- Review `src/components/artwork-reviews.tsx` to ensure the query correctly filters by `artwork_id` and `is_approved`.
- Verify the query includes the `profiles` relationship to display the reviewer's name.
- Add more robust error handling or empty state checks if needed.

## Technical Details
- Table: `public.reviews`
- Columns: `id`, `artwork_id`, `rating`, `comment`, `is_approved`, `user_id`
- Component: `src/components/artwork-reviews.tsx`
- Query: `supabase.from("reviews").select(...).eq("artwork_id", artworkId).eq("is_approved", true)`
