import { spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
// Dedicated, disposable E2E database. Never delete the application database.
const root = resolve(".test-data");
mkdirSync(root, { recursive: true });
for (const suffix of ["", "-wal", "-shm"])
  rmSync(resolve(root, "e2e.sqlite" + suffix), { force: true });
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      SAT_DATABASE_PATH: resolve(root, "e2e.sqlite"),
      APP_ORIGIN: "http://127.0.0.1:3000",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
