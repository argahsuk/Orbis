import dbConnect from "@/lib/connectDb";
import User from "@/models/userModel";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Mail, User as UserIcon } from "lucide-react";

export default async function UserProfilePage({ params }) {
  await dbConnect();
  const { id } = await params;

  let profile = null;
  try {
    profile = await User.findById(id).select("-password");
  } catch (e) {
    console.error("Invalid user ID");
  }

  if (!profile) return notFound();

  return (
    <div className="max-w-3xl mx-auto p-8 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-2 shadow-sm">
         <div className="h-32 bg-primary/10 w-full relative">
            <div className="absolute -bottom-12 left-8 border-4 border-background rounded-full bg-secondary h-24 w-24 flex items-center justify-center overflow-hidden">
               {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                  <UserIcon size={40} className="text-muted-foreground" />
               )}
            </div>
         </div>
         <CardHeader className="pt-16 pb-4">
            <CardTitle className="text-3xl font-bold">{profile.username || "No Name Provided"}</CardTitle>
            <p className="text-muted-foreground">@{profile.username}</p>
         </CardHeader>
         <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 text-sm">
               <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail size={16} />
                  <span>{profile.email}</span>
               </div>
               <div className="flex items-center gap-3 text-muted-foreground">
                  <Github size={16} />
                  {profile.githubId ? (
                     <span className="text-primary font-medium">GitHub Connected</span>
                  ) : (
                     <span className="italic">GitHub Not Connected</span>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
