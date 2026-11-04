#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { version as fastnodeVersion } from "#fastnode/meta";
import { error, intro, log, outro, success } from "./ui.ts";

const pkgName = "fastnode";
const pkgVersion = fastnodeVersion ?? "1.0.0";

// Only show intro when not requesting help/version
const isHelpRequest = process.argv.includes("--help") || process.argv.includes("-h");
const isVersionRequest = process.argv.includes("--version") || process.argv.includes("-v");

if (!isHelpRequest && !isVersionRequest) {
  intro(`${pkgName} v${pkgVersion}`);
}

const main = defineCommand({
  meta: {
    name: pkgName,
    description: "Build and Deploy Universal JavaScript Servers",
    version: pkgVersion,
  },
  subCommands: {
    create: () => import("./commands/create/index.ts").then((r) => r.default),
    dev: () => import("./commands/dev.ts").then((r) => r.default),
    build: () => import("./commands/build.ts").then((r) => r.default),
    deploy: () => import("./commands/deploy.ts").then((r) => r.default),
    task: () => import("./commands/task/index.ts").then((r) => r.default),
    preview: () => import("./commands/preview.ts").then((r) => r.default),
    serve: () => import("./commands/serve.ts").then((r) => r.default),
    start: () => import("./commands/serve.ts").then((r) => r.default),
    fetch: () => import("./commands/fetch/index.ts").then((r) => r.default),
    curl: () => import("./commands/fetch/index.ts").then((r) => r.default),
    docs: () => import("./commands/docs.ts").then((r) => r.default),
  },
});

runMain(main)
  .catch((err) => {
    error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  })
  .finally(() => {
    if (!isHelpRequest && !isVersionRequest) {
      outro(`Happy coding with ${pkgName}!`);
    }
  });
