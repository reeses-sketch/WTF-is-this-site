import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface Technology {
  name: string;
  category: string;
  confidence: number;
  version?: string;
}

interface PerformanceMetrics {
  ttfb: number;
  domContentLoaded: number;
  pageSize: number;
  resourceCount: number;
}

interface SecurityScore {
  score: number;
  issues: string[];
  recommendations: string[];
}

interface SEOScore {
  score: number;
  issues: string[];
  recommendations: string[];
}

interface AnalysisResult {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  technologies: Technology[];
  headers: Record<string, string>;
  statusCode: number;
  loadTime: number;
  performanceMetrics?: PerformanceMetrics;
  securityScore?: SecurityScore;
  seoScore?: SEOScore;
}

export function SiteAnalyzer() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'security' | 'seo' | 'export'>('overview');
  const [bulkUrls, setBulkUrls] = useState("");
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  
  const analyzeSite = useAction(api.siteAnalyzer.analyzeSite);
  const bulkAnalyzeSites = useAction(api.siteAnalyzer.bulkAnalyzeSites);
  const bulkJobs = useQuery(api.siteAnalyzer.getUserBulkJobs);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const analysis = await analyzeSite({ url: url.trim() });
      setResult(analysis);
      toast.success("Site analyzed successfully!");
    } catch (error) {
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBulkAnalyze = async () => {
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) return;

    setIsBulkAnalyzing(true);
    try {
      await bulkAnalyzeSites({ urls });
      toast.success(`Started bulk analysis of ${urls.length} sites`);
      setBulkUrls("");
    } catch (error) {
      toast.error(`Bulk analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsBulkAnalyzing(false);
    }
  };

  const exportToJSON = () => {
    if (!result) return;
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.domain}-analysis.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!result) return;
    const csvData = [
      ['Field', 'Value'],
      ['URL', result.url],
      ['Domain', result.domain],
      ['Title', result.title || ''],
      ['Status Code', result.statusCode.toString()],
      ['Load Time (ms)', result.loadTime.toString()],
      ['Technologies', result.technologies.map(t => t.name).join(', ')],
      ['Security Score', result.securityScore?.score.toString() || ''],
      ['SEO Score', result.seoScore?.score.toString() || ''],
    ];
    
    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.domain}-analysis.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Framework': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      'Library': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      'Web Server': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      'CDN': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      'CSS Framework': 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      'Analytics': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'CMS': 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
      'E-commerce': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };
    return colors[category] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Enhanced Site Analyzer</h2>
        <p className="text-gray-600 dark:text-gray-300">Comprehensive website analysis with performance, security, and SEO insights</p>
      </div>

      {/* Analysis Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Site Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Single Site Analysis</h3>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., github.com)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              disabled={isAnalyzing || !url.trim()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Site"}
            </button>
          </form>
        </div>

        {/* Bulk Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Bulk Analysis</h3>
          <div className="space-y-4">
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder="Enter multiple URLs (one per line)&#10;github.com&#10;google.com&#10;stackoverflow.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={4}
              disabled={isBulkAnalyzing}
            />
            <button
              onClick={handleBulkAnalyze}
              disabled={isBulkAnalyzing || !bulkUrls.trim()}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isBulkAnalyzing ? "Starting Analysis..." : "Analyze Multiple Sites"}
            </button>
          </div>

          {/* Bulk Jobs Status */}
          {bulkJobs && bulkJobs.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Bulk Jobs</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {bulkJobs.slice(0, 3).map((job) => (
                  <div key={job._id} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex justify-between">
                      <span>{job.urls.length} URLs</span>
                      <span className={`font-medium ${
                        job.status === 'completed' ? 'text-green-600' : 
                        job.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    {job.results && (
                      <div className="text-gray-500 dark:text-gray-400">
                        {job.results.filter(r => r.success).length} successful
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
            <nav className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'performance', label: 'Performance', icon: '⚡' },
                { id: 'security', label: 'Security', icon: '🔒' },
                { id: 'seo', label: 'SEO', icon: '🔍' },
                { id: 'export', label: 'Export', icon: '📤' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Site Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">URL</label>
                    <p className="text-gray-900 dark:text-white break-all">{result.url}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Domain</label>
                    <p className="text-gray-900 dark:text-white">{result.domain}</p>
                  </div>
                  {result.title && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</label>
                      <p className="text-gray-900 dark:text-white">{result.title}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Code</label>
                    <p className={`font-medium ${result.statusCode === 200 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {result.statusCode}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Load Time</label>
                    <p className="text-gray-900 dark:text-white">{result.loadTime}ms</p>
                  </div>
                </div>
                {result.description && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                    <p className="text-gray-900 dark:text-white">{result.description}</p>
                  </div>
                )}
              </div>

              {/* Technologies */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Technologies Detected</h3>
                {result.technologies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.technologies.map((tech, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{tech.name}</h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{tech.confidence}%</span>
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tech.category)}`}>
                          {tech.category}
                        </span>
                        {tech.version && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">v{tech.version}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No technologies detected</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'performance' && result.performanceMetrics && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.performanceMetrics.ttfb}ms
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Time to First Byte</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.performanceMetrics.domContentLoaded}ms
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">DOM Content Loaded</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatBytes(result.performanceMetrics.pageSize)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Page Size</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {result.performanceMetrics.resourceCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Resources</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && result.securityScore && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Security Analysis</h3>
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.securityScore.score)}`}>
                      {result.securityScore.score}/100
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Security Score</div>
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        result.securityScore.score >= 80 ? 'bg-green-500' :
                        result.securityScore.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.securityScore.score}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {result.securityScore.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Security Issues</h4>
                  <ul className="space-y-1">
                    {result.securityScore.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-red-500">⚠️</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.securityScore.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {result.securityScore.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-blue-500">💡</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seo' && result.seoScore && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">SEO Analysis</h3>
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.seoScore.score)}`}>
                      {result.seoScore.score}/100
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">SEO Score</div>
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        result.seoScore.score >= 80 ? 'bg-green-500' :
                        result.seoScore.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.seoScore.score}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {result.seoScore.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">SEO Issues</h4>
                  <ul className="space-y-1">
                    {result.seoScore.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-red-500">⚠️</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.seoScore.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {result.seoScore.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <span className="text-blue-500">💡</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Export Analysis</h3>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Export your analysis results in different formats for further processing or reporting.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={exportToJSON}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    📄 Export as JSON
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    📊 Export as CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Headers (always visible) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Response Headers</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 dark:text-gray-300">
                {Object.entries(result.headers)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join('\n')}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
