ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS show_book boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_order boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_whatsapp boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_visit boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accommodation_type text,
  ADD COLUMN IF NOT EXISTS food_menu jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS price_items jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_seconds integer NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all business profiles" ON public.business_profiles;
CREATE POLICY "Admins can view all business profiles" ON public.business_profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));