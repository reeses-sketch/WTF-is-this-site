import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function SiteComparison() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [comparisonName, setComparisonName] = useState("");
  
  const searchResults = useQuery(api.siteAnalyzer.searchSites, 
    searchQuery.length > 2 ? { query: searchQuery } : "skip"
  );
  const userComparisons = useQuery(api.siteAnalyzer.getUserComparisons);
  const createComparison = useMutation(api.siteAnalyzer.createComparison);

  const handleCreateComparison = async () => {
    if (!comparisonName.trim() || selectedSites.length < 2) {
      toast.error("Please enter a name and select at least 2 sites");
      return;
    }

    try {
      await createComparison({
        name: comparisonName,
        siteIds: selectedSites as any,
      });
      toast.success("Comparison created successfully!");
      setComparisonName("");
      setSelectedSites([]);
    } catch (error) {
      toast.error("Failed to create comparison");
    }
  };

  const toggleSiteSelection = (siteId: string) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Site Comparison</h2>
        <p className="text-gray-600 dark:text-gray-300">Compare multiple websites side by side</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Comparison</h3>
          
          <div className="space-y-4">
            <input
              type="text"
              value={comparisonName}
              onChange={(e) => setComparisonName(e.target.value)}
              placeholder="Comparison name (e.g., 'E-commerce Platforms')"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search analyzed sites..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />

            {searchResults && searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {searchResults.map((site) => (
                  <div
                    key={site._id}
                    onClick={() => toggleSiteSelection(site._id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSites.includes(site._id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{site.domain}</h4>
                        {site.title && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{site.title}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedSites.includes(site._id) && (
                          <span className="text-blue-500">✓</span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {site.technologies.length} techs
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSites.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedSites.length} sites selected for comparison
                </p>
              </div>
            )}

            <button
              onClick={handleCreateComparison}
              disabled={!comparisonName.trim() || selectedSites.length < 2}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Create Comparison
            </button>
          </div>
        </div>

        {/* Existing Comparisons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Your Comparisons</h3>
          
          {userComparisons && userComparisons.length > 0 ? (
            <div className="space-y-3">
              {userComparisons.map((comparison) => (
                <div
                  key={comparison._id}
                  className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white">{comparison.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {comparison.siteIds.length} sites • Created {new Date(comparison.createdAt).toLocaleDateString()}
                  </p>
                  <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View Comparison →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No comparisons created yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
