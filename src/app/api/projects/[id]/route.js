import db from "@/lib/connectDb";
import Project from "@/models/projectModel";

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

    // Only members can see full details; public sees basic info
    const publicProject = {
      _id: project._id,
      title: project.title,
      description: project.description,
      tags: project.tags,
      difficulty: project.difficulty,
      isOpen: project.isOpen,
      owner: project.ownerId.username,
      createdAt: project.createdAt,
    };

    return new Response(JSON.stringify(publicProject), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
