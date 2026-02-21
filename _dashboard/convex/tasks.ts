import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all tasks (optionally filter by project)
export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    let tasks;

    if (args.projectId) {
      // Filter by project
      tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
    } else {
      // Get all tasks
      tasks = await ctx.db.query("tasks").collect();
    }

    // Populate assignedTo user details and project
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const assignee = task.assignedTo
          ? await ctx.db.get(task.assignedTo)
          : null;
        const creator = await ctx.db.get(task.createdBy);
        const project = task.projectId
          ? await ctx.db.get(task.projectId)
          : null;

        return {
          ...task,
          assignedTo: assignee,
          createdBy: creator,
          project: project,
        };
      })
    );

    return tasksWithDetails;
  },
});

// Get single task with comments
export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const assignee = task.assignedTo ? await ctx.db.get(task.assignedTo) : null;
    const creator = await ctx.db.get(task.createdBy);
    const project = task.projectId ? await ctx.db.get(task.projectId) : null;

    // Populate comment authors
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author,
        };
      })
    );

    return {
      ...task,
      assignedTo: assignee,
      createdBy: creator,
      project: project,
      comments: commentsWithAuthors,
    };
  },
});

// Create task
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    projectId: v.optional(v.id("projects")),
    dueDate: v.optional(v.number()),
    createdBy: v.id("users"),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "todo",
      priority: args.priority,
      projectId: args.projectId,
      dueDate: args.dueDate,
      createdBy: args.createdBy,
      assignedTo: args.assignedTo,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return taskId;
  },
});

// Update task
export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"))
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    projectId: v.optional(v.id("projects")),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;

    await ctx.db.patch(taskId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return taskId;
  },
});
