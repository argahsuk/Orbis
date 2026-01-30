"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuthRedirect({ requireAuth = false } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const user = await res.json();

        if (ignore) return;

        if (requireAuth && !user) {
          router.replace("/login");
        }
        if (!requireAuth && user) {
          router.replace("/dashboard");
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

  return loading;
}
