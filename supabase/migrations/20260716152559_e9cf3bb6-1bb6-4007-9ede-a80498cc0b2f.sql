
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS pix_qr_code text,
  ADD COLUMN IF NOT EXISTS pix_qr_code_base64 text,
  ADD COLUMN IF NOT EXISTS pix_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_provider_payment_id_idx
  ON public.orders (provider_payment_id);
