import { getLoggedUser } from "@/lib/auth";
import db from "@/lib/connectDb";
import Project from "@/models/projectModel";

export async function GET(req) {
  await db();
  const user = await getLoggedUser();
  const userId = user ? user._id : null;

  try {
    const query = { $or: [{ isOpen: true }] };
    if (userId) {
       query.$or.push({ ownerId: userId });
       query.$or.push({ collaborators: userId });
    }

    const projects = await Project.find(query)
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
      owner: p.ownerId?.username,
      collaborators: p.collaborators?.map(c => ({ username: c.username, name: c.name })) || [],
      collaboratorsCount: p.collaborators?.length || 0,
      createdAt: p.createdAt,
    }));

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function POST(req) {
  await db();
  
  try {
    const user = await getLoggedUser();
    if (!user || !user._id) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const { title, description, tags, difficulty, isOpen, githubRepoOwner, githubRepoName } = body;

    if (!title || !description) {
      return new Response(JSON.stringify({ error: "Title and description are required" }), { status: 400 });
    }

    const newProject = await Project.create({
      title,
      description,
      tags: tags || [],
      difficulty: difficulty || "Beginner",
      isOpen: isOpen !== undefined ? isOpen : true,
      ownerId: user._id,
      collaborators: [],
      githubRepoOwner: githubRepoOwner || "",
      githubRepoName: githubRepoName || "",
    });

    return new Response(JSON.stringify(newProject), { status: 201 });
  } catch (err) {
    console.error("Create Project Error:", err);
    return new Response(JSON.stringify({ error: "Failed to create project" }), { status: 500 });
  }
}
