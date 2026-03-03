import Project from "@/models/projectModel";
import { getLoggedUser } from "@/lib/auth";

export async function checkProjectAccess(projectId) {
  const user = await getLoggedUser();
  
  if (!user) {
    return { isAuthorized: false, user: null, project: null, error: "Unauthorized" };
  }

  const project = await Project.findById(projectId);
  
  if (!project) {
    return { isAuthorized: false, user, project: null, error: "Project not found" };
  }

  const isOwner = project.ownerId.toString() === user._id.toString();
  const isCollaborator = project.collaborators.some(
    (collabId) => collabId.toString() === user._id.toString()
  );

  if (!isOwner && !isCollaborator) {
    return { isAuthorized: false, user, project, error: "Forbidden" };
  }

  return { isAuthorized: true, isOwner, isCollaborator, user, project, error: null };
}
