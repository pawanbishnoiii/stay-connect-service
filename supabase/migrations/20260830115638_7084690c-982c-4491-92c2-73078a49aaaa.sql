-- 1) Owner self-onboarding: any signed-in user may become a business owner.
--    The role literal is hardcoded; 'admin' can never be self-granted.
create or replace function public.become_owner()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'owner'::app_role)
  on conflict (user_id, role) do nothing
$$;

revoke execute on function public.become_owner() from public, anon;
grant execute on function public.become_owner() to authenticated;

-- 2) Seed service categories
insert into public.categories (slug, name, kind, icon, color, description, sort_order, is_active) values
  ('library', 'Library', 'place', 'library', '#7c3aed', 'Study spaces with daily or monthly seat passes', 1, true),
  ('gym', 'Gym', 'place', 'gym', '#e11d48', 'Fitness centres with day and monthly memberships', 2, true),
  ('pg', 'PG', 'place', 'pg', '#059669', 'Paying guest accommodations near colleges', 3, true),
  ('hostel', 'Hostel', 'place', 'hostel', '#d97706', 'Hostels with rooms and beds', 4, true),
  ('rooms', 'Rooms', 'place', 'room', '#ea580c', 'Independent rooms on rent', 5, true),
  ('tiffin', 'Tiffin', 'service', 'tiffin', '#65a30d', 'Daily home-style meals delivered', 6, true),
  ('laundry', 'Washing & Press', 'service', 'laundry', '#0284c7', 'Wash, iron and dry-cleaning services', 7, true),
  ('electrician', 'Electrician', 'service', 'electrician', '#4f46e5', 'Electrical repairs and fittings', 8, true),
  ('cleaning', 'Cleaning', 'service', 'cleaning', '#0d9488', 'Home and room cleaning services', 9, true),
  ('food', 'Food', 'service', 'food', '#db2777', 'Restaurants and food delivery', 10, true);

-- 3) Seed amenities grouped by category
insert into public.amenities (name, slug, icon, group_name, is_active) values
  ('WiFi', 'wifi', 'wifi', 'Connectivity', true),
  ('Power backup', 'power-backup', 'power-backup', 'Connectivity', true),
  ('AC', 'ac', 'ac', 'Comfort', true),
  ('Fan', 'fan', 'fan', 'Comfort', true),
  ('Fridge', 'fridge', 'fridge', 'Comfort', true),
  ('Hot water', 'hot-water', 'hot-water', 'Bathroom', true),
  ('Attached bathroom', 'attached-bath', 'attached-bath', 'Bathroom', true),
  ('Common bathroom', 'common-bath', 'common-bath', 'Bathroom', true),
  ('Study table', 'study-table', null, 'Furniture', true),
  ('Wardrobe', 'wardrobe', null, 'Furniture', true),
  ('Balcony', 'balcony', null, 'Furniture', true),
  ('Parking', 'parking', 'parking', 'Parking', true),
  ('Bike parking', 'bike-parking', 'parking', 'Parking', true),
  ('Washing machine', 'washing-machine', 'washing-machine', 'Laundry', true),
  ('Laundry pickup', 'laundry-pickup', 'laundry', 'Laundry', true),
  ('Veg meals', 'veg-meals', 'veg', 'Food', true),
  ('Non-veg meals', 'non-veg-meals', 'non-veg', 'Food', true),
  ('Housekeeping', 'housekeeping', 'cleaning', 'Services', true),
  ('CCTV security', 'cctv', null, 'Services', true),
  ('Doorstep pickup', 'doorstep-pickup', 'nearby', 'Services', true),
  ('Free delivery', 'free-delivery', 'tiffin', 'Services', true),
  ('24x7 support', '24x7-support', 'support', 'Services', true);