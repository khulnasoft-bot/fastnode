import { consola } from "consola";
import { colors } from "consola/utils";
import { hasTTY } from "std-env";
import {
  box as clackBox,
  confirm as clackConfirm,
  CANCEL_SYMBOL,
  intro as clackIntro,
  isCancel as clackIsCancel,
  isTTY as clackIsTTY,
  log as clackLog,
  note as clackNote,
  outro as clackOutro,
  select as clackSelect,
  spinner as clackSpinner,
  text as clackText,
} from "@clack/prompts";
import type { SpinnerResult } from "@clack/prompts";

const useClack = hasTTY && clackIsTTY(process.stdout);

export function intro(message: string): void {
  if (useClack) {
    clackIntro(message);
  } else {
    consola.info(message);
  }
}

export function outro(message: string): void {
  if (useClack) {
    clackOutro(message);
  } else {
    consola.info(message);
  }
}

export function log(message: string): void {
  if (useClack) {
    clackLog.message(message);
  } else {
    consola.log(message);
  }
}

export function info(message: string): void {
  if (useClack) {
    clackLog.info(message);
  } else {
    consola.info(message);
  }
}

export function warn(message: string): void {
  if (useClack) {
    clackLog.warn(message);
  } else {
    consola.warn(message);
  }
}

export function error(message: string): void {
  if (useClack) {
    clackLog.error(message);
  } else {
    consola.error(message);
  }
}

export function success(message: string): void {
  if (useClack) {
    clackLog.success(message);
  } else {
    consola.success(message);
  }
}

export function note(title: string, message: string): void {
  if (useClack) {
    clackNote(message, title);
  } else {
    consola.info(`${title}: ${message}`);
  }
}

export function panel(title: string, lines: Array<string>): void {
  if (useClack) {
    clackBox(lines.join("\n"), title);
  } else {
    consola.log(`\n${title}:\n${lines.map((l) => `  ${l}`).join("\n")}\n`);
  }
}

export function startSpinner(message: string): SpinnerResult | null {
  if (useClack) {
    const spin = clackSpinner({});
    spin.start(message);
    return spin;
  }
  consola.start(message);
  return null;
}

export function stopSpinner(spinner: SpinnerResult | null, message?: string): void {
  if (useClack && spinner) {
    spinner.stop(message);
  } else if (message) {
    consola.info(message);
  }
}

export async function promptText(opts: {
  message: string;
  placeholder?: string;
  defaultValue?: string;
}): Promise<string | null> {
  if (useClack) {
    const result = await clackText({
      message: opts.message,
      placeholder: opts.placeholder,
      defaultValue: opts.defaultValue,
    });
    if (result === CANCEL_SYMBOL || clackIsCancel(result)) {
      return null;
    }
    return result as string;
  }
  return consola
    .prompt(opts.message, {
      type: "text",
      placeholder: opts.placeholder,
      initial: opts.defaultValue,
      cancel: "reject",
    })
    .catch(() => null);
}

export async function promptSelect<T extends string>(opts: {
  message: string;
  options: Array<{ label: string; value: T; hint?: string }>;
}): Promise<T | null> {
  if (useClack) {
    const result = await (clackSelect as any)({
      message: opts.message,
      options: opts.options,
    });
    if (result === CANCEL_SYMBOL || clackIsCancel(result)) {
      return null;
    }
    return result as T;
  }
  return consola.prompt(opts.message, {
    type: "select",
    options: opts.options,
    cancel: "reject",
  }) as Promise<T | null>;
}

export async function promptConfirm(opts: {
  message: string;
  active?: string;
  inactive?: string;
}): Promise<boolean | null> {
  if (useClack) {
    const result = await clackConfirm({
      message: opts.message,
      active: opts.active,
      inactive: opts.inactive,
    });
    if (result === CANCEL_SYMBOL || clackIsCancel(result)) {
      return null;
    }
    return result as boolean;
  }
  return consola.prompt(opts.message, {
    type: "confirm",
    cancel: "reject",
  }) as Promise<boolean | null>;
}

export { colors, hasTTY };
