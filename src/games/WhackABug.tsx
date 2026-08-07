import { createSignal, onCleanup, For, Show } from "solid-js";

interface Hole {
  id: number;
  bug: string | null;
  type: "bug" | "golden" | "bomb" | null;
}

const BUG_TYPES = [
  { emoji: "🐛", type: "bug", points: 10 },
  { emoji: "🐞", type: "bug", points: 10 },
  { emoji: "🪲", type: "bug", points: 15 },
  { emoji: "⚡", type: "golden", points: 50 },
  { emoji: "💣", type: "bomb", points: -30 },
];

export default function WhackABug() {
  const [holes, setHoles] = createSignal<Hole[]>(
    Array.from({ length: 9 }, (_, i) => ({ id: i, bug: null, type: null }))
  );
  const [score, setScore] = createSignal(0);
  const [highScore, setHighScore] = createSignal(0);
  const [timeLeft, setTimeLeft] = createSignal(30);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [gameOver, setGameOver] = createSignal(false);
  const [splatters, setSplatters] = createSignal<{ holeId: number; text: string }[]>([]);

  let timerInterval: number | undefined;
  let bugTimeout: number | undefined;

  function loadHighScore() {
    try {
      const h = localStorage.getItem("whackabug-high-score");
      if (h) setHighScore(parseInt(h, 10) || 0);
    } catch (e) {}
  }

  loadHighScore();

  function startGame() {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setTimeLeft(30);
    setSplatters([]);

    if (timerInterval) clearInterval(timerInterval);
    if (bugTimeout) clearTimeout(bugTimeout);

    timerInterval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000) as unknown as number;

    popBugLoop();
  }

  function endGame() {
    setIsPlaying(false);
    setGameOver(true);
    if (timerInterval) clearInterval(timerInterval);
    if (bugTimeout) clearTimeout(bugTimeout);

    setHoles((prev) => prev.map((h) => ({ ...h, bug: null, type: null })));

    if (score() > highScore()) {
      setHighScore(score());
      try {
        localStorage.setItem("whackabug-high-score", String(score()));
      } catch (e) {}
    }
  }

  function popBugLoop() {
    if (!isPlaying()) return;

    const currentHoles = holes();
    const availableHoles = currentHoles.filter((h) => !h.bug);

    if (availableHoles.length > 0) {
      const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      const randomBug = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)];

      setHoles((prev) =>
        prev.map((h) =>
          h.id === randomHole.id
            ? { ...h, bug: randomBug.emoji, type: randomBug.type as any }
            : h
        )
      );

      const hideDelay = Math.floor(Math.random() * 800) + 600;
      setTimeout(() => {
        setHoles((prev) =>
          prev.map((h) => (h.id === randomHole.id ? { ...h, bug: null, type: null } : h))
        );
      }, hideDelay);
    }

    const nextLoopDelay = Math.floor(Math.random() * 400) + 300;
    bugTimeout = setTimeout(popBugLoop, nextLoopDelay) as unknown as number;
  }

  function whack(holeId: number) {
    if (!isPlaying()) return;

    const targetHole = holes().find((h) => h.id === holeId);
    if (!targetHole || !targetHole.bug) return;

    const bugInfo = BUG_TYPES.find((b) => b.emoji === targetHole.bug);
    const pts = bugInfo ? bugInfo.points : 10;

    setScore((s) => Math.max(0, s + pts));

    // Show floating score popup
    setSplatters((prev) => [...prev, { holeId, text: pts > 0 ? `+${pts}` : `${pts}` }]);
    setTimeout(() => {
      setSplatters((prev) => prev.filter((s) => s.holeId !== holeId));
    }, 600);

    // Clear bug from hole
    setHoles((prev) =>
      prev.map((h) => (h.id === holeId ? { ...h, bug: null, type: null } : h))
    );
  }

  onCleanup(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (bugTimeout) clearTimeout(bugTimeout);
  });

  return (
    <div class="flex flex-col items-center gap-5 w-full max-w-md mx-auto font-mono select-none">
      {/* Scoreboard Bar */}
      <div class="flex items-center justify-between w-full px-2">
        <button
          onClick={startGame}
          class="px-3.5 py-1.5 rounded-lg bg-mint/10 border border-mint/30 text-mint hover:bg-mint/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>{isPlaying() ? "🔄 Restart" : "▶ Start Game"}</span>
        </button>

        <div class="flex items-center gap-3">
          <div class="bg-navy/80 border border-slate/20 px-3 py-1.5 rounded-lg text-center">
            <div class="text-[10px] text-slate uppercase font-semibold tracking-wider">Time</div>
            <div class="text-sm font-bold text-mint">{timeLeft()}s</div>
          </div>
          <div class="bg-navy/80 border border-slate/20 px-3 py-1.5 rounded-lg text-center">
            <div class="text-[10px] text-slate uppercase font-semibold tracking-wider">Score</div>
            <div class="text-sm font-bold text-light-slate">{score()}</div>
          </div>
          <div class="bg-navy/80 border border-slate/20 px-3 py-1.5 rounded-lg text-center">
            <div class="text-[10px] text-slate uppercase font-semibold tracking-wider">Best</div>
            <div class="text-sm font-bold text-amber-400">{highScore()}</div>
          </div>
        </div>
      </div>

      {/* Bug Hole Grid */}
      <div class="relative w-full aspect-square bg-navy/90 border border-slate/20 p-4 rounded-2xl shadow-2xl overflow-hidden">
        <div class="grid grid-cols-3 gap-3 h-full w-full">
          <For each={holes()}>
            {(hole) => {
              const isPopped = hole.bug !== null;
              const splatter = splatters().find((s) => s.holeId === hole.id);

              return (
                <button
                  onClick={() => whack(hole.id)}
                  disabled={!isPlaying() || !isPopped}
                  class={`relative rounded-xl border flex items-center justify-center transition-all duration-150 overflow-hidden cursor-pointer ${
                    isPopped
                      ? "bg-light-navy border-mint/50 shadow-lg scale-95"
                      : "bg-navy/80 border-slate/20 hover:border-slate/40"
                  }`}
                >
                  {/* Hole crater pattern */}
                  <div class="w-12 h-6 rounded-full bg-navy/90 border border-slate/30 absolute bottom-3 pointer-events-none"></div>

                  {/* Bug Pop Animation */}
                  <Show when={isPopped}>
                    <span class="text-4xl sm:text-5xl animate-bounce z-10 filter drop-shadow-md">
                      {hole.bug}
                    </span>
                  </Show>

                  {/* Splatter Floating Text */}
                  <Show when={splatter}>
                    <span
                      class={`absolute z-20 font-black text-sm animate-ping ${
                        splatter!.text.startsWith("+") ? "text-mint" : "text-rose-400"
                      }`}
                    >
                      {splatter!.text}
                    </span>
                  </Show>
                </button>
              );
            }}
          </For>
        </div>

        {/* Start Overlay */}
        <Show when={!isPlaying() && !gameOver()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <div class="text-4xl mb-2">🎯</div>
            <h3 class="text-2xl font-serif font-bold text-light-slate mb-1">Whack-a-Bug</h3>
            <p class="text-xs text-slate mb-4 max-w-xs leading-relaxed">
              Squash software bugs as fast as you can! Click bugs for points, avoid 💣 bombs, and catch ⚡ golden bugs!
            </p>
            <button
              onClick={startGame}
              class="px-6 py-2.5 rounded-xl bg-mint text-navy font-bold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              ▶ Start Debugging
            </button>
          </div>
        </Show>

        {/* Game Over Overlay */}
        <Show when={gameOver()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div class="text-4xl mb-2">🏁</div>
            <h3 class="text-2xl font-serif font-bold text-mint mb-1">Time's Up!</h3>
            <p class="text-xs text-slate mb-4">
              Total Bugs Squashed Score: <span class="text-mint font-bold">{score()}</span>
            </p>
            <button
              onClick={startGame}
              class="px-5 py-2.5 rounded-xl bg-mint text-navy font-bold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </Show>
      </div>

      <p class="text-[11px] text-slate text-center">
        Click or tap on bugs as soon as they pop out of the code files!
      </p>
    </div>
  );
}
