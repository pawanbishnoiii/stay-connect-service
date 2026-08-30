-- Replace the security-definer self-onboarding function with an RLS-native,
-- non-recursive self-service insert policy. The role literal is hardcoded to
-- 'owner', so users can never self-grant 'admin'.
drop function if exists public.become_owner();

create policy "Users can self-enroll as owner"
on public.user_roles
for insert
to authenticated
with check (user_id = auth.uid() and role = 'owner'::app_role);

-- Tighten direct API access to internal RLS/trigger helper functions: they are
-- only ever called from access-rule expressions, triggers, or backend code,
-- never by anonymous clients. is_listing_public stays callable by anon because
-- the public read rules for media/plans/offers rely on it.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.get_user_role(uuid) from public, anon;
revoke execute on function public.is_listing_owner(uuid) from public, anon;
revoke execute on function public.nearby_push_devices(numeric, numeric, numeric) from public, anon;
revoke execute on function public.handle_new_user() from public, anon;
revoke execute on function public.bump_conversation() from public, anon;
revoke execute on function public.update_library_rating() from public, anon;
revoke execute on function public.update_listing_rating() from public, anon;
revoke execute on function public.update_updated_at_column() from public, anon;