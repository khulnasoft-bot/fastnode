import { defineCommand } from "citty";
import { log } from "../../ui.ts";
import { listTasks, loadOptions } from "fastnode/builder";
import { resolve } from "pathe";

export default defineCommand({
  meta: {
    name: "list",
    description: "List available tasks (experimental)",
  },
  args: {
    dir: {
      type: "string",
      description: "project root directory",
    },
  },
  async run({ args }) {
    const cwd = resolve((args.dir || args.cwd || ".") as string);
    const options = await loadOptions({ rootDir: cwd }).catch(() => undefined);

    const tasks = await listTasks({
      cwd,
      buildDir: options?.buildDir || ".fastnode",
    });
    for (const [name, task] of Object.entries(tasks)) {
      log(` - \`${name}\`${task.meta?.description ? ` - ${task.meta.description}` : ""}`);
    }
  },
});
