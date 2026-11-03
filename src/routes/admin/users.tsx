import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import {
  useAdminUsers,
  useAssignRole,
  useAdminDeleteUser,
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

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management | Fix Desk Admin" },
      { name: "description", content: "Search, edit, promote and remove user accounts." },
    ],
  }),
  component: UsersPage,
});

const ALL = "ALL";

function UsersPage() {
  const { session } = useAuth();
  const { rows, isLoading, error } = useAdminUsers();
  const updateProfile = useUpdateProfile();
  const assignRole = useAssignRole();
  const deleteUser = useAdminDeleteUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(ALL);

  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((u) => {
      if (roleFilter !== ALL && u.role !== roleFilter) return false;
      if (!term) return true;
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.department.toLowerCase().includes(term)
      );
    });
  }, [rows, search, roleFilter]);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load users. {error.message}</AlertDescription>
      </Alert>
    );
  }

  function openEdit(u: AdminUserRow) {
    setEditTarget(u);
    setEditName(u.name);
    setEditDept(u.department);
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
      toast.success("User updated.");
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Could not update the user.");
    }
  }

  async function promote(u: AdminUserRow) {
    try {
      await assignRole.mutateAsync({ user_id: u.id, role: "MANAGER" });
      toast.success(`${u.name} promoted to Manager.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not promote the user.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      await deleteUser.mutateAsync({ user_id: id });
      toast.success("User account deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the user.");
      setDeleteTarget(null);
    }
  }

  const isSelf = (u: AdminUserRow) => u.id === session?.user?.id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search and manage all registered users, promote employees to managers, or remove accounts.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Search</Label>
            <Input
              placeholder="Name, email or department"
              value={search}
              maxLength={80}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All roles</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 py-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No users match these filters.</p>
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
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{u.department || "—"}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                            <Pencil className="size-4" />
                            Edit
                          </Button>
                          {u.role === "EMPLOYEE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => promote(u)}
                              disabled={assignRole.isPending}
                            >
                              <UserCog className="size-4" />
                              Promote
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={isSelf(u)}
                            onClick={() => setDeleteTarget(u)}
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

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user's profile details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {editError && (
              <Alert variant="destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                maxLength={100}
                onChange={(e) => setEditName(e.target.value)}
                disabled={updateProfile.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept">Department</Label>
              <Select
                value={editDept}
                onValueChange={setEditDept}
                disabled={updateProfile.isPending}
              >
                <SelectTrigger id="edit-dept">
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

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget?.name}</span> (
              <span className="font-medium">{deleteTarget?.email}</span>)? This permanently removes
              the account and any complaints they have raised cannot be recovered.
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
