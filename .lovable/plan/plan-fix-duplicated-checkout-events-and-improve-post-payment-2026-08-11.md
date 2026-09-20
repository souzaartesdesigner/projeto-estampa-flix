# Plan: Fix Duplicated Checkout Events and Improve Post-Payment Redirection

The user reported two issues:
1. `begin_checkout` events are duplicated when clicking "Finalizar Compra".
2. After a successful Pix payment, the redirection stays stuck on "Pagamento confirmado! Redirecionando para a sua arte..." instead of going directly to the downloads page.

## Proposed Changes

### 1. Fix Duplicated `begin_checkout` Events
- **Analysis**: The `trackBeginCheckout` function is currently called in the `mutationFn` of `checkoutMut` in `src/routes/_authenticated/carrinho.tsx` and also in a `useEffect` inside `src/routes/pagamento.pix.$orderId.tsx`.
- **Solution**: Remove the `useEffect` trigger in `src/routes/pagamento.pix.$orderId.tsx` that fires `trackBeginCheckout` when the status is "pending". Keep it only on the explicit user action (clicking the button) to ensure it fires exactly once per intent.
- **Files**: `src/routes/pagamento.pix.$orderId.tsx`

### 2. Improve Post-Payment Redirection
- **Analysis**: When a Pix payment is confirmed, the app currently tries to redirect to the specific artwork page if a slug is available, or to `minha-conta?tab=orders`. The user wants to go directly to the downloads page.
- **Solution**: Update the redirection logic in the `useEffect` (triggered by `status === "paid"`) to navigate to `/minha-conta?tab=downloads` instead of the orders tab or individual artwork page, providing a better user experience for immediate access to the purchase.
- **Files**: `src/routes/pagamento.pix.$orderId.tsx`

## Verification Plan

### Automated Verification
- Drive Playwright to simulate a checkout flow:
    - Add item to cart.
    - Click "Finalizar Compra".
    - Check browser console logs for `dataLayer` pushes to verify `begin_checkout` is fired once.
    - (Mocking payment confirmation) Verify navigation goes to `/minha-conta?tab=downloads`.

### Manual Verification
- Review code changes to ensure all `trackBeginCheckout` calls are now single-gated by user actions.
