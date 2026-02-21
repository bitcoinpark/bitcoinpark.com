import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all projects
export const list = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();

    // Populate creator details
    const projectsWithUsers = await Promise.all(
      projects.map(async (project) => {
        const creator = await ctx.db.get(project.createdBy);

        // Count tasks in this project
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        return {
          ...project,
          createdBy: creator,
          taskCount: tasks.length,
        };
      })
    );

    return projectsWithUsers;
  },
});

// Get single project
export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const creator = await ctx.db.get(project.createdBy);

    return {
      ...project,
      createdBy: creator,
    };
  },
});

// Create project
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    color: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      color: args.color,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// Update project
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;

    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

// Delete project
export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Optional: Check if there are tasks in this project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Remove project reference from all tasks
    for (const task of tasks) {
      await ctx.db.patch(task._id, { projectId: undefined });
    }

    await ctx.db.delete(args.projectId);
    return true;
  },
});
