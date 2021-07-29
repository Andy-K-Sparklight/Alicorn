import pkg from "../../../package.json";
import { randsl } from "../../renderer/Translator";
import {
  Box,
  CodeComponent,
  ComponentsGroup,
  Spoiler,
  StyleComponent,
} from "../bbcode/BBCode";
import { LaunchTracker } from "../launch/Tracker";
import { CrashReportMap } from "./CrashLoader";

const TITLE_FONT = "Trebuchet MS";
const PINKIE_COLOR = "#df307f";
const TWILIGHT_COLOR = "#5d2391";
const BR = "\n";

export function generateTrackerInfo(tracker: LaunchTracker): string {
  const br1 = new StyleComponent("[已查验]");
  br1.color = "Green";
  br1.bold = true;
  br1.size = "2";
  const RESOLVED = br1.toBBCode();
  const RESERVED = br1.make("[已保留]").toBBCode();
  br1.color = "Red";
  const FAILED = br1.make("[查验失败]").toBBCode();
  const ERR = br1.make("[错误]").toBBCode();
  br1.color = "Gray";
  const MOVED = br1.make("[已移动]").toBBCode();
  const trackerPage = new ComponentsGroup();
  const title = new StyleComponent("Launch Tracker");
  title.font = TITLE_FONT;
  title.align = "center";
  title.color = PINKIE_COLOR;
  title.size = "5";
  trackerPage.db(title);
  title.text = "启动追踪器";
  trackerPage.db(title);

  const commonText = new StyleComponent("");
  commonText.color = TWILIGHT_COLOR;
  commonText.align = "center";
  commonText.font = TITLE_FONT;
  commonText.bold = true;
  commonText.size = "14px";

  const box = new Box(
    commonText
      .make("本部分记录了启动器在启动过程中对游戏文件夹进行的操作。")
      .toBBCode()
  );
  commonText.bold = false;
  const a = new StyleComponent(box.toBBCode());
  a.align = "center";
  trackerPage.db(a);
  title.size = "4";

  // Java
  trackerPage.dbRaw("\n");
  trackerPage.db(title.make("JRE 运行环境"));
  trackerPage.db(commonText.make("Java " + tracker.java().version));
  trackerPage.db(commonText.make(tracker.java().runtime));

  // Mods
  if (tracker.mods().total > 0) {
    trackerPage.dbRaw(BR);
    trackerPage.db(title.make("Mods 模组动态加载"));
    const mods = new ComponentsGroup();
    const CODE_COMPONENT = new StyleComponent("");
    CODE_COMPONENT.color = TWILIGHT_COLOR;
    CODE_COMPONENT.size = "2";
    for (const a of tracker.mods().operateRecord) {
      CODE_COMPONENT.del = a.operation === "OPERATED";
      CODE_COMPONENT.color =
        a.operation !== "OPERATED" ? TWILIGHT_COLOR : "Gray";
      if (a.file) {
        mods.dbRaw(
          CODE_COMPONENT.make(a.file).toBBCode() +
            " " +
            (a.operation === "SKIPPED"
              ? RESERVED
              : a.operation === "FAILED"
              ? ERR
              : MOVED)
        );
      }
    }
    trackerPage.db(new Spoiler(mods.out("\n")));
  }

  // Libraries

  if (tracker.assets().total > 0) {
    trackerPage.dbRaw(BR);
    trackerPage.db(title.make("Libraries 支援库"));
    trackerPage.db(
      commonText.make(
        "通过查验的支援库：" +
          generateCount(tracker.library().total, tracker.library().resolved)
      )
    );
    const libraries = new ComponentsGroup();
    const CODE_COMPONENT = new StyleComponent("");
    CODE_COMPONENT.color = TWILIGHT_COLOR;
    CODE_COMPONENT.size = "2";
    for (const a of tracker.library().operateRecord) {
      if (a.file) {
        libraries.db(
          CODE_COMPONENT.make(
            a.file + " " + (a.operation === "FAILED" ? FAILED : RESOLVED)
          )
        );
      }
    }
    trackerPage.db(new Spoiler(libraries.out("\n")));
    trackerPage.dbRaw(BR);
  }

  // Assets

  if (tracker.assets().total > 0) {
    trackerPage.dbRaw(BR);
    trackerPage.db(title.make("Assets 游戏资源"));
    trackerPage.db(commonText.make("游戏资源列表过长，因此仅统计数量。"));
    trackerPage.db(
      commonText.make(
        "通过查验的资源：" +
          generateCount(tracker.assets().total, tracker.assets().resolved)
      )
    );
    trackerPage.dbRaw(BR);
  }
  return trackerPage.out();
}

function generateCount(total: number, done: number): string {
  const a = new StyleComponent(`${done}/${total}`);
  if (total > done) {
    a.color = "Red";
  } else {
    a.color = "Green";
  }
  return a.toBBCode();
}

export function generateCrashAnalytics(
  cr: CrashReportMap | undefined,
  originCrashReport: string,
  tracker: LaunchTracker,
  logs: string,
  logsReport: CrashReportMap | undefined
): string {
  let c;
  if (cr === undefined) {
    c = "抱歉，但崩溃报告未生成或无法读取。";
  } else {
    c = makeCrashAnalytics(cr, originCrashReport, "崩溃报告");
  }
  let d;
  if (logsReport === undefined) {
    d = "抱歉，但日志未生成或无法读取。";
  } else {
    d = makeCrashAnalytics(logsReport, logs, "日志");
  }
  return (
    makeIndex() +
    "\n" +
    makeFirstPage() +
    "\n[page]\n" +
    c +
    "\n\n" +
    d +
    "\n[page]\n" +
    generateTrackerInfo(tracker)
  );
}

export function makeFirstPage(): string {
  const group = new ComponentsGroup();
  const sc = new StyleComponent("Minecraft 崩溃啦！");
  sc.color = "#5d2391";
  sc.font = "Trebuchet MS";
  sc.align = "center";
  sc.size = "6";
  group.db(sc);
  sc.color = "#aaaaaa";
  sc.size = "2";
  group.db(sc.make(randsl("CrashReportDisplay.Complain")));
  group.dbRaw("\n");
  sc.color = "#5d2391";
  sc.size = "2";
  sc.bold = true;
  const box = new Box(
    sc
      .make(
        `这是由 Alicorn 启动器自动生成的求助信息，Alicorn 版本：${pkg.appVersion}`
      )
      .toBBCode()
  );
  const a = new StyleComponent(box.toBBCode());
  a.align = "center";
  group.db(a);
  group.dbRaw("\n");
  sc.size = "5";
  sc.bold = false;
  group.db(sc.make("Getting Started 开始"));
  group.dbRaw(
    `[align=center][color=#df307f]该求助信息生成于：[/color][color=#5d2391]${new Date().toLocaleDateString()}[/color][/align]`
  );
  sc.color = "#df307f";
  sc.size = "2";
  group.db(sc.make("该求助信息由两部分组成：启动信息摘要和崩溃报告分析。"));
  group.db(
    sc.make(
      "启动信息摘要中包含了所启动核心的基本信息，包括（可能的）Mod 列表等。"
    )
  );
  group.db(
    sc.make(
      "崩溃报告分析则内附了启动过程中 JRE 运行环境输出的全部日志，崩溃报告文件（若有）以及 CMC 提供的建议。"
    )
  );
  group.db(
    sc.make(
      "作为回答者，您可以[color=#5d2391][b]在顶部的目录中选择需要阅读参考的信息[/b][/color]，在进行回答时请注意遵守版块规则，同时请尊重提问者。"
    )
  );
  group.db(sc.make("至为感谢！"));
  return group.out();
}

export function makeCrashAnalytics(
  crashReport: CrashReportMap,
  originCrashReport: string,
  type: string
): string {
  const group = new ComponentsGroup();
  const sc = new StyleComponent(type + "原文");
  sc.color = "#5d2391";
  sc.font = "Trebuchet MS";
  sc.align = "center";
  sc.size = "5";
  group.db(sc);
  group.dbRaw("\n");
  group.db(new Spoiler(`[code]${originCrashReport}[/code]`));
  group.dbRaw("\n");
  group.db(sc.make(type + "分析"));
  group.dbRaw("\n");
  const code = new CodeComponent("");
  code.color = "#5d2391";
  const index = new StyleComponent("");
  index.color = "#df307f";
  const aName = new StyleComponent("");
  aName.color = "#df307f";
  aName.bold = true;
  aName.background = "#ffe0f0";
  aName.font = "Trebuchet MS";
  const aReason = new StyleComponent("");
  aReason.color = "#5d2391";
  aReason.font = "Trebuchet MS";
  const commonText = new StyleComponent("");
  commonText.color = "#df307f";
  commonText.font = "Trebuchet MS";
  for (const [l, n] of crashReport.entries()) {
    if (n.report.length === 0) {
      continue;
    }
    group.dbRaw(
      `${index.make(l.toString()).toBBCode()}  ${code
        .make(n.origin)
        .toBBCode()}`
    );
    group.dbRaw("\n");
    for (const c of n.report) {
      group.dbRaw(
        `    ${aName.make(c.by || "?").toBBCode()} - ${aReason
          .make(c.reason || "未能确定原因")
          .toBBCode()}`
      );
      group.dbRaw("\n");
      if (c.suggestions === undefined || c.suggestions.length === 0) {
        group.dbRaw(
          `      ${commonText.make("没有有效的建议。").toBBCode()}\n`
        );
        continue;
      }
      group.dbRaw(`      ${commonText.make("提供的建议：").toBBCode()}\n`);
      for (const s of c.suggestions) {
        group.dbRaw(`        - ${commonText.make(s).toBBCode()}\n`);
      }
    }
  }
  return group.out();
}

export function makeIndex(): string {
  return "[index]\n[#1]开始\n[#2]崩溃报告\n[#3]启动信息摘要（模组列表与日志）\n[/index]";
}
