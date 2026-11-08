import data from "@/content/stories.json";
export type Line = {
  id: string;
  storySlug: string;
  text: string;
  ar: string;
  keyword: { en: string; ar: string };
  audio: string;
};
export const stories = data.map((s) => ({
  ...s,
  lines: s.lines.map((l, i) => ({
    ...l,
    id: `${s.slug}-${i + 1}`,
    storySlug: s.slug,
    audio: `/audio/${s.slug}-${i + 1}.mp3`,
  })),
}));
export type Story = (typeof stories)[number];
export const allLines = stories.flatMap((s) => s.lines);
export const findLine = (id: string) => allLines.find((l) => l.id === id);
