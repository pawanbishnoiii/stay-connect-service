ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS rules text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS room_types jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.listing_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  user_id uuid,
  name text,
  phone text NOT NULL,
  visit_date date NOT NULL,
  visit_time text,
  mode text NOT NULL DEFAULT 'physical',
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_visits TO authenticated;
GRANT ALL ON public.listing_visits TO service_role;
ALTER TABLE public.listing_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visits insert" ON public.listing_visits FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "visits read" ON public.listing_visits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "visits update" ON public.listing_visits FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER listing_visits_updated BEFORE UPDATE ON public.listing_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_messages_user_idx ON public.support_messages (user_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support self read" ON public.support_messages FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "support self write" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

INSERT INTO public.admin_settings (key, value)
VALUES ('support_ai', '{"prompt":"You are LocalSpot Support, a warm and concise helper for a local services marketplace in India (PG, hostels, rooms, libraries, gyms, tiffin, laundry, home services). Reply in the same language the user writes in — Hindi, Hinglish or English. Help users find places, understand bookings, contact owners, and resolve issues. Never invent prices or availability; suggest opening the listing or messaging the owner instead.","prompts":[]}'::jsonb)
ON CONFLICT (key) DO NOTHING;