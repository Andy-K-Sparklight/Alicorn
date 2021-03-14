export interface Updatable {
  hasUpdate(): Promise<boolean>;

  runUpdate(): Promise<void>;
}
