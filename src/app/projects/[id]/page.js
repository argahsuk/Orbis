"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Code, Flag, Users, Edit2, X, Check, UserPlus, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

export default function ProjectWorkspaceOverview() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Repo State
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [savingRepo, setSavingRepo] = useState(false);

  // Join Request State
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("I would love to contribute to this project!");
  const [joinStatus, setJoinStatus] = useState(null); // 'none', 'pending', 'accepted'
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, userRes] = await Promise.all([
           fetch(`/api/projects/${id}`),
           fetch(`/api/auth/me`)
        ]);
        
        let parsedProject = null;

        if (projRes.ok) {
           parsedProject = await projRes.json();
           setProject(parsedProject);
           setRepoOwner(parsedProject.githubRepoOwner || "");
           setRepoName(parsedProject.githubRepoName || "");
        }
        if (userRes.ok) {
           const u = await userRes.json();
           setCurrentUser(u);
           
           // Check join status
           if (parsedProject) {
              if (parsedProject.joinRequests && Array.isArray(parsedProject.joinRequests)) {
                 const req = parsedProject.joinRequests.find(r => r.userId === u._id || r.userId?._id === u._id);
                 if (req) {
                    setJoinStatus(req.status);
                 } else {
                    setJoinStatus("none");
                 }
              }

              // If owner, fetch pending requests
              if (parsedProject.ownerId?._id === u._id || parsedProject.ownerId === u._id) {
                 fetch(`/api/projects/${id}/requests`)
                   .then(r => r.ok ? r.json() : [])
                   .then(reqs => setPendingRequests(Array.isArray(reqs) ? reqs : []))
                   .catch(console.error);
              }
           }
        }
      } catch (e) {
         console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleJoinRequest = async () => {
     setSubmittingRequest(true);
     try {
        const res = await fetch(`/api/projects/${id}/join`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ message: requestMessage })
        });
        if (res.ok) {
           setJoinStatus("pending");
           setIsRequesting(false);
        } else {
           const data = await res.json();
           alert(data.error || "Failed to send join request.");
        }
     } catch (e) {
        alert("An error occurred.");
     } finally {
        setSubmittingRequest(false);
     }
  };

  const handleRespondRequest = async (reqId, action) => {
     try {
        const res = await fetch(`/api/projects/${id}/requests/${reqId}`, {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ action })
        });
        if (res.ok) {
           setPendingRequests(prev => prev.filter(r => r._id !== reqId));
           // if accepted, ideally we'd refetch project to update collaborators list
        }
     } catch (e) {
        console.error("Failed to respond to request", e);
     }
  };

  const handleSaveRepo = async () => {
     setSavingRepo(true);
     try {
        const res = await fetch(`/api/projects/${id}`, {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
              githubRepoOwner: repoOwner.trim(),
              githubRepoName: repoName.trim()
           })
        });
        if (res.ok) {
           setProject(prev => ({ ...prev, githubRepoOwner: repoOwner.trim(), githubRepoName: repoName.trim() }));
           setIsEditingRepo(false);
        } else {
           const data = await res.json();
           alert(data.error || "Failed to update repository connection.");
        }
     } catch (e) {
        alert("Failed to save repository settings.");
     } finally {
        setSavingRepo(false);
     }
  };

  if (loading) return <div className="p-8 animate-pulse flex space-x-4">Loading Overview...</div>;
  if (!project) return null;

  const isOwner = currentUser && (project.ownerId?._id === currentUser._id || project.ownerId === currentUser._id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
         <h1 className="text-3xl font-bold tracking-tight mb-2">Workspace Overview</h1>
         <p className="text-muted-foreground">High-level details and members of this project.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
           <Card>
              <CardHeader>
                 <CardTitle>About the Project</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-base leading-relaxed text-foreground/80">{project.description}</p>
                 
                 <div className="mt-6 flex flex-wrap gap-2">
                    {project.tags?.map(t => (
                       <Badge key={t} variant="secondary" className="px-3 py-1 bg-secondary/50">
                         {t}
                       </Badge>
                    ))}
                 </div>
              </CardContent>
           </Card>

           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                   <Github size={20} /> Repository Connection
                </CardTitle>
                {isOwner && !isEditingRepo && (
                   <Button variant="ghost" size="sm" onClick={() => setIsEditingRepo(true)} className="h-8 rounded-full px-3">
                      <Edit2 size={14} className="mr-2" /> Edit Link
                   </Button>
                )}
             </CardHeader>
             <CardContent>
               {isEditingRepo ? (
                  <div className="p-4 border rounded-lg bg-secondary/20 space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Repo Owner</label>
                           <Input placeholder="e.g. facebook" value={repoOwner} onChange={(e) => setRepoOwner(e.target.value)} />
                        </div>
                        <div>
                           <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Repo Name</label>
                           <Input placeholder="e.g. react" value={repoName} onChange={(e) => setRepoName(e.target.value)} />
                        </div>
                     </div>
                     <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setIsEditingRepo(false); setRepoOwner(project.githubRepoOwner || ""); setRepoName(project.githubRepoName || ""); }}>
                           <X size={14} className="mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveRepo} disabled={savingRepo}>
                           {savingRepo ? "Saving..." : <><Check size={14} className="mr-1" /> Save</>}
                        </Button>
                     </div>
                  </div>
               ) : (
                  project.githubRepoOwner && project.githubRepoName ? (
                     <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div>
                           <p className="font-medium text-sm text-foreground">Linked Repository</p>
                           <p className="text-sm text-muted-foreground">{project.githubRepoOwner}/{project.githubRepoName}</p>
                        </div>
                        <a 
                          href={`https://github.com/${project.githubRepoOwner}/${project.githubRepoName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline hover:underline-offset-4"
                        >
                          View on GitHub →
                        </a>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-lg bg-card text-center gap-2">
                        <Github size={32} className="text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No GitHub repository linked yet.</p>
                        {isOwner && (
                           <Button variant="outline" size="sm" onClick={() => setIsEditingRepo(true)} className="mt-2">
                              Link Repository
                           </Button>
                        )}
                     </div>
                   )
               )}
             </CardContent>
           </Card>

            {/* Owner Only: Pending Requests */}
            {isOwner && pendingRequests.length > 0 && (
               <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                     <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus size={18} className="text-primary" /> Pending Join Requests ({pendingRequests.length})
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {pendingRequests.map(req => (
                        <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border rounded-lg gap-4">
                           <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold uppercase shrink-0">
                                 {req.userId?.username?.[0] || "U"}
                              </div>
                              <div>
                                 <p className="font-medium text-sm">{req.userId?.username || "Unknown User"}</p>
                                 <p className="text-xs text-muted-foreground mb-2">{req.userId?.email}</p>
                                 <p className="text-sm italic bg-muted/50 p-2 rounded-md border text-muted-foreground">"{req.message || "I would like to join."}"</p>
                              </div>
                           </div>
                           <div className="flex gap-2 shrink-0">
                              <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleRespondRequest(req._id, "reject")}>
                                 Decline
                              </Button>
                              <Button size="sm" onClick={() => handleRespondRequest(req._id, "accept")}>
                                 Accept
                              </Button>
                           </div>
                        </div>
                     ))}
                  </CardContent>
               </Card>
            )}
        </div>

        {/* Sidebar Info */}
         <div className="space-y-6">
            {/* Access Status / Join Project */}
            {currentUser && !isOwner && !project.collaborators?.some(c => (c._id || c) === currentUser._id) && (
               <Card className={joinStatus === "pending" ? "border-amber-500/50 bg-amber-500/5" : ""}>
                  <CardHeader>
                     <CardTitle className="text-lg">Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                     {joinStatus === "pending" ? (
                        <div className="flex flex-col items-center justify-center text-center p-4 gap-2">
                           <Clock size={24} className="text-amber-500" />
                           <p className="font-medium text-amber-500">Request Pending</p>
                           <p className="text-xs text-muted-foreground">The owner is reviewing your request.</p>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           <p className="text-sm text-muted-foreground">You are currently viewing the public overview of this project.</p>
                           {isRequesting ? (
                              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                 <Textarea 
                                    placeholder="Add a message..." 
                                    className="text-sm min-h-[80px]"
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                 />
                                 <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => setIsRequesting(false)}>Cancel</Button>
                                    <Button size="sm" className="flex-1" onClick={handleJoinRequest} disabled={submittingRequest || !project.isOpen}>
                                       {submittingRequest ? "Sending..." : "Send Request"}
                                    </Button>
                                 </div>
                              </div>
                           ) : (
                              <Button 
                                 className="w-full" 
                                 onClick={() => setIsRequesting(true)}
                                 disabled={!project.isOpen}
                              >
                                 <UserPlus size={16} className="mr-2" /> 
                                 {project.isOpen ? "Request to Join" : "Project Closed"}
                              </Button>
                           )}
                        </div>
                     )}
                  </CardContent>
               </Card>
            )}

           <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Flag size={16}/> Difficulty</div>
                    <Badge variant="outline">{project.difficulty}</Badge>
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Code size={16}/> Status</div>
                    <Badge variant={project.isOpen ? "default" : "secondary"}>
                       {project.isOpen ? "Open" : "Closed"}
                    </Badge>
                 </div>
              </CardContent>
           </Card>

           <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users size={18} /> Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    <div>
                       <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Owner</p>
                       <Link href={`/profile/${project.ownerId?._id || project.ownerId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shadow-sm">
                             {(project.ownerId?.username || project.ownerId?.name || "O")[0]}
                          </div>
                          <span className="text-sm font-medium hover:underline">{project.ownerId?.username || project.ownerId?.name || "Owner"}</span>
                       </Link>
                    </div>
                    {project.collaborators?.length > 0 && (
                       <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Collaborators</p>
                           <div className="flex flex-col gap-3">
                              {project.collaborators.map((c, i) => (
                                 <Link key={i} href={`/profile/${c._id || c}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity" title={c.username || c.name || "Collaborator"}>
                                    <div className="w-8 h-8 rounded-full bg-secondary border border-background flex items-center justify-center text-secondary-foreground font-bold text-xs uppercase shadow-sm">
                                       {(c.username || c.name || "C")[0]}
                                    </div>
                                    <span className="text-sm font-medium hover:underline">{c.username || c.name || "Collaborator"}</span>
                                 </Link>
                              ))}
                           </div>
                       </div>
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
