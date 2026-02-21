import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a comment
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    authorId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      taskId: args.taskId,
      authorId: args.authorId,
      content: args.content,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

// List comments for a task
export const list = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    // Populate author details
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author,
        };
      })
    );

    return commentsWithAuthors;
  },
});
