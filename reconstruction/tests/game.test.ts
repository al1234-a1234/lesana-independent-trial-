import test from "node:test";
import assert from "node:assert/strict";
import { currentWord, gameWords, skipGame, startGame, submitGame, tickGame } from "../lib/game";

test("game uses only original story keywords and deterministic order", () => {
  assert.equal(gameWords.length, 24);
  assert.deepEqual(startGame(42).order, startGame(42).order);
  assert.equal(new Set(startGame(42).order).size, gameWords.length);
});
test("right answer scores, wrong answer stays, skip advances", () => {
  const initial = startGame(42);
  const wrong = submitGame(initial, "not-the-answer");
  assert.equal(wrong.mistakes, 1);
  assert.equal(wrong.index, 0);
  const right = submitGame(wrong, ` ${currentWord(wrong).en.toUpperCase()} `);
  assert.equal(right.correct, 1);
  assert.equal(right.index, 1);
  const skipped = skipGame(right);
  assert.equal(skipped.skipped, 1);
  assert.equal(skipped.index, 2);
});
test("one minute ends the round and blocks late scores", () => {
  let state = startGame(42);
  for (let i = 0; i < 60; i++) state = tickGame(state);
  assert.equal(state.phase, "finished");
  assert.equal(state.seconds, 0);
  assert.deepEqual(submitGame(state, currentWord(state).en), state);
});
