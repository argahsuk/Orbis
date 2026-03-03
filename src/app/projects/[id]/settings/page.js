"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [isOpen, setIsOpen] = useState(true);
  const [tags, setTags] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) {
           setErrorMsg("Failed to load project or you don't have permission.");
           setLoading(false);
           return;
        }
        
        const data = await res.json();
        
        // Verify owner permissions
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
           const user = await userRes.json();
           const ownerIdStr = data.ownerId?._id?.toString() || data.ownerId?.toString();
           const userIdStr = user._id?.toString();
           
           if (ownerIdStr !== userIdStr) {
               setErrorMsg("Only the project owner can access settings.");
               setLoading(false);
               return;
           }
        }
        
        setTitle(data.title || "");
        setDescription(data.description || "");
        setDifficulty(data.difficulty || "Beginner");
        setIsOpen(data.isOpen !== false);
        setTags(data.tags ? data.tags.join(", ") : "");
        
      } catch (err) {
        setErrorMsg("An error occurred while loading settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  const handleSave = async (e) => {
     e.preventDefault();
     setSaving(true);
     setErrorMsg("");
     
     try {
        const tagsArray = tags.split(",").map(t => t.trim()).filter(t => t);
        
        const res = await fetch(`/api/projects/${id}`, {
           method: "PATCH",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
              title,
              description,
              difficulty,
              isOpen,
              tags: tagsArray
           })
        });
        
        if (res.ok) {
           router.push(`/projects/${id}`);
        } else {
           const data = await res.json();
           setErrorMsg(data.error || "Failed to save settings.");
        }
     } catch (err) {
        setErrorMsg("Failed to save settings.");
     } finally {
        setSaving(false);
     }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;
  
  if (errorMsg && errorMsg.includes("permission") || errorMsg.includes("Only the")) {
      return <div className="p-8 text-destructive">{errorMsg}</div>;
  }

  return (
    <div className="p-8 max-w-3xl animate-in fade-in zoom-in-95 duration-300">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Project Settings</h1>
      
      <Card>
         <CardHeader>
            <CardTitle>General Details</CardTitle>
         </CardHeader>
         <CardContent>
            {errorMsg && <div className="mb-4 text-sm text-destructive">{errorMsg}</div>}
            
            <form onSubmit={handleSave} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-sm font-medium">Project Title</label>
                  <Input 
                     value={title} 
                     onChange={(e) => setTitle(e.target.value)} 
                     required 
                  />
               </div>
               
               <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                     value={description} 
                     onChange={(e) => setDescription(e.target.value)} 
                     rows={4}
                     required 
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Difficulty</label>
                     <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                     >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                     </select>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Status</label>
                     <select 
                        value={isOpen ? "open" : "closed"} 
                        onChange={(e) => setIsOpen(e.target.value === "open")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                     >
                        <option value="open">Open (Accepting Members)</option>
                        <option value="closed">Closed</option>
                     </select>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <label className="text-sm font-medium">Tags (comma-separated)</label>
                  <Input 
                     value={tags} 
                     onChange={(e) => setTags(e.target.value)} 
                     placeholder="e.g. React, Node.js, AI"
                  />
               </div>
               
               <div className="flex justify-end pt-4 border-t border-border">
                  <Button type="button" variant="ghost" className="mr-2" onClick={() => router.push(`/projects/${id}`)}>
                     Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                     {saving ? "Saving..." : "Save Changes"}
                  </Button>
               </div>
            </form>
         </CardContent>
      </Card>
    </div>
  );
}
