import { stories } from "./catalog";

export const gameWords = stories.flatMap((story) =>
  story.lines.map((line) => ({ en: line.keyword.en, ar: line.keyword.ar })),
);

export type GameState = {
  phase: "idle" | "playing" | "finished";
  order: number[];
  index: number;
  seconds: number;
  correct: number;
  skipped: number;
  mistakes: number;
  last: "correct" | "wrong" | "skipped" | null;
};

export const idleGame: GameState = {
  phase: "idle", order: [], index: 0, seconds: 60,
  correct: 0, skipped: 0, mistakes: 0, last: null,
};

export function startGame(seed: number): GameState {
  const order = gameWords.map((_, i) => i);
  let random = seed >>> 0;
  for (let i = order.length - 1; i > 0; i--) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    const j = random % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...idleGame, phase: "playing", order };
}

export function currentWord(state: GameState) {
  return gameWords[state.order[state.index % state.order.length]];
}

export function submitGame(state: GameState, answer: string): GameState {
  if (state.phase !== "playing") return state;
  const match = answer.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === currentWord(state).en.toLowerCase();
  return match
    ? { ...state, index: state.index + 1, correct: state.correct + 1, last: "correct" }
    : { ...state, mistakes: state.mistakes + 1, last: "wrong" };
}

export function skipGame(state: GameState): GameState {
  return state.phase === "playing"
    ? { ...state, index: state.index + 1, skipped: state.skipped + 1, last: "skipped" }
    : state;
}

export function tickGame(state: GameState): GameState {
  if (state.phase !== "playing") return state;
  const seconds = Math.max(0, state.seconds - 1);
  return { ...state, seconds, phase: seconds ? "playing" : "finished" };
}
