
CREATE OR REPLACE FUNCTION public.nearby_listings(_lat numeric, _lng numeric, _radius_km numeric DEFAULT 10, _category text DEFAULT NULL, _limit int DEFAULT 50)
RETURNS TABLE (id uuid, slug text, title text, cover_url text, city text, locality text, average_rating numeric, total_reviews int, price_current numeric, category_id uuid, distance_km numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
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

REVOKE EXECUTE ON FUNCTION public.is_listing_owner(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_listing_public(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.nearby_push_devices(numeric, numeric, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_listing_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_library_rating() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_listing_slug() FROM anon, authenticated;
