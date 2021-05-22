import { LaunchTracker } from "../launch/Tracker";
import {
  Box,
  ComponentsGroup,
  Spoiler,
  StyleComponent,
} from "../bbcode/BBCode";

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
