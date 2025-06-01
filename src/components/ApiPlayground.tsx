import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ApiResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  time: number;
}

export function ApiPlayground() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState("{}");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const makeRequest = useAction(api.apiPlayground.makeApiRequest);
  const userRequests = useQuery(api.apiPlayground.getUserRequests);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      let parsedHeaders = {};
      if (headers.trim()) {
        try {
          parsedHeaders = JSON.parse(headers);
        } catch {
          toast.error("Invalid JSON in headers");
          setIsLoading(false);
          return;
        }
      }

      const result = await makeRequest({
        method,
        url: url.trim(),
        headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
        body: body.trim() || undefined,
      });

      setResponse(result);
      toast.success("Request completed");
    } catch (error) {
      toast.error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (request: any) => {
    setMethod(request.method);
    setUrl(request.url);
    setHeaders(JSON.stringify(request.headers || {}, null, 2));
    setBody(request.body || "");
  };

  const formatJson = (str: string) => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600 dark:text-green-400";
    if (status >= 300 && status < 400) return "text-yellow-600 dark:text-yellow-400";
    if (status >= 400) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Request Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">API Playground</h2>
          <p className="text-gray-600 dark:text-gray-300">Test API endpoints in real-time</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          {/* Method and URL */}
          <div className="flex gap-3">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter API endpoint URL"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Headers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Headers (JSON)
            </label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              placeholder='{"Content-Type": "application/json"}'
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
            />
          </div>

          {/* Body */}
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Request Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Request body content"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                rows={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isLoading ? "Sending..." : "Send Request"}
          </button>
        </form>

        {/* Response */}
        {response && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Response</h3>
            
            {/* Status and Time */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Status: </span>
                <span className={`font-medium ${getStatusColor(response.status)}`}>
                  {response.status}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Time: </span>
                <span className="font-medium text-gray-900 dark:text-white">{response.time}ms</span>
              </div>
            </div>

            {/* Response Headers */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Headers</h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-700 dark:text-gray-300">
                  {Object.entries(response.headers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')}
                </pre>
              </div>
            </div>

            {/* Response Body */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Body</h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {formatJson(response.body)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request History */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Request History</h3>
          {userRequests && userRequests.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userRequests.map((request) => (
                <div
                  key={request._id}
                  onClick={() => loadFromHistory(request)}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">{request.method}</span>
                    {request.response && (
                      <span className={`text-xs ${getStatusColor(request.response.status)}`}>
                        {request.response.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{request.url}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(request.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No requests yet</p>
          )}
        </div>

        {/* Quick Examples */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Examples</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setMethod("GET");
                setUrl("https://jsonplaceholder.typicode.com/posts/1");
                setHeaders("{}");
                setBody("");
              }}
              className="w-full text-left p-2 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              GET JSON Post
            </button>
            <button
              onClick={() => {
                setMethod("POST");
                setUrl("https://jsonplaceholder.typicode.com/posts");
                setHeaders('{"Content-Type": "application/json"}');
                setBody('{\n  "title": "Test Post",\n  "body": "This is a test",\n  "userId": 1\n}');
              }}
              className="w-full text-left p-2 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              POST JSON Data
            </button>
            <button
              onClick={() => {
                setMethod("GET");
                setUrl("https://api.github.com/users/octocat");
                setHeaders("{}");
                setBody("");
              }}
              className="w-full text-left p-2 text-sm border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              GitHub User API
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
