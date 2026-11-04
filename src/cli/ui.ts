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
