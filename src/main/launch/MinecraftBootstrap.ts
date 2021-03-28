import { MinecraftContainer } from "../container/MinecraftContainer";

export class RunningMinecraft {
  readonly args: string;
  readonly container: MinecraftContainer;

  constructor(args: string, container: MinecraftContainer) {
    this.args = args;
    this.container = container;
  }
}
