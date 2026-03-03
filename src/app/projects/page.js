"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, Code, Plus, Users, FolderOpen } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ProjectsFeed() {
  const { user, loading: authLoading } = useAuthRedirect({ requireAuth: true });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;
      
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to load projects");
        
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
        setError("Could not load your projects. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    if (!authLoading) {
      fetchProjects();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 animate-pulse space-y-8">
        <div className="h-10 w-48 bg-secondary/50 rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="h-64 bg-secondary/30 rounded-xl"></div>
           <div className="h-64 bg-secondary/30 rounded-xl"></div>
           <div className="h-64 bg-secondary/30 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Filter out to show relevant projects: user is owner or collaborator
  const createdProjects = projects.filter(p => p.owner === user?.username);
  const joinedProjects = projects.filter(p => p.collaborators?.some(c => c.username === user?.username) && p.owner !== user?.username);
  const publicProjects = projects.filter(p => !createdProjects.some(cp => cp._id === p._id) && !joinedProjects.some(jp => jp._id === p._id));

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
         <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Projects</h1>
            <p className="text-muted-foreground text-lg">Manage your workspaces and explore open collaborations.</p>
         </div>
         <Link href="/projects/create">
            <Button size="lg" className="rounded-full shadow-md hover:shadow-lg transition-all">
               <Plus className="mr-2" size={18} /> New Workspace
            </Button>
         </Link>
      </div>

      {error && (
         <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20 font-medium">
            {error}
         </div>
      )}

      {/* User's Created Projects */}
      <section className="space-y-6">
         <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="text-primary" size={24} />
            <h2 className="text-2xl font-semibold tracking-tight">Created Workspaces</h2>
         </div>
         
         {createdProjects.length === 0 ? (
            <div className="text-center py-16 bg-secondary/10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center">
               <Code className="text-muted-foreground mb-4" size={48} />
               <h3 className="text-xl font-medium mb-2">No active workspaces</h3>
               <p className="text-muted-foreground mb-6 max-w-md">You haven't created any projects yet. Start a new workspace to collaborate with your team.</p>
               <Link href="/projects/create">
                  <Button variant="outline">Create your first project</Button>
               </Link>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {createdProjects.map(project => (
                  <ProjectCard key={project._id} project={project} isOwner={true} />
               ))}
            </div>
         )}
      </section>

      {/* User's Joined Projects */}
      {joinedProjects.length > 0 && (
         <section className="space-y-6 pt-4">
            <div className="flex items-center gap-2 mb-4">
               <Users className="text-primary" size={24} />
               <h2 className="text-2xl font-semibold tracking-tight">Joined Workspaces</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {joinedProjects.map(project => (
                  <ProjectCard key={project._id} project={project} isOwner={false} />
               ))}
            </div>
         </section>
      )}

      {/* Explore Projects */}
      {publicProjects.length > 0 && (
         <section className="space-y-6 pt-8 border-t">
            <div className="flex items-center gap-2 mb-4">
               <Users className="text-primary" size={24} />
               <h2 className="text-2xl font-semibold tracking-tight">Explore the Feed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {publicProjects.map(project => (
                  <ProjectCard key={project._id} project={project} isOwner={false} />
               ))}
            </div>
         </section>
      )}

    </div>
  );
}

function ProjectCard({ project, isOwner }) {
   return (
      <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full border-border/50 bg-gradient-to-br from-card to-card/50">
         <CardHeader className="pb-4">
            <div className="flex justify-between items-start gap-4 mb-2">
               <CardTitle className="text-xl leading-tight line-clamp-2">{project.title}</CardTitle>
               {isOwner && <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0">Owner</Badge>}
            </div>
            <CardDescription className="line-clamp-2 min-h-[40px] text-sm leading-relaxed">
               {project.description}
            </CardDescription>
         </CardHeader>
         <CardContent className="flex-grow space-y-4">
            <div className="flex flex-wrap gap-1.5">
               {project.tags?.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 rounded-sm font-normal">
                     {tag}
                  </Badge>
               ))}
               {project.tags?.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-sm font-normal text-muted-foreground">
                     +{project.tags.length - 3}
                  </Badge>
               )}
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg">
               <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><Users size={14} /> Members</span>
                  <span className="font-medium text-foreground">{project.collaboratorsCount + 1}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><Code size={14} /> Difficulty</span>
                  <span className="font-medium text-foreground">{project.difficulty}</span>
               </div>
            </div>
         </CardContent>
         <CardFooter className="pt-0 pb-5">
            <Link href={`/projects/${project._id}`} className="w-full">
               <Button className="w-full flex items-center justify-between" variant={isOwner ? "default" : "outline"}>
                  <span>{isOwner ? "Manage Workspace" : "View Project"}</span>
                  <span className="text-xs opacity-70 font-normal">
                     {project.createdAt ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true }) : "recently"}
                  </span>
               </Button>
            </Link>
         </CardFooter>
      </Card>
   );
}
