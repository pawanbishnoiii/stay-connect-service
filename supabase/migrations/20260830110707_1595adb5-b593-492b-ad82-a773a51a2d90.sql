
-- ============ ENUMS ============
CREATE TYPE public.listing_state AS ENUM ('draft','pending','published','rejected','suspended','archived');
CREATE TYPE public.verification_state AS ENUM ('unverified','pending','verified');
CREATE TYPE public.order_state AS ENUM ('new','accepted','preparing','ready','out_for_delivery','delivered','completed','cancelled');
CREATE TYPE public.ledger_kind AS ENUM ('income','expense','credit','debit','advance','refund');
CREATE TYPE public.pay_method AS ENUM ('cash','upi','bank_transfer','online','manual');

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'property',
  icon text,
  color text,
  description text,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);
GRANT SELECT ON public.subcategories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;
GRANT ALL ON public.subcategories TO service_role;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subcategories public read" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "subcategories admin write" ON public.subcategories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  group_name text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.amenities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amenities TO authenticated;
GRANT ALL ON public.amenities TO service_role;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amenities public read" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "amenities admin write" ON public.amenities FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags public read" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags admin write" ON public.tags FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ OWNER / VENDOR PROFILE ============
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  business_name text,
  title text,
  about text,
  avatar_url text,
  slug text UNIQUE,
  started_year int,
  phone text,
  whatsapp text,
  email text,
  instagram text,
  youtube text,
  address text,
  city text,
  locality text,
  state text,
  pincode text,
  lat numeric,
  lng numeric,
  primary_category_id uuid REFERENCES public.categories(id),
  onboarding_step int NOT NULL DEFAULT 1,
  onboarding_complete boolean NOT NULL DEFAULT false,
  verification verification_state NOT NULL DEFAULT 'unverified',
  average_rating numeric NOT NULL DEFAULT 0,
  total_reviews int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_profiles TO authenticated;
GRANT ALL ON public.business_profiles TO service_role;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business public read" ON public.business_profiles FOR SELECT USING (true);
CREATE POLICY "business self manage" ON public.business_profiles FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  aadhaar_ref text,
  document_url text,
  selfie_url text,
  status verification_state NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif self" ON public.verification_requests FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ LISTINGS ============
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  subcategory_id uuid REFERENCES public.subcategories(id),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  about text,
  cover_url text,
  gender_preference text NOT NULL DEFAULT 'common',
  address text,
  locality text,
  city text,
  state text,
  pincode text,
  lat numeric,
  lng numeric,
  phone text,
  whatsapp text,
  email text,
  price_original numeric,
  price_current numeric,
  price_offer numeric,
  price_unit text NOT NULL DEFAULT 'month',
  security_deposit numeric NOT NULL DEFAULT 0,
  advance_amount numeric NOT NULL DEFAULT 0,
  maintenance_charge numeric NOT NULL DEFAULT 0,
  electricity_charge numeric NOT NULL DEFAULT 0,
  water_charge numeric NOT NULL DEFAULT 0,
  other_charges numeric NOT NULL DEFAULT 0,
  capacity int,
  available_units int,
  is_open_now boolean NOT NULL DEFAULT true,
  seo_title text,
  seo_description text,
  status listing_state NOT NULL DEFAULT 'draft',
  verification verification_state NOT NULL DEFAULT 'unverified',
  is_featured boolean NOT NULL DEFAULT false,
  average_rating numeric NOT NULL DEFAULT 0,
  total_reviews int NOT NULL DEFAULT 0,
  view_count int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listings_geo_idx ON public.listings (lat, lng);
CREATE INDEX listings_cat_idx ON public.listings (category_id, status);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings public read" ON public.listings FOR SELECT USING (status = 'published');
CREATE POLICY "listings owner read" ON public.listings FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "listings owner write" ON public.listings FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.is_listing_owner(_listing uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = _listing AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
$$;
CREATE OR REPLACE FUNCTION public.is_listing_public(_listing uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = _listing AND l.status = 'published')
$$;

CREATE TABLE public.listing_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  is_cover boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listing_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_media TO authenticated;
GRANT ALL ON public.listing_media TO service_role;
ALTER TABLE public.listing_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media public read" ON public.listing_media FOR SELECT USING (public.is_listing_public(listing_id));
CREATE POLICY "media owner all" ON public.listing_media FOR ALL TO authenticated USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

CREATE TABLE public.listing_amenities (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, amenity_id)
);
GRANT SELECT ON public.listing_amenities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_amenities TO authenticated;
GRANT ALL ON public.listing_amenities TO service_role;
ALTER TABLE public.listing_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "la public read" ON public.listing_amenities FOR SELECT USING (public.is_listing_public(listing_id));
CREATE POLICY "la owner all" ON public.listing_amenities FOR ALL TO authenticated USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

CREATE TABLE public.listing_tags (
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, tag_id)
);
GRANT SELECT ON public.listing_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_tags TO authenticated;
GRANT ALL ON public.listing_tags TO service_role;
ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lt public read" ON public.listing_tags FOR SELECT USING (public.is_listing_public(listing_id));
CREATE POLICY "lt owner all" ON public.listing_tags FOR ALL TO authenticated USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

CREATE TABLE public.listing_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  image_url text,
  price numeric NOT NULL DEFAULT 0,
  price_unit text NOT NULL DEFAULT 'item',
  meal_type text,
  food_type text,
  duration_minutes int,
  is_available boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listing_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_services TO authenticated;
GRANT ALL ON public.listing_services TO service_role;
ALTER TABLE public.listing_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ls public read" ON public.listing_services FOR SELECT USING (public.is_listing_public(listing_id));
CREATE POLICY "ls owner all" ON public.listing_services FOR ALL TO authenticated USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

CREATE TABLE public.listing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  name text NOT NULL,
  period text NOT NULL DEFAULT 'monthly',
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  shift_name text,
  start_time time,
  end_time time,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listing_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_plans TO authenticated;
GRANT ALL ON public.listing_plans TO service_role;
ALTER TABLE public.listing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp public read" ON public.listing_plans FOR SELECT USING (public.is_listing_public(listing_id));
CREATE POLICY "lp owner all" ON public.listing_plans FOR ALL TO authenticated USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

CREATE TABLE public.listing_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  day_of_week int NOT NULL,
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false,
  UNIQUE (listing_id, day_of_week)
);
GRANT SELECT ON public.listing_hours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_hours TO authenticated;
GRANT ALL ON public.listing_hours TO service_role;
ALTER TABLE public.listing_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lh public read" ON public.listing_hours FOR SELECT USING (public.is_listing_public(listing_id));
CREATE POLICY "lh owner all" ON public.listing_hours FOR ALL TO authenticated USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

CREATE TABLE public.delivery_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  locality text NOT NULL,
  city text,
  radius_km numeric NOT NULL DEFAULT 3,
  fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.delivery_areas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_areas TO authenticated;
GRANT ALL ON public.delivery_areas TO service_role;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "da public read" ON public.delivery_areas FOR SELECT USING (public.is_listing_public(listing_id));
CREATE POLICY "da owner all" ON public.delivery_areas FOR ALL TO authenticated USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_percent int,
  discount_amount numeric,
  original_price numeric,
  offer_price numeric,
  promo_code text,
  conditions text,
  badge text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers public read" ON public.offers FOR SELECT USING (public.is_listing_public(listing_id));
CREATE POLICY "offers owner all" ON public.offers FOR ALL TO authenticated USING (public.is_listing_owner(listing_id)) WITH CHECK (public.is_listing_owner(listing_id));

-- ============ USER ACTIVITY ============
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fav self" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recently_viewed TO authenticated;
GRANT ALL ON public.recently_viewed TO service_role;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rv self" ON public.recently_viewed FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  query text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  city text,
  lat numeric,
  lng numeric,
  radius_km numeric NOT NULL DEFAULT 5,
  max_price numeric,
  min_rating numeric,
  notify boolean NOT NULL DEFAULT true,
  last_notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ss self" ON public.saved_searches FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.saved_search_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid NOT NULL REFERENCES public.saved_searches(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  notified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (saved_search_id, listing_id)
);
GRANT SELECT ON public.saved_search_matches TO authenticated;
GRANT ALL ON public.saved_search_matches TO service_role;
ALTER TABLE public.saved_search_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ssm read own" ON public.saved_search_matches FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.saved_searches s WHERE s.id = saved_search_id AND s.user_id = auth.uid()));

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY,
  push_enabled boolean NOT NULL DEFAULT true,
  bookings boolean NOT NULL DEFAULT true,
  payments boolean NOT NULL DEFAULT true,
  reviews boolean NOT NULL DEFAULT true,
  offers boolean NOT NULL DEFAULT true,
  nearby boolean NOT NULL DEFAULT true,
  saved_search boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "np self" ON public.notification_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ REVIEWS ============
CREATE TABLE public.listing_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating int NOT NULL,
  title text,
  comment text,
  is_verified_customer boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT true,
  helpful_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, user_id)
);
GRANT SELECT ON public.listing_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_reviews TO authenticated;
GRANT ALL ON public.listing_reviews TO service_role;
ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.listing_reviews FOR SELECT USING (is_approved);
CREATE POLICY "reviews self write" ON public.listing_reviews FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.review_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.listing_reviews(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.review_media TO anon;
GRANT SELECT, INSERT, DELETE ON public.review_media TO authenticated;
GRANT ALL ON public.review_media TO service_role;
ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rm public read" ON public.review_media FOR SELECT USING (true);
CREATE POLICY "rm self write" ON public.review_media FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.listing_reviews r WHERE r.id = review_id AND r.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.listing_reviews r WHERE r.id = review_id AND r.user_id = auth.uid()));

CREATE TABLE public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.listing_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.review_replies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_replies TO authenticated;
GRANT ALL ON public.review_replies TO service_role;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rr public read" ON public.review_replies FOR SELECT USING (true);
CREATE POLICY "rr self write" ON public.review_replies FOR ALL TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.listing_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.review_reports TO authenticated;
GRANT ALL ON public.review_reports TO service_role;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rrep insert" ON public.review_reports FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rrep read" ON public.review_reports FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ BOOKINGS / ORDERS ============
CREATE TABLE public.listing_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  user_id uuid NOT NULL,
  plan_id uuid REFERENCES public.listing_plans(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.listing_services(id) ON DELETE SET NULL,
  booking_type text NOT NULL DEFAULT 'booking',
  quantity int NOT NULL DEFAULT 1,
  start_date date,
  end_date date,
  scheduled_at timestamptz,
  slot text,
  pickup_address text,
  pickup_lat numeric,
  pickup_lng numeric,
  delivery_address text,
  delivery_lat numeric,
  delivery_lng numeric,
  contact_phone text,
  amount numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  status order_state NOT NULL DEFAULT 'new',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_method pay_method,
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.listing_bookings TO authenticated;
GRANT ALL ON public.listing_bookings TO service_role;
ALTER TABLE public.listing_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lb read" ON public.listing_bookings FOR SELECT TO authenticated USING (user_id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "lb insert" ON public.listing_bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "lb update" ON public.listing_bookings FOR UPDATE TO authenticated USING (user_id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  user_id uuid,
  name text,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.enquiries TO anon;
GRANT SELECT, INSERT, UPDATE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enq insert" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "enq read" ON public.enquiries FOR SELECT TO authenticated USING (user_id = auth.uid() OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "enq update" ON public.enquiries FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ BUSINESS OPS ============
CREATE TABLE public.business_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  user_id uuid,
  name text NOT NULL,
  phone text,
  email text,
  photo_url text,
  address text,
  customer_type text NOT NULL DEFAULT 'customer',
  plan_name text,
  room_label text,
  bed_label text,
  meal_preference text,
  start_date date,
  next_renewal date,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_customers TO authenticated;
GRANT ALL ON public.business_customers TO service_role;
ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bc owner all" ON public.business_customers FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bc self read" ON public.business_customers FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.business_customers(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.listing_bookings(id) ON DELETE SET NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  kind ledger_kind NOT NULL,
  category text,
  description text,
  amount numeric NOT NULL,
  method pay_method,
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger owner all" ON public.ledger_entries FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'general',
  description text,
  amount numeric NOT NULL,
  method pay_method,
  receipt_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exp owner all" ON public.expenses FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings read" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "settings admin" ON public.admin_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.generate_listing_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; final text; c int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND (TG_OP = 'UPDATE' AND NEW.slug <> OLD.slug) THEN
    base := trim(both '-' from lower(regexp_replace(NEW.slug,'[^a-zA-Z0-9]+','-','g')));
  ELSIF NEW.slug IS NULL OR NEW.slug = '' THEN
    base := trim(both '-' from lower(regexp_replace(NEW.title,'[^a-zA-Z0-9]+','-','g')));
  ELSE
    RETURN NEW;
  END IF;
  IF base = '' THEN base := 'listing'; END IF;
  final := base;
  WHILE EXISTS (SELECT 1 FROM public.listings WHERE slug = final AND id <> NEW.id) LOOP
    final := base || '-' || c; c := c + 1;
  END LOOP;
  NEW.slug := final;
  RETURN NEW;
END; $$;
CREATE TRIGGER listings_slug BEFORE INSERT OR UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.generate_listing_slug();
CREATE TRIGGER listings_updated BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER business_profiles_updated BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER listing_bookings_updated BEFORE UPDATE ON public.listing_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER business_customers_updated BEFORE UPDATE ON public.business_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER listing_services_updated BEFORE UPDATE ON public.listing_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER listing_plans_updated BEFORE UPDATE ON public.listing_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_listing_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.listings SET
    average_rating = (SELECT COALESCE(AVG(rating),0) FROM public.listing_reviews WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id) AND is_approved),
    total_reviews = (SELECT COUNT(*) FROM public.listing_reviews WHERE listing_id = COALESCE(NEW.listing_id, OLD.listing_id) AND is_approved)
  WHERE id = COALESCE(NEW.listing_id, OLD.listing_id);
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER listing_rating_sync AFTER INSERT OR UPDATE OR DELETE ON public.listing_reviews FOR EACH ROW EXECUTE FUNCTION public.update_listing_rating();

-- nearby listings helper
CREATE OR REPLACE FUNCTION public.nearby_listings(_lat numeric, _lng numeric, _radius_km numeric DEFAULT 10, _category text DEFAULT NULL, _limit int DEFAULT 50)
RETURNS TABLE (id uuid, slug text, title text, cover_url text, city text, locality text, average_rating numeric, total_reviews int, price_current numeric, category_id uuid, distance_km numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.slug, l.title, l.cover_url, l.city, l.locality, l.average_rating, l.total_reviews, l.price_current, l.category_id,
    (6371 * acos(least(1, greatest(-1,
      cos(radians(_lat))*cos(radians(l.lat))*cos(radians(l.lng)-radians(_lng)) + sin(radians(_lat))*sin(radians(l.lat))
    ))))::numeric AS distance_km
  FROM public.listings l
  LEFT JOIN public.categories c ON c.id = l.category_id
  WHERE l.status = 'published' AND l.lat IS NOT NULL AND l.lng IS NOT NULL
    AND (_category IS NULL OR c.slug = _category)
    AND (6371 * acos(least(1, greatest(-1,
      cos(radians(_lat))*cos(radians(l.lat))*cos(radians(l.lng)-radians(_lng)) + sin(radians(_lat))*sin(radians(l.lat))
    )))) <= _radius_km
  ORDER BY distance_km ASC
  LIMIT _limit
$$;