"use client";

interface Comment {
  _id: string;
  content: string;
  createdAt: number;
  author?: {
    name: string;
    type: "human" | "agent";
  } | null;
}

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: "var(--bp-text-dim)" }}>
        No comments yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment._id}
          className="rounded-lg p-4"
          style={{ background: "var(--bp-bg-dark)", border: "1px solid var(--bp-border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold" style={{ color: "var(--bp-text)" }}>
              {comment.author?.type === "agent" ? "🤖" : "👤"}{" "}
              {comment.author?.name || "Unknown"}
            </span>
            <span className="text-xs" style={{ color: "var(--bp-text-dim)" }}>
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--bp-text-muted)" }}>
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  );
}
