ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_service boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_location boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_booking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_pickup boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_delivery boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

UPDATE public.categories
SET supports_pickup = true,
    supports_delivery = true
WHERE lower(slug) IN ('tiffin', 'laundry', 'washing-press', 'washing-and-press');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS age smallint,
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET first_name = COALESCE(first_name, NULLIF(split_part(trim(full_name), ' ', 1), '')),
    last_name = COALESCE(last_name, NULLIF(trim(regexp_replace(trim(full_name), '^\\S+\\s*', '')), ''))
WHERE full_name IS NOT NULL
  AND (first_name IS NULL OR last_name IS NULL);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_age_range_check
  CHECK (age IS NULL OR age BETWEEN 13 AND 120);

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS operational_status text NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS single_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS double_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS triple_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS cleaning_status text NOT NULL DEFAULT 'ready';

UPDATE public.rooms
SET operational_status = CASE WHEN COALESCE(current_occupancy, 0) > 0 THEN 'occupied' ELSE 'available' END
WHERE operational_status = 'available';

ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_operational_status_check
  CHECK (operational_status IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance', 'unavailable')),
  ADD CONSTRAINT rooms_cleaning_status_check
  CHECK (cleaning_status IN ('ready', 'needs_cleaning', 'in_progress', 'inspection'));

CREATE TABLE public.property_stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  bed_id uuid REFERENCES public.beds(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  user_id uuid,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  status text NOT NULL DEFAULT 'reserved',
  payment_status text NOT NULL DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_stays_dates_check CHECK (check_out > check_in),
  CONSTRAINT property_stays_status_check CHECK (status IN ('reserved', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
  CONSTRAINT property_stays_payment_status_check CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  CONSTRAINT property_stays_amounts_check CHECK (total_amount >= 0 AND amount_paid >= 0 AND amount_paid <= total_amount)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_stays TO authenticated;
GRANT ALL ON public.property_stays TO service_role;
ALTER TABLE public.property_stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "property stays participant read" ON public.property_stays
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "property stays guest or owner insert" ON public.property_stays
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id))
    OR (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND l.owner_id = auth.uid()) AND owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "property stays owner update" ON public.property_stays
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "property stays owner delete" ON public.property_stays
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX property_stays_library_dates_idx ON public.property_stays (library_id, check_in, check_out);
CREATE INDEX property_stays_owner_status_idx ON public.property_stays (owner_id, status, check_in);
CREATE INDEX property_stays_user_idx ON public.property_stays (user_id, created_at DESC);
CREATE TRIGGER property_stays_updated_at
  BEFORE UPDATE ON public.property_stays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.room_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  details text,
  issue_type text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  reported_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_issues_type_check CHECK (issue_type IN ('ac', 'wifi', 'plumbing', 'electrical', 'cleaning', 'furniture', 'general')),
  CONSTRAINT room_issues_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT room_issues_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_issues TO authenticated;
GRANT ALL ON public.room_issues TO service_role;
ALTER TABLE public.room_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room issues owner access" ON public.room_issues
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "room issues owner insert" ON public.room_issues
  FOR INSERT TO authenticated
  WITH CHECK ((owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND l.owner_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "room issues owner update" ON public.room_issues
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "room issues owner delete" ON public.room_issues
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX room_issues_library_status_idx ON public.room_issues (library_id, status, priority);
CREATE INDEX room_issues_owner_updated_idx ON public.room_issues (owner_id, updated_at DESC);
CREATE TRIGGER room_issues_updated_at
  BEFORE UPDATE ON public.room_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();