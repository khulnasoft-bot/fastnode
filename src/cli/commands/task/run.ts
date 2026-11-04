import { defineCommand } from "citty";
import destr from "destr";
import { loadOptions, runTask } from "fastnode/builder";
import { resolve } from "pathe";
import { error, info, success } from "../../ui.ts";

export default defineCommand({
  meta: {
    name: "run",
    description: "Run a runtime task in the currently running dev server (experimental)",
  },
  args: {
    name: {
      type: "positional",
      description: "task name",
      required: true,
    },
    dir: {
      type: "string",
      description: "project root directory",
    },
    payload: {
      type: "string",
      description: "payload json to pass to the task",
    },
  },
  async run({ args }) {
    const cwd = resolve((args.dir || args.cwd || ".") as string);
    const options = await loadOptions({ rootDir: cwd }).catch(() => undefined);

    info(`Running task \`${args.name}\`...`);
    let payload: any = destr(args.payload || "{}");
    if (typeof payload !== "object") {
      error(`Invalid payload: \`${args.payload}\` (it should be a valid JSON object)`);
      payload = undefined;
    }
    try {
      const { result } = await runTask(
        {
          name: args.name,
          context: {},
          payload,
        },
        {
          cwd,
          buildDir: options?.buildDir || ".fastnode",
        }
      );
      success(`Result: ${JSON.stringify(result)}`);
    } catch (err) {
      error(`Failed to run task \`${args.name}\`: ${err}`);
      process.exit(1); // eslint-disable-line unicorn/no-process-exit
    }
  },
});
