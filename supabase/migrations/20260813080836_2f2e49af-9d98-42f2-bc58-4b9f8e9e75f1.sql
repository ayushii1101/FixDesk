-- ROLES
CREATE TYPE public.app_role AS ENUM ('EMPLOYEE', 'MANAGER');
CREATE TYPE public.complaint_status AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE public.complaint_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'MANAGER'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'MANAGER'));

-- CATEGORIES
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_read" ON public.categories FOR SELECT TO authenticated USING (true);
INSERT INTO public.categories (name) VALUES
  ('Furniture'), ('Computer / IT'), ('Electrical'), ('Plumbing'), ('Cleaning'), ('Other');

-- MAINTENANCE STAFF
CREATE TABLE public.maintenance_staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT ''
);
GRANT SELECT ON public.maintenance_staff TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.maintenance_staff TO authenticated;
GRANT ALL ON public.maintenance_staff TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.maintenance_staff_id_seq TO authenticated;
ALTER TABLE public.maintenance_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read" ON public.maintenance_staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff_manage" ON public.maintenance_staff FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'MANAGER')) WITH CHECK (public.has_role(auth.uid(), 'MANAGER'));
INSERT INTO public.maintenance_staff (name, department, phone) VALUES
  ('Ramesh Kumar', 'Electrical', '98200 11223'),
  ('Amit Sharma', 'IT', '98200 44556'),
  ('Raj Kumar', 'Furniture', '98200 77889'),
  ('Suresh Patil', 'Plumbing', '98200 99001'),
  ('Meena Devi', 'Housekeeping', '98200 22334');

-- COMPLAINTS
CREATE SEQUENCE public.complaint_number_seq START 101;
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_no INTEGER NOT NULL UNIQUE DEFAULT nextval('public.complaint_number_seq'),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.categories(id),
  problem_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL,
  priority public.complaint_priority NOT NULL DEFAULT 'MEDIUM',
  status public.complaint_status NOT NULL DEFAULT 'PENDING',
  assigned_staff_id INTEGER REFERENCES public.maintenance_staff(id) ON DELETE SET NULL,
  resolution_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.complaint_number_seq TO authenticated;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "complaints_select_own_or_manager" ON public.complaints FOR SELECT TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(), 'MANAGER'));
CREATE POLICY "complaints_insert_own" ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid() AND status = 'PENDING' AND assigned_staff_id IS NULL
    AND resolution_remarks IS NULL AND resolved_at IS NULL);
CREATE POLICY "complaints_update_manager_only" ON public.complaints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'MANAGER')) WITH CHECK (public.has_role(auth.uid(), 'MANAGER'));

-- HISTORY
CREATE TABLE public.complaint_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.complaint_history TO authenticated;
GRANT ALL ON public.complaint_history TO service_role;
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_select_own_or_manager" ON public.complaint_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.complaints c WHERE c.id = complaint_id
    AND (c.employee_id = auth.uid() OR public.has_role(auth.uid(), 'MANAGER'))));

CREATE OR REPLACE FUNCTION public.log_complaint_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.complaint_history (complaint_id, action)
  VALUES (NEW.id, 'Complaint submitted');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_complaint_insert AFTER INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.log_complaint_insert();

CREATE OR REPLACE FUNCTION public.log_complaint_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE staff_name TEXT;
BEGIN
  NEW.updated_at := now();
  IF NEW.status = 'RESOLVED' AND OLD.status <> 'RESOLVED' AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at := now();
  END IF;
  IF NEW.assigned_staff_id IS DISTINCT FROM OLD.assigned_staff_id AND NEW.assigned_staff_id IS NOT NULL THEN
    SELECT name INTO staff_name FROM public.maintenance_staff WHERE id = NEW.assigned_staff_id;
    INSERT INTO public.complaint_history (complaint_id, action)
    VALUES (NEW.id, 'Assigned to ' || COALESCE(staff_name, 'staff'));
  END IF;
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO public.complaint_history (complaint_id, action)
    VALUES (NEW.id, 'Priority changed to ' || NEW.priority::text);
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.complaint_history (complaint_id, action)
    VALUES (NEW.id, 'Status changed to ' || NEW.status::text);
  END IF;
  IF NEW.resolution_remarks IS DISTINCT FROM OLD.resolution_remarks AND NEW.resolution_remarks IS NOT NULL THEN
    INSERT INTO public.complaint_history (complaint_id, action)
    VALUES (NEW.id, 'Resolution remarks added');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_complaint_update BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.log_complaint_update();

-- NEW USER BOOTSTRAP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE requested TEXT;
BEGIN
  INSERT INTO public.profiles (id, name, email, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'department', '')
  );
  requested := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'EMPLOYEE'));
  IF requested <> 'MANAGER' THEN requested := 'EMPLOYEE'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, requested::public.app_role);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();