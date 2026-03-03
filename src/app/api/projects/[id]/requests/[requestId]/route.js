import { getLoggedUser } from "@/lib/auth";
import db from "@/lib/connectDb";
import Project from "@/models/projectModel";
import Notification from "@/models/notificationModel";

export async function PUT(req, { params }) {
  await db();

  try {
    const user = await getLoggedUser();
    if (!user || !user._id) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id: projectId, requestId } = await params;
    const body = await req.json();
    const { action } = body; // action can be "accept" or "reject"

    if (!["accept", "reject"].includes(action)) {
       return new Response(JSON.stringify({ error: "Invalid action. Must be 'accept' or 'reject'." }), { status: 400 });
    }

    const project = await Project.findById(projectId);

    if (!project) {
       return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    // Only owner can accept/reject requests
    if (project.ownerId.toString() !== user._id.toString()) {
       return new Response(JSON.stringify({ error: "Forbidden. Only the project owner can manage requests." }), { status: 403 });
    }

    let requestIndex = -1;

    // Direct Notification Request Matching
    if (body.isFromNotification && body.senderId) {
        requestIndex = project.joinRequests?.findIndex(req => req.userId.toString() === body.senderId.toString() && req.status === "pending");
    } else {
        requestIndex = project.joinRequests?.findIndex(req => req._id.toString() === requestId);
    }

    if (requestIndex === -1 || requestIndex === undefined || project.joinRequests[requestIndex].status !== "pending") {
       return new Response(JSON.stringify({ error: "Request not found or already processed" }), { status: 404 });
    }

    const targetUserId = project.joinRequests[requestIndex].userId;

    if (action === "accept") {
       project.joinRequests[requestIndex].status = "accepted";
       
       // Add user to collaborators
       if (!project.collaborators.includes(targetUserId)) {
          project.collaborators.push(targetUserId);
       }
       
       // Notify user
       await Notification.create({
          userId: targetUserId,
          type: "invite_accepted",
          message: `Your request to join ${project.title} has been accepted!`,
          projectId: project._id,
          link: `/projects/${project._id}`,
       });
    } else {
       project.joinRequests[requestIndex].status = "rejected";
       
       // Notify user
       await Notification.create({
          userId: targetUserId,
          type: "invite_rejected",
          message: `Your request to join ${project.title} was declined.`,
          projectId: project._id,
       });
    }

    await project.save();
    return new Response(JSON.stringify({ message: `Request ${action}ed successfully.` }), { status: 200 });
  } catch (error) {
    console.error(`Process Join Request Error:`, error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), { status: 500 });
  }
}
