-- Harden public.email_logs: read restricted to admins, writes only via server (service_role)
REVOKE ALL ON public.email_logs FROM anon;
REVOKE ALL ON public.email_logs FROM authenticated;
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_admin_read" ON public.email_logs;
CREATE POLICY "email_logs_admin_read" ON public.email_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
