"use client";

import Link from "next/link";

interface TaskCardProps {
  task: {
    _id: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    assignedTo?: {
      name: string;
      type: "human" | "agent";
    } | null;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const priorityBorder = {
    low: "#4caf50",
    medium: "#f0c040",
    high: "#ef4444",
  };

  return (
    <Link href={`/tasks/${task._id}`}>
      <div
        className="p-3 rounded cursor-pointer transition-all"
        style={{
          background: "var(--bp-card)",
          border: "1px solid var(--bp-border)",
          borderLeftColor: priorityBorder[task.priority],
          borderLeftWidth: "4px",
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
    </Link>
  );
}
