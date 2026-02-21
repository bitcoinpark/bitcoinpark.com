import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
// users and apiKeys are accessed via api.users / api.apiKeys

const http = httpRouter();

// Authentication helper
async function authenticateRequest(ctx: any, request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return { authenticated: false, error: "Missing Authorization header" };
  }

  // Support both "Bearer token" and "token" formats
  const apiKey = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  const auth = await ctx.runQuery(api.apiKeys.validate, { apiKey });

  if (!auth) {
    return { authenticated: false, error: "Invalid API key" };
  }

  return { authenticated: true, userId: auth.userId, permissions: auth.permissions };
}

// ============ PROJECTS ============

// List all projects
http.route({
  path: "/api/projects",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const projects = await ctx.runQuery(api.projects.list);
    return new Response(JSON.stringify(projects), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// Create project
http.route({
  path: "/api/projects",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const projectId = await ctx.runMutation(api.projects.create, body);
    return new Response(JSON.stringify({ projectId }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// Get single project
http.route({
  path: "/api/projects/{id}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const projectId = url.pathname.split("/").pop() as Id<"projects">;

    const project = await ctx.runQuery(api.projects.get, { projectId });

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    return new Response(JSON.stringify(project), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// Update project
http.route({
  path: "/api/projects/{id}",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const projectId = url.pathname.split("/").pop() as Id<"projects">;
    const body = await request.json();

    await ctx.runMutation(api.projects.update, {
      projectId,
      ...body,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// Delete project
http.route({
  path: "/api/projects/{id}",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const projectId = url.pathname.split("/").pop() as Id<"projects">;

    await ctx.runMutation(api.projects.remove, { projectId });

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// ============ TASKS ============

// List all tasks (optionally filter by project)
http.route({
  path: "/api/tasks",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Authenticate request
    const auth = await authenticateRequest(ctx, request);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    const tasks = await ctx.runQuery(api.tasks.list, {
      projectId: projectId as Id<"projects"> | undefined,
    });

    return new Response(JSON.stringify(tasks), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// Create task
http.route({
  path: "/api/tasks",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const taskId = await ctx.runMutation(api.tasks.create, body);
    return new Response(JSON.stringify({ taskId }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// Get single task
http.route({
  path: "/api/tasks/{id}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const taskId = url.pathname.split("/").pop() as Id<"tasks">;

    const task = await ctx.runQuery(api.tasks.get, { taskId });

    if (!task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
      });
    }

    return new Response(JSON.stringify(task), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// Update task
http.route({
  path: "/api/tasks/{id}",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const taskId = url.pathname.split("/").pop() as Id<"tasks">;
    const body = await request.json();

    await ctx.runMutation(api.tasks.update, {
      taskId,
      ...body,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// Add comment
http.route({
  path: "/api/tasks/{id}/comments",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const taskId = pathParts[pathParts.length - 2] as Id<"tasks">;
    const body = await request.json();

    const commentId = await ctx.runMutation(api.comments.create, {
      taskId,
      content: body.content,
      authorId: body.authorId,
    });

    return new Response(JSON.stringify({ commentId }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }),
});

// ============ ONBOARDING ============

// Create a user + API key in one shot — returns ready-to-use credentials
http.route({
  path: "/api/onboard",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { name, type = "agent", keyName } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Create user
    const userId = await ctx.runMutation(api.users.create, {
      name,
      type: type === "human" ? "human" : "agent",
    });

    // Create API key
    const keyResult = await ctx.runMutation(api.apiKeys.create, {
      name: keyName || `${name} key`,
      permissions: ["read", "write"],
      userId,
    });

    const convexUrl = process.env.CONVEX_SITE_URL || process.env.CONVEX_URL || "";

    return new Response(
      JSON.stringify({
        userId,
        keyId: keyResult.keyId,
        apiKey: keyResult.apiKey,
        convexUrl,
        env: `CONVEX_URL=${convexUrl}\nAPI_KEY=${keyResult.apiKey}\nUSER_ID=${userId}`,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }),
});

http.route({
  path: "/api/onboard",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

// CORS preflight
http.route({
  path: "/api/tasks",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
