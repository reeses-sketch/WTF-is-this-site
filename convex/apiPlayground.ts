import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const makeApiRequest = action({
  args: {
    method: v.string(),
    url: v.string(),
    headers: v.optional(v.record(v.string(), v.string())),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const startTime = Date.now();

    try {
      const requestOptions: RequestInit = {
        method: args.method,
        headers: {
          'User-Agent': 'API-Playground/1.0',
          ...args.headers,
        },
      };

      if (args.body && ['POST', 'PUT', 'PATCH'].includes(args.method)) {
        requestOptions.body = args.body;
      }

      const response = await fetch(args.url, requestOptions);
      const responseText = await response.text();
      const responseTime = Date.now() - startTime;

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const result = {
        status: response.status,
        headers: responseHeaders,
        body: responseText,
        time: responseTime,
      };

      // Save request to database
      await ctx.runMutation(api.apiPlayground.saveRequest, {
        userId: userId || undefined,
        method: args.method,
        url: args.url,
        headers: args.headers,
        body: args.body,
        response: result,
      });

      return result;
    } catch (error) {
      const errorResult = {
        status: 0,
        headers: {},
        body: `Error: ${error instanceof Error ? error.message : String(error)}`,
        time: Date.now() - startTime,
      };

      // Save failed request
      await ctx.runMutation(api.apiPlayground.saveRequest, {
        userId: userId || undefined,
        method: args.method,
        url: args.url,
        headers: args.headers,
        body: args.body,
        response: errorResult,
      });

      return errorResult;
    }
  },
});

export const saveRequest = mutation({
  args: {
    userId: v.optional(v.id("users")),
    method: v.string(),
    url: v.string(),
    headers: v.optional(v.record(v.string(), v.string())),
    body: v.optional(v.string()),
    response: v.object({
      status: v.number(),
      headers: v.record(v.string(), v.string()),
      body: v.string(),
      time: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("apiRequests", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getUserRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("apiRequests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const getRecentRequests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("apiRequests")
      .withIndex("by_timestamp")
      .order("desc")
      .take(10);
  },
});
