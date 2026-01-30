export async function fetchProjects() {
  const res = await fetch("/api/projects");
  return res.json();
}

export async function fetchProject(id) {
  const res = await fetch(`/api/projects/${id}`);
  return res.json();
}

export async function fetchTasks(projectId) {
  const res = await fetch(`/api/projects/${projectId}/tasks`);
  return res.json();
}

export async function createTask(projectId, data) {
  const res = await fetch(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTask(projectId, data) {
  const res = await fetch(`/api/projects/${projectId}/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTask(projectId, taskId) {
  const res = await fetch(`/api/projects/${projectId}/tasks`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId }),
  });
  return res.json();
}
