"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useEffect, useState } from "react";
import { Github } from "lucide-react";

export default function DashboardPage() {
  const { loading, user } = useAuthRedirect({ requireAuth: true });

  if (loading || !user) return <p className="text-center mt-10">Loading Dashboard...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.username}!</h1>
      
      <div className="p-6 border rounded-xl bg-card shadow-sm">
         <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Github /> GitHub Integration
         </h2>
         {user.githubId ? (
            <div className="flex items-center justify-between bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-lg border border-green-500/20">
               <div>
                  <p className="font-semibold">Connected to GitHub</p>
                  <p className="text-sm">Logged in as {user.githubUsername}</p>
               </div>
               <div className="text-sm font-medium px-3 py-1 bg-green-500/20 rounded-full">Active</div>
            </div>
         ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-secondary/30 p-4 rounded-lg border">
               <div>
                  <p className="font-semibold text-foreground">GitHub Not Connected</p>
                  <p className="text-sm text-muted-foreground">Connect your account to access repository releases, branches, and commits directly in your workspace.</p>
               </div>
               <button 
                  onClick={() => window.location.href = "/api/auth/github"}
                  className="shrink-0 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
               >
                  Connect GitHub
               </button>
            </div>
         )}
      </div>
    </div>
  );
}
