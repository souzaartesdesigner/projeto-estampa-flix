
-- Grant SELECT on reviews to anon and authenticated
GRANT SELECT ON public.reviews TO anon, authenticated;

-- Grant EXECUTE on the specific RPC function to anon and authenticated
GRANT EXECUTE ON FUNCTION public.review_author_names(uuid[]) TO anon, authenticated;

-- Ensure RLS is enabled and policy exists
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
FOR SELECT TO anon, authenticated
USING (is_approved = true OR auth.uid() = user_id);

-- Verify grants after applying
SELECT 
    grantee, privilege_type, table_name
FROM information_schema.role_table_grants 
WHERE table_name = 'reviews' AND table_schema = 'public' AND (grantee = 'anon' OR grantee = 'authenticated');

SELECT 
    routine_name, grantee, privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'review_author_names' AND routine_schema = 'public' AND (grantee = 'anon' OR grantee = 'authenticated');
