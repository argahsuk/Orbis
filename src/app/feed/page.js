"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function FeedPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading projects...</div>

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Projects Feed</h1>
      {projects.length === 0 ? (
        <p className="text-gray-500">No projects found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(project => (
            <Link 
              key={project._id} 
              href={`/projects/${project._id}`} 
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
            >
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {project.title}
              </h5>
              <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 line-clamp-2">
                {project.description}
              </p>
              
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300">
                      +{project.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mt-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                <span className="font-medium text-gray-800 dark:text-gray-300">
                  By: {project.owner || 'Unknown'}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold dark:bg-blue-900 dark:text-blue-200">
                  {project.difficulty || 'Beginner'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
