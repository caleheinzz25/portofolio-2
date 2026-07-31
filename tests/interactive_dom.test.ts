import { describe, test, expect, beforeEach } from "bun:test";
import { Window } from "happy-dom";

describe("Empirical DOM Interactive Test Suite", () => {
  let window: Window;
  let document: Document;

  beforeEach(() => {
    window = new Window({
      url: "http://localhost:3000/",
    });
    document = window.document as unknown as Document;
    globalThis.window = window as any;
    globalThis.document = document as any;
    globalThis.navigator = window.navigator as any;
    globalThis.localStorage = window.localStorage as any;
    globalThis.HTMLElement = window.HTMLElement as any;
    globalThis.HTMLInputElement = window.HTMLInputElement as any;
    globalThis.HTMLButtonElement = window.HTMLButtonElement as any;
    globalThis.HTMLFormElement = window.HTMLFormElement as any;
    globalThis.KeyboardEvent = window.KeyboardEvent as any;
    globalThis.Event = window.Event as any;
  });

  describe("R1: Terminal CLI Overlay Interactivity", () => {
    test("R1.DOM: Toggle overlay, command execution, clear, exit, and shortcuts", () => {
      // Set up DOM structure matching TerminalOverlay.astro
      document.body.innerHTML = `
        <button id="terminal-toggle-btn">hisyam-cli</button>
        <div id="terminal-overlay" class="fixed inset-0">
          <button id="terminal-close-btn">X</button>
          <button id="terminal-close-dot">red-dot</button>
          <div id="terminal-output"></div>
        </div>
      `;

      const toggleBtn = document.getElementById("terminal-toggle-btn")!;
      const overlay = document.getElementById("terminal-overlay")!;
      const closeBtn = document.getElementById("terminal-close-btn")!;
      const closeDot = document.getElementById("terminal-close-dot")!;
      const outputContainer = document.getElementById("terminal-output")!;

      let isOpen = false;
      const commandHistory: string[] = [];
      let historyIndex = -1;
      const THEMES = ["gold", "emerald", "rose", "violet", "cyan"];

      function toggleOverlay() {
        isOpen = !isOpen;
        if (isOpen) {
          overlay.classList.add("is-open");
          document.body.style.overflow = "hidden";
          if (outputContainer.children.length === 0) {
            initTerminalContent();
          }
        } else {
          overlay.classList.remove("is-open");
          document.body.style.overflow = "";
        }
      }

      function initTerminalContent() {
        outputContainer.innerHTML = `<div id="welcome">Welcome</div>` + createInputLineHTML();
        setupFormListeners();
      }

      function createInputLineHTML(): string {
        return `
          <form id="terminal-form">
            <input id="terminal-input" type="text" />
          </form>
        `;
      }

      function setupFormListeners() {
        const form = document.getElementById("terminal-form") as HTMLFormElement | null;
        const input = document.getElementById("terminal-input") as HTMLInputElement | null;
        if (!form || !input) return;

        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const cmd = input.value.trim();
          if (cmd) executeCommand(cmd);
        });
      }

      function executeCommand(trimmed: string) {
        commandHistory.push(trimmed);
        historyIndex = -1;
        const parts = trimmed.split(/\s+/);
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (command === "clear") {
          outputContainer.innerHTML = createInputLineHTML();
          setupFormListeners();
        } else if (command === "exit") {
          toggleOverlay();
        } else if (command === "theme") {
          let target = args[0]?.toLowerCase();
          if (!target) {
            const current = document.documentElement.getAttribute("data-theme") || "gold";
            const idx = THEMES.indexOf(current);
            target = THEMES[(idx + 1) % THEMES.length];
          }
          if (THEMES.includes(target)) {
            document.documentElement.setAttribute("data-theme", target);
            localStorage.setItem("theme", target);
          }
          renderResponse(`Theme set to ${target}`);
        } else {
          renderResponse(`Executed ${command}`);
        }
      }

      function renderResponse(html: string) {
        const div = document.createElement("div");
        div.className = "response";
        div.innerHTML = html;
        outputContainer.appendChild(div);
        const newForm = document.createElement("div");
        newForm.innerHTML = createInputLineHTML();
        outputContainer.appendChild(newForm.firstElementChild!);
        setupFormListeners();
      }

      toggleBtn.addEventListener("click", toggleOverlay);
      closeBtn.addEventListener("click", toggleOverlay);

      // 1. Click toggle button -> overlay opens
      toggleBtn.click();
      expect(isOpen).toBe(true);
      expect(overlay.classList.contains("is-open")).toBe(true);
      expect(document.body.style.overflow).toBe("hidden");

      // 2. Form submitted with 'theme rose'
      const input = document.getElementById("terminal-input") as HTMLInputElement;
      input.value = "theme rose";
      const form = document.getElementById("terminal-form") as HTMLFormElement;
      form.dispatchEvent(new Event("submit"));

      expect(document.documentElement.getAttribute("data-theme")).toBe("rose");
      expect(localStorage.getItem("theme")).toBe("rose");

      // 3. Clear command
      const newInput = document.getElementById("terminal-input") as HTMLInputElement;
      newInput.value = "clear";
      const newForm = document.getElementById("terminal-form") as HTMLFormElement;
      newForm.dispatchEvent(new Event("submit"));

      expect(outputContainer.querySelectorAll(".response").length).toBe(0);

      // 4. Exit command
      const exitInput = document.getElementById("terminal-input") as HTMLInputElement;
      exitInput.value = "exit";
      const exitForm = document.getElementById("terminal-form") as HTMLFormElement;
      exitForm.dispatchEvent(new Event("submit"));

      expect(isOpen).toBe(false);
      expect(overlay.classList.contains("is-open")).toBe(false);
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("R3: Dynamic Theme Switcher Interactivity", () => {
    test("R3.DOM: Click theme buttons updates data-theme and localStorage and active states", () => {
      document.body.innerHTML = `
        <button data-theme-option="gold" aria-pressed="true" class="filter-btn ring-2 ring-white scale-110">Gold</button>
        <button data-theme-option="emerald" aria-pressed="false" class="filter-btn">Emerald</button>
        <button data-theme-option="rose" aria-pressed="false" class="filter-btn">Rose</button>
        <button data-theme-option="violet" aria-pressed="false" class="filter-btn">Violet</button>
        <button data-theme-option="cyan" aria-pressed="false" class="filter-btn">Cyan</button>
      `;

      const buttons = document.querySelectorAll<HTMLButtonElement>("[data-theme-option]");
      const validThemes = ["gold", "emerald", "rose", "violet", "cyan"];

      function updateActiveState() {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "gold";
        buttons.forEach((btn) => {
          const theme = btn.getAttribute("data-theme-option");
          if (theme === currentTheme) {
            btn.setAttribute("aria-pressed", "true");
            btn.classList.add("ring-2", "ring-white", "scale-110");
          } else {
            btn.setAttribute("aria-pressed", "false");
            btn.classList.remove("ring-2", "ring-white", "scale-110");
          }
        });
      }

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const theme = btn.getAttribute("data-theme-option");
          if (theme && validThemes.includes(theme)) {
            document.documentElement.setAttribute("data-theme", theme);
            try {
              localStorage.setItem("portfolio-accent", theme);
            } catch (e) {}
            updateActiveState();
          }
        });
      });

      // Initial active state check
      updateActiveState();
      expect(buttons[0].getAttribute("aria-pressed")).toBe("true");

      // Click Emerald button
      buttons[1].click();
      expect(document.documentElement.getAttribute("data-theme")).toBe("emerald");
      expect(localStorage.getItem("portfolio-accent")).toBe("emerald");
      expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
      expect(buttons[0].getAttribute("aria-pressed")).toBe("false");

      // Click Cyan button
      buttons[4].click();
      expect(document.documentElement.getAttribute("data-theme")).toBe("cyan");
      expect(localStorage.getItem("portfolio-accent")).toBe("cyan");
      expect(buttons[4].getAttribute("aria-pressed")).toBe("true");
      expect(buttons[1].getAttribute("aria-pressed")).toBe("false");
    });
  });

  describe("R4: Project Tech Filter Interactivity", () => {
    test("R4.DOM: Filtering project items by tag, empty results, and reset", () => {
      document.body.innerHTML = `
        <div id="project-filter-bar">
          <button class="filter-btn active" data-filter="All" aria-pressed="true">All</button>
          <button class="filter-btn" data-filter="TypeScript" aria-pressed="false">TypeScript</button>
          <button class="filter-btn" data-filter="Python" aria-pressed="false">Python</button>
          <button class="filter-btn" data-filter="Rust" aria-pressed="false">Rust</button>
        </div>
        <div id="matching-count">6</div>
        <div id="show-more-container">Show More Container</div>
        <button id="show-more-btn" data-visible="3" data-total="6">Show More</button>
        <div id="no-filter-results" class="hidden">
          No projects match <span id="missing-tag-name"></span>
          <button id="reset-filter-btn">Reset</button>
        </div>

        <!-- Featured projects -->
        <div class="project-item" data-featured="true" data-tags='["TypeScript", "React"]'>Card 1</div>
        <div class="project-item" data-featured="true" data-tags='["Python", "Django"]'>Card 2</div>

        <!-- Other projects -->
        <div class="project-item" data-featured="false" data-other-index="0" data-tags='["TypeScript", "Node.js"]'>Card 3</div>
        <div class="project-item" data-featured="false" data-other-index="1" data-tags='["Python"]'>Card 4</div>
      `;

      const filterButtons = document.querySelectorAll<HTMLButtonElement>(".filter-btn");
      const allProjectItems = document.querySelectorAll<HTMLElement>(".project-item");
      const matchingCountEl = document.getElementById("matching-count")!;
      const noResultsEl = document.getElementById("no-filter-results")!;
      const missingTagNameEl = document.getElementById("missing-tag-name")!;
      const resetFilterBtn = document.getElementById("reset-filter-btn") as HTMLButtonElement;
      const showMoreContainer = document.getElementById("show-more-container")!;

      function applyFilter(selectedTag: string) {
        let matchingCount = 0;
        filterButtons.forEach((btn) => {
          const isSelected = btn.dataset.filter === selectedTag;
          btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
          if (isSelected) btn.classList.add("active");
          else btn.classList.remove("active");
        });

        allProjectItems.forEach((card) => {
          let tags: string[] = [];
          try {
            tags = JSON.parse(card.dataset.tags || "[]");
          } catch (e) {
            tags = [];
          }
          const matches = selectedTag === "All" || tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());

          if (matches) {
            card.classList.remove("hidden");
            card.style.display = "";
            matchingCount++;
          } else {
            card.classList.add("hidden");
            card.style.display = "none";
          }
        });

        if (selectedTag === "All") {
          showMoreContainer.style.display = "";
        } else {
          showMoreContainer.style.display = "none";
        }

        matchingCountEl.textContent = matchingCount.toString();

        if (matchingCount === 0) {
          missingTagNameEl.textContent = selectedTag;
          noResultsEl.classList.remove("hidden");
          noResultsEl.style.display = "";
        } else {
          noResultsEl.classList.add("hidden");
          noResultsEl.style.display = "none";
        }
      }

      filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => applyFilter(btn.dataset.filter || "All"));
      });

      resetFilterBtn.addEventListener("click", () => applyFilter("All"));

      // 1. Filter by TypeScript
      filterButtons[1].click(); // TypeScript
      expect(matchingCountEl.textContent).toBe("2");
      expect(allProjectItems[0].classList.contains("hidden")).toBe(false);
      expect(allProjectItems[1].classList.contains("hidden")).toBe(true);
      expect(allProjectItems[2].classList.contains("hidden")).toBe(false);
      expect(allProjectItems[3].classList.contains("hidden")).toBe(true);
      expect(showMoreContainer.style.display).toBe("none");

      // 2. Filter by Rust (0 matches)
      filterButtons[3].click(); // Rust
      expect(matchingCountEl.textContent).toBe("0");
      expect(noResultsEl.classList.contains("hidden")).toBe(false);
      expect(missingTagNameEl.textContent).toBe("Rust");

      // 3. Reset filter
      resetFilterBtn.click();
      expect(matchingCountEl.textContent).toBe("4");
      expect(noResultsEl.classList.contains("hidden")).toBe(true);
      expect(filterButtons[0].getAttribute("aria-pressed")).toBe("true");
    });
  });
});
