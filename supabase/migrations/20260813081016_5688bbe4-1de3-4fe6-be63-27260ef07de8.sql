ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_employee_profile_fkey
  FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;