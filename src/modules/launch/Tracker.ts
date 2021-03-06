import { ProfileType } from "../profile/WhatProfile";

export class LaunchTracker {
  javaReport: JavaReport = { runtime: "", version: 0 };
  libraryReport: FileOperateReport = {
    total: 0,
    resolved: 0,
    operateRecord: [],
  };
  assetsReport: FileOperateReport = {
    total: 0,
    resolved: 0,
    operateRecord: [],
  };
  modsReport: FileOperateReport = {
    total: 0,
    resolved: 0,
    operateRecord: [],
  };

  mods(v?: FileOperateReport): FileOperateReport {
    if (v) {
      this.modsReport = v;
    }
    return this.modsReport;
  }

  java(v?: JavaReport): JavaReport {
    if (v) {
      this.javaReport = v;
    }
    return this.javaReport;
  }

  library(v?: FileOperateReport): FileOperateReport {
    if (v) {
      this.libraryReport = v;
    }
    return this.libraryReport;
  }

  assets(v?: FileOperateReport): FileOperateReport {
    if (v) {
      this.assetsReport = v;
    }
    return this.assetsReport;
  }
}

export interface FileOperateReport {
  total: number;
  resolved: number;
  operateRecord: OperateRecord[];
}

export interface OperateRecord {
  file: string;
  operation: "SKIPPED" | "OPERATED" | "FAILED";
}

export interface ProfileReport {
  baseVersion: string;
  id: string;
  isLegacy: boolean;
  type: ProfileType;
}

export interface JavaReport {
  runtime: string;
  version: number;
}
