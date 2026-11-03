-- ADMIN RLS: grants + policies.
-- Employee and Manager behaviour is unchanged; these policies only ADD
-- admin capabilities. Multiple SELECT/USING policies are OR'd by Postgres,
-- so existing policies continue to work exactly as before.

-- --- Table-level grants needed for admin write paths -------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- --- profiles ----------------------------------------------------------------
-- Admin can view every profile and edit names/departments.
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- --- user_roles --------------------------------------------------------------
-- Admin manages the role assignments of all users (promote/demote).
CREATE POLICY "user_roles_select_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "user_roles_insert_admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "user_roles_update_admin" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "user_roles_delete_admin" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- --- categories --------------------------------------------------------------
-- Admin manages complaint categories; write access is still denied for
-- employees and (unchanged) managers.
CREATE POLICY "categories_insert_admin" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "categories_update_admin" ON public.categories FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "categories_delete_admin" ON public.categories FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));

-- --- complaints (READ ONLY for admin) ----------------------------------------
-- Needed by the admin Categories screen to show how many complaints reference
-- each category (so deletion can be blocked safely). Read-only: admins cannot
-- create, update or delete complaints.
CREATE POLICY "complaints_select_admin" ON public.complaints FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'));