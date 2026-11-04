#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { version as fastnodeVersion } from "#fastnode/meta";
import { intro, outro } from "./ui.ts";

const pkgName = "fastnode";
const pkgVersion = fastnodeVersion ?? "1.0.0";

intro(`${pkgName} v${pkgVersion}`);

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

runMain(main).finally(() => {
  outro(`Happy coding with ${pkgName}!`);
});
