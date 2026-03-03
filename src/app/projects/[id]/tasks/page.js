"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, Trash2, AlignLeft, User } from "lucide-react";
import { toast } from "sonner";
import { TaskEditModal } from "@/components/TaskEditModal";

import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- DND Sortable Task Item Component ---
function SortableTaskItem({ task, projectRole, onDelete, onEdit, id }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id, data: { type: "Task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border-2 border-primary/50 border-dashed rounded-xl h-[100px] w-full"
      />
    );
  }

  return (
    <Card 
       ref={setNodeRef} 
       style={style} 
       className="group hover:shadow-md transition-shadow relative bg-card overflow-hidden"
    >
       <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between">
           <div className="font-medium text-sm pr-6 leading-tight cursor-pointer w-full" onClick={() => onEdit(task)}>
              <div className="mb-1 font-semibold text-base">{task.title}</div>
              {task.description && (
                 <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
              )}
              
              <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-border/50">
                 <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><User size={10}/> Created By</span>
                    <span className="font-medium text-foreground">{task.createdBy?.username || task.createdBy?.name || "Unknown"}</span>
                 </div>
                 <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><User size={10}/> Assigned To</span>
                    {task.assignedTo ? (
                       <div className="flex items-center gap-1 text-secondary-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md">
                          {task.assignedTo.avatar && <img src={task.assignedTo.avatar} alt="" className="w-3 h-3 rounded-full" />}
                          <span className="font-medium truncate max-w-[80px]">
                             {task.assignedTo.username || task.assignedTo.name}
                          </span>
                       </div>
                    ) : (
                       <span className="font-medium">Unassigned</span>
                    )}
                 </div>
              </div>
          </div>
          {projectRole === "Owner" && (
             <button 
               onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
               className="absolute top-3 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
             >
                <Trash2 size={14} />
             </button>
          )}
       </CardHeader>
       <CardFooter className="p-2 px-3 pt-0 bg-secondary/10 flex justify-between items-center cursor-grab active:cursor-grabbing border-t border-border/50" {...attributes} {...listeners}>
           <div className="text-xs text-muted-foreground flex items-center gap-1 w-full justify-center">
              <GripVertical size={14} className="opacity-50"/> 
           </div>
       </CardFooter>
    </Card>
  );
}

// --- DND Sortable Column Component ---
function Column({ board, tasks, projectRole, onDeleteTask, onEditTask }) {
  const taskIds = useMemo(() => tasks.map(t => t._id), [tasks]);
  
  const { setNodeRef } = useSortable({
    id: board.key,
    data: { type: "Column", board }
  });

  return (
    <div 
      className={`flex-1 min-w-[300px] max-w-[400px] rounded-xl border p-4 flex flex-col h-full bg-card/50 ${board.color}`}
    >
       <div className="flex items-center justify-between mb-4 px-1" ref={setNodeRef}>
          <h3 className="font-semibold">{board.title}</h3>
          <span className="text-xs bg-background rounded-full px-2 py-1 font-medium text-muted-foreground shadow-sm">
             {tasks.length}
          </span>
       </div>
       
       <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
          <SortableContext items={taskIds}>
             <div className="space-y-3 pb-8 flex flex-col min-h-[150px]">
                {tasks.map(task => (
                   <SortableTaskItem 
                     key={task._id} 
                     id={task._id}
                     task={task} 
                     projectRole={projectRole} 
                     onDelete={onDeleteTask}
                     onEdit={onEditTask} 
                   />
                ))}
             </div>
          </SortableContext>
       </div>
    </div>
  );
}


// --- Main Page Component ---
export default function TaskBoardPage() {
  const { id } = useParams();
  const { user } = useAuthRedirect({ requireAuth: true });
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [projectRole, setProjectRole] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);

  // Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeEditTask, setActiveEditTask] = useState(null);

  // Drag State
  const [activeDragTask, setActiveDragTask] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/projects/${id}/tasks`);
      if (res.ok) setTasks(await res.json());
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    async function init() {
       setLoading(true);
       try {
           const pRes = await fetch(`/api/projects/${id}`);
           if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.ownerId?._id === user?._id || pData.ownerId === user?._id) setProjectRole("Owner");
              else if (pData.collaborators?.some(c => (c._id || c) === user?._id)) setProjectRole("Collaborator");
              
              if (pData.ownerId && pData.collaborators) {
                 setProjectMembers([pData.ownerId, ...pData.collaborators]);
              }
           }
           await fetchTasks();
       } finally {
           setLoading(false);
       }
    }
    if (user) init();
  }, [id, user]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch(`/api/projects/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle }),
      });

      if (res.ok) {
        setNewTaskTitle("");
        toast.success("Task created");
        fetchTasks();
      } else {
         toast.error("Failed to create task");
      }
    } catch (e) {
       toast.error("Error creating task");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId)); 
    try {
      const res = await fetch(`/api/projects/${id}/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
         toast.success("Task deleted");
      } else {
         const data = await res.json();
         toast.error(data.error || "Failed to delete task");
         fetchTasks(); 
      }
    } catch(e) {
        fetchTasks();
    }
  };

  // --- DND Context Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // minimum distance to move before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === "Task") {
       setActiveDragTask(active.data.current.task);
    }
  };

  const onDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    // Moving Task Over Another Task
    if (isActiveTask && isOverTask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t._id === activeId);
        const overIndex = tasks.findIndex((t) => t._id === overId);
        
        const activeTask = tasks[activeIndex];
        const overTask = tasks[overIndex];

        // If they are in different columns, move it to the new column immediately (optimistic visual update)
        if (activeTask.status !== overTask.status) {
           const newTasks = [...tasks];
           newTasks[activeIndex] = { ...newTasks[activeIndex], status: overTask.status };
           return arrayMove(newTasks, activeIndex, overIndex);
        }

        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    // Moving Task Over Empty Column Space
    if (isActiveTask && isOverColumn) {
       setTasks((tasks) => {
         const activeIndex = tasks.findIndex((t) => t._id === activeId);
         const activeTask = tasks[activeIndex];
         const newStatus = over.data.current.board.key;

         if (activeTask.status !== newStatus) {
            const newTasks = [...tasks];
            newTasks[activeIndex] = { ...newTasks[activeIndex], status: newStatus };
            return newTasks;
         }
         return tasks;
       });
    }
  };

  const onDragEnd = async (event) => {
    const originalTask = activeDragTask;
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over || !originalTask) return;
    
    const activeTask = tasks.find(t => t._id === active.id);
    if (!activeTask) return;

    // Check if status actually changed to persist to DB
    // We get the final state from the state since onDragOver handled the optimistic updates
    if (originalTask.status !== activeTask.status) {
        try {
           const res = await fetch(`/api/projects/${id}/tasks/${activeTask._id}`, {
             method: "PATCH",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ status: activeTask.status }),
           });
           if (!res.ok) {
              toast.error("Failed to persist task move");
              fetchTasks();
           }
        } catch(e) { fetchTasks(); }
    }
  };

  const boards = [
    { key: "todo", title: "To Do", color: "bg-slate-500/10 border-slate-500/20" },
    { key: "in-progress", title: "In Progress", color: "bg-amber-500/10 border-amber-500/20" },
    { key: "done", title: "Done", color: "bg-emerald-500/10 border-emerald-500/20" }
  ];

  if (loading) return <div className="p-8 animate-pulse text-muted-foreground">Loading Task Board...</div>;

  return (
    <div className="p-8 w-full h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-end justify-between">
         <div>
             <h1 className="text-3xl font-bold tracking-tight mb-2">Task Board</h1>
             <p className="text-muted-foreground">Manage project tasks and track progress.</p>
         </div>
      </div>

      <form onSubmit={handleCreateTask} className="mb-8 flex items-center gap-3">
         <Input 
           placeholder="What needs to be done?" 
           value={newTaskTitle}
           onChange={(e) => setNewTaskTitle(e.target.value)}
           className="max-w-md bg-secondary/30"
           disabled={isCreating}
         />
         <Button type="submit" disabled={isCreating || !newTaskTitle.trim()}>
            <Plus size={16} className="mr-2" /> Add Task
         </Button>
      </form>

      <DndContext
         sensors={sensors}
         collisionDetection={closestCorners}
         onDragStart={onDragStart}
         onDragOver={onDragOver}
         onDragEnd={onDragEnd}
      >
         <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
            {boards.map(board => (
               <Column 
                 key={board.key}
                 board={board}
                 tasks={tasks.filter(t => t.status === board.key)}
                 projectRole={projectRole}
                 onDeleteTask={handleDeleteTask}
                 onEditTask={(task) => { setActiveEditTask(task); setEditModalOpen(true); }}
               />
            ))}
         </div>

         <DragOverlay>
            {activeDragTask ? (
               <SortableTaskItem 
                 task={activeDragTask} 
                 projectRole={projectRole} 
                 id={activeDragTask._id} 
               />
            ) : null}
         </DragOverlay>
      </DndContext>

      <TaskEditModal 
         isOpen={editModalOpen}
         onClose={() => { setEditModalOpen(false); setActiveEditTask(null); }}
         task={activeEditTask}
         projectId={id}
         members={projectMembers}
         onSave={fetchTasks}
      />
    </div>
  );
}
