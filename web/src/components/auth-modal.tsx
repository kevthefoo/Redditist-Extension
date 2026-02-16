"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import {
  Modal,
  ModalContent,
  ModalBody,
  Button,
  Input,
} from "@heroui/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "sign-in" | "sign-up";
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose, defaultMode = "sign-in" }: AuthModalProps) {
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const router = useRouter();

  const [mode, setMode] = useState<"sign-in" | "sign-up" | "verify">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setEmail("");
    setPassword("");
    setCode("");
    setError("");
    setLoading(false);
  }

  function switchMode(newMode: "sign-in" | "sign-up") {
    resetForm();
    setMode(newMode);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!signInLoaded) return;
    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        onClose();
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr.errors?.[0]?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!signUpLoaded) return;
    setLoading(true);
    setError("");

    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setMode("verify");
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr.errors?.[0]?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!signUpLoaded) return;
    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
        onClose();
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: { message: string }[] };
      setError(clerkErr.errors?.[0]?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (mode === "sign-in" || mode === "verify") {
      if (!signInLoaded) return;
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } else {
      if (!signUpLoaded) return;
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { resetForm(); setMode(defaultMode); onClose(); }}
      placement="center"
      backdrop="blur"
      classNames={{
        base: "bg-zinc-900 border border-white/10",
        closeButton: "text-gray-400 hover:text-white",
      }}
      size="md"
    >
      <ModalContent>
        <ModalBody className="px-8 py-10">
          {/* Header */}
          <div className="mb-2 text-center">
            <p className="text-2xl font-bold text-orange-500">🔥 Redditist</p>
            <h2 className="mt-4 text-xl font-bold text-white">
              {mode === "verify"
                ? "Check your email"
                : mode === "sign-in"
                  ? "Welcome back"
                  : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {mode === "verify"
                ? `We sent a code to ${email}`
                : mode === "sign-in"
                  ? "Sign in to access your summaries"
                  : "Start summarizing Reddit in seconds"}
            </p>
          </div>

          {mode === "verify" ? (
            <form onSubmit={handleVerify} className="mt-4 flex flex-col gap-4">
              <Input
                type="text"
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={code}
                onValueChange={setCode}
                variant="bordered"
                size="lg"
                classNames={{
                  inputWrapper: "border-zinc-700 bg-zinc-800/50 hover:border-orange-500/50 group-data-[focus=true]:border-orange-500",
                  label: "text-zinc-400",
                  input: "text-white placeholder:text-zinc-500",
                }}
                isRequired
                autoFocus
              />

              {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="mt-1 w-full bg-gradient-to-r from-orange-500 to-orange-600 font-semibold text-white shadow-lg shadow-orange-500/25"
                size="lg"
                isLoading={loading}
              >
                Verify & Continue
              </Button>
            </form>
          ) : (
            <>
              {/* Google */}
              <Button
                variant="bordered"
                className="mt-4 w-full border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700/50"
                size="lg"
                onPress={handleGoogle}
                startContent={<GoogleIcon />}
              >
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-700" />
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">or</span>
                <div className="h-px flex-1 bg-zinc-700" />
              </div>

              {/* Email/Password Form */}
              <form
                onSubmit={mode === "sign-in" ? handleSignIn : handleSignUp}
                className="flex flex-col gap-4"
              >
                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  value={email}
                  onValueChange={setEmail}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    inputWrapper: "border-zinc-700 bg-zinc-800/50 hover:border-orange-500/50 group-data-[focus=true]:border-orange-500",
                    label: "text-zinc-400",
                    input: "text-white placeholder:text-zinc-500",
                  }}
                  isRequired
                />
                <Input
                  type="password"
                  label="Password"
                  placeholder={mode === "sign-in" ? "Enter your password" : "Create a password"}
                  value={password}
                  onValueChange={setPassword}
                  variant="bordered"
                  size="lg"
                  classNames={{
                    inputWrapper: "border-zinc-700 bg-zinc-800/50 hover:border-orange-500/50 group-data-[focus=true]:border-orange-500",
                    label: "text-zinc-400",
                    input: "text-white placeholder:text-zinc-500",
                  }}
                  isRequired
                />

                {error && (
                  <div className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="mt-1 w-full bg-gradient-to-r from-orange-500 to-orange-600 font-semibold text-white shadow-lg shadow-orange-500/25"
                  size="lg"
                  isLoading={loading}
                >
                  {mode === "sign-in" ? "Sign In" : "Create Account"}
                </Button>
              </form>
            </>
          )}

          {/* Clerk CAPTCHA target */}
          <div id="clerk-captcha" />

          {/* Toggle */}
          {mode !== "verify" && (
            <p className="mt-5 text-center text-sm text-zinc-400">
              {mode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => switchMode(mode === "sign-in" ? "sign-up" : "sign-in")}
                className="font-medium text-orange-500 hover:text-orange-400 transition-colors"
              >
                {mode === "sign-in" ? "Sign up" : "Sign in"}
              </button>
            </p>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
