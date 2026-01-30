import db from "@/lib/connectDb";
import Project from "@/models/projectModel";
import Task from "@/models/taskModel";

// helper to check membership
const isMember = (project, userId) => {
  if (!userId) return false;
  return (
    project.ownerId.equals(userId) ||
    project.collaborators.some((c) => c.equals(userId))
  );
};

// GET tasks for a project
export async function GET(req, { params }) {
  await db();
  const { id: projectId } = params;

  try {
    const resUser = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });
    const user = await resUser.json();

    const project = await Project.findById(projectId);
    if (!project)
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });

    // Only members can see tasks
    if (!isMember(project, user?._id))
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });

    const tasks = await Task.find({ projectId }).populate("assignedTo", "username name email");
    return new Response(JSON.stringify(tasks), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// POST: create task
export async function POST(req, { params }) {
  await db();
  const { id: projectId } = params;
  const body = await req.json();

  try {
    const resUser = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });
    const user = await resUser.json();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const project = await Project.findById(projectId);
    if (!project)
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });

    if (!isMember(project, user._id))
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });

    const { title, description, assignedTo } = body;
    if (!title)
      return new Response(JSON.stringify({ error: "Title is required" }), { status: 400 });

    const task = await Task.create({
      projectId,
      title,
      description: description || "",
      assignedTo: assignedTo || null,
      status: "todo",
    });

    return new Response(JSON.stringify(task), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// PATCH: update task
export async function PATCH(req, { params }) {
  await db();
  const { id: projectId } = params;
  const body = await req.json();

  try {
    const resUser = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });
    const user = await resUser.json();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { taskId, status, title, description, assignedTo } = body;
    if (!taskId)
      return new Response(JSON.stringify({ error: "Task ID is required" }), { status: 400 });

    const project = await Project.findById(projectId);
    if (!project)
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });

    if (!isMember(project, user._id))
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });

    const task = await Task.findById(taskId);
    if (!task) return new Response(JSON.stringify({ error: "Task not found" }), { status: 404 });

    if (status) task.status = status;
    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;

    await task.save();
    return new Response(JSON.stringify(task), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// DELETE: delete task
export async function DELETE(req, { params }) {
  await db();
  const { id: projectId } = params;
  const body = await req.json();

  try {
    const resUser = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });
    const user = await resUser.json();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { taskId } = body;
    if (!taskId)
      return new Response(JSON.stringify({ error: "Task ID is required" }), { status: 400 });

    const project = await Project.findById(projectId);
    if (!project)
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });

    if (!isMember(project, user._id))
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });

    await Task.findByIdAndDelete(taskId);
    return new Response(JSON.stringify({ message: "Task deleted successfully" }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
