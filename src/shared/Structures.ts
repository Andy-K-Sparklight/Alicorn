export interface SystemCall {
  command: SystemCommand;
  args?: string[];
}

enum SystemCommand {
  CloseWindow,
}

export { SystemCommand };
