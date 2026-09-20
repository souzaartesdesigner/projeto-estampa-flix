-- Harden support_messages: prevent ownership spoofing on update
DROP POLICY IF EXISTS "Support admin update" ON public.support_messages;
CREATE POLICY "Support admin update" ON public.support_messages
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));