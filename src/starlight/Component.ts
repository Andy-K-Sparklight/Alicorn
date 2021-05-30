export abstract class RenderAble {
  abstract render(document: Document, ...args: unknown[]): void;

  // eslint-disable-next-line no-empty-function
  async prerender(document: Document, ...args: unknown[]): Promise<void> {}
}

export abstract class Executor {
  abstract execute(document: Document, ...args: unknown[]): void;
}
