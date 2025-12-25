import { createSignal, onMount, onCleanup, createEffect } from "solid-js";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

export default function SnakeGame() {
    const [snake, setSnake] = createSignal<Position[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = createSignal<Position>({ x: 15, y: 15 });
    const [direction, setDirection] = createSignal<Direction>("RIGHT");
    const [gameOver, setGameOver] = createSignal(false);
    const [score, setScore] = createSignal(0);
    const [highScore, setHighScore] = createSignal(0);
    const [isPaused, setIsPaused] = createSignal(false);
    const [gameStarted, setGameStarted] = createSignal(false);

    let gameLoop: number | undefined;

    const generateFood = (): Position => {
        let newFood: Position;
        do {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
        } while (snake().some((segment) => segment.x === newFood.x && segment.y === newFood.y));
        return newFood;
    };

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood(generateFood());
        setDirection("RIGHT");
        setGameOver(false);
        setScore(0);
        setIsPaused(false);
        setGameStarted(true);
    };

    const moveSnake = () => {
        if (gameOver() || isPaused() || !gameStarted()) return;

        const currentSnake = snake();
        const head = { ...currentSnake[0] };

        switch (direction()) {
            case "UP":
                head.y -= 1;
                break;
            case "DOWN":
                head.y += 1;
                break;
            case "LEFT":
                head.x -= 1;
                break;
            case "RIGHT":
                head.x += 1;
                break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            setGameOver(true);
            if (score() > highScore()) {
                setHighScore(score());
            }
            return;
        }

        // Check self collision
        if (currentSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
            setGameOver(true);
            if (score() > highScore()) {
                setHighScore(score());
            }
            return;
        }

        const newSnake = [head, ...currentSnake];

        // Check food collision
        if (head.x === food().x && head.y === food().y) {
            setScore(score() + 10);
            setFood(generateFood());
        } else {
            newSnake.pop();
        }

        setSnake(newSnake);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === " ") {
            e.preventDefault();
            if (gameOver()) {
                resetGame();
            } else if (gameStarted()) {
                setIsPaused(!isPaused());
            } else {
                setGameStarted(true);
            }
            return;
        }

        if (gameOver() || isPaused() || !gameStarted()) return;

        const currentDirection = direction();
        switch (e.key) {
            case "ArrowUp":
            case "w":
            case "W":
                if (currentDirection !== "DOWN") setDirection("UP");
                break;
            case "ArrowDown":
            case "s":
            case "S":
                if (currentDirection !== "UP") setDirection("DOWN");
                break;
            case "ArrowLeft":
            case "a":
            case "A":
                if (currentDirection !== "RIGHT") setDirection("LEFT");
                break;
            case "ArrowRight":
            case "d":
            case "D":
                if (currentDirection !== "LEFT") setDirection("RIGHT");
                break;
        }
    };

    onMount(() => {
        document.addEventListener("keydown", handleKeyDown);
        gameLoop = setInterval(moveSnake, INITIAL_SPEED) as unknown as number;

        onCleanup(() => {
            document.removeEventListener("keydown", handleKeyDown);
            if (gameLoop) clearInterval(gameLoop);
        });
    });

    return (
        <>
            <div class="flex flex-col items-center gap-6 p-4">
                {/* Score Board */}
                <div class="flex gap-8 text-lg font-mono">
                    <div class="text-slate">
                        Score: <span class="text-mint font-bold">{score()}</span>
                    </div>
                    <div class="text-slate">
                        High Score: <span class="text-yellow-400 font-bold">{highScore()}</span>
                    </div>
                </div>

                {/* Game Board */}
                <div
                    class="relative border-2 border-mint/50 rounded-lg overflow-hidden bg-navy"
                    style={{
                        width: `${GRID_SIZE * CELL_SIZE}px`,
                        height: `${GRID_SIZE * CELL_SIZE}px`,
                    }}
                >
                    {/* Grid Background */}
                    <div
                        class="absolute inset-0 opacity-10"
                        style={{
                            "background-image": `
              linear-gradient(to right, #64ffda 1px, transparent 1px),
              linear-gradient(to bottom, #64ffda 1px, transparent 1px)
            `,
                            "background-size": `${CELL_SIZE}px ${CELL_SIZE}px`,
                        }}
                    />

                    {/* Snake */}
                    {snake().map((segment, index) => (
                        <div
                            class={`absolute rounded-sm transition-all duration-75 ${index === 0
                                ? "bg-mint shadow-lg shadow-mint/50"
                                : "bg-mint/70"
                                }`}
                            style={{
                                left: `${segment.x * CELL_SIZE}px`,
                                top: `${segment.y * CELL_SIZE}px`,
                                width: `${CELL_SIZE - 2}px`,
                                height: `${CELL_SIZE - 2}px`,
                            }}
                        />
                    ))}

                    {/* Food */}
                    <div
                        class="absolute bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"
                        style={{
                            left: `${food().x * CELL_SIZE}px`,
                            top: `${food().y * CELL_SIZE}px`,
                            width: `${CELL_SIZE - 2}px`,
                            height: `${CELL_SIZE - 2}px`,
                        }}
                    />

                    {/* Overlay Messages */}
                    {!gameStarted() && !gameOver() && (
                        <div class="absolute inset-0 flex items-center justify-center bg-navy/80 backdrop-blur-sm">
                            <div class="text-center">
                                <div class="text-mint text-2xl font-bold mb-4">🐍 Snake Game</div>
                                <div class="text-slate text-sm mb-4">
                                    Use Arrow Keys or WASD to move
                                </div>
                                <button
                                    onClick={() => setGameStarted(true)}
                                    class="px-6 py-2 bg-mint text-navy font-bold rounded-lg hover:bg-mint/80 transition-colors"
                                >
                                    Press SPACE or Click to Start
                                </button>
                            </div>
                        </div>
                    )}

                    {isPaused() && !gameOver() && (
                        <div class="absolute inset-0 flex items-center justify-center bg-navy/80 backdrop-blur-sm">
                            <div class="text-center">
                                <div class="text-yellow-400 text-2xl font-bold mb-4">⏸️ Paused</div>
                                <div class="text-slate text-sm">Press SPACE to Resume</div>
                            </div>
                        </div>
                    )}

                    {gameOver() && (
                        <div class="absolute inset-0 flex items-center justify-center bg-navy/80 backdrop-blur-sm">
                            <div class="text-center">
                                <div class="text-red-500 text-2xl font-bold mb-2">💀 Game Over!</div>
                                <div class="text-mint text-lg mb-4">Score: {score()}</div>
                                <button
                                    onClick={resetGame}
                                    class="px-6 py-2 bg-mint text-navy font-bold rounded-lg hover:bg-mint/80 transition-colors"
                                >
                                    Play Again (SPACE)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Info */}
                <div class="flex flex-wrap justify-center gap-4 text-sm text-slate">
                    <div class="flex items-center gap-2">
                        <kbd class="px-2 py-1 bg-light-navy rounded border border-slate/30">↑↓←→</kbd>
                        <span>or</span>
                        <kbd class="px-2 py-1 bg-light-navy rounded border border-slate/30">WASD</kbd>
                        <span>Move</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <kbd class="px-2 py-1 bg-light-navy rounded border border-slate/30">SPACE</kbd>
                        <span>Pause/Resume</span>
                    </div>
                </div>
            </div>
        </>
    );
}
