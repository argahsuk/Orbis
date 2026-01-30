import db from "@/lib/connectDb";
import Project from "@/models/projectModel";

export async function GET(req) {
  await db();
  const userId = req.headers.get("x-user-id"); // Optional

  try {
    const projects = await Project.find({
      $or: [
        { isOpen: true }, // Public/open projects
        { ownerId: userId },
        { collaborators: userId },
      ],
    })
      .populate("ownerId", "username name")
      .populate("collaborators", "username name")
      .sort({ createdAt: -1 });

    // Map to safe output
    const result = projects.map(p => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      tags: p.tags,
      difficulty: p.difficulty,
      isOpen: p.isOpen,
      owner: p.ownerId.username,
      collaboratorsCount: p.collaborators.length,
      createdAt: p.createdAt,
    }));

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
