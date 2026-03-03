import db from "@/lib/connectDb";
import Project from "@/models/projectModel";
import { checkProjectAccess } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await db();
  const { id: projectId } = await params;

  try {
    const project = await Project.findById(projectId)
      .populate("ownerId", "username name email")
      .populate("collaborators", "username name email");

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(project), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}


export async function PATCH(request, context) {
  try {
    await db();
    const { id: projectId } = await context.params;

    const authCheck = await checkProjectAccess(projectId);
    
    // Only owner can edit project details like GitHub repo
    if (!authCheck.isAuthorized || !authCheck.isOwner) {
      return NextResponse.json({ error: "Unauthorized. Only the owner can update this project." }, { status: 403 });
    }

    const body = await request.json();
    const allowedUpdates = {};
    if (body.title !== undefined) allowedUpdates.title = body.title;
    if (body.description !== undefined) allowedUpdates.description = body.description;
    if (body.tags !== undefined) allowedUpdates.tags = body.tags;
    if (body.difficulty !== undefined) allowedUpdates.difficulty = body.difficulty;
    if (body.githubRepoOwner !== undefined) allowedUpdates.githubRepoOwner = body.githubRepoOwner;
    if (body.githubRepoName !== undefined) allowedUpdates.githubRepoName = body.githubRepoName;
    if (body.isOpen !== undefined) allowedUpdates.isOpen = body.isOpen;

    const project = await Project.findByIdAndUpdate(projectId, allowedUpdates, { new: true });
    
    if (!project) {
       return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error("Update Project Error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
