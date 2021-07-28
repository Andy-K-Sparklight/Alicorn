import { CrashLoader } from "./CrashLoader";

export const CMC_CRASH_LOADER: CrashLoader = {
  rules: {
    CMC001: {
      match: "Manually triggered debug crash",
      script: (() => {
        return {
          reason: "手动触发的崩溃",
          suggestions: ["请不要按下 F3+C 组合键！"],
        };
      }).toString(),
    },
    CMC002: {
      match: "Pixel format not accelerated",
      script: (() => {
        return {
          reason:
            "显卡型号过旧，或显卡驱动未正确安装（高版本 Minecraft 对显卡有更高要求）",
          suggestions: ["更新或修复显卡驱动", "尝试换一张显卡，或游玩较老版本"],
        };
      }).toString(),
    },
  },
};
