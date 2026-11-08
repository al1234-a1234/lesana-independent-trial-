import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  accuracy,
  advance,
  initialState,
  marks,
  prepareTarget,
  replay,
} from "../lib/engine";
import { DAY, MINUTE, schedule } from "../lib/scheduler";
const fixtures = JSON.parse(
  readFileSync(
    new URL("../evidence/audit-fixtures.json", import.meta.url),
    "utf8",
  ),
) as {
  cases: {
    name: string;
    target: string;
    steps: {
      input: string;
      state: {
        typed: string;
        correct: number;
        wrong: number;
        arabicHits: number;
      };
    }[];
    completed: { accuracy: number }[];
  }[];
};
for (const fixture of fixtures.cases)
  test(`audited fixture: ${fixture.name}`, () => {
    const result = replay(
      fixture.steps.map((s) => s.input),
      fixture.target,
    );
    const expected = fixture.steps.at(-1)!.state;
    assert.equal(result.typed, expected.typed);
    assert.equal(result.correct, expected.correct);
    assert.equal(result.wrong, expected.wrong);
    assert.equal(result.arabicHits, expected.arabicHits);
    assert.equal(result.done, fixture.completed.length > 0);
    if (fixture.completed.length)
      assert.equal(accuracy(result), fixture.completed[0].accuracy);
  });
test("corrected character preserves its error mark and accuracy", () => {
  const result = replay(["c", "cx", "c", "ca", "cat"], "cat");
  assert.deepEqual(marks(result, "cat"), [1, 2, 1]);
  assert.equal(accuracy(result), 0.75);
});
test("own punctuation requires terminal punctuation", () => {
  const text = prepareTarget("A small boat", true);
  assert.equal(text, "A small boat.");
  assert.equal(replay(["A small boat"], text, true).done, false);
  assert.equal(replay(["A small boat."], text, true).done, true);
});
test("input after completion cannot modify accumulated results", () => {
  const complete = replay(["cat"], "cat");
  assert.deepEqual(advance(complete, "xxx", "cat"), complete);
});
test("default target preparation removes optional punctuation, preserves decimal separators", () =>
  assert.equal(
    prepareTarget("It costs 2.5 coins, today.", false),
    "It costs 2.5 coins today",
  ));
test("scheduler repeats mistakes after exactly ten minutes", () => {
  const r = schedule(undefined, { accuracy: 0.8, wrong: 1 }, 100);
  assert.equal(r.dueAt, 100 + 10 * MINUTE);
  assert.equal(r.streak, 0);
  assert.equal(r.lapses, 1);
});
test("scheduler clean ladder and cap are deterministic", () => {
  let prev;
  for (const days of [1, 3, 7, 14, 30, 60, 60]) {
    prev = schedule(prev, { accuracy: 1, wrong: 0 }, 1000);
    assert.equal(prev.dueAt, 1000 + days * DAY);
  }
});
test("a mistake resets a previously learned interval", () => {
  assert.equal(
    schedule({ streak: 4, lapses: 2 }, { accuracy: 0.99, wrong: 1 }, 0).streak,
    0,
  );
});
