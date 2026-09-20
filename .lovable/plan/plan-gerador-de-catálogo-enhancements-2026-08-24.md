# Plan - Gerador de Catálogo Enhancements

This plan addresses UI flickers for Premium users, increases sidebar margins, and applies requested visual text updates in the "Gerador de Catálogo" page.

## Changes

### Frontend

- **src/routes/gerador-catalogo.tsx**
    - Update logic for the "Vantagens de ser Premium" block to prevent it from flickering for Premium users during data loading. It will now only show when the subscription state is explicitly non-premium and not loading.
    - Increase the bottom margin of the sidebar from 5px to 8px for better spacing.
    - Apply the visual text replacement for the invisible separator span (`\u2063`).

## Technical details

- Use the `isLoading` state from `useUserSubscription` and check for `userId` presence to ensure the Premium block visibility is stable during initial load.
- Adjust `lg:pb-[5px]` and the spacer `div` height from `5px` to `8px` in the sidebar layout.
- Locate and update the span containing the invisible character as requested.

## Verification plan

- **Visual check**: Verify that the "Vantagens de ser Premium" block does not flash briefly for users with active subscriptions.
- **Layout check**: Confirm the bottom margin of the sidebar is visibly larger (8px).
- **Functionality check**: Ensure the "Gerador de Catálogo" still functions correctly for both free and premium users.
