"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TaskCard } from "./TaskCard";

export function TaskBoard() {
  const tasks = useQuery(api.tasks.list);

  if (!tasks) {
    return (
      <div className="flex items-center justify-center h-64">
        <div style={{ color: "var(--bp-text-muted)" }}>Loading tasks...</div>
      </div>
    );
  }

  const columns = {
    todo: tasks.filter((t: any) => t.status === "todo"),
    in_progress: tasks.filter((t: any) => t.status === "in_progress"),
    done: tasks.filter((t: any) => t.status === "done"),
  };

  const columnTitles = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
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
              statusTasks.map((task: any) => <TaskCard key={task._id} task={task} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
