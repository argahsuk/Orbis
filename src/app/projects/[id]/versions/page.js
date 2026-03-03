"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, GitCommit, Tag, Clock, ArrowRight } from "lucide-react";
import { VersionActionModal } from "@/components/VersionActionModal";
import { Badge } from "@/components/ui/badge";

export default function GitHubVersionsPage() {
  const { id } = useParams();
  const { user } = useAuthRedirect({ requireAuth: true });
  
  const [project, setProject] = useState(null);
  const [releases, setReleases] = useState([]);
  const [branches, setBranches] = useState([]);
  const [commits, setCommits] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [modalState, setModalState] = useState({ isOpen: false, type: "", value: "" });

  useEffect(() => {
    async function fetchData() {
       setLoading(true);
       try {
          const pRes = await fetch(`/api/projects/${id}`);
          if (!pRes.ok) throw new Error("Failed to load project details.");
          const pData = await pRes.json();
          setProject(pData);

          if (!pData.githubRepoOwner || !pData.githubRepoName) {
             setErrorMsg("No GitHub repository linked to this project.");
             return;
          }

          // Fetch Github Proxy endpoints concurrently
          const [relRes, brRes, comRes] = await Promise.all([
             fetch(`/api/projects/${id}/github/releases`),
             fetch(`/api/projects/${id}/github/branches`),
             fetch(`/api/projects/${id}/github/commits`)
          ]);

          if (relRes.ok) setReleases(await relRes.json());
          if (brRes.ok) setBranches(await brRes.json());
          if (comRes.ok) setCommits(await comRes.json());

          if (relRes.status === 401 || brRes.status === 401) {
             setErrorMsg("Repository access unavailable. Please reconnect your GitHub account in profile.");
          } else if (relRes.status === 404) {
             setErrorMsg("Repository not found on GitHub. It might be deleted or private.");
          }
       } catch (err) {
          console.error(err);
          setErrorMsg("Failed to communicate with GitHub API.");
       } finally {
          setLoading(false);
       }
    }

    if (user) fetchData();
  }, [id, user]);

  const openModal = (type, value) => setModalState({ isOpen: true, type, value });
  const closeModal = () => setModalState({ ...modalState, isOpen: false });

  if (loading) return <div className="p-8 animate-pulse text-muted-foreground">Loading GitHub Versions...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
             <h1 className="text-3xl font-bold tracking-tight mb-2">Version Control</h1>
             <p className="text-muted-foreground">Browse releases, branches, and commits from the connected GitHub repository.</p>
         </div>
         {project?.githubRepoOwner && (
            <div className="inline-flex items-center rounded-lg border bg-card px-3 py-1.5 text-sm font-medium">
               <span className="text-muted-foreground mr-2">Repository:</span>
               <a href={`https://github.com/${project.githubRepoOwner}/${project.githubRepoName}`} target="_blank" className="font-mono text-primary hover:underline">
                 {project.githubRepoOwner}/{project.githubRepoName}
               </a>
            </div>
         )}
      </div>

      {errorMsg ? (
         <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-lg flex items-center justify-center text-center">
            {errorMsg}
         </div>
      ) : (
         <Tabs defaultValue="releases" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 max-w-md bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="releases" className="rounded-lg"><Tag size={16} className="mr-2"/> Releases</TabsTrigger>
              <TabsTrigger value="branches" className="rounded-lg"><GitBranch size={16} className="mr-2"/> Branches</TabsTrigger>
              <TabsTrigger value="commits" className="rounded-lg"><GitCommit size={16} className="mr-2"/> Commits</TabsTrigger>
            </TabsList>

            <div className="mt-6 flex-1 overflow-y-auto pr-2 pb-8 scrollbar-thin">
               <TabsContent value="releases" className="m-0 space-y-4">
                 {releases.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-accent/30 rounded-lg border border-dashed">No releases found.</div>
                 ) : (
                    releases.map(release => (
                       <Card key={release.id} className="hover:border-primary/50 transition-colors">
                          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                             <div className="space-y-1">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                   {release.name || release.tag_name} 
                                   <Badge variant="secondary" className="font-mono text-xs">{release.tag_name}</Badge>
                                </h3>
                                <div className="text-sm text-muted-foreground flex items-center gap-4">
                                   <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(release.published_at).toLocaleDateString()}</span>
                                   <span className="flex items-center gap-1.5">By {release.author?.login}</span>
                                </div>
                             </div>
                             <Button onClick={() => openModal("release", release.tag_name)}>
                               Use Version <ArrowRight size={16} className="ml-2"/>
                             </Button>
                          </CardContent>
                       </Card>
                    ))
                 )}
               </TabsContent>

               <TabsContent value="branches" className="m-0 space-y-4">
                 {branches.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-accent/30 rounded-lg border border-dashed">No branches found.</div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {branches.map(branch => (
                         <Card key={branch.name} className="hover:border-primary/50 transition-colors">
                            <CardContent className="p-5 flex items-center justify-between">
                               <div>
                                  <h3 className="font-semibold flex items-center gap-2">
                                     <GitBranch size={16} className="text-muted-foreground" /> {branch.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground font-mono mt-1 w-32 truncate" title={branch.commit.sha}>
                                     {branch.commit.sha.substring(0, 7)}
                                  </p>
                               </div>
                               <Button variant="secondary" size="sm" onClick={() => openModal("branch", branch.name)}>
                                 Checkout
                               </Button>
                            </CardContent>
                         </Card>
                      ))}
                    </div>
                 )}
               </TabsContent>

               <TabsContent value="commits" className="m-0 space-y-4">
                 {commits.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-accent/30 rounded-lg border border-dashed">No commits found.</div>
                 ) : (
                    commits.map(commit => (
                       <Card key={commit.sha} className="hover:border-primary/50 transition-colors">
                          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                             <div className="space-y-1.5 flex-1 max-w-full overflow-hidden">
                                <div className="flex items-center gap-3">
                                   <Badge variant="outline" className="font-mono text-xs bg-background">{commit.sha.substring(0, 7)}</Badge>
                                   <span className="text-sm text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                                      {new Date(commit.commit.author.date).toLocaleDateString()}
                                   </span>
                                </div>
                                <h3 className="font-medium text-sm truncate pr-4" title={commit.commit.message}>
                                   {commit.commit.message.split('\n')[0]}
                                </h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                   <img src={commit.author?.avatar_url || "https://github.com/ghost.png"} alt="" className="w-4 h-4 rounded-full" />
                                   {commit.commit.author.name}
                                </p>
                             </div>
                             <Button variant="outline" size="sm" className="shrink-0" onClick={() => openModal("commit", commit.sha)}>
                               Checkout Commit
                             </Button>
                          </CardContent>
                       </Card>
                    ))
                 )}
               </TabsContent>
            </div>
         </Tabs>
      )}

      {project && (
         <VersionActionModal 
            isOpen={modalState.isOpen}
            onClose={closeModal}
            versionType={modalState.type}
            versionValue={modalState.value}
            repoOwner={project.githubRepoOwner}
            repoName={project.githubRepoName}
         />
      )}
    </div>
  );
}
