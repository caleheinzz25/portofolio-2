import { createSignal, onCleanup, For, Show } from "solid-js";

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

const ROWS = 9;
const COLS = 9;
const TOTAL_MINES = 10;

function createEmptyGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        r,
        c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      });
    }
    grid.push(row);
  }
  return grid;
}

function initializeMines(initialR: number, initialC: number): Cell[][] {
  const grid = createEmptyGrid();
  let minesPlaced = 0;

  while (minesPlaced < TOTAL_MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);

    // Don't place mine on initial click or existing mine
    if (!grid[r][c].isMine && !(r === initialR && c === initialC)) {
      grid[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate adjacent mines
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].isMine) {
            count++;
          }
        }
      }
      grid[r][c].adjacentMines = count;
    }
  }

  return grid;
}

export default function MinesweeperGame() {
  const [grid, setGrid] = createSignal<Cell[][]>(createEmptyGrid());
  const [isFirstClick, setIsFirstClick] = createSignal(true);
  const [gameOver, setGameOver] = createSignal(false);
  const [gameWon, setGameWon] = createSignal(false);
  const [timer, setTimer] = createSignal(0);
  const [flaggedCount, setFlaggedCount] = createSignal(0);
  const [flagMode, setFlagMode] = createSignal(false); // Mobile flag toggle

  let timerInterval: number | undefined;

  function startNewGame() {
    setGrid(createEmptyGrid());
    setIsFirstClick(true);
    setGameOver(false);
    setGameWon(false);
    setTimer(0);
    setFlaggedCount(0);
    if (timerInterval) clearInterval(timerInterval);
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000) as unknown as number;
  }

  function revealCell(r: number, c: number) {
    if (gameOver() || gameWon()) return;

    let currentGrid = grid();

    // Initialize mines on first click
    if (isFirstClick()) {
      currentGrid = initializeMines(r, c);
      setIsFirstClick(false);
      startTimer();
    }

    const cell = currentGrid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    // Hit Mine -> Game Over
    if (cell.isMine) {
      if (timerInterval) clearInterval(timerInterval);
      setGameOver(true);
      // Reveal all mines
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cellItem) =>
            cellItem.isMine ? { ...cellItem, isRevealed: true } : cellItem
          )
        )
      );
      return;
    }

    // Cascade reveal 0-neighbor empty cells
    const newGrid = currentGrid.map((row) => row.map((cellItem) => ({ ...cellItem })));

    function cascade(cr: number, cc: number) {
      if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) return;
      const target = newGrid[cr][cc];
      if (target.isRevealed || target.isFlagged || target.isMine) return;

      target.isRevealed = true;

      if (target.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) cascade(cr + dr, cc + dc);
          }
        }
      }
    }

    cascade(r, c);
    setGrid(newGrid);

    checkWin(newGrid);
  }

  function toggleFlag(e: MouseEvent | TouchEvent, r: number, c: number) {
    e.preventDefault();
    if (gameOver() || gameWon()) return;

    const cell = grid()[r][c];
    if (cell.isRevealed) return;

    const newGrid = grid().map((row) => row.map((cellItem) => ({ ...cellItem })));
    const target = newGrid[r][c];

    target.isFlagged = !target.isFlagged;
    setGrid(newGrid);

    let count = 0;
    newGrid.forEach((row) => row.forEach((cellItem) => {
      if (cellItem.isFlagged) count++;
    }));
    setFlaggedCount(count);
  }

  function handleCellClick(r: number, c: number) {
    if (flagMode()) {
      const cell = grid()[r][c];
      if (!cell.isRevealed) {
        const fakeEvt = { preventDefault: () => {} } as MouseEvent;
        toggleFlag(fakeEvt, r, c);
      }
    } else {
      revealCell(r, c);
    }
  }

  function checkWin(currentGrid: Cell[][]) {
    let unrevealedNonMines = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = currentGrid[r][c];
        if (!cell.isMine && !cell.isRevealed) {
          unrevealedNonMines++;
        }
      }
    }

    if (unrevealedNonMines === 0) {
      setGameWon(true);
      if (timerInterval) clearInterval(timerInterval);
    }
  }

  onCleanup(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  function getNumberColor(num: number): string {
    switch (num) {
      case 1: return "text-blue-400";
      case 2: return "text-emerald-400";
      case 3: return "text-rose-400";
      case 4: return "text-purple-400";
      case 5: return "text-amber-400";
      default: return "text-teal-400";
    }
  }

  return (
    <div class="flex flex-col items-center gap-5 w-full max-w-md mx-auto font-mono select-none">
      {/* Status Header */}
      <div class="flex items-center justify-between w-full px-2">
        <button
          onClick={startNewGame}
          class="px-3.5 py-1.5 rounded-lg bg-mint/10 border border-mint/30 text-mint hover:bg-mint/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>🔄 Restart</span>
        </button>

        <div class="flex items-center gap-3">
          {/* Mobile Flag Toggle */}
          <button
            onClick={() => setFlagMode(!flagMode())}
            class={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 sm:hidden ${
              flagMode()
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "bg-navy/80 border-slate/20 text-slate"
            }`}
          >
            <span>🚩</span> {flagMode() ? "Flag" : "Dig"}
          </button>

          <div class="bg-navy/80 border border-slate/20 px-3 py-1.5 rounded-lg text-center">
            <div class="text-[10px] text-slate uppercase font-semibold tracking-wider">Mines</div>
            <div class="text-sm font-bold text-rose-400">{TOTAL_MINES - flaggedCount()}</div>
          </div>

          <div class="bg-navy/80 border border-slate/20 px-3 py-1.5 rounded-lg text-center">
            <div class="text-[10px] text-slate uppercase font-semibold tracking-wider">Time</div>
            <div class="text-sm font-bold text-mint">{timer()}s</div>
          </div>
        </div>
      </div>

      {/* Minesweeper Grid */}
      <div class="relative w-full aspect-square bg-navy/90 border border-mint/40 p-3 rounded-2xl shadow-2xl overflow-hidden">
        <div class="grid grid-cols-9 grid-rows-9 h-full w-full gap-1">
          <For each={grid()}>
            {(row, rIdx) => (
              <For each={row}>
                {(cell, cIdx) => (
                  <button
                    onClick={() => handleCellClick(rIdx(), cIdx())}
                    onContextMenu={(e) => toggleFlag(e, rIdx(), cIdx())}
                    class={`flex items-center justify-center rounded-lg text-sm sm:text-base font-bold transition-all border cursor-pointer ${
                      cell.isRevealed
                        ? cell.isMine
                          ? "bg-rose-600/80 border-rose-400 text-white"
                          : "bg-navy/90 border-slate/20 text-light-slate"
                        : "bg-light-navy/80 border-slate/30 hover:border-mint/50 hover:bg-light-navy"
                    }`}
                  >
                    <Show when={cell.isRevealed}>
                      {cell.isMine ? "💣" : cell.adjacentMines > 0 ? (
                        <span class={getNumberColor(cell.adjacentMines)}>{cell.adjacentMines}</span>
                      ) : ""}
                    </Show>
                    <Show when={!cell.isRevealed && cell.isFlagged}>
                      <span class="text-amber-400">🚩</span>
                    </Show>
                  </button>
                )}
              </For>
            )}
          </For>
        </div>

        {/* Game Over Overlay */}
        <Show when={gameOver()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div class="text-4xl mb-2">💥</div>
            <h3 class="text-2xl font-serif font-bold text-rose-400 mb-1">BOOM! Game Over</h3>
            <p class="text-xs text-slate mb-4">You hit a mine! Better luck next time.</p>
            <button
              onClick={startNewGame}
              class="px-5 py-2.5 rounded-xl bg-mint text-navy font-bold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </Show>

        {/* Win Overlay */}
        <Show when={gameWon()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div class="text-4xl mb-2">🏆</div>
            <h3 class="text-2xl font-serif font-bold text-mint mb-1">Mines Cleared!</h3>
            <p class="text-xs text-slate mb-4">Completed in <span class="text-mint font-bold">{timer()} seconds</span>!</p>
            <button
              onClick={startNewGame}
              class="px-5 py-2.5 rounded-xl bg-mint text-navy font-bold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              Play Again
            </button>
          </div>
        </Show>
      </div>

      <p class="text-[11px] text-slate text-center">
        Left-click to dig cells. Right-click or use <span class="text-amber-400 font-bold">🚩 Flag</span> mode to mark mines!
      </p>
    </div>
  );
}
