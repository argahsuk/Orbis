"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { 
    LayoutDashboard, 
    ListTodo, 
    GitBranch,
    Users,
    Settings,
    ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProjectWorkspaceLayout({ children }) {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthRedirect({ requireAuth: true });
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!user) return; // Wait for auth contextual load

    const checkAccess = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${id}`);
        // Here we rely on the API to naturally enforce Owner/Collaborator bounds soon,
        // but for now, we simulate fetching the project and determining role.
        if (!res.ok) {
           if(res.status === 403 || res.status === 401) {
              setAccessError("You must be an owner or collaborator to view this workspace.");
           } else {
              setAccessError("Failed to load workspace.");
           }
           return;
        }
        const data = await res.json();
        setProject(data);
        
        let foundRole = "Viewer";
        if (data.ownerId?._id === user._id || data.ownerId === user._id) {
            foundRole = "Owner";
        } else if (data.collaborators?.some(c => (c._id || c) === user._id)) {
            foundRole = "Collaborator";
        }

        setRole(foundRole);

      } catch (err) {
        setAccessError("Failed to verify workspace access.");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [id, user]);

  if (loading || authLoading) return <div className="flex h-screen items-center justify-center">Loading Workspace...</div>;
  
  if (accessError) {
      return (
          <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
              <h1 className="text-2xl font-bold mb-4 text-destructive">Error</h1>
              <p className="text-muted-foreground mb-6">{accessError}</p>
              <button 
                  onClick={() => router.push('/projects')}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                  Back to Projects
              </button>
          </div>
      );
  }

  const navItems = [
    { label: "Overview", icon: <LayoutDashboard size={18} />, href: `/projects/${id}` },
    ...(role === "Owner" || role === "Collaborator" ? [
       { label: "Tasks", icon: <ListTodo size={18} />, href: `/projects/${id}/tasks` },
       { label: "Versions", icon: <GitBranch size={18} />, href: `/projects/${id}/versions` },
    ] : [])
  ];

  return (
    <div className="flex bg-background h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-4 border-b border-border">
            <button 
                onClick={() => router.push('/projects')}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
                <ChevronLeft size={16} className="mr-1" /> All Projects
            </button>
            <h2 className="font-semibold text-lg truncate" title={project.title}>{project.title}</h2>
            <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                {role}
            </div>
          </div>
          
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {role === "Owner" && (
            <div className="p-4 border-t border-border">
                <Link href={`/projects/${id}/settings`} className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Settings size={18} />
                    Project Settings
                </Link>
            </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
         {/* Mobile Header (Fallback) */}
         <div className="md:hidden p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold truncate w-1/2">{project.title}</h2>
            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{role}</div>
         </div>
         {children}
      </main>
    </div>
  );
}
