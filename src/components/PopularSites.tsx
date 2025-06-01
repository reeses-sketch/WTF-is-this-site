import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function PopularSites() {
  const popularSites = useQuery(api.siteAnalyzer.getPopularSites);
  const recentAnalyses = useQuery(api.siteAnalyzer.getRecentAnalyses);

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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Popular Sites</h2>
        <p className="text-gray-600 dark:text-gray-300">Most analyzed websites and recent discoveries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Popular */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            🔥 Most Analyzed
          </h3>
          {popularSites && popularSites.length > 0 ? (
            <div className="space-y-4">
              {popularSites.map((site, index) => (
                <div key={site._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{site.domain}</h4>
                      {site.title && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{site.title}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">#{index + 1}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{site.searchCount} searches</div>
                    </div>
                  </div>
                  
                  {site.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {site.technologies.slice(0, 3).map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tech.category)}`}
                        >
                          {tech.name}
                        </span>
                      ))}
                      {site.technologies.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                          +{site.technologies.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No sites analyzed yet</p>
          )}
        </div>

        {/* Recently Analyzed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            ⏰ Recently Analyzed
          </h3>
          {recentAnalyses && recentAnalyses.length > 0 ? (
            <div className="space-y-4">
              {recentAnalyses.map((site) => (
                <div key={site._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{site.domain}</h4>
                      {site.title && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{site.title}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(site.lastAnalyzed).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {site.loadTime}ms
                      </div>
                    </div>
                  </div>
                  
                  {site.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {site.technologies.slice(0, 3).map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tech.category)}`}
                        >
                          {tech.name}
                        </span>
                      ))}
                      {site.technologies.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                          +{site.technologies.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No recent analyses</p>
          )}
        </div>
      </div>

      {/* Technology Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          📊 Technology Trends
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {popularSites?.reduce((acc, site) => 
                acc + site.technologies.filter(t => t.category === 'Framework').length, 0
              ) || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Frameworks</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {popularSites?.reduce((acc, site) => 
                acc + site.technologies.filter(t => t.category === 'Library').length, 0
              ) || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Libraries</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {popularSites?.reduce((acc, site) => 
                acc + site.technologies.filter(t => t.category === 'Web Server').length, 0
              ) || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Web Servers</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {popularSites?.reduce((acc, site) => 
                acc + site.technologies.filter(t => t.category === 'CDN').length, 0
              ) || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">CDNs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
