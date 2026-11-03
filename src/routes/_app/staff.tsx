import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Loader2,
  Phone,
  Pencil,
  Plus,
  UserPlus,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import {
  useComplaints,
  useStaff,
  useCreateStaff,
  useUpdateStaff,
} from "@/lib/queries";
import { DEPARTMENTS } from "@/lib/omcms";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/staff")({
  head: () => ({
    meta: [
      { title: "Maintenance Staff | OMCMS Indian Oil" },
      {
        name: "description",
        content:
          "Directory of office maintenance staff with department, contact number and current open complaint workload.",
      },
      {
        property: "og:title",
        content: "Maintenance Staff | OMCMS Indian Oil",
      },
      {
        property: "og:description",
        content:
          "Directory of office maintenance staff with department and contact number.",
      },
    ],
  }),
  component: StaffPage,
});

type StaffForm = {
  name: string;
  department: string;
  phone: string;
};

function StaffPage() {
  const { isManager } = useAuth();

  const {
    data: staff = [],
    isLoading,
    error,
  } = useStaff();

  const { data: complaints = [] } = useComplaints();

  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);

  const [form, setForm] = useState<StaffForm>({
    name: "",
    department: "",
    phone: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStaffId !== null;
  const isSaving = createStaff.isPending || updateStaff.isPending;

  function openAddDialog() {
    setEditingStaffId(null);

    setForm({
      name: "",
      department: "",
      phone: "",
    });

    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(member: {
    id: number;
    name: string;
    department: string;
    phone: string;
  }) {
    setEditingStaffId(member.id);

    setForm({
      name: member.name,
      department: member.department,
      phone: member.phone,
    });

    setFormError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isSaving) return;

    setDialogOpen(false);
    setEditingStaffId(null);
    setFormError(null);
  }

  function updateField(field: keyof StaffForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError(null);
  }

  async function handleSubmit() {
    const name = form.name.trim();
    const department = form.department.trim();
    const phone = form.phone.trim();

    if (!name) {
      setFormError("Please enter the staff member's name.");
      return;
    }

    if (!department) {
      setFormError("Please select a department.");
      return;
    }

    if (!phone) {
      setFormError("Please enter a phone number.");
      return;
    }

    if (phone.length < 7) {
      setFormError("Please enter a valid phone number.");
      return;
    }

    setFormError(null);

    try {
      if (isEditing && editingStaffId !== null) {
        await updateStaff.mutateAsync({
          id: editingStaffId,
          name,
          department,
          phone,
        });
      } else {
        await createStaff.mutateAsync({
          name,
          department,
          phone,
        });
      }

      setDialogOpen(false);
      setEditingStaffId(null);
      setForm({
        name: "",
        department: "",
        phone: "",
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to save maintenance staff.",
      );
    }
  }

  if (!isManager) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Unauthorised access. The maintenance staff directory is available
          to managers only.
        </AlertDescription>
      </Alert>
    );
  }

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
        <AlertDescription>
          Failed to load maintenance staff. {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Maintenance Staff</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage maintenance personnel available for complaint assignment.
            </p>
          </div>

          <Button onClick={openAddDialog}>
            <Plus className="size-4" />
            Add Staff
          </Button>
        </div>

        {/* Staff Directory */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff Directory</CardTitle>
          </CardHeader>

          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">
                      Open Complaints
                    </TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {staff.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <UserPlus className="size-5 text-muted-foreground" />
                          </div>

                          <div>
                            <p className="font-medium">
                              No maintenance staff yet
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Add your first maintenance staff member.
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openAddDialog}
                          >
                            <Plus className="size-4" />
                            Add Staff
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    staff.map((member) => {
                      const openComplaints = complaints.filter(
                        (complaint) =>
                          complaint.assigned_staff_id === member.id &&
                          complaint.status !== "RESOLVED",
                      ).length;

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.name}
                          </TableCell>

                          <TableCell>{member.department}</TableCell>

                          <TableCell className="text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="size-3.5" />
                              {member.phone}
                            </span>
                          </TableCell>

                          <TableCell className="text-right tabular-nums">
                            {openComplaints}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(member)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Staff Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Maintenance Staff" : "Add Maintenance Staff"}
            </DialogTitle>

            <DialogDescription>
              {isEditing
                ? "Update the maintenance staff member's details."
                : "Add a maintenance staff member who can be assigned to complaints."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Form Error */}
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="staff-name">Name</Label>

              <Input
                id="staff-name"
                placeholder="Enter staff member name"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                disabled={isSaving}
                maxLength={100}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="staff-department">Department</Label>

              <Select
                value={form.department}
                onValueChange={(value) =>
                  updateField("department", value)
                }
                disabled={isSaving}
              >
                <SelectTrigger id="staff-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>

                <SelectContent>
                  {DEPARTMENTS.map((department) => (
                    <SelectItem
                      key={department}
                      value={department}
                    >
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone</Label>

              <Input
                id="staff-phone"
                type="tel"
                inputMode="numeric"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                disabled={isSaving}
                maxLength={20}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEditing ? (
                <Pencil className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}

              {isSaving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}