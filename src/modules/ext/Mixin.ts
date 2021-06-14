const MIXIN_TABLE: Map<string, Mixin[]> = new Map();

export interface Mixin {
  target: string;
  type: MixinType;
  executor: (...args: unknown[]) => unknown;
}

export type MixinType = "BeforeEnd" | "AfterEnd" | "BeforeStart" | "AfterStart";

export function registerMixin(target: string, mixin: Mixin): void {
  const tc = MIXIN_TABLE.get(target);
  if (tc === undefined) {
    MIXIN_TABLE.set(target, [mixin]);
  } else {
    tc.push(mixin);
  }
}

// Call all mixins related with this target and refuse any delay
export function markMixinSync(
  target: string,
  state: MixinType,
  ...args: unknown[]
): void {
  const allMixins = MIXIN_TABLE.get(target);
  if (allMixins === undefined || allMixins.length === 0) {
    return;
  }
  for (const m of allMixins) {
    if (m.type === state) {
      m.executor(...args);
    }
  }
}

// Call all mixins related with this target while accepting delay
export async function markMixin(
  target: string,
  state: MixinType,
  ...args: unknown[]
): Promise<void> {
  const allMixins = MIXIN_TABLE.get(target);
  if (allMixins === undefined || allMixins.length === 0) {
    return;
  }
  for (const m of allMixins) {
    if (m.type === state) {
      const t = m.executor(...args);
      if (t instanceof Promise) {
        await t;
      }
    }
  }
}
