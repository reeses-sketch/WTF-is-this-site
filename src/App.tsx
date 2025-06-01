import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { SiteAnalyzer } from "./components/SiteAnalyzer";
import { ApiPlayground } from "./components/ApiPlayground";
import { PopularSites } from "./components/PopularSites";
import { SiteComparison } from "./components/SiteComparison";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { useState } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'api' | 'popular' | 'comparison'>('analyzer');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🌐 WTF is This Site?</h1>
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab('analyzer')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'analyzer'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Site Analyzer
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'comparison'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Compare Sites
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'api'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                API Playground
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'popular'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Popular Sites
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <Unauthenticated>
          <div className="max-w-md mx-auto mt-20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome!</h2>
              <p className="text-gray-600 dark:text-gray-300">Sign in to analyze websites and test APIs</p>
            </div>
            <SignInForm />
          </div>
        </Unauthenticated>

        <Authenticated>
          {activeTab === 'analyzer' && <SiteAnalyzer />}
          {activeTab === 'comparison' && <SiteComparison />}
          {activeTab === 'api' && <ApiPlayground />}
          {activeTab === 'popular' && <PopularSites />}
        </Authenticated>
      </main>

      <Toaster />
    </div>
  );
}
