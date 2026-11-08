import { readFileSync, writeFileSync } from "node:fs";
const manifest = JSON.parse(
  readFileSync(new URL("../public/audio/manifest.json", import.meta.url)),
);
const actual = {
  files: manifest.length,
  characters: manifest.reduce((n, x) => n + x.characters, 0),
  audioBytes: manifest.reduce((n, x) => n + x.bytes, 0),
  audioSeconds: manifest.reduce((n, x) => n + x.duration, 0),
};
const round = (n) => Math.round(n * 10000) / 10000;
const price = {
  pollyStandardPerMillion: 4,
  pollyNeuralPerMillion: 16,
  r2StorageGbMonth: 0.015,
  r2ClassAPerMillion: 4.5,
  r2ClassBPerMillion: 0.36,
  r2FreeGb: 10,
  r2FreeA: 1_000_000,
  r2FreeB: 10_000_000,
  usdToSarPlanning: 3.75,
};
const catalogue = {
  stories: 1000,
  linesPerStory: 6,
  charactersPerLine: 60,
  keywordCharacters: 10,
  lineSeconds: 4,
  keywordSeconds: 1,
  bitrateKbps: 96,
  newStoriesPerMonth: 100,
};
const characters =
  catalogue.stories *
  catalogue.linesPerStory *
  (catalogue.charactersPerLine + catalogue.keywordCharacters);
const storageGb =
  (catalogue.stories *
    catalogue.linesPerStory *
    (catalogue.lineSeconds + catalogue.keywordSeconds) *
    catalogue.bitrateKbps *
    1000) /
  8 /
  1e9;
const scenarios = [100, 1000, 10000].map((mau, index) => {
  const sessions = 20,
    lines = 12,
    plays = 2;
  const requests = mau * sessions * lines * plays;
  const transferGb = (requests * 4 * 96 * 1000) / 8 / 1e9;
  const vm = [6, 12, 24][index];
  const backups = vm * 0.2;
  const newTts = ((catalogue.newStoriesPerMonth * 6 * 70) / 1e6) * 16;
  const r2Storage = Math.ceil(Math.max(0, storageGb - 10)) * 0.015;
  const r2Reads = Math.ceil(Math.max(0, requests - 10_000_000) / 1e6) * 0.36;
  const monthly = round(vm + backups + newTts + r2Storage + r2Reads);
  return {
    mau,
    sessionsPerUser: sessions,
    requests,
    transferGb: round(transferGb),
    vmPlanningUsd: vm,
    weeklyBackupUsd: round(backups),
    newNeuralAudioUsd: round(newTts),
    r2StorageUsd: r2Storage,
    r2ReadsUsd: r2Reads,
    monthlyUsd: monthly,
    monthlySar: round(monthly * 3.75),
    note: "Planning only; optional R2/Polly are not wired into the app. No capacity benchmark or purchase.",
  };
});
const out = {
  checkedAt: "2026-11-07",
  sources: {
    polly: "https://aws.amazon.com/polly/pricing/",
    r2: "https://developers.cloudflare.com/r2/pricing/",
    hosting: "https://www.digitalocean.com/pricing/droplets",
  },
  actual: {
    ...actual,
    localProviderSpendUsd: 0,
    optionalNeuralRegenerationUsd: round((actual.characters / 1e6) * 16),
  },
  price,
  catalogue: {
    ...catalogue,
    characters,
    storageGb,
    oneTimeStandardUsd: round((characters / 1e6) * 4),
    oneTimeNeuralUsd: round((characters / 1e6) * 16),
  },
  scenarios,
  buildEstimate: {
    hoursLow: 72,
    hoursHigh: 116,
    hourlyUsdLow: 40,
    hourlyUsdHigh: 75,
    usdLow: 2880,
    usdHigh: 8700,
    note: "Independent market planning assumption, not a quote or this session’s invoiced work.",
  },
  exclusions: [
    "VAT and taxes",
    "Domain registration",
    "Human content review",
    "Monitoring/email/payment services",
    "High availability and managed databases",
    "Load validation",
    "Actual AI session billing, unavailable",
  ],
};
writeFileSync(
  new URL("../evidence/cost-model.json", import.meta.url),
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out, null, 2));
