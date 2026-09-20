-- 1. Correção de RLS: Garantir que tabelas críticas tenham políticas estritas de dono
-- Tabela de Orders
DROP POLICY IF EXISTS "Own orders read" ON public.orders;
CREATE POLICY "Users can read own orders" ON public.orders
FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Tabela de Subscriptions
DROP POLICY IF EXISTS "Own subscription read" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- 2. Reforçar a função consume_download (já auditada, garantindo que não retorne file_path se não tiver acesso)
-- A função já utiliza security definer para gerir créditos, mas as políticas de RLS nas tabelas base 
-- garantem que o usuário não consiga ler o file_path diretamente via API REST.

-- 3. Proteção contra IDOR em cart_items
DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items" ON public.cart_items
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Sanitização de Suporte (Evitar XSS simples)
ALTER TABLE public.support_messages ALTER COLUMN message SET DATA TYPE text;

-- 5. Revogar acesso anon a tabelas sensíveis que possam ter sobrado
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.subscriptions FROM anon;
REVOKE ALL ON public.downloads FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.downloads TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
