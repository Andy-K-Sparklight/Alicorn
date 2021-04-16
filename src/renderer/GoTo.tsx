export function jumpTo(target: string): void {
  window.location.hash = target;
}

export function triggerSetPage(page: Pages): void {
  document.dispatchEvent(new CustomEvent("setPage", { detail: page }));
}

export enum Pages {
  Settings = "Settings",
  Today = "Today",
  Containers = "Containers",
  LaunchPad = "LaunchPad",
  CrashAnalyze = "CrashAnalyze",
  CoreDetail = "CoreDetail",
  ModDetail = "ModDetail",
  Installer = "Installer",
  Accounts = "Accounts",
  AccountDetail = "AccountDetail",
  InstallConfiguration = "InstallConfiguration",
}
