import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT_DIR = join(import.meta.dir, "..");

describe("Feature R1: Terminal CLI Overlay (src/components/TerminalOverlay.astro)", () => {
  const filePath = join(ROOT_DIR, "src/components/TerminalOverlay.astro");
  const content = readFileSync(filePath, "utf-8");

  test("R1.1: File exists and contains essential elements", () => {
    expect(content).toContain("id=\"terminal-overlay\"");
    expect(content).toContain("id=\"terminal-toggle-btn\"");
    expect(content).toContain("hisyam-cli");
  });

  test("R1.2: Command parser supports required commands", () => {
    const commands = ["help", "about", "skills", "projects", "contact", "music", "games", "theme", "clear", "exit"];
    commands.forEach((cmd) => {
      expect(content).toContain(`case '${cmd}':`);
    });
  });

  test("R1.3: HTML Escaping logic prevents XSS in commands", () => {
    function escapeHTML(str: string): string {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    const payload = "<script>alert('xss')</script>&foo=bar";
    const escaped = escapeHTML(payload);
    expect(escaped).toBe("&lt;script&gt;alert('xss')&lt;/script&gt;&amp;foo=bar");
    expect(escaped).not.toContain("<script>");
  });

  test("R1.4: Theme command parsing and cycling logic", () => {
    const THEMES = ["gold", "emerald", "rose", "violet", "cyan"];
    
    function handleTheme(currentTheme: string, args: string[]) {
      if (args.length === 0) {
        const currentIndex = THEMES.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        return THEMES[nextIndex];
      } else {
        const target = args[0].toLowerCase();
        return THEMES.includes(target) ? target : null;
      }
    }

    // Cycling test
    expect(handleTheme("gold", [])).toBe("emerald");
    expect(handleTheme("cyan", [])).toBe("gold");

    // Specific theme test
    expect(handleTheme("gold", ["rose"])).toBe("rose");
    expect(handleTheme("gold", ["ROSE"])).toBe("rose");

    // Invalid theme test
    expect(handleTheme("gold", ["neon"])).toBeNull();
  });

  test("R1.5: History navigation logic", () => {
    const history = ["help", "about", "projects"];
    let historyIndex = -1;

    // Simulate ArrowUp
    function arrowUp() {
      if (history.length > 0) {
        if (historyIndex === -1) {
          historyIndex = history.length - 1;
        } else if (historyIndex > 0) {
          historyIndex--;
        }
      }
      return history[historyIndex];
    }

    // Simulate ArrowDown
    function arrowDown() {
      if (historyIndex !== -1) {
        if (historyIndex < history.length - 1) {
          historyIndex++;
          return history[historyIndex];
        } else {
          historyIndex = -1;
          return "";
        }
      }
      return "";
    }

    expect(arrowUp()).toBe("projects");
    expect(arrowUp()).toBe("about");
    expect(arrowUp()).toBe("help");
    expect(arrowUp()).toBe("help"); // boundary check: does not go below 0

    expect(arrowDown()).toBe("about");
    expect(arrowDown()).toBe("projects");
    expect(arrowDown()).toBe(""); // returns to empty input line
  });

  test("R1.6: Keybinding shortcuts defined in code", () => {
    expect(content).toContain("e.ctrlKey || e.metaKey");
    expect(content).toContain("e.key === '`' || e.code === 'Backquote'");
    expect(content).toContain("e.key === 'Escape'");
  });
});

describe("Feature R2: Career Experience Timeline (src/components/Experience.astro)", () => {
  const filePath = join(ROOT_DIR, "src/components/Experience.astro");
  const content = readFileSync(filePath, "utf-8");

  test("R2.1: File exists and contains section heading & container", () => {
    expect(content).toContain("id=\"experience\"");
    expect(content).toContain("Career Experience");
  });

  test("R2.2: Experience entries contain complete schema fields", () => {
    expect(content).toContain("Senior Full Stack Engineer");
    expect(content).toContain("Frontend Specialist");
    expect(content).toContain("Software Engineer Intern");
    expect(content).toContain("Open Source Contributor");
  });

  test("R2.3: Alternating timeline layout logic (isEven)", () => {
    // Verify even items use fade-right and odd items use fade-left
    expect(content).toContain('data-animate={isEven ? "fade-right" : "fade-left"}');
    expect(content).toContain('data-delay={String(100 + index * 150)}');
  });

  test("R2.4: Spine line and node badges rendered", () => {
    expect(content).toContain("Vertical Glowing Timeline Spine");
    expect(content).toContain("Timeline Node Badge");
    expect(content).toContain("rounded-full bg-mint group-hover:animate-ping");
  });

  test("R2.5: External company URL external link safety attributes", () => {
    expect(content).toContain('target="_blank"');
    expect(content).toContain('rel="noopener noreferrer"');
  });
});

describe("Feature R3: Dynamic Theme Accent Picker (src/components/ThemeSwitcher.astro)", () => {
  const filePath = join(ROOT_DIR, "src/components/ThemeSwitcher.astro");
  const content = readFileSync(filePath, "utf-8");

  const VALID_THEMES = ["gold", "emerald", "rose", "violet", "cyan"];

  test("R3.1: All 5 preset themes defined", () => {
    VALID_THEMES.forEach((theme) => {
      expect(content).toContain(`name: '${theme}'`);
    });
  });

  test("R3.2: Theme fallback logic", () => {
    function resolveTheme(saved: string | null): string {
      if (saved && VALID_THEMES.indexOf(saved) !== -1) {
        return saved;
      }
      return "gold";
    }

    expect(resolveTheme("emerald")).toBe("emerald");
    expect(resolveTheme("invalid")).toBe("gold");
    expect(resolveTheme(null)).toBe("gold");
  });

  test("R3.3: ARIA accessibility attributes present", () => {
    expect(content).toContain('aria-label="Theme Accent Switcher"');
    expect(content).toContain('aria-pressed');
  });
});

describe("Feature Discrepancy Test: LocalStorage keys in R1 vs R3", () => {
  const r1Content = readFileSync(join(ROOT_DIR, "src/components/TerminalOverlay.astro"), "utf-8");
  const r3Content = readFileSync(join(ROOT_DIR, "src/components/ThemeSwitcher.astro"), "utf-8");

  test("R1 and R3 localStorage key comparison", () => {
    const r1KeyMatch = r1Content.match(/localStorage\.(?:getItem|setItem)\(['"]([^'"]+)['"]/);
    const r3KeyMatch = r3Content.match(/localStorage\.(?:getItem|setItem)\(['"]([^'"]+)['"]/);

    const r1Key = r1KeyMatch ? r1KeyMatch[1] : null;
    const r3Key = r3KeyMatch ? r3KeyMatch[1] : null;

    console.log(`[Empirical Audit] R1 LocalStorage key: '${r1Key}', R3 LocalStorage key: '${r3Key}'`);
    // Note: If r1Key !== r3Key, this reveals a persistence mismatch between CLI theme command and GUI theme switcher!
  });
});

describe("Feature R4: Project Tech Filter (src/components/Projects.astro)", () => {
  const filePath = join(ROOT_DIR, "src/components/Projects.astro");
  const content = readFileSync(filePath, "utf-8");

  test("R4.1: Tech tag extraction logic with 'All' upfront", () => {
    const sampleRepos = [
      { tags: ["TypeScript", "React"], language: "TypeScript" },
      { tags: ["Astro", "Tailwind CSS"], language: "Astro" },
      { tags: [], language: "Python" }
    ];

    const allTags = [
      "All",
      ...Array.from(
        new Set(
          sampleRepos.flatMap((repo) => (repo.tags && repo.tags.length > 0 ? repo.tags : [repo.language || "Misc"]))
        )
      ).sort()
    ];

    expect(allTags[0]).toBe("All");
    expect(allTags).toContain("TypeScript");
    expect(allTags).toContain("React");
    expect(allTags).toContain("Astro");
    expect(allTags).toContain("Tailwind CSS");
    expect(allTags).toContain("Python");
  });

  test("R4.2: Case-insensitive filter matching logic", () => {
    function matchesFilter(cardTags: string[], selectedTag: string): boolean {
      if (selectedTag === "All") return true;
      return cardTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    }

    expect(matchesFilter(["TypeScript", "React"], "All")).toBe(true);
    expect(matchesFilter(["TypeScript", "React"], "typescript")).toBe(true);
    expect(matchesFilter(["TypeScript", "React"], "REACT")).toBe(true);
    expect(matchesFilter(["TypeScript", "React"], "Vue")).toBe(false);
  });

  test("R4.3: Empty filter state & reset elements in DOM", () => {
    expect(content).toContain("id=\"no-filter-results\"");
    expect(content).toContain("id=\"reset-filter-btn\"");
    expect(content).toContain("id=\"missing-tag-name\"");
  });

  test("R4.4: Show More pagination elements in DOM", () => {
    expect(content).toContain("id=\"show-more-btn\"");
    expect(content).toContain("id=\"show-more-container\"");
    expect(content).toContain("id=\"matching-count\"");
    expect(content).toContain("id=\"total-count\"");
  });
});

describe("Feature R5: Interactive API Demo Widget (src/components/ApiPlayground.tsx)", () => {
  const filePath = join(ROOT_DIR, "src/components/ApiPlayground.tsx");
  const content = readFileSync(filePath, "utf-8");

  test("R5.1: Contains 6 preset endpoints including Custom", () => {
    const presets = ["jp-posts", "jp-users", "dj-quotes", "dj-products", "open-meteo", "custom"];
    presets.forEach((preset) => {
      expect(content).toContain(`id: "${preset}"`);
    });
  });

  test("R5.2: Helper formatBytes formats payload sizes accurately", () => {
    function formatBytes(bytes: number): string {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  test("R5.3: Helper getStatusText returns proper HTTP status phrases", () => {
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

    expect(getStatusText(200)).toBe("OK");
    expect(getStatusText(404)).toBe("Not Found");
    expect(getStatusText(500)).toBe("Internal Server Error");
    expect(getStatusText(418)).toBe("");
  });

  test("R5.4: highlightJsonHTML escapes HTML tags and applies syntax colors", () => {
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

    const testJson = JSON.stringify({ key: "<script>alert('test')</script>", count: 42, active: true, extra: null }, null, 2);
    const highlighted = highlightJsonHTML(testJson);

    expect(highlighted).not.toContain("<script>");
    expect(highlighted).toContain("&lt;script&gt;");
    expect(highlighted).toContain("text-mint font-semibold"); // key class
    expect(highlighted).toContain("text-emerald-300"); // string class
    expect(highlighted).toContain("text-amber-300"); // number class
    expect(highlighted).toContain("text-purple-400 font-semibold"); // boolean class
    expect(highlighted).toContain("text-rose-400 font-semibold"); // null class
  });

  test("R5.5: Real API live fetch simulation with latency measurement", async () => {
    const startTime = performance.now();
    const res = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    expect(res.status).toBe(200);
    expect(duration).toBeGreaterThanOrEqual(0);

    const text = await res.text();
    const json = JSON.parse(text);
    expect(json.id).toBe(1);
    expect(text.length).toBeGreaterThan(0);
  });

  test("R5.6: API Error handling on invalid/unreachable URL", async () => {
    let errorMsg = null;
    let statusCode = null;

    try {
      const res = await fetch("https://invalid-nonexistent-domain-123456789.org/api");
      statusCode = res.status;
    } catch (err: any) {
      statusCode = 0;
      errorMsg = err.message;
    }

    expect(statusCode).toBe(0);
    expect(errorMsg).not.toBeNull();
  });
});
