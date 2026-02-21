"use client";

import { useState } from "react";
import Image from "next/image";

// Mock data with projects
const mockProjects = [
  {
    _id: "p1",
    name: "Website Redesign",
    description: "Modernize the company website",
    color: "#4caf50",
    taskCount: 3,
  },
  {
    _id: "p2",
    name: "Mobile App",
    description: "Build iOS and Android app",
    color: "#2e7d32",
    taskCount: 2,
  },
  {
    _id: "p3",
    name: "Documentation",
    description: "Improve product documentation",
    color: "#82a086",
    taskCount: 1,
  },
];

type MockProject = (typeof mockProjects)[number];
type MockTask = {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  projectId: string;
  project: MockProject | null;
  assignedTo: { name: string; type: "human" | "agent" } | null;
  createdAt: number;
  updatedAt: number;
};

const mockTasks: MockTask[] = [
  {
    _id: "1",
    title: "Setup project infrastructure",
    description: "Initialize the project with Next.js and Convex",
    status: "done",
    priority: "high",
    projectId: "p1",
    project: mockProjects[0],
    assignedTo: { name: "Demo User", type: "human" },
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    _id: "2",
    title: "Implement task board UI",
    description: "Create a Kanban-style board with drag and drop",
    status: "in_progress",
    priority: "high",
    projectId: "p1",
    project: mockProjects[0],
    assignedTo: { name: "AI Agent", type: "agent" },
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 3600000,
  },
  {
    _id: "3",
    title: "Build HTTP API for agents",
    description: "Create REST endpoints for agent integration",
    status: "in_progress",
    priority: "medium",
    projectId: "p1",
    project: mockProjects[0],
    assignedTo: { name: "Demo User", type: "human" },
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 7200000,
  },
  {
    _id: "4",
    title: "Design mobile screens",
    description: "Create mockups for main app screens",
    status: "todo",
    priority: "medium",
    projectId: "p2",
    project: mockProjects[1],
    assignedTo: null,
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 21600000,
  },
  {
    _id: "5",
    title: "Set up push notifications",
    description: "Implement FCM for Android and APNS for iOS",
    status: "todo",
    priority: "low",
    projectId: "p2",
    project: mockProjects[1],
    assignedTo: null,
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 10800000,
  },
  {
    _id: "6",
    title: "Write API documentation",
    description: "Document all HTTP endpoints with examples",
    status: "done",
    priority: "high",
    projectId: "p3",
    project: mockProjects[2],
    assignedTo: { name: "AI Agent", type: "agent" },
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 86400000,
  },
];

function TaskCard({ task, onClick }: any) {
  const priorityBorder = {
    low: "#4caf50",
    medium: "#f0c040",
    high: "#ef4444",
  };

  return (
    <div
      onClick={onClick}
      className="p-3 rounded cursor-pointer transition-all"
      style={{
        background: "var(--bp-card)",
        borderLeft: `4px solid ${priorityBorder[task.priority as keyof typeof priorityBorder]}`,
        border: `1px solid var(--bp-border)`,
        borderLeftColor: priorityBorder[task.priority as keyof typeof priorityBorder],
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "var(--bp-card-hover)")}
      onMouseOut={(e) => (e.currentTarget.style.background = "var(--bp-card)")}
    >
      <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--bp-text)" }}>
        {task.title}
      </h3>
      <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--bp-text-muted)" }}>
        {task.description}
      </p>
      <div className="flex items-center justify-between">
        <span
          className="text-xs px-2 py-1 rounded"
          style={{ background: "var(--bp-bg-dark)", color: "var(--bp-text-muted)" }}
        >
          {task.priority}
        </span>
        {task.assignedTo && (
          <span className="text-xs" style={{ color: "var(--bp-text-dim)" }}>
            {task.assignedTo.type === "agent" ? "🤖" : "👤"} {task.assignedTo.name}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [projects, setProjects] = useState(mockProjects);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    projectId: "",
  });

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    color: "#4caf50",
  });

  const filteredTasks = selectedProject
    ? tasks.filter((t) => t.projectId === selectedProject)
    : tasks;

  const columns = {
    todo: filteredTasks.filter((t) => t.status === "todo"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    done: filteredTasks.filter((t) => t.status === "done"),
  };

  const columnTitles = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    setTasks(
      tasks.map((t) =>
        t._id === taskId ? { ...t, status: newStatus as any } : t
      )
    );
    if (selectedTask?._id === taskId) {
      setSelectedTask({ ...selectedTask, status: newStatus });
    }
  };

  const handleCreateTask = () => {
    const project = projects.find((p) => p._id === newTask.projectId);
    const task: MockTask = {
      _id: `task_${Date.now()}`,
      ...newTask,
      status: "todo",
      project: project || null,
      assignedTo: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setTasks([...tasks, task]);
    setNewTask({ title: "", description: "", priority: "medium", projectId: "" });
    setShowCreateTask(false);
  };

  const handleCreateProject = () => {
    const project = {
      _id: `proj_${Date.now()}`,
      ...newProject,
      taskCount: 0,
    };

    setProjects([...projects, project]);
    setNewProject({ name: "", description: "", color: "#4caf50" });
    setShowCreateProject(false);
  };

  const statusColors = {
    todo: { background: "#1a2e20", color: "#b8c8b8" },
    in_progress: { background: "#1b3a2b", color: "#4caf50" },
    done: { background: "#2e7d32", color: "#ffffff" },
  };

  const priorityColors = {
    low: { background: "#1b3a2b", color: "#4caf50" },
    medium: { background: "#2e2a1a", color: "#f0c040" },
    high: { background: "#2e1a1a", color: "#ef4444" },
  };

  const inputStyle = {
    width: "100%",
    border: "1px solid var(--bp-border)",
    borderRadius: "0.5rem",
    padding: "0.5rem",
    fontSize: "0.875rem",
    background: "var(--bp-bg-dark)",
    color: "var(--bp-text)",
    outline: "none",
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bp-bg)" }}>
      <div className="container mx-auto">
        {/* Header */}
        <header
          className="mb-6 p-6"
          style={{ background: "var(--bp-bg-dark)", borderBottom: "1px solid var(--bp-border)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/bp-logo.png"
                alt="Bitcoin Park"
                width={120}
                height={60}
                style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
              />
              <div>
                <h1 className="text-3xl font-bold" style={{ color: "var(--bp-text)" }}>
                  Mission Control Dashboard
                </h1>
                <p className="mt-1" style={{ color: "var(--bp-text-muted)" }}>
                  Task management for humans and AI agents
                </p>
              </div>
            </div>
            <div
              className="p-3 rounded"
              style={{ background: "#1a2a10", borderLeft: "4px solid var(--bp-green-light)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--bp-green-light)" }}>
                🎨 Demo Mode
              </p>
              <p className="text-xs" style={{ color: "var(--bp-text-dim)" }}>
                Using mock data. Run{" "}
                <code
                  className="px-1 rounded"
                  style={{ background: "var(--bp-bg-dark)", color: "var(--bp-green-light)" }}
                >
                  npx convex dev
                </code>{" "}
                for full functionality.
              </p>
            </div>
          </div>
        </header>

        {selectedTask ? (
          <div className="max-w-4xl mx-auto px-6">
            <button
              onClick={() => setSelectedTask(null)}
              className="text-sm mb-4 flex items-center gap-1 transition-colors"
              style={{ color: "var(--bp-green-light)" }}
            >
              ← Back to Dashboard
            </button>

            <div
              className="rounded-lg p-6 mb-6"
              style={{ background: "var(--bp-card)", border: "1px solid var(--bp-border)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold" style={{ color: "var(--bp-text)" }}>
                  {selectedTask.title}
                </h1>
                <div className="flex gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={priorityColors[selectedTask.priority as keyof typeof priorityColors]}
                  >
                    {selectedTask.priority}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={statusColors[selectedTask.status as keyof typeof statusColors]}
                  >
                    {selectedTask.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <p className="mb-6" style={{ color: "var(--bp-text-muted)" }}>
                {selectedTask.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedTask.project && (
                  <div>
                    <label className="text-sm font-semibold" style={{ color: "var(--bp-text-dim)" }}>
                      Project
                    </label>
                    <p className="flex items-center gap-2" style={{ color: "var(--bp-text)" }}>
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: selectedTask.project.color }}
                      ></span>
                      {selectedTask.project.name}
                    </p>
                  </div>
                )}
                {selectedTask.assignedTo && (
                  <div>
                    <label className="text-sm font-semibold" style={{ color: "var(--bp-text-dim)" }}>
                      Assigned To
                    </label>
                    <p style={{ color: "var(--bp-text)" }}>
                      {selectedTask.assignedTo.type === "agent" ? "🤖" : "👤"}{" "}
                      {selectedTask.assignedTo.name}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--bp-border)", paddingTop: "1rem" }}>
                <label className="text-sm font-semibold block mb-2" style={{ color: "var(--bp-text-dim)" }}>
                  Update Status
                </label>
                <div className="flex gap-2">
                  {(["todo", "in_progress", "done"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => updateTaskStatus(selectedTask._id, status)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={
                        selectedTask.status === status
                          ? statusColors[status]
                          : { background: "var(--bp-bg-dark)", color: "var(--bp-text-muted)" }
                      }
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="rounded-lg p-6"
              style={{ background: "var(--bp-card)", border: "1px solid var(--bp-border)" }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--bp-text)" }}>
                Comments
              </h2>
              <div className="space-y-4">
                <div
                  className="rounded-lg p-4"
                  style={{ background: "var(--bp-bg-dark)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--bp-text)" }}>
                      👤 Demo User
                    </span>
                    <span className="text-xs" style={{ color: "var(--bp-text-dim)" }}>
                      2 hours ago
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--bp-text-muted)" }}>
                    This looks great! Making good progress on this task.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Project Tabs & Actions */}
            <div className="px-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={
                      selectedProject === null
                        ? { background: "var(--bp-green)", color: "#fff" }
                        : { background: "var(--bp-card)", color: "var(--bp-text-muted)", border: "1px solid var(--bp-border)" }
                    }
                  >
                    All Projects
                  </button>
                  {projects.map((project) => (
                    <button
                      key={project._id}
                      onClick={() => setSelectedProject(project._id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      style={
                        selectedProject === project._id
                          ? { background: "var(--bp-green)", color: "#fff" }
                          : { background: "var(--bp-card)", color: "var(--bp-text-muted)", border: "1px solid var(--bp-border)" }
                      }
                    >
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: project.color }}
                      ></span>
                      {project.name} ({project.taskCount})
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: "var(--bp-green-light)", color: "#fff" }}
                  >
                    + New Project
                  </button>
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: "var(--bp-green)", color: "#fff" }}
                  >
                    + New Task
                  </button>
                </div>
              </div>
            </div>

            {/* Create Task Modal */}
            {showCreateTask && (
              <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
                <div
                  className="rounded-lg p-6 max-w-md w-full mx-4"
                  style={{ background: "var(--bp-card)", border: "1px solid var(--bp-border)" }}
                >
                  <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--bp-text)" }}>
                    Create New Task
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: "var(--bp-text-muted)" }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        style={inputStyle}
                        placeholder="Task title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: "var(--bp-text-muted)" }}>
                        Description
                      </label>
                      <textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        style={inputStyle}
                        rows={3}
                        placeholder="Task description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: "var(--bp-text-muted)" }}>
                        Project
                      </label>
                      <select
                        value={newTask.projectId}
                        onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="">No Project</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: "var(--bp-text-muted)" }}>
                        Priority
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                        style={inputStyle}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleCreateTask}
                      disabled={!newTask.title || !newTask.description}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{
                        background: newTask.title && newTask.description ? "var(--bp-green)" : "var(--bp-bg-dark)",
                        color: newTask.title && newTask.description ? "#fff" : "var(--bp-text-dim)",
                        cursor: newTask.title && newTask.description ? "pointer" : "not-allowed",
                      }}
                    >
                      Create Task
                    </button>
                    <button
                      onClick={() => setShowCreateTask(false)}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{ background: "var(--bp-bg-dark)", color: "var(--bp-text-muted)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Project Modal */}
            {showCreateProject && (
              <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }}>
                <div
                  className="rounded-lg p-6 max-w-md w-full mx-4"
                  style={{ background: "var(--bp-card)", border: "1px solid var(--bp-border)" }}
                >
                  <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--bp-text)" }}>
                    Create New Project
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: "var(--bp-text-muted)" }}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        style={inputStyle}
                        placeholder="Project name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: "var(--bp-text-muted)" }}>
                        Description
                      </label>
                      <textarea
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        style={inputStyle}
                        rows={3}
                        placeholder="Project description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1" style={{ color: "var(--bp-text-muted)" }}>
                        Color
                      </label>
                      <div className="flex gap-2">
                        {["#4caf50", "#2e7d32", "#82a086", "#ef4444", "#b8c8b8", "#f0c040"].map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewProject({ ...newProject, color })}
                            className="w-10 h-10 rounded-lg"
                            style={{
                              backgroundColor: color,
                              outline: newProject.color === color ? "2px solid #fff" : "none",
                              outlineOffset: "2px",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleCreateProject}
                      disabled={!newProject.name || !newProject.description}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{
                        background: newProject.name && newProject.description ? "var(--bp-green)" : "var(--bp-bg-dark)",
                        color: newProject.name && newProject.description ? "#fff" : "var(--bp-text-dim)",
                        cursor: newProject.name && newProject.description ? "pointer" : "not-allowed",
                      }}
                    >
                      Create Project
                    </button>
                    <button
                      onClick={() => setShowCreateProject(false)}
                      className="flex-1 px-4 py-2 rounded-lg transition-colors"
                      style={{ background: "var(--bp-bg-dark)", color: "var(--bp-text-muted)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-6">
              {Object.entries(columns).map(([status, statusTasks]) => (
                <div
                  key={status}
                  className="rounded-lg p-4"
                  style={{ background: "var(--bp-bg-dark)", border: "1px solid var(--bp-border)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg" style={{ color: "var(--bp-text)" }}>
                      {columnTitles[status as keyof typeof columnTitles]}
                    </h2>
                    <span
                      className="text-sm rounded-full px-2 py-1"
                      style={{ background: "var(--bp-card)", color: "var(--bp-text-dim)" }}
                    >
                      {statusTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {statusTasks.length === 0 ? (
                      <div className="text-center text-sm py-8" style={{ color: "var(--bp-text-dim)" }}>
                        No tasks
                      </div>
                    ) : (
                      statusTasks.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onClick={() => setSelectedTask(task)}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
