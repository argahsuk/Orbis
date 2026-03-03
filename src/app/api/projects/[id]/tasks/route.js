import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import Task from "@/models/taskModel";
import { checkProjectAccess } from "@/lib/permissions";

// Fetch tasks for a project
export async function GET(req, { params }) {
  try {
    const { id: projectId } = await params;
    await connectDb();

    // Verify access
    const { isAuthorized, error } = await checkProjectAccess(projectId);
    if (!isAuthorized) {
      return NextResponse.json({ error }, { status: 403 });
    }

    const tasks = await Task.find({ projectId })
      .populate("assignedTo", "username avatar")
      .populate("createdBy", "username name avatar");
    return NextResponse.json(tasks, { status: 200 });

  } catch (error) {
    console.error("GET Tasks Error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// Create a new task
export async function POST(req, { params }) {
  try {
    const { id: projectId } = await params;
    const body = await req.json();
    await connectDb();

    // Verify access
    const { isAuthorized, user, error } = await checkProjectAccess(projectId);
    if (!isAuthorized) {
      return NextResponse.json({ error }, { status: 403 });
    }

    const newTask = new Task({
      ...body,
      projectId,
      createdBy: user._id,
    });

    const savedTask = await newTask.save();
    return NextResponse.json(savedTask, { status: 201 });

  } catch (error) {
    console.error("POST Task Error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
