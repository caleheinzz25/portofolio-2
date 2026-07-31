import { createSignal, Show, For } from "solid-js";

interface Preset {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST";
  description: string;
  defaultBody?: string;
}

const PRESETS: Preset[] = [
  {
    id: "jp-posts",
    name: "JSONPlaceholder - Posts",
    url: "https://jsonplaceholder.typicode.com/posts/1",
    method: "GET",
    description: "Fetch a sample blog post object",
    defaultBody: JSON.stringify(
      { title: "foo", body: "bar", userId: 1 },
      null,
      2
    ),
  },
  {
    id: "jp-users",
    name: "JSONPlaceholder - Users",
    url: "https://jsonplaceholder.typicode.com/users/1",
    method: "GET",
    description: "Fetch sample user profile details",
    defaultBody: JSON.stringify(
      { name: "Jane Doe", username: "janedoe", email: "jane@example.com" },
      null,
      2
    ),
  },
  {
    id: "dj-quotes",
    name: "DummyJSON - Quotes",
    url: "https://dummyjson.com/quotes/random",
    method: "GET",
    description: "Fetch a random inspirational quote",
    defaultBody: JSON.stringify(
      { quote: "Stay hungry, stay foolish.", author: "Steve Jobs" },
      null,
      2
    ),
  },
  {
    id: "dj-products",
    name: "DummyJSON - Products",
    url: "https://dummyjson.com/products/1",
    method: "GET",
    description: "Fetch product item catalog data",
    defaultBody: JSON.stringify(
      { title: "Sample Product", price: 99.99 },
      null,
      2
    ),
  },
  {
    id: "open-meteo",
    name: "Open-Meteo - Weather",
    url: "https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current_weather=true",
    method: "GET",
    description: "Fetch live current weather forecast for Jakarta",
    defaultBody: "{}",
  },
  {
    id: "custom",
    name: "Custom URL",
    url: "",
    method: "GET",
    description: "Enter any CORS-enabled public REST endpoint",
    defaultBody: "{\n  \"key\": \"value\"\n}",
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return statusTexts[status] || "";
}

function highlightJsonHTML(jsonStr: string): string {
  if (!jsonStr) return "";
  const escaped = jsonStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "text-amber-300"; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "text-mint font-semibold"; // key
        } else {
          cls = "text-emerald-300"; // string value
        }
      } else if (/true|false/.test(match)) {
        cls = "text-purple-400 font-semibold"; // boolean
      } else if (/null/.test(match)) {
        cls = "text-rose-400 font-semibold"; // null
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export default function ApiPlayground() {
  const [selectedPresetId, setSelectedPresetId] = createSignal<string>(PRESETS[0].id);
  const [url, setUrl] = createSignal<string>(PRESETS[0].url);
  const [method, setMethod] = createSignal<"GET" | "POST">(PRESETS[0].method);
  const [requestBody, setRequestBody] = createSignal<string>(PRESETS[0].defaultBody || "{}");
  
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [responseData, setResponseData] = createSignal<string | null>(null);
  const [statusCode, setStatusCode] = createSignal<number | null>(null);
  const [statusText, setStatusText] = createSignal<string | null>(null);
  const [latency, setLatency] = createSignal<number | null>(null);
  const [payloadSize, setPayloadSize] = createSignal<number | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const [copied, setCopied] = createSignal<boolean>(false);
  const [isExpanded, setIsExpanded] = createSignal<boolean>(false);

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      if (preset.id !== "custom") {
        setUrl(preset.url);
        setMethod(preset.method);
        if (preset.defaultBody) setRequestBody(preset.defaultBody);
      }
    }
  };

  const handleUrlInput = (newUrl: string) => {
    setUrl(newUrl);
    const currentPreset = PRESETS.find((p) => p.id === selectedPresetId());
    if (currentPreset && currentPreset.id !== "custom" && currentPreset.url !== newUrl) {
      setSelectedPresetId("custom");
    }
  };

  const handleSendRequest = async (e?: Event) => {
    if (e) e.preventDefault();
    const targetUrl = url().trim();
    if (!targetUrl) {
      setError("Please enter a valid request URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponseData(null);
    setStatusCode(null);
    setStatusText(null);
    setLatency(null);
    setPayloadSize(null);

    const startTime = performance.now();
    try {
      const options: RequestInit = {
        method: method(),
        headers: {
          "Accept": "application/json",
        },
      };

      if (method() === "POST") {
        options.headers = {
          ...options.headers,
          "Content-Type": "application/json",
        };
        options.body = requestBody();
      }

      const res = await fetch(targetUrl, options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      setLatency(duration);
      setStatusCode(res.status);
      setStatusText(res.statusText || getStatusText(res.status) || (res.ok ? "OK" : "Response Received"));

      const text = await res.text();
      const bytes = new Blob([text]).size;
      setPayloadSize(bytes);

      try {
        const json = JSON.parse(text);
        setResponseData(JSON.stringify(json, null, 2));
      } catch {
        setResponseData(text);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setStatusCode(0);
      setStatusText("Network Error");
      setError(err?.message || "Failed to execute request. Verify URL or CORS support.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultPreset = PRESETS[0];
    setSelectedPresetId(defaultPreset.id);
    setUrl(defaultPreset.url);
    setMethod(defaultPreset.method);
    setRequestBody(defaultPreset.defaultBody || "{}");
    setIsLoading(false);
    setResponseData(null);
    setStatusCode(null);
    setStatusText(null);
    setLatency(null);
    setPayloadSize(null);
    setError(null);
    setCopied(false);
    setIsExpanded(false);
  };

  const handleCopyJson = () => {
    const data = responseData();
    if (!data) return;
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="card bg-light-navy/40 border border-slate/20 rounded-xl p-6 shadow-2xl backdrop-blur-md">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Pane: Request Config */}
        <div class="lg:col-span-5 flex flex-col gap-5 bg-navy/80 p-5 rounded-lg border border-slate/15">
          <div class="flex items-center justify-between border-b border-slate/15 pb-3">
            <h3 class="text-base font-serif font-semibold text-light-slate flex items-center gap-2">
              <span class="text-mint">⚡</span> Request Configuration
            </h3>
            <button
              type="button"
              onClick={handleReset}
              class="text-xs font-mono text-slate hover:text-mint transition-colors duration-200 flex items-center gap-1 cursor-pointer"
              title="Reset to defaults"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>

          {/* Preset Selector */}
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-mono text-slate flex justify-between items-center">
              <span>Preset API Endpoints</span>
              <span class="text-[10px] text-slate/70">5 Pre-configured</span>
            </label>
            <select
              value={selectedPresetId()}
              onChange={(e) => handlePresetChange(e.currentTarget.value)}
              class="w-full bg-navy border border-slate/30 text-light-slate text-xs font-mono rounded-md px-3 py-2 focus:border-mint focus:outline-none transition-colors cursor-pointer"
            >
              <For each={PRESETS}>
                {(preset) => (
                  <option value={preset.id} class="bg-navy text-light-slate">
                    {preset.name} ({preset.method})
                  </option>
                )}
              </For>
            </select>
            <Show when={PRESETS.find((p) => p.id === selectedPresetId())?.description}>
              <p class="text-[11px] text-slate/80 italic mt-0.5">
                {PRESETS.find((p) => p.id === selectedPresetId())?.description}
              </p>
            </Show>
          </div>

          {/* HTTP Method & URL */}
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-mono text-slate">HTTP Method & URL</label>
            <div class="flex gap-2">
              <select
                value={method()}
                onChange={(e) => setMethod(e.currentTarget.value as "GET" | "POST")}
                class={`font-mono text-xs font-bold rounded-md px-3 py-2 border transition-colors cursor-pointer focus:outline-none ${
                  method() === "GET"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-sky-500/20 text-sky-400 border-sky-500/40"
                }`}
              >
                <option value="GET" class="bg-navy text-emerald-400">GET</option>
                <option value="POST" class="bg-navy text-sky-400">POST</option>
              </select>
              
              <input
                type="url"
                value={url()}
                onInput={(e) => handleUrlInput(e.currentTarget.value)}
                placeholder="https://api.example.com/data"
                class="flex-1 bg-navy border border-slate/30 text-light-slate font-mono text-xs rounded-md px-3 py-2 focus:border-mint focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Request Body (If POST) */}
          <Show when={method() === "POST"}>
            <div class="flex flex-col gap-1.5 animate-fade-in">
              <label class="text-xs font-mono text-slate flex justify-between items-center">
                <span>Request Body (JSON)</span>
                <span class="text-[10px] text-sky-400">application/json</span>
              </label>
              <textarea
                value={requestBody()}
                onInput={(e) => setRequestBody(e.currentTarget.value)}
                rows={5}
                class="w-full bg-navy border border-slate/30 text-light-slate font-mono text-xs rounded-md p-3 focus:border-mint focus:outline-none transition-colors resize-y"
                placeholder='{\n  "key": "value"\n}'
              />
            </div>
          </Show>

          {/* Send Request Button */}
          <div class="pt-2">
            <button
              type="button"
              onClick={handleSendRequest}
              disabled={isLoading()}
              class="w-full btn-primary py-2.5 px-4 font-mono text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-mint/10"
            >
              <Show
                when={isLoading()}
                fallback={
                  <>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Send Request
                  </>
                }
              >
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </Show>
            </button>
          </div>

        </div>

        {/* Right Pane: Response Viewer & Metrics */}
        <div class="lg:col-span-7 flex flex-col bg-navy/80 rounded-lg border border-slate/15 overflow-hidden">
          
          {/* Header & Metrics Bar */}
          <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-navy border-b border-slate/15">
            <div class="flex items-center gap-3 flex-wrap">
              {/* Status Badge */}
              <Show
                when={statusCode() !== null}
                fallback={
                  <span class="text-xs font-mono px-2.5 py-1 rounded bg-slate/10 text-slate border border-slate/20">
                    No Request Sent
                  </span>
                }
              >
                <span
                  class={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                    statusCode()! >= 200 && statusCode()! < 300
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : statusCode()! >= 300 && statusCode()! < 400
                      ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}
                >
                  {statusCode()} {statusText()}
                </span>
              </Show>

              {/* Latency Metric */}
              <Show when={latency() !== null}>
                <span class="text-xs font-mono text-slate flex items-center gap-1 bg-navy/60 px-2 py-1 rounded border border-slate/10">
                  <svg class="w-3.5 h-3.5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {latency()} ms
                </span>
              </Show>

              {/* Payload Size Display */}
              <Show when={payloadSize() !== null}>
                <span class="text-xs font-mono text-slate flex items-center gap-1 bg-navy/60 px-2 py-1 rounded border border-slate/10">
                  <svg class="w-3.5 h-3.5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {formatBytes(payloadSize()!)}
                </span>
              </Show>
            </div>

            {/* Action Buttons */}
            <div class="flex items-center gap-2">
              <Show when={responseData()}>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  class="text-xs font-mono px-2.5 py-1 rounded border border-slate/30 text-slate hover:text-mint hover:border-mint/50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Show
                    when={copied()}
                    fallback={
                      <>
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy JSON
                      </>
                    }
                  >
                    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-emerald-400">Copied!</span>
                  </Show>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded())}
                  class="text-xs font-mono px-2.5 py-1 rounded border border-slate/30 text-slate hover:text-mint hover:border-mint/50 transition-colors flex items-center gap-1 cursor-pointer"
                  title={isExpanded() ? "Collapse height" : "Expand height"}
                >
                  <svg class={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  {isExpanded() ? "Collapse" : "Expand"}
                </button>
              </Show>
            </div>
          </div>

          {/* Response Content / Viewer Area */}
          <div class="flex-1 p-4 overflow-hidden relative min-h-[260px] flex flex-col justify-center">
            
            {/* Empty State */}
            <Show when={!isLoading() && !responseData() && !error()}>
              <div class="text-center py-10 px-4">
                <div class="text-4xl mb-3 opacity-60">🌐</div>
                <h4 class="text-sm font-mono text-light-slate font-semibold mb-1">API Response Playground</h4>
                <p class="text-xs font-mono text-slate max-w-sm mx-auto">
                  Select a preset API or enter a custom REST URL on the left pane, then click <span class="text-mint">"Send Request"</span> to view execution timing and payload metrics.
                </p>
              </div>
            </Show>

            {/* Loading State */}
            <Show when={isLoading()}>
              <div class="text-center py-12 flex flex-col items-center justify-center gap-3">
                <svg class="w-8 h-8 text-mint animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span class="text-xs font-mono text-slate animate-pulse">Executing HTTP Request...</span>
              </div>
            </Show>

            {/* Error State */}
            <Show when={!isLoading() && error()}>
              <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-xs font-mono text-red-300">
                <div class="font-bold flex items-center gap-2 mb-1">
                  <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Request Failed
                </div>
                <p>{error()}</p>
              </div>
            </Show>

            {/* Syntax-Highlighted JSON Viewer */}
            <Show when={!isLoading() && responseData()}>
              <div
                class={`w-full overflow-auto rounded bg-navy/90 border border-slate/10 p-4 font-mono text-xs leading-relaxed transition-all duration-300 ${
                  isExpanded() ? "max-h-[600px]" : "max-h-[320px]"
                }`}
              >
                <pre
                  class="whitespace-pre text-slate"
                  innerHTML={highlightJsonHTML(responseData() || "")}
                />
              </div>
            </Show>

          </div>

        </div>

      </div>
    </div>
  );
}
