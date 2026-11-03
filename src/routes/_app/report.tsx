import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { useAuth } from "@/lib/auth";
import { useCategories, useCreateComplaint } from "@/lib/queries";
import { CATEGORY_PROBLEMS, PRIORITIES, PRIORITY_LABEL, complaintCode } from "@/lib/omcms";
import type { Priority } from "@/lib/omcms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/report")({
  head: () => ({
    meta: [
      { title: "Report a Problem | OMCMS Indian Oil" },
      {
        name: "description",
        content:
          "Report an office maintenance problem — furniture, IT, electrical, plumbing or cleaning — and track it until resolution.",
      },
      { property: "og:title", content: "Report a Problem | OMCMS Indian Oil" },
      {
        property: "og:description",
        content: "Report an office maintenance problem and track it until resolution.",
      },
    ],
  }),
  component: ReportPage,
});

const schema = z.object({
  category: z.string().min(1, "Please select a category."),
  problem_type: z.string().trim().min(1, "Please select or enter a problem type.").max(120),
  location: z.string().trim().min(3, "Please enter the location.").max(150),
  description: z.string().trim().min(5, "Please describe the problem.").max(1000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

function ReportPage() {
  const { session, isManager } = useAuth();
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const create = useCreateComplaint();

  const [category, setCategory] = useState("");
  const [problemType, setProblemType] = useState("");
  const [customProblem, setCustomProblem] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (isManager) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Managers do not raise complaints. Use All Complaints to manage employee reports.
        </AlertDescription>
      </Alert>
    );
  }

  const problemOptions = CATEGORY_PROBLEMS[category] ?? [];
  const usesCustom = category === "Other" || problemType === "__custom";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const resolvedProblem = usesCustom ? customProblem : problemType;
    const parsed = schema.safeParse({
      category,
      problem_type: resolvedProblem,
      location,
      description,
      priority,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please fill all required fields.");
      return;
    }

    const categoryRow = categories.find((c) => c.name === category);
    if (!categoryRow || !session?.user?.id) {
      setError("Invalid complaint data. Please try again.");
      return;
    }

    try {
      const created = await create.mutateAsync({
        employee_id: session.user.id,
        category_id: categoryRow.id,
        problem_type: parsed.data.problem_type,
        description: parsed.data.description,
        location: parsed.data.location,
        priority: parsed.data.priority,
      });
      setSuccess(
        `Complaint submitted successfully. Your complaint ID is ${complaintCode(created.complaint_no)}.`,
      );
      setCategory("");
      setProblemType("");
      setCustomProblem("");
      setLocation("");
      setDescription("");
      setPriority("MEDIUM");
      setTimeout(() => {
        void navigate({ to: "/complaints/$id", params: { id: created.id } });
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the complaint.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Report a Problem</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide accurate details so the facility team can act quickly.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-success/40 bg-success/10">
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complaint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v);
                    setProblemType("");
                    setCustomProblem("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Problem Type <span className="text-destructive">*</span>
                </Label>
                {category === "Other" ? (
                  <Input
                    placeholder="Describe the problem type"
                    value={customProblem}
                    maxLength={120}
                    onChange={(e) => setCustomProblem(e.target.value)}
                  />
                ) : (
                  <Select value={problemType} onValueChange={setProblemType} disabled={!category}>
                    <SelectTrigger>
                      <SelectValue placeholder={category ? "Select problem" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {problemOptions.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom">Other (specify)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {problemType === "__custom" && category !== "Other" && (
                  <Input
                    className="mt-2"
                    placeholder="Describe the problem type"
                    value={customProblem}
                    maxLength={120}
                    onChange={(e) => setCustomProblem(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="3rd Floor - Room 302"
                value={location}
                maxLength={150}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="Explain the problem in detail."
                value={description}
                maxLength={1000}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
            </div>

            <div className="space-y-2 sm:max-w-xs">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The facility manager may revise the priority after review.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                Submit Complaint
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
