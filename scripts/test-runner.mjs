#!/usr/bin/env node
import { spawn } from "node:child_process";

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "-i");

const child = spawn(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "vitest", "--run", "--passWithNoTests", ...forwardedArgs],
  { stdio: "inherit" },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
