
-- Add phone to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add order_number (auto-increment, human friendly) to orders
CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq START 1000;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number bigint UNIQUE;
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq');
GRANT USAGE, SELECT ON SEQUENCE public.orders_order_number_seq TO authenticated, service_role;

-- Backfill existing orders
UPDATE public.orders SET order_number = nextval('public.orders_order_number_seq') WHERE order_number IS NULL;
ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;

-- Admin cancel/refund helper: allow admin to update order status/refund note
-- (Already covered by "Admin manage orders" policy)
