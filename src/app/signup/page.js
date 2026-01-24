"use client";

import AuthForm from "@/components/AuthForm";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function SignupPage() {
  const loading = useAuthRedirect({ requireAuth: false });

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return <AuthForm />;
}
