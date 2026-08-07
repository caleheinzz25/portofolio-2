import { createSignal, For, Show } from "solid-js";

type Grid = number[][];

const PUZZLES: Record<string, { board: Grid; solution: Grid }> = {
  easy: {
    board: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
  medium: {
    board: [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
    solution: [
      [4, 3, 5, 2, 6, 9, 7, 8, 1],
      [6, 8, 2, 5, 7, 1, 4, 9, 3],
      [1, 9, 7, 8, 3, 4, 5, 6, 2],
      [8, 2, 6, 1, 9, 5, 3, 4, 7],
      [3, 7, 4, 6, 8, 2, 9, 1, 5],
      [9, 5, 1, 7, 4, 3, 6, 2, 8],
      [5, 1, 9, 3, 2, 6, 8, 7, 4],
      [2, 4, 8, 9, 5, 7, 1, 3, 6],
      [7, 6, 3, 4, 1, 8, 2, 5, 9],
    ],
  },
};

export default function SudokuGame() {
  const [diff, setDiff] = createSignal<"easy" | "medium">("easy");
  const [grid, setGrid] = createSignal<Grid>(
    PUZZLES.easy.board.map((r) => [...r])
  );
  const [selectedCell, setSelectedCell] = createSignal<[number, number] | null>(null);
  const [gameWon, setGameWon] = createSignal(false);
  const [errors, setErrors] = createSignal<string[]>([]);

  function loadPuzzle(d: "easy" | "medium") {
    setDiff(d);
    setGrid(PUZZLES[d].board.map((r) => [...r]));
    setSelectedCell(null);
    setGameWon(false);
    setErrors([]);
  }

  function isInitial(r: number, c: number): boolean {
    return PUZZLES[diff()].board[r][c] !== 0;
  }

  function handleNumberInput(num: number) {
    const sel = selectedCell();
    if (!sel) return;
    const [r, c] = sel;

    if (isInitial(r, c)) return;

    const newGrid = grid().map((row) => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);

    checkCompletion(newGrid);
  }

  function handleErase() {
    const sel = selectedCell();
    if (!sel) return;
    const [r, c] = sel;
    if (isInitial(r, c)) return;

    const newGrid = grid().map((row) => [...row]);
    newGrid[r][c] = 0;
    setGrid(newGrid);
  }

  function checkCompletion(currentGrid: Grid) {
    const solution = PUZZLES[diff()].solution;
    let isComplete = true;
    let newErrors: string[] = [];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = currentGrid[r][c];
        if (val === 0) {
          isComplete = false;
        } else if (val !== solution[r][c]) {
          newErrors.push(`${r}-${c}`);
          isComplete = false;
        }
      }
    }

    setErrors(newErrors);

    if (isComplete && newErrors.length === 0) {
      setGameWon(true);
    }
  }

  return (
    <div class="flex flex-col items-center gap-5 w-full max-w-md mx-auto font-mono select-none">
      {/* Difficulty Bar */}
      <div class="flex items-center justify-between w-full px-2">
        <div class="flex items-center gap-2">
          <button
            onClick={() => loadPuzzle("easy")}
            class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              diff() === "easy"
                ? "bg-mint text-navy font-bold"
                : "bg-navy/80 border border-slate/20 text-slate hover:text-light-slate"
            }`}
          >
            Easy
          </button>
          <button
            onClick={() => loadPuzzle("medium")}
            class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              diff() === "medium"
                ? "bg-mint text-navy font-bold"
                : "bg-navy/80 border border-slate/20 text-slate hover:text-light-slate"
            }`}
          >
            Medium
          </button>
        </div>

        <button
          onClick={() => loadPuzzle(diff())}
          class="px-3 py-1.5 rounded-lg bg-mint/10 border border-mint/30 text-mint text-xs font-bold hover:bg-mint/20 cursor-pointer"
        >
          🔄 Restart
        </button>
      </div>

      {/* 9x9 Sudoku Board Grid */}
      <div class="relative w-full aspect-square bg-navy/90 border border-mint/40 p-2 rounded-2xl shadow-2xl overflow-hidden">
        <div class="grid grid-cols-9 grid-rows-9 h-full w-full border border-slate/30 rounded-lg overflow-hidden">
          <For each={grid()}>
            {(row, rIdx) => (
              <For each={row}>
                {(val, cIdx) => {
                  const initial = isInitial(rIdx(), cIdx());
                  const isSelected =
                    selectedCell()?.[0] === rIdx() && selectedCell()?.[1] === cIdx();
                  const isError = errors().includes(`${rIdx()}-${cIdx()}`);

                  const thickRight = (cIdx() + 1) % 3 === 0 && cIdx() < 8;
                  const thickBottom = (rIdx() + 1) % 3 === 0 && rIdx() < 8;

                  return (
                    <button
                      onClick={() => setSelectedCell([rIdx(), cIdx()])}
                      class={`flex items-center justify-center text-sm sm:text-base font-bold transition-all border border-slate/15 cursor-pointer ${
                        thickRight ? "border-r-2 border-r-mint/50" : ""
                      } ${thickBottom ? "border-b-2 border-b-mint/50" : ""} ${
                        isSelected ? "bg-mint/25 ring-2 ring-mint z-10" : ""
                      } ${
                        initial
                          ? "bg-light-navy/60 text-light-slate font-black"
                          : val > 0
                          ? isError
                            ? "bg-rose-500/20 text-rose-400"
                            : "bg-navy/80 text-mint"
                          : "bg-navy/40 hover:bg-light-navy/30"
                      }`}
                    >
                      {val > 0 ? val : ""}
                    </button>
                  );
                }}
              </For>
            )}
          </For>
        </div>

        {/* Win Overlay */}
        <Show when={gameWon()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div class="text-4xl mb-2">🎉</div>
            <h3 class="text-2xl font-serif font-bold text-mint mb-1">Sudoku Solved!</h3>
            <p class="text-xs text-slate mb-4">Awesome job completing the puzzle!</p>
            <button
              onClick={() => loadPuzzle(diff())}
              class="px-5 py-2.5 rounded-xl bg-mint text-navy font-bold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </Show>
      </div>

      {/* Keypad */}
      <div class="flex items-center justify-center gap-1.5 w-full max-w-sm">
        <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9]}>
          {(num) => (
            <button
              onClick={() => handleNumberInput(num)}
              class="flex-1 h-10 rounded-lg bg-light-navy border border-slate/20 text-mint font-bold text-sm hover:bg-mint/10 active:bg-mint/20 cursor-pointer"
            >
              {num}
            </button>
          )}
        </For>
        <button
          onClick={handleErase}
          class="h-10 px-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs hover:bg-rose-500/20 cursor-pointer"
        >
          ⌫
        </button>
      </div>

      <p class="text-[11px] text-slate text-center">
        Select a cell and tap a number to fill in the grid!
      </p>
    </div>
  );
}
