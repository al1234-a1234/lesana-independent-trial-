import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import { stories } from "../lib/catalog";
const origin = "http://127.0.0.1:3000";
const line = stories[0].lines[0];
function attempt(id = crypto.randomUUID()) {
  return {
    id,
    lineId: line.id,
    inputs: [line.text],
    punctuation: false,
    durationMs: 1000,
    replays: 0,
    mode: "story",
  };
}
async function save(request: APIRequestContext, payload: unknown) {
  return request.post("/api/attempts", {
    data: payload,
    headers: { Origin: origin },
  });
}
async function start(page: Page, slug = stories[0].slug) {
  await page.goto(`/story/${slug}`);
  await page
    .getByRole("button", { name: "ابدأ الكتابة ←", exact: true })
    .click();
  await expect(page.getByTestId("typing-input")).toBeVisible();
}
const externals = new WeakMap<Page, string[]>(),
  errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  await page.request.get("/api/state");
  externals.set(page, []);
  errors.set(page, []);
  page.on("pageerror", (e) => errors.get(page)!.push(e.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
      externals.get(page)!.push(url.hostname);
      return route.abort();
    }
    return route.continue();
  });
});
test.afterEach(async ({ page }, info) => {
  await info.attach("runtime-observations", {
    body: JSON.stringify({
      externalRequests: externals.get(page),
      pageErrors: errors.get(page),
    }),
    contentType: "application/json",
  });
  expect(externals.get(page)).toEqual([]);
  expect(errors.get(page)).toEqual([]);
});
test("original vocabulary challenge scores, rejects mistakes, skips and survives reload as best score", async ({ page }) => {
  await page.clock.install();
  await page.goto("/challenge");
  await page.getByRole("button", { name: /ابدأ التحدي/ }).click();
  const prompt = await page.getByTestId("game-prompt").textContent();
  const words: Record<string, string> = {
    "تذكرة": "ticket", "يغادر": "leaves", "بجانب": "beside", "يقدّم": "offers", "عبر": "through", "رحلة": "journey",
    "فارغ": "empty", "نعناع": "mint", "زرعنا": "planted", "جار": "neighbor", "حصاد": "harvest", "مفضّل": "favorite",
    "معرض": "exhibition", "لوحات": "paintings", "استعار": "borrowed", "غروب": "sunset", "تعرّف على": "recognized", "كان ذا أهمية": "mattered",
    "أتعلم": "learn", "بعض": "some", "تخيف": "scare", "أبدأ": "start", "آخر": "another", "يبدأ": "begin",
  };
  expect(words[prompt ?? ""]).toBeTruthy();
  await page.getByRole("textbox", { name: "اكتب بالإنجليزي" }).fill("incorrect-answer");
  await page.getByRole("button", { name: "تحقق ←" }).click();
  await expect(page.getByTestId("game-feedback")).toContainText("جرّب مرة أخرى");
  await expect(page.getByTestId("game-score")).toHaveText("0");
  await page.getByRole("textbox", { name: "اكتب بالإنجليزي" }).fill(words[prompt ?? ""]);
  await page.getByRole("button", { name: "تحقق ←" }).click();
  await expect(page.getByTestId("game-score")).toHaveText("1");
  await page.getByRole("button", { name: "لا أعرفها، التالية ←" }).click();
  await expect(page.getByTestId("game-feedback")).toContainText("انتقلت");
  await page.screenshot({ path: "evidence/challenge-local.png", fullPage: true });
  await page.clock.runFor(60_000);
  await expect(page.getByRole("heading", { name: "انتهت الدقيقة" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("أفضل نتيجة: 1 كلمة")).toBeVisible();
});
test("dashboard presents original stories and fits a mobile viewport", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "I Can Start" })).toBeVisible();
  await page.screenshot({
    path: "evidence/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "evidence/dashboard-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("incorrect typing and backspace preserve error count and corrected mark", async ({
  page,
}) => {
  await start(page);
  const input = page.getByTestId("typing-input");
  await input.fill("x");
  await expect(page.locator('[data-i="0"][data-mark="3"]')).toBeVisible();
  await input.fill("");
  await input.fill("I");
  await expect(page.locator('[data-i="0"][data-mark="2"]')).toBeVisible();
  await expect(page.getByTestId("accuracy")).toHaveText("50%");
  await page.screenshot({
    path: "evidence/corrected-letter.png",
    fullPage: true,
  });
});
test("Arabic keyboard input shows a useful warning", async ({ page }) => {
  await start(page);
  await page.getByTestId("typing-input").fill("شس");
  await expect(
    page.getByRole("alert").filter({ hasText: "لوحة مفاتيحك عربية" }),
  ).toBeVisible();
});
test("audio decodes, advances and supports four real playback rates", async ({
  page,
}) => {
  await start(page);
  const audio = page.getByTestId("line-audio");
  await page.getByRole("button", { name: /اسمع الجملة|إيقاف/ }).click();
  await page
    .getByRole("button", { name: /اسمع الجملة/ })
    .click()
    .catch(() => {});
  await expect
    .poll(() => audio.evaluate((el: HTMLAudioElement) => el.readyState))
    .toBeGreaterThanOrEqual(2);
  await expect
    .poll(() => audio.evaluate((el: HTMLAudioElement) => el.currentTime))
    .toBeGreaterThan(0);
  await page.locator("summary").click();
  for (const rate of ["1", "0.85", "0.75", "0.65"]) {
    await page.locator("#rate").selectOption(rate);
    await expect
      .poll(() => audio.evaluate((el: HTMLAudioElement) => el.playbackRate))
      .toBe(Number(rate));
  }
  await expect(audio).toHaveJSProperty("error", null);
});
test("dictation hides untyped letters and translation toggle works", async ({
  page,
}) => {
  await start(page);
  await page.locator("summary").click();
  await page.getByLabel("تحدي الاستماع: إخفاء الجملة").check();
  await expect(page.locator(".hidden-char").first()).toBeVisible();
  await page.getByLabel("إظهار الترجمة").uncheck();
  await expect(page.locator(".translation")).toHaveCount(0);
});
test("punctuation mode requires the final period", async ({ page }) => {
  await start(page);
  await page.locator("summary").click();
  await page.getByLabel("كتابة علامات الترقيم").check();
  await page.getByTestId("typing-input").fill(line.text);
  await expect(page.getByTestId("typing-input")).toBeEnabled();
  await page.getByTestId("typing-input").fill(line.text + ".");
  await expect
    .poll(async () => {
      const s = await (await page.request.get("/api/state")).json();
      return s.records.length;
    })
    .toBe(1);
});
test("complete all six lines, persist after reload, and collect vocabulary", async ({
  page,
}) => {
  await start(page);
  for (const l of stories[0].lines) {
    await expect(page.getByTestId("target")).toHaveAttribute(
      "aria-label",
      l.text,
    );
    await page.getByTestId("typing-input").fill(l.text);
  }
  await expect(
    page.getByRole("heading", { name: "أكملت القصة" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "متابعة ←" }).click();
  await page.goto(`/stories/${stories[0].slug}`);
  await expect(page.getByText("6/6 أسطر")).toBeVisible();
  await page.reload();
  await expect(page.getByText("6/6 أسطر")).toBeVisible();
  await page.goto("/words");
  await expect(
    page.getByRole("heading", { name: "ticket", exact: true }),
  ).toBeVisible();
  const state = await (await page.request.get("/api/state")).json();
  expect(state.records).toHaveLength(6);
  expect(
    state.records.every(
      (r: { intervalMs: number }) => r.intervalMs === 86400000,
    ),
  ).toBe(true);
});
test("a partially completed story resumes at its first unfinished line", async ({
  page,
}) => {
  await start(page);
  await page.getByTestId("typing-input").fill(line.text);
  await expect(page.getByTestId("target")).toHaveAttribute(
    "aria-label",
    stories[0].lines[1].text,
  );
  await page.reload();
  await page
    .getByRole("button", { name: "ابدأ الكتابة ←", exact: true })
    .click();
  await expect(page.getByTestId("target")).toHaveAttribute(
    "aria-label",
    stories[0].lines[1].text,
  );
});
test("two independent browser sessions cannot read each other’s progress", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  const response = await save(page.request, attempt());
  expect(response.ok()).toBe(true);
  const other = await browser.newContext({ baseURL: origin });
  const res = await other.request.get("/api/state");
  expect((await res.json()).records).toHaveLength(0);
  expect(
    (await (await page.request.get("/api/state")).json()).records,
  ).toHaveLength(1);
  await other.close();
});
test("idempotency prevents duplicate attempts from altering the review schedule", async ({
  page,
}) => {
  await page.goto("/");
  const a = attempt();
  const one = await (await save(page.request, a)).json();
  const two = await (await save(page.request, a)).json();
  expect(one.duplicate).toBe(false);
  expect(two.duplicate).toBe(true);
  expect(two.records[0].attempts).toBe(1);
  expect(two.records[0].dueAt).toBe(one.records[0].dueAt);
});
test("offline write is journaled and successfully synchronized on reconnection", async ({
  page,
}) => {
  await start(page);
  await page.route("**/api/attempts", (route) =>
    route.abort("internetdisconnected"),
  );
  await page.getByTestId("typing-input").fill(line.text);
  await expect(page.getByTestId("pending-status")).toContainText("1 نتيجة");
  await page.unroute("**/api/attempts");
  await page.getByRole("button", { name: "أعد المزامنة" }).click();
  await expect(page.getByTestId("pending-status")).toHaveCount(0);
  const s = await (await page.request.get("/api/state")).json();
  expect(s.records).toHaveLength(1);
});
test("a due review completes and moves to a longer interval", async ({
  page,
}) => {
  await page.goto("/");
  await save(page.request, attempt());
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === "satr_session")!.value;
  const owner = createHash("sha256").update(token).digest("hex");
  const db = new DatabaseSync(resolve(".test-data/e2e.sqlite"));
  const row = db
    .prepare("SELECT data FROM progress WHERE owner=? AND line_id=?")
    .get(owner, line.id) as { data: string };
  const record = JSON.parse(row.data);
  record.dueAt = Date.now() - 1000;
  db.prepare("UPDATE progress SET data=? WHERE owner=? AND line_id=?").run(
    JSON.stringify(record),
    owner,
    line.id,
  );
  db.close();
  await page.goto("/review");
  await expect(page.getByTestId("due-count")).toHaveText("1");
  await page.getByRole("button", { name: "ابدأ المراجعة ←" }).click();
  await page
    .getByRole("button", { name: "ابدأ الكتابة ←", exact: true })
    .click();
  await page.getByTestId("typing-input").fill(line.text);
  await expect(
    page.getByRole("heading", { name: "أكملت المراجعة" }),
  ).toBeVisible();
  const s = await (await page.request.get("/api/state")).json();
  expect(s.records[0].attempts).toBe(2);
  expect(s.records[0].intervalMs).toBe(3 * 86400000);
  await page.screenshot({
    path: "evidence/review-complete.png",
    fullPage: true,
  });
});
test("missing audio fails visibly without preventing typing", async ({
  page,
}) => {
  await page.route("**/audio/*.mp3", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  await start(page);
  await expect(
    page.getByRole("alert").filter({ hasText: "ملف الصوت غير متاح" }),
  ).toBeVisible();
  await page.getByTestId("typing-input").fill("I");
  await expect(page.locator('[data-i="0"][data-mark="1"]')).toBeVisible();
});
test("API rejects foreign origins, incomplete inputs, and unauthenticated writes", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.request.get("/api/state");
  const csrf = await page.request.post("/api/attempts", {
    data: attempt(),
    headers: { Origin: "https://untrusted.example" },
  });
  expect(csrf.status()).toBe(403);
  const incomplete = await save(page.request, { ...attempt(), inputs: ["I"] });
  expect(incomplete.status()).toBe(422);
  const invalid = await save(page.request, { ...attempt(), inputs: "bad" });
  expect(invalid.status()).toBe(400);
  const anonymous = await browser.newContext({ baseURL: origin });
  expect((await save(anonymous.request, attempt())).status()).toBe(401);
  await anonymous.close();
});
test("unknown story is a real 404 and framing protections are present", async ({
  page,
}) => {
  const response = await page.goto("/story/does-not-exist");
  expect(response?.status()).toBe(404);
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  await expect(
    page.getByRole("heading", { name: "هذه الحكاية غير موجودة." }),
  ).toBeVisible();
});
test("an incorrect completed line is stored and scheduled in ten minutes", async ({
  page,
}) => {
  await start(page);
  const changed = "x" + line.text.slice(1);
  await page.getByTestId("typing-input").fill(changed);
  await expect
    .poll(async () => {
      const s = await (await page.request.get("/api/state")).json();
      return s.records.length;
    })
    .toBe(1);
  const r = (await (await page.request.get("/api/state")).json()).records[0];
  expect(r.wrong).toBe(1);
  expect(r.intervalMs).toBe(600000);
  expect(r.streak).toBe(0);
});
test("state loading failure displays retry and recovers", async ({ page }) => {
  await page.route("**/api/state", (route) =>
    route.fulfill({ status: 500, body: "{}", contentType: "application/json" }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("alert").filter({ hasText: "تعذّر تحميل التقدم" }),
  ).toBeVisible();
  await page.unroute("**/api/state");
  await page.getByRole("button", { name: "إعادة الاتصال" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "تعذّر تحميل التقدم" }),
  ).toHaveCount(0);
});
test("API bounds payload size and requires JSON content", async ({ page }) => {
  const tooLarge = await page.request.post("/api/attempts", {
    data: "x".repeat(129000),
    headers: { Origin: origin, "Content-Type": "application/json" },
  });
  expect(tooLarge.status()).toBe(413);
  const text = await page.request.post("/api/attempts", {
    data: "text",
    headers: { Origin: origin, "Content-Type": "text/plain" },
  });
  expect(text.status()).toBe(415);
  const nullBody = await page.request.post("/api/attempts", {
    data: "null",
    headers: { Origin: origin, "Content-Type": "application/json" },
  });
  expect(nullBody.status()).toBe(400);
  const malformed = await page.request.post("/api/attempts", {
    data: "{",
    headers: { Origin: origin, "Content-Type": "application/json" },
  });
  expect(malformed.status()).toBe(400);
});
