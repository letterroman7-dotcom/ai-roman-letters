import config from "./config.js";

const runtimeFlags = new Set<string>();

export function isEnabled(flag: string): boolean {
  return config.flags.has(flag) || runtimeFlags.has(flag);
}

export function enable(flag: string): void {
  runtimeFlags.add(flag);
}

export function disable(flag: string): void {
  runtimeFlags.delete(flag);
}

export function listFlags(): string[] {
  return Array.from(new Set([...config.flags, ...runtimeFlags])).sort();
}

export function killSwitchActive(): boolean {
  return config.killSwitch === true;
}
