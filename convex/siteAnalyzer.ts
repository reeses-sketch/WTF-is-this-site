import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const analyzeSite = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    try {
      const startTime = Date.now();
      
      // Normalize URL
      let normalizedUrl = args.url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname;

      // Fetch the site
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SiteAnalyzer/1.0)',
        },
      });

      const html = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const loadTime = Date.now() - startTime;

      // Extract basic info
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : undefined;

      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const description = descMatch ? descMatch[1].trim() : undefined;

      // Detect technologies
      const technologies = detectTechnologies(html, headers);

      // Analyze performance metrics
      const performanceMetrics = analyzePerformance(html, headers, loadTime);

      // Analyze security
      const securityScore = analyzeSecurityHeaders(headers);

      // Analyze SEO
      const seoScore = analyzeSEO(html);

      // Save or update analysis
      const existingAnalysis = await ctx.runQuery(api.siteAnalyzer.getByDomain, { domain });
      
      if (existingAnalysis) {
        await ctx.runMutation(api.siteAnalyzer.updateAnalysis, {
          id: existingAnalysis._id,
          url: normalizedUrl,
          title,
          description,
          technologies,
          headers,
          statusCode: response.status,
          loadTime,
          performanceMetrics,
          securityScore,
          seoScore,
        });
      } else {
        await ctx.runMutation(api.siteAnalyzer.createAnalysis, {
          url: normalizedUrl,
          domain,
          title,
          description,
          technologies,
          headers,
          statusCode: response.status,
          loadTime,
          performanceMetrics,
          securityScore,
          seoScore,
        });
      }

      return {
        url: normalizedUrl,
        domain,
        title,
        description,
        technologies,
        headers,
        statusCode: response.status,
        loadTime,
        performanceMetrics,
        securityScore,
        seoScore,
      };
    } catch (error) {
      throw new Error(`Failed to analyze site: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});

export const bulkAnalyzeSites = action({
  args: { urls: v.array(v.string()) },
  handler: async (ctx, args): Promise<{ jobId: any; results: any[] }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Create bulk analysis job
    const jobId: any = await ctx.runMutation(api.siteAnalyzer.createBulkJob, {
      userId,
      urls: args.urls,
    });

    // Process each URL
    const results: any[] = [];
    for (const url of args.urls) {
      try {
        const analysis: any = await ctx.runAction(api.siteAnalyzer.analyzeSite, { url });
        const analysisRecord: any = await ctx.runQuery(api.siteAnalyzer.getByDomain, { domain: analysis.domain });
        results.push({
          url,
          success: true,
          analysisId: analysisRecord?._id,
        });
      } catch (error) {
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Update job with results
    await ctx.runMutation(api.siteAnalyzer.updateBulkJob, {
      jobId,
      results,
    });

    return { jobId, results };
  },
});

export const createBulkJob = mutation({
  args: {
    userId: v.id("users"),
    urls: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bulkAnalysisJobs", {
      userId: args.userId,
      urls: args.urls,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateBulkJob = mutation({
  args: {
    jobId: v.id("bulkAnalysisJobs"),
    results: v.array(v.object({
      url: v.string(),
      success: v.boolean(),
      analysisId: v.optional(v.id("siteAnalyses")),
      error: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.jobId, {
      status: "completed",
      results: args.results,
      completedAt: Date.now(),
    });
  },
});

export const getUserBulkJobs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("bulkAnalysisJobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});

export const createComparison = mutation({
  args: {
    name: v.string(),
    siteIds: v.array(v.id("siteAnalyses")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    return await ctx.db.insert("siteComparisons", {
      userId,
      name: args.name,
      siteIds: args.siteIds,
      createdAt: Date.now(),
    });
  },
});

export const getUserComparisons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("siteComparisons")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});

export const getComparison = query({
  args: { comparisonId: v.id("siteComparisons") },
  handler: async (ctx, args) => {
    const comparison = await ctx.db.get(args.comparisonId);
    if (!comparison) return null;

    const sites = await Promise.all(
      comparison.siteIds.map(id => ctx.db.get(id))
    );

    return {
      ...comparison,
      sites: sites.filter(Boolean),
    };
  },
});

export const getByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("siteAnalyses")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .first();
  },
});

export const createAnalysis = mutation({
  args: {
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
    performanceMetrics: v.optional(v.object({
      ttfb: v.number(),
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("siteAnalyses", {
      ...args,
      searchCount: 1,
      lastAnalyzed: Date.now(),
    });
  },
});

export const updateAnalysis = mutation({
  args: {
    id: v.id("siteAnalyses"),
    url: v.string(),
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
    performanceMetrics: v.optional(v.object({
      ttfb: v.number(),
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
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Analysis not found");
    
    return await ctx.db.patch(id, {
      ...updates,
      searchCount: existing.searchCount + 1,
      lastAnalyzed: Date.now(),
    });
  },
});

export const getPopularSites = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("siteAnalyses")
      .withIndex("by_search_count")
      .order("desc")
      .take(10);
  },
});

export const getRecentAnalyses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("siteAnalyses")
      .withIndex("by_last_analyzed")
      .order("desc")
      .take(10);
  },
});

export const searchSites = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const sites = await ctx.db.query("siteAnalyses").collect();
    return sites.filter(site => 
      site.domain.toLowerCase().includes(args.query.toLowerCase()) ||
      site.title?.toLowerCase().includes(args.query.toLowerCase()) ||
      site.technologies.some(tech => 
        tech.name.toLowerCase().includes(args.query.toLowerCase())
      )
    ).slice(0, 20);
  },
});

function detectTechnologies(html: string, headers: Record<string, string>) {
  const technologies = [];

  // Server detection
  if (headers.server) {
    if (headers.server.includes('nginx')) {
      technologies.push({ name: 'Nginx', category: 'Web Server', confidence: 100 });
    }
    if (headers.server.includes('Apache')) {
      technologies.push({ name: 'Apache', category: 'Web Server', confidence: 100 });
    }
    if (headers.server.includes('cloudflare')) {
      technologies.push({ name: 'Cloudflare', category: 'CDN', confidence: 100 });
    }
  }

  // Framework detection
  if (html.includes('_next/static') || html.includes('__NEXT_DATA__')) {
    technologies.push({ name: 'Next.js', category: 'Framework', confidence: 95 });
  }
  if (html.includes('react') || html.includes('React')) {
    technologies.push({ name: 'React', category: 'Library', confidence: 80 });
  }
  if (html.includes('vue') || html.includes('Vue')) {
    technologies.push({ name: 'Vue.js', category: 'Framework', confidence: 80 });
  }
  if (html.includes('angular') || html.includes('ng-')) {
    technologies.push({ name: 'Angular', category: 'Framework', confidence: 80 });
  }

  // CSS Frameworks
  if (html.includes('bootstrap') || html.includes('Bootstrap')) {
    technologies.push({ name: 'Bootstrap', category: 'CSS Framework', confidence: 90 });
  }
  if (html.includes('tailwind') || html.includes('Tailwind')) {
    technologies.push({ name: 'Tailwind CSS', category: 'CSS Framework', confidence: 90 });
  }

  // Analytics
  if (html.includes('google-analytics') || html.includes('gtag')) {
    technologies.push({ name: 'Google Analytics', category: 'Analytics', confidence: 95 });
  }
  if (html.includes('googletagmanager')) {
    technologies.push({ name: 'Google Tag Manager', category: 'Analytics', confidence: 95 });
  }

  // CMS
  if (html.includes('wp-content') || html.includes('wordpress')) {
    technologies.push({ name: 'WordPress', category: 'CMS', confidence: 95 });
  }
  if (html.includes('shopify')) {
    technologies.push({ name: 'Shopify', category: 'E-commerce', confidence: 95 });
  }

  return technologies;
}

function analyzePerformance(html: string, headers: Record<string, string>, loadTime: number) {
  const pageSize = new Blob([html]).size;
  const resourceCount = (html.match(/<(script|link|img)/g) || []).length;
  
  return {
    ttfb: Math.floor(loadTime * 0.3), // Estimated TTFB
    domContentLoaded: Math.floor(loadTime * 0.8), // Estimated DOM ready time
    pageSize,
    resourceCount,
  };
}

function analyzeSecurityHeaders(headers: Record<string, string>) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  const securityHeaders = [
    'strict-transport-security',
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy'
  ];

  securityHeaders.forEach(header => {
    if (!headers[header]) {
      score -= 15;
      issues.push(`Missing ${header} header`);
      recommendations.push(`Add ${header} header for better security`);
    }
  });

  if (headers['x-powered-by']) {
    score -= 10;
    issues.push('X-Powered-By header exposes server information');
    recommendations.push('Remove X-Powered-By header to hide server details');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}

function analyzeSEO(html: string) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  // Check for title
  if (!html.match(/<title[^>]*>([^<]+)<\/title>/i)) {
    score -= 20;
    issues.push('Missing page title');
    recommendations.push('Add a descriptive page title');
  }

  // Check for meta description
  if (!html.match(/<meta[^>]*name=["']description["']/i)) {
    score -= 15;
    issues.push('Missing meta description');
    recommendations.push('Add a meta description for better search results');
  }

  // Check for h1 tag
  if (!html.match(/<h1[^>]*>/i)) {
    score -= 10;
    issues.push('Missing H1 tag');
    recommendations.push('Add an H1 tag for better content structure');
  }

  // Check for meta viewport
  if (!html.match(/<meta[^>]*name=["']viewport["']/i)) {
    score -= 15;
    issues.push('Missing viewport meta tag');
    recommendations.push('Add viewport meta tag for mobile responsiveness');
  }

  // Check for alt attributes on images
  const images = html.match(/<img[^>]*>/g) || [];
  const imagesWithoutAlt = images.filter(img => !img.includes('alt='));
  if (imagesWithoutAlt.length > 0) {
    score -= Math.min(20, imagesWithoutAlt.length * 2);
    issues.push(`${imagesWithoutAlt.length} images missing alt attributes`);
    recommendations.push('Add alt attributes to all images for accessibility');
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}
