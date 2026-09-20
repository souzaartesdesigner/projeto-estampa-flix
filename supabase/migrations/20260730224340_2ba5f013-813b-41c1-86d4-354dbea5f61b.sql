-- ============ SECURITY: restrict SECURITY DEFINER functions ============
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_reviews_prepare() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_order_downloads(uuid) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.admin_get_artwork_external_url(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_artwork_external_url(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.consume_download(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_download(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.free_downloads_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.free_downloads_today() TO authenticated;

REVOKE ALL ON FUNCTION public.validate_coupon(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, text, integer) TO authenticated;

-- has_role / has_purchased_or_downloaded are required by RLS policies at runtime
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.has_purchased_or_downloaded(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_purchased_or_downloaded(uuid, uuid) TO authenticated;

-- ============ PERFORMANCE: indexes ============
CREATE INDEX IF NOT EXISTS artworks_pub_created_idx ON public.artworks (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS artworks_pub_featured_idx ON public.artworks (is_published, is_featured, featured_order);
CREATE INDEX IF NOT EXISTS artworks_pub_downloads_idx ON public.artworks (is_published, download_count DESC);
CREATE INDEX IF NOT EXISTS artworks_pub_trending_idx ON public.artworks (is_published, is_trending);
CREATE INDEX IF NOT EXISTS artworks_category_idx ON public.artworks (category_id);
CREATE INDEX IF NOT EXISTS artworks_file_format_idx ON public.artworks (file_format);

CREATE INDEX IF NOT EXISTS favorites_user_idx ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS cart_items_user_idx ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS reviews_artwork_approved_idx ON public.reviews (artwork_id, is_approved);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS coupon_redemptions_user_coupon_idx ON public.coupon_redemptions (user_id, coupon_id);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (is_published, published_at DESC);