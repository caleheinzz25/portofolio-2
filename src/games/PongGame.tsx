import { createSignal, onMount, onCleanup, Show } from "solid-js";

export default function PongGame() {
  let canvasRef: HTMLCanvasElement | undefined;
  let animationFrameId: number | undefined;

  const [playerScore, setPlayerScore] = createSignal(0);
  const [aiScore, setAiScore] = createSignal(0);
  const [gameStarted, setGameStarted] = createSignal(false);
  const [winner, setWinner] = createSignal<string | null>(null);

  // Game state
  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 70;
  const BALL_SIZE = 8;
  const WINNING_SCORE = 5;

  let playerY = 150;
  let aiY = 150;
  let ballX = 200;
  let ballY = 150;
  let ballSpeedX = 4;
  let ballSpeedY = 3;

  let moveUp = false;
  let moveDown = false;

  function resetBall(direction: number = 1) {
    if (!canvasRef) return;
    ballX = canvasRef.width / 2;
    ballY = canvasRef.height / 2;
    ballSpeedX = 4 * direction;
    ballSpeedY = (Math.random() - 0.5) * 6;
  }

  function startNewGame() {
    setPlayerScore(0);
    setAiScore(0);
    setWinner(null);
    setGameStarted(true);

    if (canvasRef) {
      playerY = (canvasRef.height - PADDLE_HEIGHT) / 2;
      aiY = (canvasRef.height - PADDLE_HEIGHT) / 2;
      resetBall();
    }

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") moveUp = true;
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") moveDown = true;
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") moveUp = false;
    if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") moveDown = false;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvasRef || !gameStarted()) return;
    const rect = canvasRef.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    playerY = Math.max(0, Math.min(canvasRef.height - PADDLE_HEIGHT, mouseY - PADDLE_HEIGHT / 2));
  }

  function handleTouchMove(e: TouchEvent) {
    if (!canvasRef || !gameStarted() || e.touches.length === 0) return;
    const rect = canvasRef.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    playerY = Math.max(0, Math.min(canvasRef.height - PADDLE_HEIGHT, touchY - PADDLE_HEIGHT / 2));
  }

  function gameLoop() {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    if (gameStarted() && !winner()) {
      // 1. Move Player
      if (moveUp) playerY = Math.max(0, playerY - 6);
      if (moveDown) playerY = Math.min(canvasRef.height - PADDLE_HEIGHT, playerY + 6);

      // 2. Move AI Paddle
      const aiCenter = aiY + PADDLE_HEIGHT / 2;
      if (aiCenter < ballY - 15) aiY += 3.8;
      else if (aiCenter > ballY + 15) aiY -= 3.8;
      aiY = Math.max(0, Math.min(canvasRef.height - PADDLE_HEIGHT, aiY));

      // 3. Move Ball
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Ball Wall Collisions (Top / Bottom)
      if (ballY - BALL_SIZE <= 0 || ballY + BALL_SIZE >= canvasRef.height) {
        ballSpeedY = -ballSpeedY;
      }

      // Ball Paddle Collisions
      // Player Paddle (Left)
      if (
        ballX - BALL_SIZE <= PADDLE_WIDTH + 10 &&
        ballY >= playerY &&
        ballY <= playerY + PADDLE_HEIGHT
      ) {
        ballSpeedX = Math.abs(ballSpeedX) * 1.05; // Slightly speed up
        const hitPos = (ballY - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedY = hitPos * 5;
        ballX = PADDLE_WIDTH + 10 + BALL_SIZE;
      }

      // AI Paddle (Right)
      if (
        ballX + BALL_SIZE >= canvasRef.width - PADDLE_WIDTH - 10 &&
        ballY >= aiY &&
        ballY <= aiY + PADDLE_HEIGHT
      ) {
        ballSpeedX = -Math.abs(ballSpeedX) * 1.05;
        const hitPos = (ballY - (aiY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedY = hitPos * 5;
        ballX = canvasRef.width - PADDLE_WIDTH - 10 - BALL_SIZE;
      }

      // Scoring
      if (ballX < 0) {
        // AI scores
        const newScore = aiScore() + 1;
        setAiScore(newScore);
        if (newScore >= WINNING_SCORE) {
          setWinner("AI Bot");
          setGameStarted(false);
        } else {
          resetBall(1);
        }
      } else if (ballX > canvasRef.width) {
        // Player scores
        const newScore = playerScore() + 1;
        setPlayerScore(newScore);
        if (newScore >= WINNING_SCORE) {
          setWinner("You");
          setGameStarted(false);
        } else {
          resetBall(-1);
        }
      }
    }

    // Render Canvas
    ctx.fillStyle = "#0D1B2A";
    ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);

    // Center Dashed Line
    ctx.strokeStyle = "rgba(75, 85, 99, 0.4)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(canvasRef.width / 2, 0);
    ctx.lineTo(canvasRef.width / 2, canvasRef.height);
    ctx.stroke();

    // Player Paddle (Mint)
    ctx.fillStyle = "#10B981";
    ctx.fillRect(10, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // AI Paddle (Right)
    ctx.fillStyle = "#94A3B8";
    ctx.fillRect(canvasRef.width - PADDLE_WIDTH - 10, aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Ball
    ctx.fillStyle = "#10B981";
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_SIZE, 0, Math.PI * 2);
    ctx.fill();

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  onMount(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    if (canvasRef) {
      canvasRef.width = 440;
      canvasRef.height = 300;
      playerY = (canvasRef.height - PADDLE_HEIGHT) / 2;
      aiY = (canvasRef.height - PADDLE_HEIGHT) / 2;
      ballX = canvasRef.width / 2;
      ballY = canvasRef.height / 2;
    }

    animationFrameId = requestAnimationFrame(gameLoop);
  });

  onCleanup(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    }
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  });

  return (
    <div class="flex flex-col items-center gap-4 w-full max-w-md mx-auto font-mono select-none">
      {/* Scoreboard */}
      <div class="flex items-center justify-between w-full px-4 bg-navy/80 border border-slate/20 p-2.5 rounded-xl">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-mint"></span>
          <span class="text-xs font-bold text-light-slate">You</span>
          <span class="text-lg font-bold text-mint ml-2">{playerScore()}</span>
        </div>

        <span class="text-xs text-slate font-bold">VS</span>

        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-light-slate mr-2">{aiScore()}</span>
          <span class="text-xs font-bold text-light-slate">AI Bot</span>
          <span class="w-3 h-3 rounded-full bg-slate"></span>
        </div>
      </div>

      {/* Canvas Box */}
      <div class="relative w-full border border-mint/40 rounded-2xl overflow-hidden shadow-2xl bg-navy">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          class="w-full aspect-[44/30] cursor-pointer touch-none block"
        />

        {/* Start Overlay */}
        <Show when={!gameStarted() && !winner()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
            <div class="text-4xl mb-2">🎮</div>
            <h3 class="text-2xl font-serif font-bold text-light-slate mb-1">Retro Pong</h3>
            <p class="text-xs text-slate mb-4">First player to score 5 points wins!</p>
            <button
              onClick={startNewGame}
              class="px-6 py-2.5 rounded-xl bg-mint text-navy font-bold text-sm hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              ▶ Start Pong Match
            </button>
          </div>
        </Show>

        {/* Win / Loss Overlay */}
        <Show when={winner()}>
          <div class="absolute inset-0 bg-navy/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in">
            <div class="text-4xl mb-2">{winner() === "You" ? "🏆" : "🤖"}</div>
            <h3 class="text-2xl font-serif font-bold text-mint mb-1">
              {winner() === "You" ? "You Won!" : "AI Bot Won!"}
            </h3>
            <p class="text-xs text-slate mb-4">
              Final Score: {playerScore()} - {aiScore()}
            </p>
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
        Use <kbd class="px-1 py-0.5 bg-slate/20 rounded text-mint">W/S</kbd>, <kbd class="px-1 py-0.5 bg-slate/20 rounded text-mint">Arrow Keys</kbd> or drag mouse/touch to control paddle!
      </p>
    </div>
  );
}
