import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server-side ADMIN actions (create / delete auth users).
 *
 * These need the Supabase service-role key (cannot be done from the browser
 * with RLS alone), so they run as TanStack Start server functions. The start
 * instance automatically attaches the caller's JWT via `attachSupabaseAuth`;
 * every function re-checks that the caller actually holds the ADMIN role
 * before doing anything.
 */

const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  name: z.string().trim().min(1, "Name is required.").max(100),
  department: z.string().trim().min(1, "Department is required."),
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]),
});

const userIdSchema = z.object({
  user_id: z.string().uuid("Invalid user id."),
});

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Verifies the caller is an ADMIN and returns their user id. */
async function assertAdmin(): Promise<string> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const auth = request?.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) throw new Error("Unauthorized: missing token.");

  const sb = await getAdminClient();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) throw new Error("Unauthorized: invalid token.");

  const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", data.user.id);
  if (!roles?.some((r) => r.role === "ADMIN")) {
    throw new Error("Unauthorized: administrator access required.");
  }
  return data.user.id;
}

export const adminCreateUserFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createUserSchema.parse(input))
  .handler(async ({ data }) => {
    await assertAdmin();
    const sb = await getAdminClient();

    const { data: created, error } = await sb.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, department: data.department },
    });
    if (error || !created.user) {
      throw new Error(error?.message ?? "Could not create the user.");
    }

    // handle_new_user() creates the profile + EMPLOYEE role; now set role.
    const { error: roleError } = await sb
      .from("user_roles")
      .update({ role: data.role })
      .eq("user_id", created.user.id);
    if (roleError) throw new Error(roleError.message);

    return { id: created.user.id, email: created.user.email ?? data.email };
  });

export const adminDeleteUserFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => userIdSchema.parse(input))
  .handler(async ({ data }) => {
    const callerId = await assertAdmin();
    if (callerId === data.user_id) {
      throw new Error("You cannot delete your own administrator account.");
    }

    const sb = await getAdminClient();
    const { error } = await sb.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
