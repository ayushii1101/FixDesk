import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import {
  useAdminUsers,
  useAdminCreateUser,
  useAdminDeleteUser,
  useUnassignRole,
  useUpdateProfile,
  type AdminUserRow,
} from "@/lib/queries";
import { DEPARTMENTS } from "@/lib/omcms";
import { RoleBadge } from "@/components/RoleBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/managers")({
  head: () => ({
    meta: [
      { title: "Manager Management | Fix Desk Admin" },
      { name: "description", content: "Add, edit, demote or delete managers." },
    ],
  }),
  component: ManagersPage,
});

type AddForm = {
  name: string;
  email: string;
  department: string;
  password: string;
  confirmPassword: string;
};

function ManagersPage() {
  const { session } = useAuth();
  const { rows, isLoading, error } = useAdminUsers();
  const createUser = useAdminCreateUser();
  const updateProfile = useUpdateProfile();
  const unassignRole = useUnassignRole();
  const deleteUser = useAdminDeleteUser();

  const [search, setSearch] = useState("");

  const managers = useMemo(() => rows.filter((r) => r.role === "MANAGER"), [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return managers;
    return managers.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.department.toLowerCase().includes(term),
    );
  }, [managers, search]);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<AddForm>({
    name: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  function openAdd() {
    setForm({ name: "", email: "", department: "", password: "", confirmPassword: "" });
    setFormError(null);
    setAddOpen(true);
  }

  function setField(field: keyof AddForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }

  async function submitAdd() {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) {
      setFormError("Please enter the manager's name.");
      return;
    }
    if (!/^[^\s@]+@indianoil\.in$/.test(email)) {
      setFormError("Only official @indianoil.in email addresses are allowed.");
      return;
    }
    if (!form.department) {
      setFormError("Please select a department.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    setFormError(null);
    try {
      await createUser.mutateAsync({
        name,
        email,
        department: form.department,
        password: form.password,
        role: "MANAGER",
      });
      toast.success(`${name} added as Manager.`);
      setAddOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add the manager.");
    }
  }

  function openEdit(m: AdminUserRow) {
    setEditTarget(m);
    setEditName(m.name);
    setEditDept(m.department);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editTarget) return;
    if (!editName.trim()) {
      setEditError("Please enter a name.");
      return;
    }
    if (!editDept) {
      setEditError("Please select a department.");
      return;
    }
    setEditError(null);
    try {
      await updateProfile.mutateAsync({
        id: editTarget.id,
        name: editName.trim(),
        department: editDept,
      });
      toast.success("Manager updated.");
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Could not update the manager.");
    }
  }

  async function demote(m: AdminUserRow) {
    try {
      await unassignRole.mutateAsync({ user_id: m.id, role: "MANAGER" });
      toast.success(`${m.name} demoted to Employee.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not demote the manager.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      await deleteUser.mutateAsync({ user_id: id });
      toast.success("Manager account deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the manager.");
      setDeleteTarget(null);
    }
  }

  const isSelf = (m: AdminUserRow) => m.id === session?.user?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manager Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add new managers, edit their details, demote them back to employees, or remove their
            accounts.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Manager
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 py-5">
          <div className="space-y-1.5 sm:max-w-sm">
            <Label className="text-xs">Search</Label>
            <Input
              placeholder="Name, email or department"
              value={search}
              maxLength={80}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 py-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No managers found. Use "Add Manager" to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.email}</TableCell>
                      <TableCell>{m.department || "—"}</TableCell>
                      <TableCell>
                        <RoleBadge role={m.role} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          {!isSelf(m) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => demote(m)}
                              disabled={unassignRole.isPending}
                            >
                              <UserX className="size-4" />
                              Demote
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={isSelf(m)}
                            onClick={() => setDeleteTarget(m)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Manager */}
      <Dialog open={addOpen} onOpenChange={(open) => !open && setAddOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manager</DialogTitle>
            <DialogDescription>Create a new user account with the Manager role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="mgr-name">Full Name</Label>
              <Input
                id="mgr-name"
                placeholder="Enter full name"
                value={form.name}
                maxLength={100}
                onChange={(e) => setField("name", e.target.value)}
                disabled={createUser.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-email">Official IOCL Email</Label>
              <Input
                id="mgr-email"
                type="email"
                placeholder="name@indianoil.in"
                value={form.email}
                maxLength={255}
                onChange={(e) => setField("email", e.target.value)}
                disabled={createUser.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-dept">Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => setField("department", v)}
                disabled={createUser.isPending}
              >
                <SelectTrigger id="mgr-dept">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-password">Initial Password</Label>
              <Input
                id="mgr-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                disabled={createUser.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-confirm">Confirm Password</Label>
              <Input
                id="mgr-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter the password"
                value={form.confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                disabled={createUser.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={createUser.isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submitAdd} disabled={createUser.isPending}>
              {createUser.isPending && <Loader2 className="size-4 animate-spin" />}
              Add Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Manager */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Manager</DialogTitle>
            <DialogDescription>Update the manager's profile details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {editError && (
              <Alert variant="destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="mgr-edit-name">Name</Label>
              <Input
                id="mgr-edit-name"
                value={editName}
                maxLength={100}
                onChange={(e) => setEditName(e.target.value)}
                disabled={updateProfile.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-edit-dept">Department</Label>
              <Select
                value={editDept}
                onValueChange={setEditDept}
                disabled={updateProfile.isPending}
              >
                <SelectTrigger id="mgr-edit-dept">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveEdit} disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Manager */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete manager?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget?.name}</span> (
              <span className="font-medium">{deleteTarget?.email}</span>)? This permanently removes
              their account and any complaints they have raised.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteUser.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteUser.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
