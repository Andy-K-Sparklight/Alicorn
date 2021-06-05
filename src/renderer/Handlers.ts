export function registerHandlers(): void {}

export abstract class Handler {
  abstract handle(channel: string, ...args: unknown[]): Promise<unknown>;

  abstract canHandle(channel: string): boolean;
}
