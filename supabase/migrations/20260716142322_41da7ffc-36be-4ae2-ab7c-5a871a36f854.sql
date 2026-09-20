ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON public.subscriptions(stripe_subscription_id);