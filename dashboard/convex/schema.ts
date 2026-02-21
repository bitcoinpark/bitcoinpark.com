import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Users - now with authentication
  users: defineTable({
    name: v.string(),
    type: v.union(v.literal("human"), v.literal("agent")),
    email: v.optional(v.string()), // For human users
    authId: v.optional(v.string()), // Link to Convex Auth
    createdAt: v.number(),
  }).index("by_auth_id", ["authId"])
    .index("by_email", ["email"]),

  // API Keys for agent authentication
  apiKeys: defineTable({
    key: v.string(), // The actual API key (hashed)
    name: v.string(), // Friendly name for the key
    userId: v.id("users"), // Which agent/user owns this key
    permissions: v.array(v.string()), // ["read", "write", "admin"]
    lastUsed: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_key", ["key"])
    .index("by_user", ["userId"]),

  // Projects - organize tasks
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    color: v.string(), // hex color for visual organization
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Tasks - core entity
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("done")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    projectId: v.optional(v.id("projects")),
    dueDate: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_assignee", ["assignedTo"])
    .index("by_project", ["projectId"]),

  // Comments
  comments: defineTable({
    taskId: v.id("tasks"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"]),
});
