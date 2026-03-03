import { NextResponse } from "next/server";
import connectDb from "@/lib/connectDb";
import Task from "@/models/taskModel";
import { checkProjectAccess } from "@/lib/permissions";

// Update task
export async function PATCH(req, { params }) {
  try {
    const { id: projectId, taskId } = await params;
    const body = await req.json();
    await connectDb();

    // Verify access
    const { isAuthorized, error } = await checkProjectAccess(projectId);
    if (!isAuthorized) {
      return NextResponse.json({ error }, { status: 403 });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, projectId },
      { $set: body },
      { new: true }
    );

    if (!updatedTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("PATCH Task Error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// Delete task
export async function DELETE(req, { params }) {
  try {
    const { id: projectId, taskId } = await params;
    await connectDb();

    const { isAuthorized, isOwner, error } = await checkProjectAccess(projectId);
    if (!isAuthorized) {
      return NextResponse.json({ error }, { status: 403 });
    }

    if (!isOwner) {
       return NextResponse.json({ error: "Only project owners can delete tasks" }, { status: 403 });
    }

    const deletedTask = await Task.findOneAndDelete({ _id: taskId, projectId });
    if (!deletedTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Task Error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
