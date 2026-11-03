import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();

    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      navigate({ to: "/" });
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-lg">
          {!success ? (
            <>
              <div className="mb-6">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Lock className="size-6 text-primary" />
                </div>

                <h1 className="text-2xl font-bold">
                  Reset your password
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your new password below.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form
                onSubmit={handleResetPassword}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    New Password
                  </Label>

                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    Confirm New Password
                  </Label>

                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy}
                >
                  {busy && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  {!busy && <Lock className="size-4" />}

                  Reset Password
                </Button>
              </form>
            </>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-7 text-primary" />
              </div>

              <h1 className="text-2xl font-bold">
                Password updated
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Your password has been successfully updated.
                Redirecting you to login...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}