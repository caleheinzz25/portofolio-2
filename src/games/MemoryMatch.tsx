import { createSignal, createEffect, onCleanup, For, Show } from "solid-js";

/* ── Types ─────────────────────────────────────── */
interface Card {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
}

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG: Record<Difficulty, { cols: number; rows: number; label: string }> = {
    easy: { cols: 4, rows: 3, label: "4 × 3" },
    medium: { cols: 4, rows: 4, label: "4 × 4" },
    hard: { cols: 6, rows: 4, label: "6 × 4" },
};

const EMOJI_POOL = [
    "🚀", "🌙", "⚡", "🔥", "🎯", "💎", "🌸", "🦊",
    "🐉", "🎭", "🍀", "🌊", "🦋", "🎵", "🧊", "🌈",
];

/* ── Helpers ───────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildDeck(difficulty: Difficulty): Card[] {
    const { cols, rows } = DIFFICULTY_CONFIG[difficulty];
    const pairCount = (cols * rows) / 2;
    const emojis = shuffle(EMOJI_POOL).slice(0, pairCount);
    const doubled = shuffle([...emojis, ...emojis]);
    return doubled.map((emoji, i) => ({
        id: i,
        emoji,
        isFlipped: false,
        isMatched: false,
    }));
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Component ─────────────────────────────────── */
export default function MemoryMatch() {
    const [difficulty, setDifficulty] = createSignal<Difficulty>("medium");
    const [cards, setCards] = createSignal<Card[]>(buildDeck("medium"));
    const [flippedIds, setFlippedIds] = createSignal<number[]>([]);
    const [moves, setMoves] = createSignal(0);
    const [matches, setMatches] = createSignal(0);
    const [timer, setTimer] = createSignal(0);
    const [isRunning, setIsRunning] = createSignal(false);
    const [gameWon, setGameWon] = createSignal(false);
    const [combo, setCombo] = createSignal(0);
    const [bestScore, setBestScore] = createSignal<Record<Difficulty, number | null>>({
        easy: null,
        medium: null,
        hard: null,
    });
    const [lockedOut, setLockedOut] = createSignal(false);
    const [lastMatchIds, setLastMatchIds] = createSignal<number[]>([]);

    /* Timer */
    let interval: number | undefined;

    createEffect(() => {
        if (isRunning() && !gameWon()) {
            interval = setInterval(() => setTimer((t) => t + 1), 1000) as unknown as number;
        } else if (interval) {
            clearInterval(interval);
        }
    });

    onCleanup(() => {
        if (interval) clearInterval(interval);
    });

    /* Derived */
    const totalPairs = () => {
        const { cols, rows } = DIFFICULTY_CONFIG[difficulty()];
        return (cols * rows) / 2;
    };

    const score = () => {
        if (matches() === 0) return 0;
        const basePoints = matches() * 100;
        const timePenalty = timer() * 2;
        const movePenalty = moves() * 5;
        return Math.max(0, basePoints - timePenalty - movePenalty);
    };

    /* ── Actions ────────────────────────────────── */
    function startNewGame(diff?: Difficulty) {
        const d = diff ?? difficulty();
        setDifficulty(d);
        setCards(buildDeck(d));
        setFlippedIds([]);
        setMoves(0);
        setMatches(0);
        setTimer(0);
        setIsRunning(false);
        setGameWon(false);
        setCombo(0);
        setLockedOut(false);
        setLastMatchIds([]);
    }

    function handleCardClick(id: number) {
        if (lockedOut()) return;

        const card = cards().find((c) => c.id === id)!;
        if (card.isFlipped || card.isMatched) return;
        if (flippedIds().includes(id)) return;

        if (!isRunning()) setIsRunning(true);

        // Clear last match highlight
        setLastMatchIds([]);

        // Flip the card
        setCards((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
        );

        const newFlipped = [...flippedIds(), id];
        setFlippedIds(newFlipped);

        if (newFlipped.length === 2) {
            setMoves((m) => m + 1);
            setLockedOut(true);

            const [firstId, secondId] = newFlipped;
            const first = cards().find((c) => c.id === firstId)!;
            const second = cards().find((c) => c.id === secondId)!;

            if (first.emoji === second.emoji) {
                // Match found
                setCombo((c) => c + 1);
                setLastMatchIds([firstId, secondId]);

                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((c) =>
                            c.id === firstId || c.id === secondId
                                ? { ...c, isMatched: true }
                                : c
                        )
                    );
                    setFlippedIds([]);
                    setLockedOut(false);

                    const newMatches = matches() + 1;
                    setMatches(newMatches);

                    if (newMatches === totalPairs()) {
                        setGameWon(true);
                        setIsRunning(false);
                        // Save best score
                        const currentScore = score();
                        const prev = bestScore()[difficulty()];
                        if (prev === null || currentScore > prev) {
                            setBestScore((s) => ({ ...s, [difficulty()]: currentScore }));
                        }
                    }
                }, 500);
            } else {
                // No match
                setCombo(0);
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((c) =>
                            c.id === firstId || c.id === secondId
                                ? { ...c, isFlipped: false }
                                : c
                        )
                    );
                    setFlippedIds([]);
                    setLockedOut(false);
                }, 800);
            }
        }
    }

    /* ── Render ──────────────────────────────────── */
    const config = () => DIFFICULTY_CONFIG[difficulty()];

    return (
        <div class="mm-container">
            {/* Difficulty selector */}
            <div class="mm-difficulty-bar">
                <For each={Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG.easy][]}>
                    {([key, cfg]) => (
                        <button
                            class={`mm-diff-btn ${difficulty() === key ? "active" : ""}`}
                            onClick={() => startNewGame(key as Difficulty)}
                        >
                            {cfg.label}
                        </button>
                    )}
                </For>
            </div>

            {/* Stats bar */}
            <div class="mm-stats">
                <div class="mm-stat">
                    <span class="mm-stat-label">Moves</span>
                    <span class="mm-stat-value">{moves()}</span>
                </div>
                <div class="mm-stat">
                    <span class="mm-stat-label">Matches</span>
                    <span class="mm-stat-value">
                        {matches()}<span class="mm-stat-total">/{totalPairs()}</span>
                    </span>
                </div>
                <div class="mm-stat">
                    <span class="mm-stat-label">Time</span>
                    <span class="mm-stat-value">{formatTime(timer())}</span>
                </div>
                <div class="mm-stat">
                    <span class="mm-stat-label">Score</span>
                    <span class="mm-stat-value mm-score">{score()}</span>
                </div>
                <Show when={combo() >= 2}>
                    <div class="mm-combo">🔥 {combo()}x combo!</div>
                </Show>
            </div>

            {/* Card grid */}
            <div
                class="mm-grid"
                style={{
                    "grid-template-columns": `repeat(${config().cols}, 1fr)`,
                }}
            >
                <For each={cards()}>
                    {(card) => (
                        <button
                            class={`mm-card ${card.isFlipped || card.isMatched ? "flipped" : ""} ${card.isMatched ? "matched" : ""} ${lastMatchIds().includes(card.id) ? "just-matched" : ""}`}
                            onClick={() => handleCardClick(card.id)}
                            disabled={card.isMatched}
                            aria-label={card.isFlipped || card.isMatched ? card.emoji : "Hidden card"}
                        >
                            <div class="mm-card-inner">
                                <div class="mm-card-front">
                                    <span class="mm-card-icon">?</span>
                                </div>
                                <div class="mm-card-back">
                                    <span class="mm-card-emoji">{card.emoji}</span>
                                </div>
                            </div>
                        </button>
                    )}
                </For>
            </div>

            {/* Win overlay */}
            <Show when={gameWon()}>
                <div class="mm-overlay">
                    <div class="mm-win-card">
                        <div class="mm-win-icon">🎉</div>
                        <h2 class="mm-win-title">You Win!</h2>
                        <div class="mm-win-stats">
                            <div class="mm-win-stat">
                                <span>Time</span>
                                <strong>{formatTime(timer())}</strong>
                            </div>
                            <div class="mm-win-stat">
                                <span>Moves</span>
                                <strong>{moves()}</strong>
                            </div>
                            <div class="mm-win-stat">
                                <span>Score</span>
                                <strong>{score()}</strong>
                            </div>
                        </div>
                        <Show when={bestScore()[difficulty()] !== null}>
                            <p class="mm-best">
                                🏆 Best: <strong>{bestScore()[difficulty()]}</strong>
                            </p>
                        </Show>
                        <button class="mm-play-again" onClick={() => startNewGame()}>
                            Play Again
                        </button>
                    </div>
                </div>
            </Show>

            {/* Controls */}
            <div class="mm-controls">
                <button class="mm-reset-btn" onClick={() => startNewGame()}>
                    🔄 New Game
                </button>
            </div>

            {/* Inline styles */}
            <style>{`
                .mm-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.25rem;
                    position: relative;
                    width: 100%;
                }

                /* Difficulty bar */
                .mm-difficulty-bar {
                    display: flex;
                    gap: 0.5rem;
                    background: rgba(10, 25, 47, 0.6);
                    padding: 0.25rem;
                    border-radius: 0.75rem;
                    border: 1px solid rgba(136, 146, 176, 0.15);
                }
                .mm-diff-btn {
                    padding: 0.4rem 1rem;
                    border: none;
                    border-radius: 0.5rem;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #8892B0;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .mm-diff-btn:hover {
                    color: #CCD6F6;
                    background: rgba(100, 255, 218, 0.06);
                }
                .mm-diff-btn.active {
                    color: #0A192F;
                    background: #64FFDA;
                    box-shadow: 0 0 16px rgba(100, 255, 218, 0.3);
                }

                /* Stats */
                .mm-stats {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 1.25rem;
                    align-items: center;
                }
                .mm-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.15rem;
                }
                .mm-stat-label {
                    font-size: 0.65rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #8892B0;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }
                .mm-stat-value {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #CCD6F6;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }
                .mm-stat-total {
                    font-size: 0.8rem;
                    color: #8892B0;
                    font-weight: 400;
                }
                .mm-score {
                    color: #64FFDA;
                }
                .mm-combo {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #fbbf24;
                    animation: mm-combo-pop 0.35s ease;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }

                /* Grid */
                .mm-grid {
                    display: grid;
                    gap: 0.6rem;
                    width: 100%;
                    max-width: 520px;
                    perspective: 1000px;
                }

                /* Card */
                .mm-card {
                    aspect-ratio: 1;
                    background: none;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                    perspective: 800px;
                    outline: none;
                }
                .mm-card:focus-visible .mm-card-inner {
                    box-shadow: 0 0 0 2px #64FFDA;
                }
                .mm-card.matched {
                    cursor: default;
                }

                .mm-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-style: preserve-3d;
                    border-radius: 0.75rem;
                }

                .mm-card.flipped .mm-card-inner,
                .mm-card.matched .mm-card-inner {
                    transform: rotateY(180deg);
                }

                .mm-card-front,
                .mm-card-back {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 0.75rem;
                    backface-visibility: hidden;
                    -webkit-backface-visibility: hidden;
                }

                .mm-card-front {
                    background: linear-gradient(135deg, #112240 0%, #1a3356 100%);
                    border: 1px solid rgba(136, 146, 176, 0.15);
                    transition: border-color 0.25s, box-shadow 0.25s;
                }
                .mm-card:not(.flipped):not(.matched):hover .mm-card-front {
                    border-color: rgba(100, 255, 218, 0.35);
                    box-shadow: 0 0 20px rgba(100, 255, 218, 0.08);
                }
                .mm-card-icon {
                    font-size: 1.4rem;
                    color: #8892B0;
                    opacity: 0.5;
                    font-weight: 700;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }

                .mm-card-back {
                    background: linear-gradient(135deg, #0d2137 0%, #163a5a 100%);
                    border: 1px solid rgba(100, 255, 218, 0.25);
                    transform: rotateY(180deg);
                }
                .mm-card-emoji {
                    font-size: 2rem;
                }

                /* Matched glow */
                .mm-card.matched .mm-card-back {
                    border-color: rgba(100, 255, 218, 0.45);
                    box-shadow: 0 0 24px rgba(100, 255, 218, 0.12);
                    opacity: 0.7;
                }
                .mm-card.just-matched .mm-card-back {
                    animation: mm-match-glow 0.6s ease;
                }

                /* Win overlay */
                .mm-overlay {
                    position: absolute;
                    inset: -1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(10, 25, 47, 0.85);
                    backdrop-filter: blur(8px);
                    border-radius: 1rem;
                    z-index: 20;
                    animation: mm-fade-in 0.4s ease;
                }
                .mm-win-card {
                    text-align: center;
                    padding: 2rem;
                    background: linear-gradient(145deg, #112240 0%, #1a3356 100%);
                    border: 1px solid rgba(100, 255, 218, 0.3);
                    border-radius: 1rem;
                    box-shadow: 0 0 60px rgba(100, 255, 218, 0.12);
                    animation: mm-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .mm-win-icon {
                    font-size: 3rem;
                    margin-bottom: 0.5rem;
                    animation: mm-bounce 1s ease infinite;
                }
                .mm-win-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #64FFDA;
                    margin: 0 0 1rem;
                    font-family: ui-serif, Georgia, serif;
                }
                .mm-win-stats {
                    display: flex;
                    gap: 1.5rem;
                    justify-content: center;
                    margin-bottom: 1rem;
                }
                .mm-win-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }
                .mm-win-stat span {
                    font-size: 0.7rem;
                    color: #8892B0;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .mm-win-stat strong {
                    font-size: 1.25rem;
                    color: #CCD6F6;
                }
                .mm-best {
                    font-size: 0.85rem;
                    color: #fbbf24;
                    margin: 0 0 1rem;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }
                .mm-best strong {
                    color: #fbbf24;
                }

                .mm-play-again {
                    padding: 0.6rem 2rem;
                    border: 1px solid #64FFDA;
                    background: rgba(100, 255, 218, 0.1);
                    color: #64FFDA;
                    border-radius: 0.5rem;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s;
                }
                .mm-play-again:hover {
                    background: #64FFDA;
                    color: #0A192F;
                    box-shadow: 0 0 20px rgba(100, 255, 218, 0.3);
                }

                /* Controls */
                .mm-controls {
                    display: flex;
                    gap: 0.75rem;
                }
                .mm-reset-btn {
                    padding: 0.5rem 1.25rem;
                    border: 1px solid rgba(136, 146, 176, 0.3);
                    background: transparent;
                    color: #8892B0;
                    border-radius: 0.5rem;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.25s;
                }
                .mm-reset-btn:hover {
                    border-color: #64FFDA;
                    color: #64FFDA;
                }

                /* Animations */
                @keyframes mm-combo-pop {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes mm-match-glow {
                    0% { box-shadow: 0 0 0 rgba(100, 255, 218, 0); }
                    50% { box-shadow: 0 0 30px rgba(100, 255, 218, 0.4); }
                    100% { box-shadow: 0 0 24px rgba(100, 255, 218, 0.12); }
                }
                @keyframes mm-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes mm-scale-in {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes mm-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }

                /* Responsive */
                @media (max-width: 480px) {
                    .mm-grid { gap: 0.4rem; }
                    .mm-card-emoji { font-size: 1.5rem; }
                    .mm-card-icon { font-size: 1.1rem; }
                    .mm-stats { gap: 0.75rem; }
                }
            `}</style>
        </div>
    );
}
