import {
  CrashLoader,
  CrashLoaderReport,
  CrashReportCursor,
} from "./CrashLoader";

export const CMC_CRASH_LOADER: CrashLoader = {
  rules: {
    CMC001: {
      match: "Manually triggered debug crash",
      script: ((
        cursor: CrashReportCursor,
        locale: string
      ): CrashLoaderReport => {
        switch (locale) {
          case "zh_cn":
          default:
            return {
              reason: "手动触发的崩溃",
              suggestions: ["请不要按下 F3+C 组合键！"],
            };
        }
      }).toString(),
    },
  },
};
