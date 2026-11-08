import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const data = JSON.parse(readFileSync(join(root, "content/stories.json")));
const manifest = JSON.parse(readFileSync(join(root, "public/audio/manifest.json")));
const media = new Map(manifest.map((item) => [item.id, item]));
const errors = [], ids = new Set();
const fail = (message) => errors.push(message);
for (const story of data) {
  if (!/^[a-z0-9-]+$/.test(story.slug) || ids.has(story.slug)) fail(`invalid/duplicate story slug: ${story.slug}`);
  ids.add(story.slug);
  if (!["A1", "A2", "B1", "B2", "C1"].includes(story.level)) fail(`invalid level: ${story.slug}`);
  if (!story.title || !story.titleEn || !story.description || !story.lines?.length) fail(`missing metadata: ${story.slug}`);
  story.lines?.forEach((line, index) => {
    const id = `${story.slug}-${index + 1}`;
    if (!line.text || !line.ar || !line.keyword?.en || !line.keyword?.ar) fail(`missing translated line/keyword: ${id}`);
    if (!line.text.toLowerCase().includes(line.keyword.en.toLowerCase())) fail(`keyword absent from line: ${id}`);
    if (/[\r\n]/.test(line.text)) fail(`line break inside sentence: ${id}`);
    for (const audioId of [id, `word-${line.keyword.en.toLowerCase()}`]) {
      const m = media.get(audioId), path = join(root, `public/audio/${audioId}.mp3`);
      if (!m || !existsSync(path)) { fail(`missing audio: ${audioId}`); continue; }
      if (createHash("sha256").update(readFileSync(path)).digest("hex") !== m.sha256) fail(`audio hash mismatch: ${audioId}`);
    }
  });
}
const report = { stories: data.length, lines: data.reduce((n, s) => n + s.lines.length, 0), audioFiles: media.size, errors,
  manualReviewRequired: ["originality and copyright", "English level and grammar", "Arabic translation quality", "speaker clarity/pronunciation", "image rights"] };
writeFileSync(join(root, "evidence/content-validation.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
