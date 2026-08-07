import { createSignal, onMount, onCleanup, For, Show } from "solid-js";

type Board = number[][];

const BOARD_SIZE = 4;

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
}

function getEmptyCells(board: Board): [number, number][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  return empty;
}

function addRandomTile(board: Board): Board {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newBoard = board.map((row) => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

function slideRowLeft(row: number[]): { newRow: number[]; scoreGained: number } {
  const nonZeros = row.filter((val) => val !== 0);
  const newRow: number[] = [];
  let scoreGained = 0;
  let i = 0;

  while (i < nonZeros.length) {
    if (i + 1 < nonZeros.length && nonZeros[i] === nonZeros[i + 1]) {
      const merged = nonZeros[i] * 2;
      newRow.push(merged);
      scoreGained += merged;
      i += 2;
    } else {
      newRow.push(nonZeros[i]);
      i += 1;
    }
  }

  while (newRow.length < BOARD_SIZE) {
    newRow.push(0);
  }

  return { newRow, scoreGained };
}

function rotateBoard(board: Board): Board {
  const rotated = createEmptyBoard();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      rotated[c][BOARD_SIZE - 1 - r] = board[r][c];
    }
  }
  return rotated;
}

function move(board: Board, direction: "left" | "right" | "up" | "down"): { newBoard: Board; scoreGained: number; moved: boolean } {
  let rotated = board.map((row) => [...row]);
  let rotations = 0;

  if (direction === "up") rotations = 3;
  else if (direction === "right") rotations = 2;
  else if (direction === "down") rotations = 1;

  for (let i = 0; i < rotations; i++) {
    rotated = rotateBoard(rotated);
  }

  let totalScoreGained = 0;
  const movedBoard: Board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const { newRow, scoreGained } = slideRowLeft(rotated[r]);
    movedBoard.push(newRow);
    totalScoreGained += scoreGained;
  }

  let finalBoard = movedBoard;
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    finalBoard = rotateBoard(finalBoard);
  }

  let moved = false;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== finalBoard[r][c]) {
        moved = true;
        break;
      }
    }
  }

  return { newBoard: finalBoard, scoreGained: totalScoreGained, moved };
}

function hasValidMoves(board: Board): boolean {
  if (getEmptyCells(board).length > 0) return true;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const val = board[r][c];
      if (c + 1 < BOARD_SIZE && board[r][c + 1] === val) return true;
      if (r + 1 < BOARD_SIZE && board[r + 1][c] === val) return true;
    }
  }
  return false;
}

function hasTile2048(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] >= 2048) return true;
    }
  }
  return false;
}

export default function Game2048() {
  const [board, setBoard] = createSignal<Board>(createEmptyBoard());
  const [score, setScore] = createSignal(0);
  const [bestScore, setBestScore] = createSignal(0);
  const [gameOver, setGameOver] = createSignal(false);
  const [gameWon, setGameWon] = createSignal(false);
  const [hasWonBefore, setHasWonBefore] = createSignal(false);

  onMount(() => {
    try {
      const savedBest = localStorage.getItem("game2048-best-score");
      if (savedBest) setBestScore(parseInt(savedBest, 10) || 0);
    } catch (e) {}

    resetGame();
    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeyDown);
    }
  });

  function resetGame() {
    let b = createEmptyBoard();
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setHasWonBefore(false);
  }

  function handleMove(dir: "left" | "right" | "up" | "down") {
    if (gameOver()) return;

    const currentBoard = board();
    const { newBoard, scoreGained, moved } = move(currentBoard, dir);

    if (moved) {
      const updatedBoard = addRandomTile(newBoard);
      setBoard(updatedBoard);

      const newScore = score() + scoreGained;
      setScore(newScore);

      if (newScore > bestScore()) {
        setBestScore(newScore);
        try {
          localStorage.setItem("game2048-best-score", String(newScore));
        } catch (e) {}
      }

      if (!hasWonBefore() && hasTile2048(updatedBoard)) {
        setGameWon(true);
        setHasWonBefore(true);
      }

      if (!hasValidMoves(updatedBoard)) {
        setGameOver(true);
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") handleMove("left");
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") handleMove("right");
    else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") handleMove("up");
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") handleMove("down");
  }

  function getTileColor(val: number): { bg: string; text: string } {
    switch (val) {
      case 2: return { bg: "bg-emerald-950/40 border-emerald-500/30", text: "text-emerald-300" };
      case 4: return { bg: "bg-emerald-900/50 border-emerald-500/50", text: "text-emerald-200" };
      case 8: return { bg: "bg-emerald-700/70 border-emerald-400", text: "text-white" };
      case 16: return { bg: "bg-emerald-600 border-emerald-300", text: "text-white" };
      case 32: return { bg: "bg-teal-600 border-teal-300", text: "text-white" };
      case 64: return { bg: "bg-cyan-600 border-cyan-300", text: "text-white" };
      case 128: return { bg: "bg-amber-600 border-amber-300", text: "text-amber-100" };
      case 256: return { bg: "bg-amber-500 border-amber-200", text: "text-white" };
      case 512: return { bg: "bg-orange-500 border-orange-200", text: "text-white" };
      case 1024: return { bg: "bg-rose-600 border-rose-200", text: "text-white" };
      case 2048: return { bg: "bg-purple-600 border-purple-200", text: "text-white font-black animate-pulse" };
      default: return { bg: "bg-purple-800 border-purple-300", text: "text-white font-black" };
    }
  }

  return (
    <div class="flex flex-col items-center gap-5 w-full max-w-md mx-auto font-mono select-none">
      {/* Header / Scoreboard */}
      <div class="flex items-center justify-between w-full px-2">
        <div class="flex items-center gap-2">
          <button
            onClick={resetGame}
            class="px-3.5 py-1.5 rounded-lg bg-mint/10 border border-mint/30 text-mint hover:bg-mint/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄</span> Reset
          </button>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-navy/80 border border-slate/20 px-3 py-1.5 rounded-lg text-center min-w-[70px]">
            <div class="text-[10px] text-slate uppercase font-semibold tracking-wider">Score</div>
            <div class="text-sm font-bold text-mint">{score()}</div>
          </div>
          <div class="bg-navy/80 border border-slate/20 px-3 py-1.5 rounded-lg text-center min-w-[70px]">
            <div class="text-[10px] text-slate uppercase font-semibold tracking-wider">Best</div>
            <div class="text-sm font-bold text-light-slate">{bestScore()}</div>
          </div>
        </div>
      </div>

      {/* 2048 Grid Container */}
      <div class="relative w-full aspect-square bg-navy/90 border border-slate/20 p-3 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
        <div class="grid grid-cols-4 gap-2.5 h-full w-full">
          <For each={board()}>
            {(row) => (
              <For each={row}>
                {(val) => {
                  const colors = getTileColor(val);
                  return (
                    <div
                      class={`rounded-xl border flex items-center justify-center font-bold transition-all duration-150 text-xl sm:text-2xl shadow-inner ${
                        val === 0
                          ? "bg-light-navy/30 border-slate/10 text-transparent"
                          : `${colors.bg} ${colors.text} shadow-md`
                      }`}
                    >
                      {val > 0 ? val : ""}
                    </div>
                  );
                }}
              </For>
            )}
          </For>
        </div>

        {/* Game Over Overlay */}
        <Show when={gameOver()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div class="text-4xl mb-2">💔</div>
            <h3 class="text-2xl font-serif font-bold text-rose-400 mb-1">Game Over!</h3>
            <p class="text-xs text-slate mb-4">No more moves left. Final Score: <span class="text-mint font-bold">{score()}</span></p>
            <button
              onClick={resetGame}
              class="px-5 py-2.5 rounded-xl bg-mint text-navy font-bold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </Show>

        {/* Win Overlay */}
        <Show when={gameWon() && !gameOver()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div class="text-4xl mb-2">🎉</div>
            <h3 class="text-2xl font-serif font-bold text-mint mb-1">You reached 2048!</h3>
            <p class="text-xs text-slate mb-4">Great job! Score: <span class="text-mint font-bold">{score()}</span></p>
            <div class="flex items-center gap-3">
              <button
                onClick={() => setGameWon(false)}
                class="px-4 py-2 rounded-xl bg-slate/20 border border-slate/30 text-light-slate font-bold text-xs hover:bg-slate/30 cursor-pointer"
              >
                Keep Playing
              </button>
              <button
                onClick={resetGame}
                class="px-4 py-2 rounded-xl bg-mint text-navy font-bold text-xs hover:scale-105 cursor-pointer"
              >
                Play Again
              </button>
            </div>
          </div>
        </Show>
      </div>

      {/* Mobile On-Screen D-Pad Controls */}
      <div class="flex flex-col items-center gap-1.5 mt-1 sm:hidden">
        <button
          onClick={() => handleMove("up")}
          class="w-12 h-10 rounded-lg bg-light-navy border border-slate/20 text-mint text-lg flex items-center justify-center active:bg-mint/20"
        >
          ▲
        </button>
        <div class="flex items-center gap-3">
          <button
            onClick={() => handleMove("left")}
            class="w-12 h-10 rounded-lg bg-light-navy border border-slate/20 text-mint text-lg flex items-center justify-center active:bg-mint/20"
          >
            ◀
          </button>
          <button
            onClick={() => handleMove("down")}
            class="w-12 h-10 rounded-lg bg-light-navy border border-slate/20 text-mint text-lg flex items-center justify-center active:bg-mint/20"
          >
            ▼
          </button>
          <button
            onClick={() => handleMove("right")}
            class="w-12 h-10 rounded-lg bg-light-navy border border-slate/20 text-mint text-lg flex items-center justify-center active:bg-mint/20"
          >
            ▶
          </button>
        </div>
      </div>

      <p class="text-[11px] text-slate text-center mt-1">
        Use <kbd class="px-1 py-0.5 bg-slate/20 rounded text-mint">Arrow Keys</kbd> or <kbd class="px-1 py-0.5 bg-slate/20 rounded text-mint">WASD</kbd> to merge matching numbered tiles.
      </p>
    </div>
  );
}
