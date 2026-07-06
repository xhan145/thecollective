"use client";

import { AuthForm } from "@/components/beta/AuthForm";
import { AuthedRedirect } from "@/components/beta/AuthedRedirect";

export default function AuthPage() {
  return (
    <>
      {/* Already signed in? Go straight to the dashboard instead of the login form. */}
      <AuthedRedirect />
      <AuthForm initialMode="login" />
    </>
  );
}
