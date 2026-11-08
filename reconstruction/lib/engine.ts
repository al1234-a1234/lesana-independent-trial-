/** Independently written from observed behavior; no production bundle is executed. */
export type TypingState = {
  typed: string;
  correct: number;
  wrong: number;
  everWrong: boolean[];
  arabicHits: number;
  retried: boolean;
  done: boolean;
};
export const initialState = (length: number): TypingState => ({
  typed: "",
  correct: 0,
  wrong: 0,
  everWrong: Array(length).fill(false),
  arabicHits: 0,
  retried: false,
  done: false,
});
const replacements: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "`": "'",
  "“": '"',
  "”": '"',
  "–": "-",
  "—": "-",
  "−": "-",
  "\u00a0": " ",
  "\u202f": " ",
  "،": ",",
  "؟": "?",
  "٫": ".",
};
export function canonical(c: string) {
  return /[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/u.test(c)
    ? ""
    : (replacements[c] ?? c);
}
export const isPunctuation = (c: string) => !/[\p{L}\p{N} ]/u.test(c);
export function charsMatch(a: string, b: string) {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return norm(a) === norm(b);
}
export function prepareTarget(text: string, own: boolean) {
  return own
    ? /[\p{L}\p{N}]$/u.test(text)
      ? text + "."
      : text
    : text
        .replace(/["“”«»]/g, "")
        .replace(/[,.;:]/g, (c, i, s) =>
          /\d/.test(s[i - 1] ?? "") && /\d/.test(s[i + 1] ?? "") ? c : "",
        )
        .replace(/\s+/g, " ")
        .trim();
}
function normalizeInput(raw: string, target: string, own: boolean) {
  let out = "";
  const skip = () => {
    while (
      out.length < target.length &&
      !own &&
      isPunctuation(target[out.length])
    )
      out += target[out.length];
  };
  skip();
  for (const char of [...raw].map(canonical)) {
    if (out.length >= target.length) break;
    if (!char || /[\n\r\t]/.test(char) || (!own && isPunctuation(char)))
      continue;
    const pos = out.length;
    if (char === " " && target[pos] !== " ") continue;
    if (target[pos] === " " && char !== " ") {
      let next = pos + 1;
      while (next < target.length && !own && isPunctuation(target[next]))
        next++;
      if (next < target.length && charsMatch(char, target[next])) {
        out += "\x01";
        skip();
      }
    }
    out += char;
    skip();
  }
  return out;
}
export function advance(
  state: TypingState,
  raw: string,
  target: string,
  own = false,
): TypingState {
  if (state.done) return state;
  const typed = normalizeInput(raw, target, own);
  if (typed === state.typed) return state;
  let prefix = 0;
  while (
    prefix < typed.length &&
    prefix < state.typed.length &&
    typed[prefix] === state.typed[prefix]
  )
    prefix++;
  let { correct, wrong, arabicHits } = state;
  const everWrong = [...state.everWrong];
  for (let i = prefix; i < typed.length; i++) {
    if (!own && isPunctuation(target[i])) continue;
    if (charsMatch(typed[i], target[i])) {
      correct++;
      if (!/[\u0600-\u06ff]/.test(typed[i])) arabicHits = 0;
    } else {
      wrong++;
      everWrong[i] = true;
      if (/[\u0600-\u06ff]/.test(typed[i])) arabicHits++;
    }
  }
  const done = typed.length === target.length;
  if (done) {
    const compared = [...target]
      .map((c, i) => ({ c, i }))
      .filter((x) => own || !isPunctuation(x.c));
    const majorityWrong =
      compared.filter((x) => !charsMatch(typed[x.i], x.c)).length >
      compared.length / 2;
    if (arabicHits >= 2 || (majorityWrong && !state.retried))
      return {
        ...initialState(target.length),
        correct,
        wrong,
        arabicHits,
        retried: state.retried || arabicHits < 2,
      };
  }
  return {
    typed,
    correct,
    wrong,
    everWrong,
    arabicHits,
    retried: state.retried,
    done,
  };
}
export const accuracy = (s: Pick<TypingState, "correct" | "wrong">) =>
  s.correct + s.wrong ? s.correct / (s.correct + s.wrong) : 1;
export function marks(s: TypingState, target: string) {
  return [...target].map((c, i) =>
    i >= s.typed.length
      ? 0
      : charsMatch(s.typed[i], c)
        ? s.everWrong[i]
          ? 2
          : 1
        : 3,
  );
}
export function replay(inputs: string[], target: string, own = false) {
  return inputs.reduce(
    (s, input) => advance(s, input, target, own),
    initialState(target.length),
  );
}
export function inputValue(s: TypingState, target: string, own: boolean) {
  return [...s.typed]
    .filter((c, i) => c !== "\x01" && (own || !isPunctuation(target[i])))
    .join("");
}
