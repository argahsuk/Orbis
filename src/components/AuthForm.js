"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm() {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleMode() {
    setError("");
    router.push(isLogin ? "/signup" : "/login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);

    try {
      const res = await fetch(
        isLogin ? "/api/auth/login" : "/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(
            isLogin
              ? {
                  email: payload.email,
                  password: payload.password,
                }
              : {
                  username: payload.name, // matches backend
                  email: payload.email,
                  password: payload.password,
                }
          ),
        }
      );

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Something went wrong");
      }

     if (isLogin) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4 font-sans">
      <div className="group relative w-full max-w-md">
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-8 shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-gray-200/40 dark:group-hover:shadow-black/40">
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center">
              <span className="text-xl font-semibold text-black dark:text-white">
                A
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
            {isLogin
              ? "Enter your credentials to continue"
              : "Get started in less than a minute"}
          </p>

          {/* Toggle */}
          <div className="mt-6 grid grid-cols-2 rounded-lg bg-gray-100 dark:bg-gray-900 p-1 text-sm">
            <button
              onClick={() => router.push("/signup")}
              type="button"
              className={`rounded-md py-2 transition-all ${
                !isLogin
                  ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Sign up
            </button>

            <button
              onClick={() => router.push("/login")}
              type="button"
              className={`rounded-md py-2 transition-all ${
                isLogin
                  ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Log in
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full name
                </label>
                <input
                  name="name"
                  required
                  placeholder="John Doe"
                  className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm"
              />
            </div>

            {isLogin && (
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input type="checkbox" />
                Remember me
              </label>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black dark:bg-white py-2.5 text-sm font-medium text-white dark:text-black disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={toggleMode}
              type="button"
              className="font-medium text-black dark:text-white hover:underline"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>

          <div className="mt-6 relative">
             <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
             </div>
             <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-black px-2 text-gray-500">Or continue with</span>
             </div>
          </div>

          <button
             type="button"
             onClick={() => window.location.href = "/api/auth/github"}
             className="mt-6 w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1C1C1E] py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
             <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
             </svg>
             GitHub
          </button>
        </div>
      </div>
    </main>
  );
}
