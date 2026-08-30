
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'owner' THEN 2 ELSE 3 END LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
