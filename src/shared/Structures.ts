export interface SystemCall {
  command: SystemCommand;
  data?: string[];
}

enum SystemCommand {
  CloseWindow,
}

export { SystemCommand };
