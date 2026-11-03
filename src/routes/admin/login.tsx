import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Administrator Login | Fix Desk Admin" },
      {
        name: "description",
        content: "Restricted administrator sign-in for the Fix Desk maintenance portal.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { loading, session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session && isAdmin) {
      void navigate({ to: "/admin", replace: true });
    } else if (session && !isAdmin) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, isAdmin, navigate]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      setBusy(false);
      setError("Invalid email or password.");
      return;
    }

    // Double-check the signed-in account actually holds the ADMIN role.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: roles } = user
      ? await supabase.from("user_roles").select("role").eq("user_id", user.id)
      : { data: null };

    const isAdminRole = roles?.some((r) => r.role === "ADMIN");

    if (!isAdminRole) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("Access denied. Only administrator accounts can use this sign-in.");
      return;
    }

    await router.invalidate();
    setBusy(false);
    void navigate({ to: "/admin", replace: true });
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-sidebar text-sidebar-foreground">
        <Loader2 className="size-6 animate-spin text-sidebar-foreground/60" />
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-sidebar px-5 py-12 text-sidebar-foreground">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center overflow-hidden">
            <img src="/logo.jpg" alt="IOCL Logo" className="size-full object-contain" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">Fix Desk</p>
            <p className="text-xs text-sidebar-foreground/70">Administrator Panel</p>
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-bold">Admin sign in</h2>
        <p className="mt-1 text-sm text-sidebar-foreground/70">
          Restricted area. Use your administrator credentials to continue.
        </p>

        {error && (
          <Alert variant="destructive" className="mt-5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sidebar-foreground/90">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-sidebar-foreground/90">
              Password
            </Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-[18px]" />
                ) : (
                  <Eye className="size-[18px]" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {!busy && <Lock className="size-4" />}
            Sign in as Administrator
          </Button>
        </form>

        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-xs text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
        >
          <Mail className="size-3.5" />
          Employee / Manager login
        </Link>

        <p className="mt-6 flex items-start gap-2 text-[11px] text-sidebar-foreground/50">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            Administrator access is verified against your role and is restricted to authorised
            personnel.
          </span>
        </p>
      </div>
    </main>
  );
}
