REVOKE ALL ON FUNCTION public.log_complaint_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_complaint_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;