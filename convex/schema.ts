import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  siteAnalyses: defineTable({
    url: v.string(),
    domain: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    technologies: v.array(v.object({
      name: v.string(),
      category: v.string(),
      confidence: v.number(),
      version: v.optional(v.string()),
    })),
    headers: v.record(v.string(), v.string()),
    statusCode: v.number(),
    loadTime: v.number(),
    searchCount: v.number(),
    lastAnalyzed: v.number(),
    // New fields for enhanced analysis
    performanceMetrics: v.optional(v.object({
      ttfb: v.number(), // Time to first byte
      domContentLoaded: v.number(),
      pageSize: v.number(),
      resourceCount: v.number(),
    })),
    securityScore: v.optional(v.object({
      score: v.number(),
      issues: v.array(v.string()),
      recommendations: v.array(v.string()),
    })),
    seoScore: v.optional(v.object({
      score: v.number(),
      issues: v.array(v.string()),
      recommendations: v.array(v.string()),
    })),
    screenshot: v.optional(v.id("_storage")),
  }).index("by_domain", ["domain"])
    .index("by_search_count", ["searchCount"])
    .index("by_last_analyzed", ["lastAnalyzed"]),

  apiRequests: defineTable({
    userId: v.optional(v.id("users")),
    method: v.string(),
    url: v.string(),
    headers: v.optional(v.record(v.string(), v.string())),
    body: v.optional(v.string()),
    response: v.optional(v.object({
      status: v.number(),
      headers: v.record(v.string(), v.string()),
      body: v.string(),
      time: v.number(),
    })),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // New table for bulk analysis jobs
  bulkAnalysisJobs: defineTable({
    userId: v.id("users"),
    urls: v.array(v.string()),
    status: v.string(), // "pending", "running", "completed", "failed"
    results: v.optional(v.array(v.object({
      url: v.string(),
      success: v.boolean(),
      analysisId: v.optional(v.id("siteAnalyses")),
      error: v.optional(v.string()),
    }))),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // New table for site comparisons
  siteComparisons: defineTable({
    userId: v.id("users"),
    name: v.string(),
    siteIds: v.array(v.id("siteAnalyses")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
