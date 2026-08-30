
REVOKE EXECUTE ON FUNCTION public.update_listing_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_library_rating() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_listing_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_listing_public(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.nearby_push_devices(numeric, numeric, numeric) FROM PUBLIC;
