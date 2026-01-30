"use client";

import { useEffect, useState, useContext } from "react";
import { useParams } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";

export default function TaskBoardPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [error, setError] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/tasks`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [id]);

  const handleCreateTask = async () => {
    if (!newTask.title) return alert("Title required");
    try {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create task");
      setNewTask({ title: "", description: "" });
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...updates }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update task");
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete task");
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Task Board</h1>

      <div className="mb-6 flex flex-col md:flex-row gap-2">
        <input
          className="border p-2 flex-1"
          type="text"
          placeholder="Task title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
        <input
          className="border p-2 flex-1"
          type="text"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
        <button
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          onClick={handleCreateTask}
        >
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["todo", "in-progress", "done"].map((status) => (
          <div key={status} className="bg-gray-100 p-3 rounded">
            <h2 className="text-lg font-semibold capitalize mb-2">{status.replace("-", " ")}</h2>
            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <div key={task._id} className="border p-2 mb-2 bg-white rounded">
                  <strong>{task.title}</strong>
                  <p>{task.description}</p>
                  <p className="text-sm text-gray-500">
                    Assigned: {task.assignedTo ? task.assignedTo.name : "Unassigned"}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() =>
                        handleUpdateTask(task._id, {
                          status:
                            status === "todo"
                              ? "in-progress"
                              : status === "in-progress"
                              ? "done"
                              : "todo",
                        })
                      }
                    >
                      Move
                    </button>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      onClick={() => handleDeleteTask(task._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
