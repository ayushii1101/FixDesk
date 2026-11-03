import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCategories,
  useComplaints,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/lib/queries";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "Category Management | Fix Desk Admin" },
      { name: "description", content: "View, add, edit and delete complaint categories." },
    ],
  }),
  component: CategoriesPage,
});

type Category = { id: number; name: string };

function CategoriesPage() {
  const { data: categories = [], isLoading, error } = useCategories();
  const { data: complaints = [] } = useComplaints();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const complaintCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const c of complaints) {
      map.set(c.category_id, (map.get(c.category_id) ?? 0) + 1);
    }
    return map;
  }, [complaints]);

  function openAdd() {
    setEditing(null);
    setName("");
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setFormError(null);
    setDialogOpen(true);
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Please enter a category name.");
      return;
    }
    if (
      categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editing?.id)
    ) {
      setFormError("A category with this name already exists.");
      return;
    }
    setFormError(null);
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, name: trimmed });
        toast.success("Category updated.");
      } else {
        await createCategory.mutateAsync(trimmed);
        toast.success("Category added.");
      }
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the category.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the category.");
      setDeleteTarget(null);
    }
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
        <AlertDescription>Failed to load categories. {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Category Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, rename or delete complaint categories. Categories still in use by complaints cannot
            be deleted.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="px-0 py-0">
          {categories.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No categories yet. Add your first category.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Complaints</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => {
                    const count = complaintCounts.get(c.id) ?? 0;
                    const inUse = count > 0;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="tabular-nums">{count}</span>
                            {inUse && (
                              <span className="text-xs text-muted-foreground">(in use)</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                              <Pencil className="size-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={inUse}
                              title={
                                inUse
                                  ? "Cannot delete: complaints still reference this category."
                                  : "Delete category"
                              }
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Complaints keep their existing category reference. A category cannot be deleted while
        complaints use it — the database and UI both prevent this.
      </p>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editing ? "Rename this complaint category." : "Add a new complaint category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Furniture"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                disabled={createCategory.isPending || updateCategory.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {editing ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null && (complaintCounts.get(deleteTarget?.id ?? -1) ?? 0) === 0}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the{" "}
              <span className="font-medium">{deleteTarget?.name}</span> category? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteCategory.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
