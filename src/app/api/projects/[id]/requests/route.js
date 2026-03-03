import { getLoggedUser } from "@/lib/auth";
import db from "@/lib/connectDb";
import Project from "@/models/projectModel";
import Notification from "@/models/notificationModel";

export async function GET(req, { params }) {
  await db();

  try {
    const user = await getLoggedUser();
    if (!user || !user._id) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { id: projectId } = await params;
    const project = await Project.findById(projectId).populate("joinRequests.userId", "username name email avatar");

    if (!project) {
       return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    // Only owner can view requests
    if (project.ownerId.toString() !== user._id.toString()) {
       return new Response(JSON.stringify({ error: "Forbidden. Only the project owner can view requests." }), { status: 403 });
    }

    const pendingRequests = project.joinRequests?.filter(req => req.status === "pending") || [];
    
    // Reverse sort to show the newest requests first
    const sortedRequests = pendingRequests.sort((a,b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    return new Response(JSON.stringify(sortedRequests), { status: 200 });
  } catch (error) {
    console.error("Fetch Join Requests Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch join requests" }), { status: 500 });
  }
}
