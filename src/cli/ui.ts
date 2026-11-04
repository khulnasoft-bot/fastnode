import { consola } from "consola";
import { hasTTY } from "std-env";
import {
  intro as clackIntro,
  outro as clackOutro,
  log as clackLog,
  spinner as clackSpinner,
  isTTY as clackIsTTY,
} from "@clack/prompts";
import type { SpinnerResult } from "@clack/prompts";

const useClack = hasTTY && clackIsTTY(process.stdout);

function formatMessage(message: string, ...args: any[]): string {
  if (args.length === 0) {
    return message;
  }
  return message + " " + args.map((a) => String(a)).join(" ");
}

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

export function log(message: string, ...args: any[]): void {
  if (useClack) {
    clackLog.message(formatMessage(message, ...args));
  } else {
    consola.log(formatMessage(message, ...args));
  }
}

export function info(message: string, ...args: any[]): void {
  if (useClack) {
    clackLog.info(formatMessage(message, ...args));
  } else {
    consola.info(formatMessage(message, ...args));
  }
}

export function warn(message: string, ...args: any[]): void {
  if (useClack) {
    clackLog.warn(formatMessage(message, ...args));
  } else {
    consola.warn(formatMessage(message, ...args));
  }
}

export function error(message: string, ...args: any[]): void {
  if (useClack) {
    clackLog.error(formatMessage(message, ...args));
  } else {
    consola.error(formatMessage(message, ...args));
  }
}

export function success(message: string, ...args: any[]): void {
  if (useClack) {
    clackLog.success(formatMessage(message, ...args));
  } else {
    consola.success(formatMessage(message, ...args));
  }
}

export function start(message: string): void {
  if (useClack) {
    const spin = clackSpinner({});
    spin.start(message);
    // Don't return - fire and forget for non-TTY fallback compatibility
  } else {
    consola.start(message);
  }
}

export function createSpinner(message: string): SpinnerResult {
  if (useClack) {
    const spin = clackSpinner({});
    spin.start(message);
    return spin;
  }
  return {
    start: () => consola.start(message),
    stop: (msg = message) => consola.info(msg),
    stopSync: (msg = message) => consola.info(msg),
  } as unknown as SpinnerResult;
}

export function stopSpinner(spinner: SpinnerResult, message?: string): void {
  if (useClack) {
    spinner.stop(message);
  } else {
    if (message) {
      consola.info(message);
    }
  }
}

export { hasTTY };
