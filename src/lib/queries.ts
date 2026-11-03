import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { adminCreateUserFn, adminDeleteUserFn } from "@/functions/admin-actions";
import type { Priority, Role, Status } from "@/lib/omcms";

export type ComplaintRow = {
  id: string;
  complaint_no: number;
  employee_id: string;
  category_id: number;
  problem_type: string;
  description: string;
  location: string;
  priority: Priority;
  status: Status;
  assigned_staff_id: number | null;
  resolution_remarks: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  categories: { name: string } | null;
  maintenance_staff: { id: number; name: string; department: string } | null;
  profiles: { name: string; department: string; email: string } | null;
};

const SELECT = `
  id, complaint_no, employee_id, category_id, problem_type, description, location,
  priority, status, assigned_staff_id, resolution_remarks, created_at, updated_at, resolved_at,
  categories ( name ),
  maintenance_staff ( id, name, department ),
  profiles!complaints_employee_profile_fkey ( name, department, email )
`;

export function useComplaints() {
  return useQuery({
    queryKey: ["complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select(SELECT)
        .order("complaint_no", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ComplaintRow[];
    },
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Complaint not found.");
      return data as unknown as ComplaintRow;
    },
  });
}

export function useComplaintHistory(id: string) {
  return useQuery({
    queryKey: ["complaint-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaint_history")
        .select("id, action, created_at")
        .eq("complaint_id", id)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("id");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useStaff() {
  return useQuery({
    queryKey: ["maintenance_staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_staff")
        .select("id, name, department, phone")
        .order("name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}
export type CreateStaffInput = {
  name: string;
  department: string;
  phone: string;
};

export function useCreateStaff() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStaffInput) => {
      const { data, error } = await supabase
        .from("maintenance_staff")
        .insert(input)
        .select("id, name, department, phone")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["maintenance_staff"],
      });
    },
  });
}

export type UpdateStaffInput = {
  id: number;
  name: string;
  department: string;
  phone: string;
};

export function useUpdateStaff() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, department, phone }: UpdateStaffInput) => {
      const { data, error } = await supabase
        .from("maintenance_staff")
        .update({
          name,
          department,
          phone,
        })
        .eq("id", id)
        .select("id, name, department, phone")
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["maintenance_staff"],
      });

      void qc.invalidateQueries({
        queryKey: ["complaints"],
      });
    },
  });
}

export type CreateComplaintInput = {
  employee_id: string;
  category_id: number;
  problem_type: string;
  description: string;
  location: string;
  priority: Priority;
};

export function useCreateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateComplaintInput) => {
      const { data, error } = await supabase
        .from("complaints")
        .insert({ ...input, status: "PENDING" as const })
        .select("id, complaint_no")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["complaints"] });
    },
  });
}

export type UpdateComplaintInput = {
  id: string;
  priority?: Priority;
  status?: Status;
  assigned_staff_id?: number | null;
  resolution_remarks?: string | null;
};

export function useUpdateComplaint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateComplaintInput) => {
      const { error } = await supabase.from("complaints").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["complaints"] });
      void qc.invalidateQueries({ queryKey: ["complaint", id] });
      void qc.invalidateQueries({ queryKey: ["complaint-history", id] });
    },
  });
}

// ---------------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------------

export type UserRoleRow = { user_id: string; role: Role };

export type AdminProfileRow = {
  id: string;
  name: string;
  email: string;
  department: string;
  created_at: string;
};

export type AdminUserRow = AdminProfileRow & { role: Role };

export function resolveRole(roleRows: UserRoleRow[], userId: string): Role {
  const list = roleRows.filter((r) => r.user_id === userId).map((r) => r.role);
  if (list.includes("ADMIN")) return "ADMIN";
  if (list.includes("MANAGER")) return "MANAGER";
  if (list.includes("EMPLOYEE")) return "EMPLOYEE";
  return "EMPLOYEE";
}

export function useAdminProfiles() {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, department, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as AdminProfileRow[];
    },
  });
}

export function useAdminRoles() {
  return useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw new Error(error.message);
      return (data ?? []) as UserRoleRow[];
    },
  });
}

/** All profiles joined with their resolved role (EMPLOYEE/MANAGER/ADMIN). */
export function useAdminUsers() {
  const profiles = useAdminProfiles();
  const roles = useAdminRoles();
  const rows = useMemo<AdminUserRow[]>(
    () =>
      (profiles.data ?? []).map((p) => ({
        ...p,
        role: resolveRole(roles.data ?? [], p.id),
      })),
    [profiles.data, roles.data],
  );
  return {
    profiles,
    roles,
    rows,
    isLoading: profiles.isLoading || roles.isLoading,
    error: profiles.error ?? roles.error,
  };
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      department,
    }: {
      id: string;
      name: string;
      department: string;
    }) => {
      const { error } = await supabase.from("profiles").update({ name, department }).eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: Role }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) throw new Error(error.message);
      return { user_id, role };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
  });
}

export function useUnassignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: Role }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role);
      if (error) throw new Error(error.message);
      return { user_id, role };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
  });
}

export function useAdminCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      department: string;
      email: string;
      password: string;
      role: "EMPLOYEE" | "MANAGER" | "ADMIN";
    }) => adminCreateUserFn({ data: input }) as Promise<{ id: string; email: string }>,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      void qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { user_id: string }) =>
      adminDeleteUserFn({ data: input }) as Promise<{ ok: boolean }>,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      void qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name })
        .select("id, name")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { error } = await supabase.from("categories").update({ name }).eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
