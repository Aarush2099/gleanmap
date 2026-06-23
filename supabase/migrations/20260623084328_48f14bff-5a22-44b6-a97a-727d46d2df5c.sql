
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.maybe_unlock_achievements() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_sensitive_update() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_admin_role_on_allowlist() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_submission_points() FROM public, anon, authenticated;
