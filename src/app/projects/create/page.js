"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Github, Code, GitBranch } from "lucide-react";

export default function CreateProjectPage() {
  useAuthRedirect({ requireAuth: true });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch("/api/auth/github/repos");
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRepos(false);
      }
    }
    fetchRepos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const repoFullName = formData.get("githubRepo");
    let githubRepoOwner = "";
    let githubRepoName = "";

    if (repoFullName) {
       const parts = repoFullName.split("/");
       githubRepoOwner = parts[0];
       githubRepoName = parts[1];
    }

    const difficulty = formData.get("difficulty") || "Beginner";
    const tagsInput = formData.get("tags") || "";
    const tags = tagsInput.split(",").map(t => t.trim()).filter(t => t.length > 0);

    const payload = {
      title: formData.get("title"),
      description: formData.get("description"),
      githubRepoOwner,
      githubRepoName,
      tags,
      difficulty,
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create project");
      }
      
      const newProject = await res.json();
      router.push(`/projects/${newProject._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
         <h1 className="text-3xl font-bold tracking-tight mb-2">Create New Project Workspace</h1>
         <p className="text-muted-foreground">Setup a collaborative workspace for your team and select a GitHub repository to track.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card border rounded-2xl p-8 shadow-sm">
        
        {/* Core Project Details */}
        <div className="space-y-6">
           <div>
             <label className="block text-sm font-medium mb-1.5 leading-none">Project Title <span className="text-red-500">*</span></label>
             <Input name="title" required placeholder="e.g. NextJS E-commerce Platform" className="bg-background" />
           </div>

           <div>
             <label className="block text-sm font-medium mb-1.5 leading-none">Description <span className="text-red-500">*</span></label>
             <Textarea name="description" required placeholder="Describe the goal of this project..." className="h-32 bg-background resize-none" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium mb-1.5 leading-none">Tech Stack (Tags)</label>
               <Input name="tags" placeholder="e.g. React, Node.js, MongoDB" className="bg-background" />
               <p className="text-xs text-muted-foreground mt-1.5">Separate multiple tags with commas.</p>
             </div>
             <div>
               <label className="block text-sm font-medium mb-1.5 leading-none">Difficulty Level <span className="text-red-500">*</span></label>
               <select 
                 name="difficulty" 
                 required
                 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
               >
                 <option value="Beginner">Beginner</option>
                 <option value="Intermediate">Intermediate</option>
                 <option value="Advanced">Advanced</option>
               </select>
             </div>
           </div>
        </div>

        {/* GitHub Integration details */}
        <div className="space-y-4 pt-4 border-t border-border">
           <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Github size={18} className="text-muted-foreground"/> Link GitHub Repository</h2>
              <p className="text-sm text-muted-foreground">Select one of your GitHub repositories to unlock version tracking.</p>
           </div>
           
           <div>
              <label className="block text-sm font-medium mb-1.5 leading-none">Select Repository</label>
              <select 
                 name="githubRepo" 
                 className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                 disabled={loadingRepos || repos.length === 0}
              >
                 <option value="">{loadingRepos ? "Loading your repositories..." : (repos.length === 0 ? "No repositories found. Ensure GitHub is connected." : "None (Do not link a repository yet)")}</option>
                 {repos.map(r => (
                    <option key={r.id} value={r.fullName}>
                       {r.owner}/{r.name} {r.private ? "(Private)" : ""}
                    </option>
                 ))}
              </select>
           </div>
        </div>

        {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">{error}</div>}

        <div className="pt-4 flex justify-end">
           <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto min-w-[150px]">
             {loading ? "Creating..." : "Create Workspace"}
           </Button>
        </div>
      </form>
    </div>
  );
}
