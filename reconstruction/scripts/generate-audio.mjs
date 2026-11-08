import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
const stories = JSON.parse(
  readFileSync(new URL("../content/stories.json", import.meta.url)),
);
const passages = JSON.parse(readFileSync(new URL("../content/passages.json", import.meta.url)));
const knownWords = ["menu","block","cancel","camera","location","internet"];
const root = new URL("../public/audio/", import.meta.url);
mkdirSync(root, { recursive: true });
const temp = mkdtempSync(join(tmpdir(), "satr-audio-"));
const manifest = [];
const jobs = stories.flatMap((s) =>
  s.lines.map((l, i) => ({ id: `${s.slug}-${i + 1}`, text: l.text })),
);
for (const word of new Set(
  stories.flatMap((s) => s.lines.map((l) => l.keyword.en)),
))
  jobs.push({ id: `word-${word.toLowerCase()}`, text: word });
for (const passage of passages)
  passage.sections.forEach((section, i) => jobs.push({ id: `passage-${passage.slug}-${i + 1}`, text: section.text }));
for(const word of knownWords) jobs.push({id:`known-${word}`,text:word});
try {
  for (const job of jobs) {
    const file = join(temp, "speech.txt");
    writeFileSync(file, job.text);
    const out = new URL(`${job.id}.mp3`, root);
    const process = spawnSync(
      "ffmpeg",
      [
        "-v",
        "error",
        "-y",
        "-f",
        "lavfi",
        "-i",
        `flite=textfile=${file}:voice=slt`,
        "-ar",
        "44100",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "96k",
        out.pathname,
      ],
      { encoding: "utf8" },
    );
    if (process.status !== 0)
      throw new Error(`FFmpeg with libflite is required: ${process.stderr}`);
    const bytes = readFileSync(out);
    const probe = spawnSync(
      "ffprobe",
      [
        "-v",
        "quiet",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        out.pathname,
      ],
      { encoding: "utf8" },
    );
    manifest.push({
      ...job,
      characters: job.text.length,
      bytes: bytes.length,
      duration: Number(probe.stdout.trim()),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      generator: "FFmpeg libflite, built-in slt voice, 96 kbps MP3",
    });
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
writeFileSync(
  new URL("../public/audio/manifest.json", import.meta.url),
  JSON.stringify(manifest, null, 2),
);
console.log(
  JSON.stringify(
    {
      files: manifest.length,
      bytes: manifest.reduce((n, x) => n + x.bytes, 0),
      characters: manifest.reduce((n, x) => n + x.characters, 0),
      seconds: manifest.reduce((n, x) => n + x.duration, 0),
    },
    null,
    2,
  ),
);
