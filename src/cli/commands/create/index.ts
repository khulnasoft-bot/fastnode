import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { defineCommand } from "citty";
import type { ArgsDef } from "citty";
import { consola } from "consola";
import { colors } from "consola/utils";
import { installDependencies, installDependenciesCommand, runScriptCommand } from "nypm";
import type { PackageManagerName } from "nypm";
import { join, resolve } from "pathe";
import { hasTTY, isAgent } from "std-env";
import {
  error,
  info,
  log,
  panel,
  startSpinner,
  stopSpinner,
  success,
  warn,
  promptText,
  promptSelect,
  promptConfirm,
} from "../../ui.ts";
import { showUsage } from "../../_usage.ts";
import { findArgsError } from "./_args.ts";
import { createProject, isEmptyDir, projectTemplates } from "./_project.ts";
import {
  detectPackageManager,
  displayPath,
  isInsideRepo,
  isNotFoundError,
  pmNames,
  shellQuote,
} from "./_utils.ts";

const DEFAULT_DIR = "fastnode-app";

const templateNames = projectTemplates.map((t) => t.name);

const argsDef = {
  dir: {
    type: "positional",
    required: false,
    description: `Directory to create the project in (default: \`${DEFAULT_DIR}\`, prompted in a terminal; required when run by an agent without \`--template\`)`,
  },
  template: {
    type: "string",
    alias: "t",
    description: `Project template: ${projectTemplates.map((t, i) => `\`${t.name}\` (${t.description}${i === 0 ? ", default" : ""})`).join(", ")}`,
  },
  force: {
    type: "boolean",
    description: "Write into a non-empty directory, overwriting the files the template creates",
  },
  install: {
    type: "boolean",
    default: true,
    description: "Install dependencies",
    negativeDescription: "Skip installing dependencies",
  },
  packageManager: {
    type: "string",
    alias: "p",
    description: `Package manager to use: ${pmNames.join(", ")} (default: the one running \`fastnode\`, or npm)`,
  },
  gitInit: {
    type: "boolean",
    description:
      "Initialize a git repository (default: prompted in an interactive terminal, otherwise off)",
  },
} satisfies ArgsDef;

export default defineCommand({
  meta: {
    name: "create",
    description: "Create a new Fastnode project",
  },
  args: argsDef,
  async run({ args, rawArgs, cmd }) {
    const argsError = findArgsError(rawArgs, argsDef, {
      choices: { template: templateNames, packageManager: pmNames },
    });
    if (argsError) {
      return fail(argsError);
    }
    if (isAgent && !args.dir && !args.template) {
      await showUsage(cmd, { meta: { name: "fastnode" } });
      return fail(
        `No directory given. Pick the options above and pass a directory, for example: \`fastnode create ${DEFAULT_DIR} --template ${templateNames[0]}\`.`
      );
    }
    const interactive = hasTTY && !isAgent;

    if (args.template && !templateNames.includes(args.template)) {
      const lower = args.template.toLowerCase();
      return fail(
        `Unknown template \`${args.template}\`.${templateNames.includes(lower) ? ` Did you mean \`${lower}\`?` : ""} Available templates: ${templateNames.map((t) => `\`${t}\``).join(", ")}.`
      );
    }
    if (args.packageManager && !pmNames.includes(args.packageManager as PackageManagerName)) {
      return fail(
        `Unknown package manager \`${args.packageManager}\`. Use one of: ${pmNames.join(", ")}.`
      );
    }

    let dir = resolve(
      args.dir ||
        (interactive
          ? ((await promptText({
              message: "Where would you like to create your Fastnode project?",
              placeholder: `./${DEFAULT_DIR}`,
              defaultValue: DEFAULT_DIR,
            })) ?? DEFAULT_DIR)
          : DEFAULT_DIR)
    );

    if (existsSync(dir) && !statSync(dir).isDirectory()) {
      return fail(`${colors.cyan(displayPath(dir))} already exists and is not a directory.`);
    }
    let force = !!args.force;
    if (!interactive && !force && !(await isEmptyDir(dir))) {
      return fail(
        `Directory ${colors.cyan(displayPath(dir))} is not empty. Use \`--force\` to write into it (files the template creates are overwritten) or choose another directory.`
      );
    }
    while (!force && !(await isEmptyDir(dir))) {
      const action = await promptSelect({
        message: `Directory ${colors.cyan(displayPath(dir))} is not empty. What would you like to do?`,
        options: [
          { label: "Select a different directory", value: "new-directory" },
          { label: "Override its contents", value: "override" },
          { label: "Abort", value: "abort" },
        ],
      });
      if (action === "override") {
        force = true;
      } else if (action === "new-directory") {
        const newDir = await promptText({
          message: "Please specify a different directory:",
        });
        if (newDir === null) {
          process.exit(1);
        }
        dir = resolve(newDir);
      } else {
        process.exit(1);
      }
    }

    const template =
      args.template ||
      (interactive
        ? ((await promptSelect({
            message: "Which builder would you like to use?",
            options: projectTemplates.map((t) => ({
              label: `${t.title} ${colors.dim(`(${t.description})`)}`,
              value: t.name,
            })),
          })) ?? templateNames[0]!)
        : templateNames[0]!);

    const { overwritten } = await createProject(dir, { template, force });
    const dirPath = displayPath(dir);
    success(
      `Created a new Fastnode project in ${dirPath === "." ? "the current directory" : colors.cyan(dirPath)}.`
    );
    if (overwritten.length > 0) {
      warn(`Overwrote existing files: ${overwritten.join(", ")}.`);
    }

    const detectedPM = detectPackageManager();
    let packageManager: PackageManagerName | "" | undefined;
    let pmSource = "selected";
    if (args.packageManager) {
      packageManager = args.packageManager as PackageManagerName;
    } else if (args.install && interactive) {
      const selected = await promptSelect({
        message: "Which package manager would you like to use?",
        options: [
          { label: "(none)", value: "", hint: "skip installing dependencies" },
          ...pmNames.map((pm) => ({
            label: pm,
            value: pm,
            hint: pm === detectedPM ? "current" : undefined,
          })),
        ],
      });
      packageManager = (selected as PackageManagerName | "") ?? "";
    } else {
      packageManager = detectedPM || "npm";
      pmSource = detectedPM ? "detected" : "default";
    }

    let installed = false;
    let pm = packageManager || "npm";
    if (args.install && packageManager) {
      const spin = startSpinner(`Installing dependencies with \`${packageManager}\`...`);
      try {
        await installDependencies({ cwd: dir, packageManager });
        installed = true;
        stopSpinner(spin, "Dependencies installed.");
      } catch (err) {
        stopSpinner(spin);
        process.exitCode = 1;
        const notFound = isNotFoundError(err);
        if (notFound && packageManager !== "npm") {
          pm = "npm";
        }
        error(
          `Failed to install dependencies: ${notFound ? `\`${packageManager}\` is not installed (or not in PATH).` : (err as Error).message}`
        );
        info(
          `The project files were created: install dependencies in the project directory with an available package manager (see the next steps), rather than running \`fastnode create\` again.`
        );
      }
    }

    const hasGit = existsSync(join(dir, ".git"));
    const insideRepo = !hasGit && (await isInsideRepo(dir));
    const gitInit =
      !hasGit &&
      (args.gitInit ??
        (interactive &&
          (await (promptConfirm({
            message: "Initialize a git repository?",
            active: "Yes",
            inactive: "No",
          }) ?? Promise.resolve(!insideRepo)))));
    let gitInitialized = false;
    if (hasGit && args.gitInit) {
      info("Skipped `git init`: the directory is already a git repository.");
    } else if (gitInit) {
      try {
        execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
        gitInitialized = true;
        success(
          `Git repository initialized${insideRepo ? " (nested inside an existing repository or workspace)" : ""}.`
        );
      } catch (err) {
        warn(`Failed to initialize a git repository: ${(err as Error).message}`);
      }
    }

    const summary = [
      ["Directory", dir],
      [
        "Template",
        `${template} (${projectTemplates.find((t) => t.name === template)!.description})`,
      ],
      [
        "Package manager",
        packageManager
          ? `${packageManager} (${pmSource}${pm === packageManager ? "" : ", not found"})`
          : "none",
      ],
      [
        "Dependencies",
        installed ? "installed" : args.install && packageManager ? "failed" : "not installed",
      ],
      [
        "Git",
        hasGit
          ? "existing repository"
          : gitInitialized
            ? `initialized${insideRepo ? " (nested)" : ""}`
            : gitInit
              ? "failed"
              : `not initialized${insideRepo ? " (inside an existing repository or workspace)" : ""}`,
      ],
    ];
    const nextSteps = [
      dirPath !== "." && `cd ${shellQuote(dirPath)}`,
      !installed && installDependenciesCommand(pm),
      runScriptCommand(pm, "dev"),
    ].filter(Boolean) as string[];

    panel(
      "Summary",
      summary.map(([label, value]) => `${label.padEnd(17)} ${value}`)
    );
    const agentHint = isAgent
      ? "\n\nAgents: read AGENTS.md, and test routes with `npx fastnode fetch /api/hello` (no build or running server needed)."
      : "";
    const nextStepsText = `Next steps:\n\n${nextSteps.map((step) => `  ${step}`).join("\n")}${agentHint}\n\nFastnode v1 docs: https://fastnode.khulnasoft.com/docs`;
    if (interactive) {
      panel("Next steps", [nextStepsText]);
    } else {
      log(`\n${nextStepsText}\n`);
    }
  },
});

function fail(message: string): never {
  error(message);
  process.exit(1);
}
