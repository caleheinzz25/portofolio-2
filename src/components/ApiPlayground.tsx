import { createSignal, Show, For } from "solid-js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HeaderPair {
  key: string;
  value: string;
}

export interface Preset {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  description: string;
  defaultBody?: string;
  defaultHeaders?: HeaderPair[];
}

export interface PresetGroup {
  category: string;
  presets: Preset[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  method: HttpMethod;
  url: string;
  statusCode: number | null;
  statusText: string | null;
  latency: number | null;
  requestBody?: string;
  headers?: HeaderPair[];
}

const PRESET_GROUPS: PresetGroup[] = [
  {
    category: "Data & CRUD",
    presets: [
      {
        id: "jp-posts",
        name: "JSONPlaceholder - Get Post #1",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        method: "GET",
        description: "Fetch a sample blog post object",
      },
      {
        id: "jp-create-post",
        name: "JSONPlaceholder - Create Post",
        url: "https://jsonplaceholder.typicode.com/posts",
        method: "POST",
        description: "Simulate POST request to create a post",
        defaultBody: JSON.stringify(
          { title: "Building Modern Portfolios", body: "Astro and SolidJS rock!", userId: 1 },
          null,
          2
        ),
      },
      {
        id: "jp-put-post",
        name: "JSONPlaceholder - Update Post (PUT)",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        method: "PUT",
        description: "Full update of post #1",
        defaultBody: JSON.stringify(
          { id: 1, title: "Updated Title", body: "Updated content body", userId: 1 },
          null,
          2
        ),
      },
      {
        id: "jp-delete-post",
        name: "JSONPlaceholder - Delete Post",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        method: "DELETE",
        description: "Delete post #1 resource",
      },
      {
        id: "jp-users",
        name: "JSONPlaceholder - Get Users",
        url: "https://jsonplaceholder.typicode.com/users/1",
        method: "GET",
        description: "Fetch sample user profile details",
      },
    ],
  },
  {
    category: "Fun & Random",
    presets: [
      {
        id: "cat-facts",
        name: "Cat Facts API",
        url: "https://catfact.ninja/fact",
        method: "GET",
        description: "Fetch a random cat fact",
      },
      {
        id: "dog-ceo",
        name: "Dog CEO - Random Image",
        url: "https://dog.ceo/api/breeds/image/random",
        method: "GET",
        description: "Fetch a random dog picture URL",
      },
      {
        id: "dj-quotes",
        name: "DummyJSON - Quotes",
        url: "https://dummyjson.com/quotes/random",
        method: "GET",
        description: "Fetch a random inspirational quote",
      },
      {
        id: "numbers-trivia",
        name: "Numbers API - Trivia",
        url: "http://numbersapi.com/random/trivia?json",
        method: "GET",
        description: "Fetch random number trivia fact",
      },
    ],
  },
  {
    category: "Real-World",
    presets: [
      {
        id: "open-meteo",
        name: "Open-Meteo - Weather (Jakarta)",
        url: "https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current_weather=true",
        method: "GET",
        description: "Live weather forecast metrics for Jakarta",
      },
      {
        id: "ip-api",
        name: "IP-API - Geolocation",
        url: "https://ipapi.co/json/",
        method: "GET",
        description: "Fetch current visitor public IP & location info",
      },
      {
        id: "dj-products",
        name: "DummyJSON - Products",
        url: "https://dummyjson.com/products/1",
        method: "GET",
        description: "Fetch product item catalog data",
      },
    ],
  },
  {
    category: "Custom",
    presets: [
      {
        id: "custom",
        name: "Custom REST Endpoint",
        url: "",
        method: "GET",
        description: "Enter any CORS-enabled public REST endpoint",
        defaultBody: "{\n  \"key\": \"value\"\n}",
      },
    ],
  },
];

const ALL_PRESETS = PRESET_GROUPS.flatMap((g) => g.presets);

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

function getMethodBadgeClass(m: HttpMethod): string {
  switch (m) {
    case "GET":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    case "POST":
      return "bg-sky-500/20 text-sky-400 border-sky-500/40";
    case "PUT":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "PATCH":
      return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    case "DELETE":
      return "bg-red-500/20 text-red-400 border-red-500/40";
  }
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
  const [selectedPresetId, setSelectedPresetId] = createSignal<string>(ALL_PRESETS[0].id);
  const [url, setUrl] = createSignal<string>(ALL_PRESETS[0].url);
  const [method, setMethod] = createSignal<HttpMethod>(ALL_PRESETS[0].method);
  const [requestBody, setRequestBody] = createSignal<string>(ALL_PRESETS[0].defaultBody || "{}");
  
  // Custom Headers
  const [headers, setHeaders] = createSignal<HeaderPair[]>([
    { key: "Accept", value: "application/json" }
  ]);
  const [showHeadersEditor, setShowHeadersEditor] = createSignal<boolean>(false);

  // Request/Response State
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [responseData, setResponseData] = createSignal<string | null>(null);
  const [responseHeaders, setResponseHeaders] = createSignal<HeaderPair[]>([]);
  const [statusCode, setStatusCode] = createSignal<number | null>(null);
  const [statusText, setStatusText] = createSignal<string | null>(null);
  const [latency, setLatency] = createSignal<number | null>(null);
  const [payloadSize, setPayloadSize] = createSignal<number | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  // UI state
  const [activeResponseTab, setActiveResponseTab] = createSignal<"body" | "headers">("body");
  const [copied, setCopied] = createSignal<boolean>(false);
  const [isExpanded, setIsExpanded] = createSignal<boolean>(false);

  // History Log
  const [history, setHistory] = createSignal<HistoryItem[]>([]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = ALL_PRESETS.find((p) => p.id === presetId);
    if (preset && preset.id !== "custom") {
      setUrl(preset.url);
      setMethod(preset.method);
      if (preset.defaultBody) setRequestBody(preset.defaultBody);
      if (preset.defaultHeaders) {
        setHeaders(preset.defaultHeaders);
      } else {
        setHeaders([{ key: "Accept", value: "application/json" }]);
      }
    }
  };

  const handleUrlInput = (newUrl: string) => {
    setUrl(newUrl);
    const currentPreset = ALL_PRESETS.find((p) => p.id === selectedPresetId());
    if (currentPreset && currentPreset.id !== "custom" && currentPreset.url !== newUrl) {
      setSelectedPresetId("custom");
    }
  };

  const addHeaderPair = () => {
    setHeaders([...headers(), { key: "", value: "" }]);
  };

  const updateHeaderPair = (index: number, key: string, value: string) => {
    const updated = [...headers()];
    updated[index] = { key, value };
    setHeaders(updated);
  };

  const removeHeaderPair = (index: number) => {
    setHeaders(headers().filter((_, i) => i !== index));
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
    setResponseHeaders([]);
    setStatusCode(null);
    setStatusText(null);
    setLatency(null);
    setPayloadSize(null);

    const startTime = performance.now();
    try {
      const customHeaderMap: Record<string, string> = {};
      headers().forEach((h) => {
        if (h.key.trim()) {
          customHeaderMap[h.key.trim()] = h.value.trim();
        }
      });

      if (!customHeaderMap["Accept"]) {
        customHeaderMap["Accept"] = "application/json";
      }

      if (["POST", "PUT", "PATCH"].includes(method()) && !customHeaderMap["Content-Type"]) {
        customHeaderMap["Content-Type"] = "application/json";
      }

      const options: RequestInit = {
        method: method(),
        headers: customHeaderMap,
      };

      if (["POST", "PUT", "PATCH"].includes(method())) {
        options.body = requestBody();
      }

      const res = await fetch(targetUrl, options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      setLatency(duration);
      setStatusCode(res.status);
      const computedStatusText = res.statusText || getStatusText(res.status) || (res.ok ? "OK" : "Response Received");
      setStatusText(computedStatusText);

      // Extract Response Headers
      const resHeaderList: HeaderPair[] = [];
      res.headers.forEach((value, key) => {
        resHeaderList.push({ key, value });
      });
      setResponseHeaders(resHeaderList);

      const text = await res.text();
      const bytes = new Blob([text]).size;
      setPayloadSize(bytes);

      try {
        const json = JSON.parse(text);
        setResponseData(JSON.stringify(json, null, 2));
      } catch {
        setResponseData(text);
      }

      // Add to History (keep max 10)
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        method: method(),
        url: targetUrl,
        statusCode: res.status,
        statusText: computedStatusText,
        latency: duration,
        requestBody: ["POST", "PUT", "PATCH"].includes(method()) ? requestBody() : undefined,
        headers: [...headers()]
      };
      setHistory([newHistoryItem, ...history().slice(0, 9)]);

    } catch (err: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setLatency(duration);
      setStatusCode(0);
      setStatusText("Network Error");
      setError(err?.message || "Failed to execute request. Verify URL or CORS support.");

      // Record failed request in history
      const failedHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        method: method(),
        url: targetUrl,
        statusCode: 0,
        statusText: "Error",
        latency: duration,
      };
      setHistory([failedHistoryItem, ...history().slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReRunFromHistory = (item: HistoryItem) => {
    setUrl(item.url);
    setMethod(item.method);
    if (item.requestBody) setRequestBody(item.requestBody);
    if (item.headers) setHeaders(item.headers);
    setSelectedPresetId("custom");
  };

  const handleReset = () => {
    const defaultPreset = ALL_PRESETS[0];
    setSelectedPresetId(defaultPreset.id);
    setUrl(defaultPreset.url);
    setMethod(defaultPreset.method);
    setRequestBody(defaultPreset.defaultBody || "{}");
    setHeaders([{ key: "Accept", value: "application/json" }]);
    setIsLoading(false);
    setResponseData(null);
    setResponseHeaders([]);
    setStatusCode(null);
    setStatusText(null);
    setLatency(null);
    setPayloadSize(null);
    setError(null);
    setCopied(false);
    setIsExpanded(false);
    setShowHeadersEditor(false);
  };

  const handleCopyJson = () => {
    const data = responseData();
    if (!data) return;
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="card bg-light-navy/40 border border-slate/20 rounded-xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Pane: Request Config */}
        <div class="lg:col-span-5 flex flex-col gap-4 bg-navy/80 p-4 sm:p-5 rounded-lg border border-slate/15">
          <div class="flex items-center justify-between border-b border-slate/15 pb-3">
            <h3 class="text-base font-serif font-semibold text-light-slate flex items-center gap-2">
              <span class="text-mint">⚡</span> Request Config
            </h3>
            <button
              type="button"
              onClick={handleReset}
              class="text-xs font-mono text-slate hover:text-mint transition-colors duration-200 flex items-center gap-1 cursor-pointer"
              title="Reset form"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>

          {/* Grouped Preset Selector */}
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-mono text-slate flex justify-between items-center">
              <span>Preset API Endpoints</span>
              <span class="text-[10px] text-mint/80 font-mono">{ALL_PRESETS.length} Available</span>
            </label>
            <select
              value={selectedPresetId()}
              onChange={(e) => handlePresetChange(e.currentTarget.value)}
              class="w-full bg-navy border border-slate/30 text-light-slate text-xs font-mono rounded-md px-3 py-2 focus:border-mint focus:outline-none transition-colors cursor-pointer"
            >
              <For each={PRESET_GROUPS}>
                {(group) => (
                  <optgroup label={group.category} class="bg-navy text-mint font-bold">
                    <For each={group.presets}>
                      {(preset) => (
                        <option value={preset.id} class="bg-navy text-light-slate font-mono">
                          [{preset.method}] {preset.name}
                        </option>
                      )}
                    </For>
                  </optgroup>
                )}
              </For>
            </select>
            <Show when={ALL_PRESETS.find((p) => p.id === selectedPresetId())?.description}>
              <p class="text-[11px] text-slate/80 italic mt-0.5">
                {ALL_PRESETS.find((p) => p.id === selectedPresetId())?.description}
              </p>
            </Show>
          </div>

          {/* HTTP Method & URL */}
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-mono text-slate">HTTP Method & URL</label>
            <div class="flex gap-2">
              <select
                value={method()}
                onChange={(e) => setMethod(e.currentTarget.value as HttpMethod)}
                class={`font-mono text-xs font-bold rounded-md px-2.5 py-2 border transition-colors cursor-pointer focus:outline-none ${getMethodBadgeClass(method())}`}
              >
                <option value="GET" class="bg-navy text-emerald-400">GET</option>
                <option value="POST" class="bg-navy text-sky-400">POST</option>
                <option value="PUT" class="bg-navy text-amber-400">PUT</option>
                <option value="PATCH" class="bg-navy text-purple-400">PATCH</option>
                <option value="DELETE" class="bg-navy text-red-400">DELETE</option>
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

          {/* Custom Headers Section (Collapsible) */}
          <div class="flex flex-col gap-1.5 border-t border-slate/15 pt-3">
            <button
              type="button"
              onClick={() => setShowHeadersEditor(!showHeadersEditor())}
              class="text-xs font-mono text-slate hover:text-mint flex items-center justify-between cursor-pointer w-full text-left"
            >
              <span class="flex items-center gap-1.5">
                <span>Header Parameters</span>
                <span class="text-[10px] bg-slate/20 text-mint px-1.5 py-0.5 rounded font-bold">
                  {headers().filter((h) => h.key.trim()).length}
                </span>
              </span>
              <svg class={`w-3.5 h-3.5 transition-transform duration-200 ${showHeadersEditor() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <Show when={showHeadersEditor()}>
              <div class="space-y-2 pt-2 animate-fade-in">
                <For each={headers()}>
                  {(h, idx) => (
                    <div class="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Header key"
                        value={h.key}
                        onInput={(e) => updateHeaderPair(idx(), e.currentTarget.value, h.value)}
                        class="w-1/2 bg-navy border border-slate/30 text-light-slate font-mono text-[11px] rounded px-2 py-1 focus:border-mint focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={h.value}
                        onInput={(e) => updateHeaderPair(idx(), h.key, e.currentTarget.value)}
                        class="w-1/2 bg-navy border border-slate/30 text-light-slate font-mono text-[11px] rounded px-2 py-1 focus:border-mint focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeHeaderPair(idx())}
                        class="text-slate hover:text-red-400 p-1 text-xs cursor-pointer font-bold"
                        title="Remove header"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </For>
                <button
                  type="button"
                  onClick={addHeaderPair}
                  class="text-[11px] font-mono text-mint hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                >
                  + Add Header Pair
                </button>
              </div>
            </Show>
          </div>

          {/* Request Body (If POST, PUT, PATCH) */}
          <Show when={["POST", "PUT", "PATCH"].includes(method())}>
            <div class="flex flex-col gap-1.5 animate-fade-in border-t border-slate/15 pt-3">
              <label class="text-xs font-mono text-slate flex justify-between items-center">
                <span>Request Body (JSON)</span>
                <span class="text-[10px] text-sky-400">application/json</span>
              </label>
              <textarea
                value={requestBody()}
                onInput={(e) => setRequestBody(e.currentTarget.value)}
                rows={4}
                class="w-full bg-navy border border-slate/30 text-light-slate font-mono text-xs rounded-md p-2.5 focus:border-mint focus:outline-none transition-colors resize-y"
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

          {/* Request History Log Section */}
          <Show when={history().length > 0}>
            <div class="border-t border-slate/15 pt-3 mt-1">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-mono text-slate font-semibold flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Request History
                </span>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  class="text-[10px] font-mono text-slate hover:text-red-400 cursor-pointer"
                >
                  Clear History
                </button>
              </div>

              <div class="max-h-[140px] overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                <For each={history()}>
                  {(item) => (
                    <div
                      onClick={() => handleReRunFromHistory(item)}
                      class="flex items-center justify-between bg-navy/60 hover:bg-navy p-1.5 rounded border border-slate/10 hover:border-mint/30 cursor-pointer transition-colors group"
                      title="Click to load into request form"
                    >
                      <div class="flex items-center gap-2 truncate">
                        <span class={`font-bold text-[10px] px-1 py-0.5 rounded border ${getMethodBadgeClass(item.method)}`}>
                          {item.method}
                        </span>
                        <span class="text-light-slate/90 truncate max-w-[140px] sm:max-w-[180px]">
                          {item.url}
                        </span>
                      </div>

                      <div class="flex items-center gap-2 text-[10px] shrink-0">
                        <span class={item.statusCode && item.statusCode >= 200 && item.statusCode < 300 ? "text-emerald-400" : "text-red-400"}>
                          {item.statusCode || "ERR"}
                        </span>
                        <span class="text-slate/60 hidden sm:inline">{item.latency}ms</span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

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

            {/* Response Tab Controls & Action Buttons */}
            <div class="flex items-center gap-2">
              <Show when={responseData() || responseHeaders().length > 0}>
                {/* Body / Headers Tab Switcher */}
                <div class="flex bg-navy/90 p-0.5 rounded border border-slate/20 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveResponseTab("body")}
                    class={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeResponseTab() === "body"
                        ? "bg-mint/20 text-mint font-bold"
                        : "text-slate hover:text-light-slate"
                    }`}
                  >
                    Body
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveResponseTab("headers")}
                    class={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                      activeResponseTab() === "headers"
                        ? "bg-mint/20 text-mint font-bold"
                        : "text-slate hover:text-light-slate"
                    }`}
                  >
                    Headers
                    <span class="text-[9px] bg-slate/30 text-light-slate px-1 rounded">
                      {responseHeaders().length}
                    </span>
                  </button>
                </div>

                {/* Copy JSON */}
                <Show when={responseData()}>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    class="text-xs font-mono px-2 py-1 rounded border border-slate/30 text-slate hover:text-mint hover:border-mint/50 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copy JSON to clipboard"
                  >
                    <Show
                      when={copied()}
                      fallback={
                        <>
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span class="hidden sm:inline">Copy</span>
                        </>
                      }
                    >
                      <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span class="text-emerald-400 hidden sm:inline">Copied!</span>
                    </Show>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded())}
                    class="text-xs font-mono px-2 py-1 rounded border border-slate/30 text-slate hover:text-mint hover:border-mint/50 transition-colors flex items-center gap-1 cursor-pointer"
                    title={isExpanded() ? "Collapse height" : "Expand height"}
                  >
                    <svg class={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded() ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </Show>
              </Show>
            </div>
          </div>

          {/* Response Content / Viewer Area */}
          <div class="flex-1 p-4 overflow-hidden relative min-h-[300px] flex flex-col justify-center">
            
            {/* Empty State */}
            <Show when={!isLoading() && !responseData() && !error()}>
              <div class="text-center py-10 px-4">
                <div class="text-4xl mb-3 opacity-60">🌐</div>
                <h4 class="text-sm font-mono text-light-slate font-semibold mb-1">API Response Playground</h4>
                <p class="text-xs font-mono text-slate max-w-sm mx-auto">
                  Select a preset API or enter a custom REST URL on the left pane, then click <span class="text-mint">"Send Request"</span> to view execution timing, headers, and payload metrics.
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

            {/* TAB 1: Syntax-Highlighted JSON Viewer */}
            <Show when={!isLoading() && responseData() && activeResponseTab() === "body"}>
              <div
                class={`w-full overflow-auto rounded bg-navy/90 border border-slate/10 p-4 font-mono text-xs leading-relaxed transition-all duration-300 ${
                  isExpanded() ? "max-h-[600px]" : "max-h-[340px]"
                }`}
              >
                <pre
                  class="whitespace-pre text-slate"
                  innerHTML={highlightJsonHTML(responseData() || "")}
                />
              </div>
            </Show>

            {/* TAB 2: Response Headers Table */}
            <Show when={!isLoading() && activeResponseTab() === "headers"}>
              <div class="w-full max-h-[340px] overflow-auto rounded bg-navy/90 border border-slate/10 p-3 font-mono text-xs">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-slate/20 text-mint text-[11px]">
                      <th class="py-2 px-3 font-semibold w-1/3">Header Key</th>
                      <th class="py-2 px-3 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={responseHeaders()}>
                      {(h) => (
                        <tr class="border-b border-slate/10 hover:bg-slate/5 text-[11px]">
                          <td class="py-1.5 px-3 text-light-slate/90 font-semibold select-all">{h.key}</td>
                          <td class="py-1.5 px-3 text-slate select-all break-all">{h.value}</td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>

          </div>

        </div>

      </div>
    </div>
  );
}
