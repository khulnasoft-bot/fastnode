import { defineCommand } from "citty";
import type { DateString } from "compatx";
import { resolve } from "pathe";
import { error, info, startSpinner, stopSpinner, success, warn } from "../ui.ts";
import {
  build,
  copyPublicAssets,
  createFastnode,
  deploy,
  getBuildInfo,
  prepare,
  prerender,
} from "fastnode/builder";
import { buildArgs } from "./build.ts";

export default defineCommand({
  meta: {
    name: "deploy",
    description: "Build and deploy fastnode project for production",
  },
  args: {
    ...buildArgs,
    prebuilt: {
      type: "boolean",
      description: "Skip the build step and deploy the existing build",
    },
  },
  async run({ args, rawArgs }) {
    const rootDir = resolve((args.dir || args._dir || ".") as string);

    let preset = args.preset;
    let envName = args.envName;
    let outputDir: string | undefined;
    if (args.prebuilt) {
      const lastBuild = await getBuildInfo({ rootDir });
      if (!lastBuild.buildInfo) {
        error("No build info found, cannot deploy.");
        process.exit(1);
      }
      if (preset && preset !== lastBuild.buildInfo.preset) {
        warn(
          `Ignoring \`--preset ${preset}\` and using \`${lastBuild.buildInfo.preset}\` from the existing build.`
        );
      }
      preset = lastBuild.buildInfo.preset;
      if (lastBuild.buildInfo.envName) {
        if (envName && envName !== lastBuild.buildInfo.envName) {
          warn(
            `Ignoring \`--envName ${envName}\` and using \`${lastBuild.buildInfo.envName}\` from the existing build.`
          );
        }
        envName = lastBuild.buildInfo.envName;
      }
      outputDir = lastBuild.outputDir;
    }

    const fastnode = await createFastnode(
      {
        rootDir,
        dev: false,
        minify: args.minify,
        preset,
        builder: args.builder as "rollup" | "rolldown" | "vite",
        output: outputDir ? { dir: outputDir } : undefined,
      },
      {
        compatibilityDate: args.compatibilityDate as DateString,
        c12: { envName },
      }
    );

    const extraArgs = rawArgs.includes("--") ? rawArgs.slice(rawArgs.indexOf("--") + 1) : [];

    try {
      if (!args.prebuilt) {
        const spin1 = startSpinner("Preparing app...");
        await prepare(fastnode);
        stopSpinner(spin1, "App prepared.");

        if (fastnode.options.builder !== "vite") {
          const spin2 = startSpinner("Copying public assets...");
          await copyPublicAssets(fastnode);
          stopSpinner(spin2, "Public assets copied.");

          const spin3 = startSpinner("Prerendering...");
          await prerender(fastnode);
          stopSpinner(spin3, "Prerendering complete.");
        }

        const spin4 = startSpinner("Building app...");
        await build(fastnode);
        stopSpinner(spin4, "App built.");
      }

      const spin5 = startSpinner("Deploying...");
      await deploy(fastnode, { args: extraArgs });
      stopSpinner(spin5, "Deployed.");
    } catch (err) {
      error((err as Error).message);
      process.exitCode = 1;
    } finally {
      await fastnode.close();
    }
  },
});
