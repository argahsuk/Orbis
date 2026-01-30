"use client";

import { useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectDashboardPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch project");
      }
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) return <div>Loading project...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!project) return <div>No project found</div>;

  const { title, description, tags, difficulty, ownerId, collaborators, isOpen } = project;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="mb-2">{description}</p>
      <p className="mb-2">
        <strong>Tags:</strong> {tags.join(", ")}
      </p>
      <p className="mb-2">
        <strong>Difficulty:</strong> {difficulty}
      </p>
      <p className="mb-2">
        <strong>Owner:</strong> {ownerId.name} ({ownerId.username})
      </p>
      <p className="mb-4">
        <strong>Collaborators:</strong>{" "}
        {collaborators.length ? collaborators.map(c => c.name).join(", ") : "None"}
      </p>
      <p className="mb-4">
        <strong>Status:</strong> {isOpen ? "Open for collaboration" : "Closed"}
      </p>

      {isOpen && !collaborators.some(c => c._id === user._id) && ownerId._id !== user._id && (
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={async () => {
            try {
              const res = await fetch(`/api/projects/${id}/join`, { method: "POST" });
              if (!res.ok) throw new Error("Failed to request to join");
              alert("Join request sent!");
            } catch (err) {
              console.error(err);
              alert(err.message);
            }
          }}
        >
          Request to Join
        </button>
      )}

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-2"
        onClick={() => router.push(`/projects/${id}/tasks`)}
      >
        Go to Task Board
      </button>
    </div>
  );
}
