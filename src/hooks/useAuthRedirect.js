"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuthRedirect({ requireAuth = false } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const userData = await res.json();

        if (ignore) return;

        if (requireAuth && !userData) {
          router.replace("/login");
        } else if (!requireAuth && userData) {
          router.replace("/dashboard");
        } else {
          setUser(userData);
        }
      } catch {
        if (requireAuth) router.replace("/login");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    checkUser();

    return () => {
      ignore = true;
    };
  }, [router, requireAuth]);

  return { loading, user };
}
