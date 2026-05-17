import { createSignal, onCleanup, For, Show } from "solid-js";

/* ── Sentence pools by difficulty ──────────────── */
const SENTENCE_POOLS: Record<string, string[]> = {
    easy: [
        "the quick brown fox jumps over the lazy dog near the river bank",
        "a good developer writes clean code and tests it every single day",
        "we build fast apps that run on the web and help users get things done",
        "the sun sets behind the tall trees as the wind blows through the field",
        "code is like a poem you write it once and read it a hundred times more",
        "keep your code simple and easy to read so others can work with it too",
        "a small bug in the code can cause a big problem if you do not fix it",
        "the best way to learn is to build things and break them and try again",
        "every great app starts with a simple idea and a lot of hard work ahead",
        "open your mind to new tools and new ways of solving old problems fast",
    ],
    medium: [
        "async functions return promises that resolve when the operation completes successfully",
        "the component lifecycle includes mounting updating and unmounting phases in sequence",
        "solid js uses fine grained reactivity to update only the parts of the dom that change",
        "typescript adds static types to javascript making it easier to catch bugs at compile time",
        "a well designed api should be intuitive consistent and easy to integrate with other systems",
        "git branches allow developers to work on features independently without breaking main code",
        "responsive design ensures your website looks great on mobile tablet and desktop screens alike",
        "caching frequently accessed data reduces database load and improves application response time",
        "docker containers package applications with their dependencies for consistent deployment everywhere",
        "unit tests verify individual functions work correctly while integration tests check the whole flow",
    ],
    hard: [
        "implementing recursive algorithms requires careful handling of base cases to prevent infinite loops and stack overflows",
        "microservice architecture distributes application logic across independently deployable services communicating via lightweight protocols",
        "database indexing strategies significantly impact query performance especially when dealing with large datasets and complex join operations",
        "continuous integration pipelines automatically build test and validate code changes before merging them into the production branch",
        "web accessibility standards ensure that applications are usable by people with disabilities including screen reader compatibility and keyboard navigation",
        "functional programming paradigms emphasize immutable data structures pure functions and declarative composition over imperative state mutations",
        "distributed systems must handle network partitions gracefully while maintaining consistency and availability according to the cap theorem constraints",
        "server side rendering improves initial page load performance and search engine optimization by generating html on the server before sending it to clients",
        "cryptographic hashing algorithms transform variable length input into fixed length output ensuring data integrity and secure password storage mechanisms",
        "observability in production systems requires structured logging distributed tracing and metric collection to diagnose performance bottlenecks effectively",
    ],
};

type Difficulty = "easy" | "medium" | "hard";
type GamePhase = "idle" | "countdown" | "playing" | "finished";
type CharStatus = "correct" | "wrong" | "current" | "pending";

const DURATION = 30;

/* ── Component ─────────────────────────────────── */
export default function TypingSpeed() {
    const [difficulty, setDifficulty] = createSignal<Difficulty>("medium");
    const [phase, setPhase] = createSignal<GamePhase>("idle");
    const [text, setText] = createSignal("");
    const [typed, setTyped] = createSignal("");
    const [timeLeft, setTimeLeft] = createSignal(DURATION);
    const [countdown, setCountdown] = createSignal(3);

    // Stats
    const [correctChars, setCorrectChars] = createSignal(0);
    const [wrongChars, setWrongChars] = createSignal(0);
    const [correctWords, setCorrectWords] = createSignal(0);
    const [totalWordsAttempted, setTotalWordsAttempted] = createSignal(0);

    const [bestWpm, setBestWpm] = createSignal<Record<Difficulty, number>>({
        easy: 0, medium: 0, hard: 0,
    });

    let timerRef: number | undefined;
    let cdRef: number | undefined;
    let inputRef: HTMLInputElement | undefined;

    /* ── Build text ─────────────────────────────── */
    function generateText(diff: Difficulty): string {
        const pool = SENTENCE_POOLS[diff];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        // Join enough sentences for 30s of typing
        return shuffled.slice(0, 5).join(" ");
    }

    /* ── Derived ────────────────────────────────── */
    const elapsed = () => DURATION - timeLeft();
    const progress = () => (elapsed() / DURATION) * 100;

    const wpm = () => {
        const e = elapsed();
        if (e <= 0) return 0;
        // Standard: 1 word = 5 chars
        return Math.round((correctChars() / 5 / e) * 60);
    };

    const accuracy = () => {
        const total = correctChars() + wrongChars();
        if (total === 0) return 100;
        return Math.round((correctChars() / total) * 100);
    };

    const cpm = () => {
        const e = elapsed();
        if (e <= 0) return 0;
        return Math.round((correctChars() / e) * 60);
    };

    const charStatuses = (): CharStatus[] => {
        const source = text();
        const input = typed();
        const result: CharStatus[] = [];

        for (let i = 0; i < source.length; i++) {
            if (i < input.length) {
                result.push(input[i] === source[i] ? "correct" : "wrong");
            } else if (i === input.length) {
                result.push("current");
            } else {
                result.push("pending");
            }
        }
        return result;
    };

    /* ── Actions ────────────────────────────────── */
    function cleanup() {
        if (timerRef) { clearInterval(timerRef); timerRef = undefined; }
        if (cdRef) { clearInterval(cdRef); cdRef = undefined; }
    }

    function startGame(diff?: Difficulty) {
        cleanup();
        const d = diff ?? difficulty();
        setDifficulty(d);
        setText(generateText(d));
        setTyped("");
        setCorrectChars(0);
        setWrongChars(0);
        setCorrectWords(0);
        setTotalWordsAttempted(0);
        setTimeLeft(DURATION);

        // Countdown
        setPhase("countdown");
        setCountdown(3);
        let c = 3;
        cdRef = setInterval(() => {
            c--;
            setCountdown(c);
            if (c <= 0) {
                clearInterval(cdRef!);
                cdRef = undefined;
                setPhase("playing");
                inputRef?.focus();
                timerRef = setInterval(() => {
                    setTimeLeft((t) => {
                        if (t <= 1) {
                            clearInterval(timerRef!);
                            timerRef = undefined;
                            finishGame(d);
                            return 0;
                        }
                        return t - 1;
                    });
                }, 1000) as unknown as number;
            }
        }, 1000) as unknown as number;
    }

    function finishGame(d: Difficulty) {
        // Count final word stats
        const source = text();
        const input = typed();
        const sourceWords = source.split(" ");
        const inputWords = input.split(" ");

        let cw = 0;
        let tw = 0;
        for (let i = 0; i < inputWords.length; i++) {
            if (inputWords[i].length > 0) {
                tw++;
                // A word is correct if every char matches (up to the length typed for that word)
                if (i < sourceWords.length && inputWords[i] === sourceWords[i]) {
                    cw++;
                }
            }
        }
        setCorrectWords(cw);
        setTotalWordsAttempted(tw);

        setPhase("finished");
        const w = wpm();
        if (w > bestWpm()[d]) {
            setBestWpm((prev) => ({ ...prev, [d]: w }));
        }
    }

    function handleInput(value: string) {
        if (phase() !== "playing") return;

        const source = text();

        // Don't allow typing past the text
        if (value.length > source.length) return;

        // Count correct / wrong for new chars
        const prev = typed();
        if (value.length > prev.length) {
            // New chars added
            for (let i = prev.length; i < value.length; i++) {
                if (value[i] === source[i]) {
                    setCorrectChars((c) => c + 1);
                } else {
                    setWrongChars((c) => c + 1);
                }
            }
        }

        setTyped(value);

        // If typed entire text
        if (value.length >= source.length) {
            cleanup();
            finishGame(difficulty());
        }
    }

    onCleanup(cleanup);

    /* ── Word-wrapped rendering ─────────────────── */
    function renderText() {
        const source = text();
        const statuses = charStatuses();

        // Split into words preserving spaces for rendering
        const elements: { char: string; status: CharStatus; index: number }[] = [];
        for (let i = 0; i < source.length; i++) {
            elements.push({ char: source[i], status: statuses[i], index: i });
        }

        return elements;
    }

    /* ── Render ──────────────────────────────────── */
    return (
        <div class="ts-container">
            {/* Difficulty selector */}
            <div class="ts-difficulty-bar">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                    <button
                        class={`ts-diff-btn ${difficulty() === d ? "active" : ""}`}
                        onClick={() => startGame(d)}
                    >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                ))}
            </div>

            {/* Idle state */}
            <Show when={phase() === "idle"}>
                <div class="ts-idle">
                    <div class="ts-idle-icon">⌨️</div>
                    <h2 class="ts-idle-title">Typing Speed Test</h2>
                    <p class="ts-idle-desc">
                        Type the text as fast and accurately as you can.<br />
                        You have <strong>{DURATION} seconds</strong> on the clock.
                    </p>
                    <button class="ts-start-btn" onClick={() => startGame()}>
                        Start Typing
                    </button>
                </div>
            </Show>

            {/* Countdown */}
            <Show when={phase() === "countdown"}>
                <div class="ts-countdown-wrap">
                    <div class="ts-countdown-num">{countdown()}</div>
                    <p class="ts-countdown-label">Get Ready...</p>
                </div>
            </Show>

            {/* Playing */}
            <Show when={phase() === "playing"}>
                <div class="ts-game">
                    {/* Timer bar */}
                    <div class="ts-timer-bar">
                        <div
                            class="ts-timer-fill"
                            style={{ width: `${100 - progress()}%` }}
                        />
                        <span class="ts-timer-text">{timeLeft()}s</span>
                    </div>

                    {/* Live stats */}
                    <div class="ts-live-stats">
                        <div class="ts-live-stat">
                            <span class="ts-live-label">WPM</span>
                            <span class="ts-live-value ts-accent">{wpm()}</span>
                        </div>
                        <div class="ts-live-stat">
                            <span class="ts-live-label">Accuracy</span>
                            <span class="ts-live-value">{accuracy()}%</span>
                        </div>
                        <div class="ts-live-stat">
                            <span class="ts-live-label">Chars</span>
                            <span class="ts-live-value">{correctChars() + wrongChars()}</span>
                        </div>
                    </div>

                    {/* Text display */}
                    <div class="ts-text-area" onClick={() => inputRef?.focus()}>
                        <div class="ts-text-block">
                            <For each={renderText()}>
                                {(el) => (
                                    <span
                                        class={`ts-ch ${el.status}`}
                                        classList={{
                                            "ts-space": el.char === " ",
                                        }}
                                    >
                                        {el.char === " " ? "\u00A0" : el.char}
                                    </span>
                                )}
                            </For>
                        </div>
                    </div>

                    {/* Hidden input */}
                    <input
                        ref={inputRef}
                        type="text"
                        class="ts-input"
                        value={typed()}
                        onInput={(e) => handleInput(e.currentTarget.value)}
                        onPaste={(e) => e.preventDefault()}
                        autofocus
                        autocomplete="off"
                        autocapitalize="off"
                        spellcheck={false}
                        placeholder="Click above and start typing..."
                    />
                </div>
            </Show>

            {/* Finished */}
            <Show when={phase() === "finished"}>
                <div class="ts-results">
                    <div class="ts-results-icon">🏁</div>
                    <h2 class="ts-results-title">Time's Up!</h2>

                    <div class="ts-results-grid">
                        <div class="ts-result-card ts-result-highlight">
                            <span class="ts-result-num">{wpm()}</span>
                            <span class="ts-result-label">WPM</span>
                        </div>
                        <div class="ts-result-card">
                            <span class="ts-result-num">{accuracy()}%</span>
                            <span class="ts-result-label">Accuracy</span>
                        </div>
                        <div class="ts-result-card">
                            <span class="ts-result-num">{cpm()}</span>
                            <span class="ts-result-label">CPM</span>
                        </div>
                        <div class="ts-result-card">
                            <span class="ts-result-num">{correctWords()}</span>
                            <span class="ts-result-label">Correct Words</span>
                        </div>
                        <div class="ts-result-card">
                            <span class="ts-result-num">{totalWordsAttempted()}</span>
                            <span class="ts-result-label">Total Words</span>
                        </div>
                        <div class="ts-result-card">
                            <span class="ts-result-num">{correctChars() + wrongChars()}</span>
                            <span class="ts-result-label">Chars Typed</span>
                        </div>
                    </div>

                    <Show when={bestWpm()[difficulty()] > 0}>
                        <p class="ts-best">🏆 Best: <strong>{bestWpm()[difficulty()]} WPM</strong></p>
                    </Show>

                    <button class="ts-start-btn" onClick={() => startGame()}>
                        Try Again
                    </button>
                </div>
            </Show>

            {/* Styles */}
            <style>{`
                .ts-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.25rem;
                    width: 100%;
                }

                /* Difficulty */
                .ts-difficulty-bar {
                    display: flex;
                    gap: 0.5rem;
                    background: rgba(10, 25, 47, 0.6);
                    padding: 0.25rem;
                    border-radius: 0.75rem;
                    border: 1px solid rgba(136, 146, 176, 0.15);
                }
                .ts-diff-btn {
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
                .ts-diff-btn:hover { color: #CCD6F6; background: rgba(100, 255, 218, 0.06); }
                .ts-diff-btn.active {
                    color: #0A192F;
                    background: #64FFDA;
                    box-shadow: 0 0 16px rgba(100, 255, 218, 0.3);
                }

                /* Idle */
                .ts-idle {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 2rem 1rem;
                }
                .ts-idle-icon { font-size: 3rem; animation: ts-float 2s ease-in-out infinite; }
                .ts-idle-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #CCD6F6;
                    font-family: ui-serif, Georgia, serif;
                    margin: 0;
                }
                .ts-idle-desc {
                    color: #8892B0;
                    font-size: 0.85rem;
                    text-align: center;
                    line-height: 1.6;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    margin: 0;
                }
                .ts-idle-desc strong { color: #64FFDA; }

                .ts-start-btn {
                    padding: 0.65rem 2rem;
                    border: 1px solid #64FFDA;
                    background: rgba(100, 255, 218, 0.1);
                    color: #64FFDA;
                    border-radius: 0.5rem;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s;
                    margin-top: 0.5rem;
                }
                .ts-start-btn:hover {
                    background: #64FFDA;
                    color: #0A192F;
                    box-shadow: 0 0 20px rgba(100, 255, 218, 0.3);
                }

                /* Countdown */
                .ts-countdown-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 3rem 1rem;
                }
                .ts-countdown-num {
                    font-size: 4rem;
                    font-weight: 900;
                    color: #64FFDA;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    animation: ts-pulse 1s ease-in-out infinite;
                    text-shadow: 0 0 30px rgba(100, 255, 218, 0.4);
                }
                .ts-countdown-label {
                    color: #8892B0;
                    font-size: 0.9rem;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    margin: 0;
                }

                /* Game */
                .ts-game {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;
                }

                /* Timer bar */
                .ts-timer-bar {
                    position: relative;
                    width: 100%;
                    height: 28px;
                    background: rgba(10, 25, 47, 0.6);
                    border-radius: 0.5rem;
                    border: 1px solid rgba(136, 146, 176, 0.15);
                    overflow: hidden;
                }
                .ts-timer-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #64FFDA, #48c9a8);
                    border-radius: 0.5rem;
                    transition: width 1s linear;
                    box-shadow: 0 0 12px rgba(100, 255, 218, 0.2);
                }
                .ts-timer-text {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 700;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    color: #CCD6F6;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                }

                /* Live stats */
                .ts-live-stats {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                }
                .ts-live-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.1rem;
                }
                .ts-live-label {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #8892B0;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }
                .ts-live-value {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: #CCD6F6;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }
                .ts-accent { color: #64FFDA; }

                /* Text area */
                .ts-text-area {
                    padding: 1.25rem;
                    background: rgba(10, 25, 47, 0.5);
                    border-radius: 0.75rem;
                    border: 1px solid rgba(136, 146, 176, 0.1);
                    cursor: text;
                    max-height: 200px;
                    overflow-y: auto;
                    line-height: 2;
                }
                .ts-text-area::-webkit-scrollbar { width: 4px; }
                .ts-text-area::-webkit-scrollbar-thumb { background: #8892B040; border-radius: 4px; }

                .ts-text-block {
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 1.1rem;
                    font-weight: 500;
                    word-wrap: break-word;
                }

                /* Characters */
                .ts-ch {
                    color: #8892B060;
                    transition: color 0.08s;
                    border-radius: 2px;
                }
                .ts-ch.correct {
                    color: #64FFDA;
                }
                .ts-ch.wrong {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.15);
                    border-radius: 2px;
                }
                .ts-ch.current {
                    color: #CCD6F6;
                    border-left: 2px solid #64FFDA;
                    animation: ts-blink 0.8s ease-in-out infinite;
                    margin-left: -1px;
                    padding-left: 1px;
                }

                /* Input (visible but styled minimally) */
                .ts-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: rgba(10, 25, 47, 0.6);
                    border: 1px solid rgba(136, 146, 176, 0.2);
                    border-radius: 0.5rem;
                    color: #CCD6F6;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    font-size: 1rem;
                    outline: none;
                    transition: border-color 0.25s;
                }
                .ts-input:focus {
                    border-color: rgba(100, 255, 218, 0.4);
                    box-shadow: 0 0 16px rgba(100, 255, 218, 0.08);
                }
                .ts-input::placeholder { color: #8892B040; }

                /* Results */
                .ts-results {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.5rem 1rem;
                    animation: ts-fade-in 0.5s ease;
                }
                .ts-results-icon { font-size: 3rem; animation: ts-float 2s ease-in-out infinite; }
                .ts-results-title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #64FFDA;
                    font-family: ui-serif, Georgia, serif;
                    margin: 0;
                }
                .ts-results-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.75rem;
                    width: 100%;
                    max-width: 380px;
                }
                .ts-result-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.2rem;
                    padding: 0.75rem 0.5rem;
                    background: rgba(10, 25, 47, 0.5);
                    border: 1px solid rgba(136, 146, 176, 0.12);
                    border-radius: 0.75rem;
                }
                .ts-result-highlight {
                    border-color: rgba(100, 255, 218, 0.3);
                    box-shadow: 0 0 20px rgba(100, 255, 218, 0.08);
                }
                .ts-result-num {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: #CCD6F6;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                }
                .ts-result-highlight .ts-result-num { color: #64FFDA; }
                .ts-result-label {
                    font-size: 0.6rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #8892B0;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    text-align: center;
                }
                .ts-best {
                    font-size: 0.85rem;
                    color: #fbbf24;
                    font-family: ui-monospace, SFMono-Regular, monospace;
                    margin: 0;
                }
                .ts-best strong { color: #fbbf24; }

                /* Animations */
                @keyframes ts-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes ts-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                @keyframes ts-blink {
                    0%, 100% { border-left-color: #64FFDA; }
                    50% { border-left-color: transparent; }
                }
                @keyframes ts-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 480px) {
                    .ts-text-block { font-size: 0.95rem; }
                    .ts-results-grid { grid-template-columns: repeat(2, 1fr); }
                    .ts-live-stats { gap: 1rem; }
                }
            `}</style>
        </div>
    );
}
