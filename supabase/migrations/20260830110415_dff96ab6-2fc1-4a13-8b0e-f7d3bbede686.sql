-- ============ BASE ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','owner','user','vendor');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','cancelled','completed');
CREATE TYPE public.payment_status AS ENUM ('pending','completed','failed','refunded');
CREATE TYPE public.library_status AS ENUM ('pending','approved','suspended','rejected');
CREATE TYPE public.notification_type AS ENUM ('booking','payment','membership_expiry','approval','general');

-- ============ SHARED FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text,
  avatar_url text,
  needs_onboarding boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'owner' THEN 2 WHEN 'vendor' THEN 3 ELSE 4 END
  LIMIT 1
$$;

CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles admin write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ LIBRARIES (legacy core) ============
CREATE TABLE public.seat_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  seat_shape text DEFAULT 'rounded',
  seat_spacing numeric DEFAULT 8,
  row_spacing numeric DEFAULT 8,
  available_color text DEFAULT '#22c55e',
  booked_color text DEFAULT '#ef4444',
  prebooked_color text DEFAULT '#f59e0b',
  selected_color text DEFAULT '#6366f1',
  disabled_color text DEFAULT '#9ca3af',
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seat_themes TO anon, authenticated;
GRANT ALL ON public.seat_themes TO service_role;
ALTER TABLE public.seat_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "themes public read" ON public.seat_themes FOR SELECT USING (true);

CREATE TABLE public.libraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  map_lat numeric,
  map_lng numeric,
  contact_phone text,
  contact_email text,
  whatsapp_number text,
  upi_id text,
  profile_url text,
  banner_url text,
  property_type text DEFAULT 'library',
  gender_preference text DEFAULT 'common',
  facilities jsonb DEFAULT '[]'::jsonb,
  opening_hours jsonb DEFAULT '{}'::jsonb,
  status public.library_status NOT NULL DEFAULT 'pending',
  is_featured boolean NOT NULL DEFAULT false,
  theme_id uuid REFERENCES public.seat_themes(id),
  total_rows int DEFAULT 0,
  seats_per_row int DEFAULT 0,
  total_seats int DEFAULT 0,
  total_rooms int DEFAULT 0,
  total_beds int DEFAULT 0,
  average_rating numeric DEFAULT 0,
  total_reviews int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.libraries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.libraries TO authenticated;
GRANT ALL ON public.libraries TO service_role;
ALTER TABLE public.libraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "libraries public read" ON public.libraries FOR SELECT USING (status = 'approved');
CREATE POLICY "libraries owner read" ON public.libraries FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "libraries owner write" ON public.libraries FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER libraries_updated BEFORE UPDATE ON public.libraries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_library_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base_slug TEXT; final_slug TEXT; counter INTEGER := 1;
BEGIN
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.libraries WHERE slug = final_slug AND id != NEW.id) LOOP
    final_slug := base_slug || '-' || counter; counter := counter + 1;
  END LOOP;
  NEW.slug := final_slug; RETURN NEW;
END; $$;
CREATE TRIGGER libraries_slug BEFORE INSERT ON public.libraries FOR EACH ROW EXECUTE FUNCTION public.generate_library_slug();

CREATE TABLE public.library_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  display_order int DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.library_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_images TO authenticated;
GRANT ALL ON public.library_images TO service_role;
ALTER TABLE public.library_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "library images public read" ON public.library_images FOR SELECT USING (true);
CREATE POLICY "library images owner write" ON public.library_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  row_label text NOT NULL,
  seat_number int NOT NULL,
  is_disabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.seats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seats TO authenticated;
GRANT ALL ON public.seats TO service_role;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seats public read" ON public.seats FOR SELECT USING (true);
CREATE POLICY "seats owner write" ON public.seats FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_type text NOT NULL DEFAULT 'single',
  floor_number int,
  max_persons int NOT NULL DEFAULT 1,
  current_occupancy int NOT NULL DEFAULT 0,
  monthly_price numeric NOT NULL DEFAULT 0,
  price_per_bed numeric NOT NULL DEFAULT 0,
  has_ac boolean DEFAULT false,
  has_attached_bath boolean DEFAULT false,
  has_balcony boolean DEFAULT false,
  has_study_table boolean DEFAULT false,
  has_wardrobe boolean DEFAULT false,
  has_wifi boolean DEFAULT false,
  images jsonb DEFAULT '[]'::jsonb,
  policies text,
  permissions text,
  extra_requirements text,
  is_available boolean DEFAULT true,
  is_disabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rooms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms public read" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "rooms owner write" ON public.rooms FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE TRIGGER rooms_updated BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  bed_number int NOT NULL,
  bed_type text DEFAULT 'single',
  price_override numeric,
  is_occupied boolean DEFAULT false,
  is_disabled boolean DEFAULT false,
  occupant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beds TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beds TO authenticated;
GRANT ALL ON public.beds TO service_role;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beds public read" ON public.beds FOR SELECT USING (true);
CREATE POLICY "beds owner write" ON public.beds FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price_per_seat numeric NOT NULL DEFAULT 0,
  monthly_price numeric,
  discount_percent numeric,
  discount_amount numeric,
  discount_valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shifts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT ALL ON public.shifts TO service_role;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts public read" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "shifts owner write" ON public.shifts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE TRIGGER shifts_updated BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  role text DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff owner all" ON public.staff FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  booking_date date NOT NULL DEFAULT current_date,
  start_date date NOT NULL DEFAULT current_date,
  end_date date,
  is_monthly boolean DEFAULT false,
  total_amount numeric NOT NULL DEFAULT 0,
  discount_applied numeric DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  booking_status public.booking_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND l.owner_id = auth.uid()));
CREATE POLICY "bookings insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND l.owner_id = auth.uid()))
  WITH CHECK (true);
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.booking_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.booking_seats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_seats TO authenticated;
GRANT ALL ON public.booking_seats TO service_role;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking seats public read" ON public.booking_seats FOR SELECT USING (true);
CREATE POLICY "booking seats owner write" ON public.booking_seats FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_approved boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, library_id)
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (is_approved);
CREATE POLICY "reviews self write" ON public.reviews FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.update_library_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _lib uuid;
BEGIN
  _lib := COALESCE(NEW.library_id, OLD.library_id);
  UPDATE public.libraries SET
    average_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric,2) FROM public.reviews WHERE library_id = _lib AND is_approved),0),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE library_id = _lib AND is_approved)
  WHERE id = _lib;
  RETURN NULL;
END; $$;
CREATE TRIGGER reviews_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_library_rating();

CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, library_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist self" ON public.wishlists FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.visitor_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  viewer_id uuid,
  ip_address text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.visitor_views TO anon, authenticated;
GRANT SELECT ON public.visitor_views TO authenticated;
GRANT ALL ON public.visitor_views TO service_role;
ALTER TABLE public.visitor_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "views insert" ON public.visitor_views FOR INSERT WITH CHECK (true);
CREATE POLICY "views owner read" ON public.visitor_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- ============ MEMBERSHIPS ============
CREATE TABLE public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  duration_days int NOT NULL DEFAULT 30,
  max_seats int,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.membership_plans TO anon, authenticated;
GRANT ALL ON public.membership_plans TO service_role;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.membership_plans FOR SELECT USING (true);
CREATE POLICY "plans admin write" ON public.membership_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.owner_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.membership_plans(id),
  start_date date NOT NULL DEFAULT current_date,
  end_date date NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_reference text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.owner_memberships TO authenticated;
GRANT ALL ON public.owner_memberships TO service_role;
ALTER TABLE public.owner_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner memberships self" ON public.owner_memberships FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  library_id uuid NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  seat_id uuid REFERENCES public.seats(id) ON DELETE SET NULL,
  monthly_price numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT current_date,
  end_date date NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  payment_reference text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memberships TO authenticated;
GRANT ALL ON public.user_memberships TO service_role;
ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user memberships read" ON public.user_memberships FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND l.owner_id = auth.uid()));
CREATE POLICY "user memberships write" ON public.user_memberships FOR ALL TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND l.owner_id = auth.uid()))
  WITH CHECK (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.libraries l WHERE l.id = library_id AND l.owner_id = auth.uid()));

-- ============ NOTIFICATIONS / PUSH ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'general',
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications self" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'web',
  user_agent text,
  city text,
  lat numeric,
  lng numeric,
  topics text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_devices TO authenticated;
GRANT INSERT ON public.push_devices TO anon;
GRANT ALL ON public.push_devices TO service_role;
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devices self read" ON public.push_devices FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "devices insert" ON public.push_devices FOR INSERT WITH CHECK (true);
CREATE POLICY "devices self update" ON public.push_devices FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (true);
CREATE POLICY "devices self delete" ON public.push_devices FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER push_devices_updated BEFORE UPDATE ON public.push_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  icon_url text,
  banner_url text,
  action_url text,
  tag text,
  audience text NOT NULL DEFAULT 'all',
  audience_city text,
  audience_lat numeric,
  audience_lng numeric,
  radius_km numeric NOT NULL DEFAULT 10,
  source text NOT NULL DEFAULT 'admin',
  status text NOT NULL DEFAULT 'draft',
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_campaigns TO authenticated;
GRANT ALL ON public.push_campaigns TO service_role;
ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns admin all" ON public.push_campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER push_campaigns_updated BEFORE UPDATE ON public.push_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.nearby_push_devices(_lat numeric, _lng numeric, _radius_km numeric DEFAULT 10)
RETURNS TABLE (token text, distance_km numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.token,
    ROUND((6371 * acos(LEAST(1, cos(radians(_lat)) * cos(radians(d.lat)) * cos(radians(d.lng) - radians(_lng)) + sin(radians(_lat)) * sin(radians(d.lat)))))::numeric, 2) AS distance_km
  FROM public.push_devices d
  WHERE d.is_active AND d.lat IS NOT NULL AND d.lng IS NOT NULL
    AND (6371 * acos(LEAST(1, cos(radians(_lat)) * cos(radians(d.lat)) * cos(radians(d.lng) - radians(_lng)) + sin(radians(_lat)) * sin(radians(d.lat))))) <= _radius_km
$$;