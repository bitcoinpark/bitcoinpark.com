import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate a random API key
function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "mc_"; // prefix for Mission Control
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Simple hash function (in production, use a proper hashing library)
function hashKey(key: string): string {
  // For POC, we'll store keys in plain text
  // In production, use bcrypt or similar
  return key;
}

// Create a new API key
export const create = mutation({
  args: {
    name: v.string(),
    permissions: v.array(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated (for web UI key creation)
    const authUserId = await getAuthUserId(ctx);

    // Allow creating keys if authenticated OR if a userId is provided (for setup)
    const userId = args.userId || authUserId;

    if (!userId) {
      throw new Error("Must be authenticated or provide a userId");
    }

    const apiKey = generateApiKey();
    const hashedKey = hashKey(apiKey);

    const keyId = await ctx.db.insert("apiKeys", {
      key: hashedKey,
      name: args.name,
      userId: userId as any,
      permissions: args.permissions,
      createdAt: Date.now(),
    });

    // Return the plain key ONCE (it won't be shown again)
    return {
      keyId,
      apiKey, // Only returned on creation
      name: args.name,
    };
  },
});

// List user's API keys (without revealing the actual key)
export const list = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    const userId = args.userId || authUserId;

    if (!userId) {
      return [];
    }

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", userId as any))
      .collect();

    // Don't return the actual key
    return keys.map((key) => ({
      _id: key._id,
      name: key.name,
      permissions: key.permissions,
      lastUsed: key.lastUsed,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      // key is hidden
    }));
  },
});

// Revoke an API key
export const revoke = mutation({
  args: {
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);

    if (!authUserId) {
      throw new Error("Must be authenticated");
    }

    await ctx.db.delete(args.keyId);
    return true;
  },
});

// Validate an API key (used internally by HTTP routes)
export const validate = mutation({
  args: {
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const hashedKey = hashKey(args.apiKey);

    const keyRecord = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", hashedKey))
      .first();

    if (!keyRecord) {
      return null;
    }

    // Check if expired
    if (keyRecord.expiresAt && keyRecord.expiresAt < Date.now()) {
      return null;
    }

    // Update last used
    await ctx.db.patch(keyRecord._id, {
      lastUsed: Date.now(),
    });

    // Get user details
    const user = await ctx.db.get(keyRecord.userId);

    return {
      userId: keyRecord.userId,
      user,
      permissions: keyRecord.permissions,
    };
  },
});
