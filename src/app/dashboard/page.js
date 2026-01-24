"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function DashboardPage() {
  const loading = useAuthRedirect({ requireAuth: true });

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Welcome to Dashboard</h1>
      {/* Add your dashboard content here */}
    </div>
  );
}
