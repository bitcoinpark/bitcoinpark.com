"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { CommentList } from "@/components/CommentList";
import { useState } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as Id<"tasks">;
  const task = useQuery(api.tasks.get, { taskId });
  const updateTask = useMutation(api.tasks.update);
  const addComment = useMutation(api.comments.create);

  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bp-bg)" }}>
        <div style={{ color: "var(--bp-text-muted)" }}>Loading task...</div>
      </div>
    );
  }

  const handleStatusChange = async (
    newStatus: "todo" | "in_progress" | "done"
  ) => {
    await updateTask({ taskId, status: newStatus });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !task.createdBy) return;

    setIsSubmitting(true);
    try {
      await addComment({ taskId, content: comment, authorId: task.createdBy._id });
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <main className="min-h-screen" style={{ background: "var(--bp-bg)" }}>
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm flex items-center gap-1 transition-colors"
            style={{ color: "var(--bp-green-light)" }}
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div
          className="rounded-lg p-6 mb-6"
          style={{ background: "var(--bp-card)", border: "1px solid var(--bp-border)" }}
        >
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold" style={{ color: "var(--bp-text)" }}>
              {task.title}
            </h1>
            <div className="flex gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={priorityColors[task.priority]}
              >
                {task.priority}
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={statusColors[task.status]}
              >
                {task.status.replace("_", " ")}
              </span>
            </div>
          </div>

          <p className="mb-6" style={{ color: "var(--bp-text-muted)" }}>
            {task.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-semibold" style={{ color: "var(--bp-text-dim)" }}>
                Created By
              </label>
              <p style={{ color: "var(--bp-text)" }}>
                {task.createdBy?.type === "agent" ? "🤖" : "👤"} {task.createdBy?.name}
              </p>
            </div>
            {task.assignedTo && (
              <div>
                <label className="text-sm font-semibold" style={{ color: "var(--bp-text-dim)" }}>
                  Assigned To
                </label>
                <p style={{ color: "var(--bp-text)" }}>
                  {task.assignedTo.type === "agent" ? "🤖" : "👤"} {task.assignedTo.name}
                </p>
              </div>
            )}
            {task.dueDate && (
              <div>
                <label className="text-sm font-semibold" style={{ color: "var(--bp-text-dim)" }}>
                  Due Date
                </label>
                <p style={{ color: "var(--bp-text)" }}>
                  {new Date(task.dueDate).toLocaleDateString()}
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
                  onClick={() => handleStatusChange(status)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={
                    task.status === status
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
          <CommentList comments={task.comments || []} />

          <form onSubmit={handleAddComment} className="mt-6">
            <label className="text-sm font-semibold block mb-2" style={{ color: "var(--bp-text-dim)" }}>
              Add Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg p-3 text-sm"
              style={{
                background: "var(--bp-bg-dark)",
                color: "var(--bp-text)",
                border: "1px solid var(--bp-border)",
                outline: "none",
              }}
              rows={3}
              placeholder="Write a comment..."
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="mt-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                background: !isSubmitting && comment.trim() ? "var(--bp-green)" : "var(--bp-bg-dark)",
                color: !isSubmitting && comment.trim() ? "#fff" : "var(--bp-text-dim)",
                cursor: !isSubmitting && comment.trim() ? "pointer" : "not-allowed",
              }}
            >
              {isSubmitting ? "Adding..." : "Add Comment"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
