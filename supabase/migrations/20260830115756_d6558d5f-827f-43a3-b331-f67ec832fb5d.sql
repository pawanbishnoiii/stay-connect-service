-- Internal helpers are only used by triggers or backend push logic; the app
-- reads roles through RLS. Drop direct signed-in API access to them.
revoke execute on function public.get_user_role(uuid) from authenticated;
revoke execute on function public.nearby_push_devices(numeric, numeric, numeric) from authenticated;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.bump_conversation() from authenticated;
revoke execute on function public.update_library_rating() from authenticated;
revoke execute on function public.update_listing_rating() from authenticated;