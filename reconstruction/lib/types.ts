export type Progress = {
  lineId: string;
  correct: number;
  wrong: number;
  accuracy: number;
  dueAt: number;
  streak: number;
  lapses: number;
  intervalMs: number;
  attempts: number;
  updatedAt: number;
};
export type AppState = {
  records: Progress[];
  favoriteWords: string[];
  knownWords: string[];
  coreGroups: { groupId: string; score: number; completedAt: number }[];
  passages: { passageId: string; score: number; answered: number; completedAt: number }[];
  serverNow: number;
};
export type Attempt = {
  id: string;
  lineId: string;
  inputs: string[];
  punctuation: boolean;
  durationMs: number;
  replays: number;
  mode: "story" | "review";
};
