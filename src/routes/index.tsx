
import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/omcms";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Login | OMCMS - Indian Oil Maintenance Portal",
      },
      {
        name: "description",
        content:
          "Secure sign-in for the Indian Oil Office Maintenance & Complaint Management System. Report office problems and track resolution status.",
      },
      {
        property: "og:title",
        content: "Login | OMCMS - Indian Oil Maintenance Portal",
      },
      {
        property: "og:description",
        content:
          "Secure sign-in for the Indian Oil Office Maintenance & Complaint Management System.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();

  // Login / registration fields
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [name, setName] = useState("");
const [department, setDepartment] = useState("IT");
const [confirmPassword, setConfirmPassword] = useState("");
const [showLoginPassword, setShowLoginPassword] = useState(false);
const [showRegisterPassword, setShowRegisterPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const [forgotPassword, setForgotPassword] = useState(false);

  // Registration OTP state
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // OTP resend countdown
  const [resendSeconds, setResendSeconds] = useState(0);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && session) {
      void navigate({
        to: "/dashboard",
        replace: true,
      });
    }
  }, [loading, session, navigate]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendSeconds]);

  /**
   * Validate that the email belongs to the official IOCL domain.
   *
   * This is a frontend validation for good UX.
   * We will also enforce the domain at the Supabase/server level.
   */
  function validateIoclEmail(value: string): string | null {
    const normalizedEmail = value.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your official indianoil email address.");
      return null;
    }

    if (!normalizedEmail.endsWith("@indianoil.in")) {
      setError("Only official @indianoil.in email addresses are allowed.");
      return null;
    }

    return normalizedEmail;
  }

  /**
   * Normal login:
   *
   * IOCL email + password
   *
   * NO OTP is used here.
   */
  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setNotice(null);

    const normalizedEmail = validateIoclEmail(email);

    if (!normalizedEmail) {
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setBusy(false);

    if (authError) {
      setError("Invalid  email or password.");
      return;
    }

    await router.invalidate();

    void navigate({
      to: "/dashboard",
      replace: true,
    });
  }
async function handleForgotPassword(e: FormEvent) {
  e.preventDefault();

  setError(null);
  setNotice(null);

  const normalizedEmail = validateIoclEmail(email);

  if (!normalizedEmail) {
    return;
  }

  setBusy(true);

  const { error: resetError } =
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

  setBusy(false);

  if (resetError) {
    setError(resetError.message);
    return;
  }

  setNotice(
    `Password reset instructions have been sent to ${normalizedEmail}. Please check your email.`,
  );
}

  /**
   * Registration:
   *
   * Name + IOCL email + Department + Password
   *             ↓
   *         Send OTP
   *             ↓
   *       Verify OTP
   *
   * No role is accepted from the user.
   * New users should become EMPLOYEE by default.
   */
  async function handleSignup(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setNotice(null);

    const normalizedEmail = validateIoclEmail(email);

    if (!normalizedEmail) {
      return;
    }

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!department) {
      setError("Please select your department.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    /*
     * Create the account.
     *
     * Supabase will send the email verification OTP.
     *
     * IMPORTANT:
     * We deliberately do NOT send a role here.
     */
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: name.trim(),
          department,
        },
      },
    });

    setBusy(false);

    if (signUpError) {
      const message = signUpError.message.toLowerCase();

      if (message.includes("already registered")) {
        setError(
          "An account with this  email already exists. Please use Login.",
        );
      } else {
        setError(signUpError.message);
      }

      return;
    }

    /*
     * Supabase may return a user without a session when email
     * confirmation is required.
     *
     * In that case we display the OTP screen.
     */
    if (data.user) {
      setOtpStep(true);
      setOtp("");
      setResendSeconds(60);

      setNotice(
        `A 6-digit OTP has been sent to ${normalizedEmail}. Please check your IOCL email.`,
      );
    } else {
      setError(
        "Registration could not be completed. Please try again.",
      );
    }
  }

  /**
   * Verify the registration email OTP.
   */
  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();

    setError(null);
    setNotice(null);

    const normalizedEmail = validateIoclEmail(email);

    if (!normalizedEmail) {
      return;
    }

    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }

    setBusy(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanOtp,
      type: "email",
    });

    setBusy(false);

    if (verifyError) {
      const message = verifyError.message.toLowerCase();

      if (
        message.includes("expired") ||
        message.includes("invalid") ||
        message.includes("token")
      ) {
        setError(
          "The OTP is invalid or has expired. Please request a new OTP.",
        );
      } else {
        setError(verifyError.message);
      }

      return;
    }

    setNotice(
      "Email verified successfully. Your account has been created.",
    );

    /*
     * verifyOtp() creates the authenticated Supabase session.
     * AuthProvider will detect the session automatically.
     */
    await router.invalidate();

    void navigate({
      to: "/dashboard",
      replace: true,
    });
  }

  /**
   * Resend registration OTP.
   */
  async function handleResendOtp() {
    if (busy || resendSeconds > 0) {
      return;
    }

    setError(null);
    setNotice(null);

    const normalizedEmail = validateIoclEmail(email);

    if (!normalizedEmail) {
      return;
    }

    setBusy(true);

    /*
     * Since the user has already registered, use signInWithOtp
     * only to request another verification OTP.
     *
     * This does NOT change the normal login flow.
     */
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
    });

    setBusy(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setOtp("");
    setResendSeconds(60);

    setNotice(
      `A new verification OTP has been sent to ${normalizedEmail}.`,
    );
  }

  /**
   * Go back from OTP screen to registration form.
   */
  function handleChangeRegistrationDetails() {
    setOtpStep(false);
    setOtp("");
    setError(null);
    setNotice(null);
    setResendSeconds(0);
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT SIDE */}
      <section className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center overflow-hidden">
              <img
                src="/logo.jpg"
                alt="IOCL Logo"
                className="size-full object-contain"
              />
            </span>

            <div>
              <p className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">
                Fix Desk
              </p>

              <p className="text-xs text-sidebar-foreground/70">
                 For Indian Oil Corporation Limitted
              </p>
            </div>
          </div>

          <h1 className="mt-16 max-w-md text-4xl leading-tight font-bold">
            Office Maintenance &amp; Complaint Management System
          </h1>

          <p className="mt-4 max-w-md text-sm text-sidebar-foreground/75">
            Report office problems, track their progress and let facility
            managers assign maintenance staff — all from one internal portal.
          </p>

          <ul className="mt-10 space-y-3 text-sm text-sidebar-foreground/80">
            <li>• Employees raise and track their own complaints</li>
            <li>• Managers assign staff, set priority and resolve</li>
            <li>• Full activity history on every complaint</li>
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/50">
          Internal use only. Unauthorised access is prohibited.
        </p>
      </section>

      {/* RIGHT SIDE */}
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              Indian Oil
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Office Maintenance System
            </h1>
          </div>

          <h2 className="text-2xl font-bold">
            {otpStep ? "Verify your email" : "Sign in"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {otpStep
              ? `Enter the 6-digit verification code sent to ${email}.`
              : "Use your official IOCL email address to continue."}
          </p>

          {error && (
            <Alert variant="destructive" className="mt-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {notice && (
            <Alert className="mt-5 border-success/40 bg-success/10">
              <AlertDescription className="text-success">
                {notice}
              </AlertDescription>
            </Alert>
          )}

          {forgotPassword ? (
            <form
              onSubmit={handleForgotPassword}
              className="mt-6 space-y-4"
            >
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(false);
                    setError(null);
                    setNotice(null);
                  }}
                  className="mb-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  Back to login
                </button>

                <h2 className="text-2xl font-bold">
                  Reset your password
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your official Indian Oil email address and we
                  will send you a password reset link.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forgot-email">
                  Official IOCL Email
                </Label>

                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@indianoil.in"
                  value={email}
                  maxLength={255}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <p className="text-xs text-muted-foreground">
                  Only @indianoil.in email addresses are permitted.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={busy}
              >
                {busy && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                {!busy && <Mail className="size-4" />}

                Send Reset Link
              </Button>
            </form>
          ) : !otpStep ? (
            /* LOGIN + REGISTER */
            <Tabs defaultValue="login" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5">
                <form onSubmit={handleLogin} className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Official IOCL Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@indianoil.in"
                      value={email}
                      maxLength={255}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>

                      <button
                        type="button"
                        onClick={() => {
                          setForgotPassword(true);
                          setError(null);
                          setNotice(null);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((v) => !v)}
                        aria-label={
                          showLoginPassword ? "Hide password" : "Show password"
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors outline-none hover:text-primary focus-visible:text-primary"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="size-[18px]" />
                        ) : (
                          <Eye className="size-[18px]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={busy}
                  >
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    {!busy && <Lock className="size-4" />}
                    Login
                  </Button>

                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-5">
                <form onSubmit={handleSignup} className="space-y-4">

                  {/* NAME */}
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* EMAIL */}
                  <div className="space-y-2">
                    <Label htmlFor="register-email">
                      Official IOCL Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@indianoil.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* DEPARTMENT */}
                  <div className="space-y-2">
                    <Label>Department</Label>

                    <Select
                      value={department}
                      onValueChange={setDepartment}
                    >
                      <SelectTrigger>
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

                  {/* PASSWORD */}
                  <div className="space-y-2">
                    <Label htmlFor="register-password">
                      Password
                    </Label>

                    <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((v) => !v)}
                      aria-label={
                        showRegisterPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors outline-none hover:text-primary focus-visible:text-primary"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="size-[18px]" />
                      ) : (
                        <Eye className="size-[18px]" />
                      )}
                    </button>
                  </div>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm Password
                    </Label>

                    <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors outline-none hover:text-primary focus-visible:text-primary"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-[18px]" />
                      ) : (
                        <Eye className="size-[18px]" />
                      )}
                    </button>
                  </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={busy}
                  >
                    {busy && <Loader2 className="size-4 animate-spin" />}
                    {!busy && <Mail className="size-4" />}
                    Register
                  </Button>

                </form>
              </TabsContent>
            </Tabs>
          ) : (
            /* REGISTRATION OTP */
            <div className="mt-6 space-y-4">

              <form
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="otp">
                    6-digit verification code
                  </Label>

                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setOtp(value);
                    }}
                    className="text-center text-2xl tracking-[0.5em]"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={busy || otp.length !== 6}
                >
                  {busy && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  {!busy && (
                    <ShieldCheck className="size-4" />
                  )}

                  Verify Email
                </Button>
              </form>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleChangeRegistrationDetails}
                  disabled={busy}
                  className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Change details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={busy || resendSeconds > 0}
                  className="font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resendSeconds > 0
                    ? `Resend in ${resendSeconds}s`
                    : "Resend OTP"}
                </button>
              </div>

            </div>
          )}

          <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" />

            <span>
              Only official Indian Oil email addresses are permitted.
              Registration requires email verification.
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
