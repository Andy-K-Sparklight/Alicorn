import { CrashLoader, CrashLoaderReport } from "./CrashLoader";

export const CMC_CRASH_LOADER: CrashLoader = {
  rules: {
    CMC001: {
      match: "Manually triggered debug crash",
      script: ((): CrashLoaderReport => {
        return {
          reason: "手动触发的崩溃",
          suggestions: ["请不要按下 F3+C 组合键！"],
        };
      }).toString(),
    },
    CMC002: {
      match: "Pixel format not accelerated",
      script: ((): CrashLoaderReport => {
        return {
          reason:
            "显卡型号过旧，或显卡驱动未正确安装（高版本 Minecraft 对显卡有更高要求）",
          suggestions: ["更新或修复显卡驱动", "尝试换一张显卡，或游玩较老版本"],
        };
      }).toString(),
    },
    CMC003: {
      match: "UnsupportedClassVersionError",
      script: ((): CrashLoaderReport => {
        return {
          reason: "Java 版本过旧（Minecraft 1.17 需要更新的  JRE）",
          suggestions: ["安装 JRE 16（可在 Alicorn 中获得帮助）"],
        };
      }).toString(),
    },
    CMC004: {
      match: "Could not set pixel format",
      script: ((): CrashLoaderReport => {
        return {
          reason: "显卡驱动未正确安装",
          suggestions: ["更新或修复显卡驱动"],
        };
      }).toString(),
    },
    CMC005: {
      match: "OutOfMemoryError",
      script: ((): CrashLoaderReport => {
        return {
          reason: "内存不足",
          suggestions: ["安装新的内存", "使用 JRE 调优设置（参见选项页）"],
        };
      }).toString(),
    },
  },
};
