import { getLoggedUser } from "@/lib/auth";
import db from "@/lib/connectDb";
import Project from "@/models/projectModel";
import Notification from "@/models/notificationModel";

// POST: Request to join a project
export async function POST(req, { params }) {
  await db();

  try {
    const user = await getLoggedUser();
    if (!user || !user._id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await req.json();
    const message = body.message || "I would like to join this project.";

    const project = await Project.findById(projectId);

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    if (!project.isOpen) {
      return new Response(JSON.stringify({ error: "This project is currently closed to new members" }), { status: 400 });
    }

    // Check if user is already the owner or a collaborator
    if (project.ownerId.toString() === user._id.toString() || project.collaborators.includes(user._id)) {
       return new Response(JSON.stringify({ error: "You are already a member of this project" }), { status: 400 });
    }

    // Check if user already has a pending or accepted request
    const existingRequest = project.joinRequests?.find(req => req.userId.toString() === user._id.toString());
    
    if (existingRequest) {
       if (existingRequest.status === "pending") {
         return new Response(JSON.stringify({ error: "You already have a pending request for this project" }), { status: 400 });
       }
       if (existingRequest.status === "accepted") {
         return new Response(JSON.stringify({ error: "You are already a member of this project" }), { status: 400 });
       }
       // If rejected, we might allow them to request again or block it. Let's allow replacing it.
       existingRequest.status = "pending";
       existingRequest.message = message;
       existingRequest.requestedAt = Date.now();
    } else {
       // Add new request
       if (!project.joinRequests) project.joinRequests = [];
       project.joinRequests.push({
          userId: user._id,
          status: "pending",
          message,
       });
    }

    await project.save();

    // Create a notification for the project owner
    await Notification.create({
       userId: project.ownerId,
       type: "new_request",
       message: `${user.username || user.name} requested to join your project: ${project.title}`,
       projectId: project._id,
       senderId: user._id,
       link: `/projects/${project._id}`,
    });

    return new Response(JSON.stringify({ message: "Join request sent successfully!" }), { status: 200 });

  } catch (error) {
    console.error("Join Project Error:", error);
    return new Response(JSON.stringify({ error: "Failed to send join request" }), { status: 500 });
  }
}
