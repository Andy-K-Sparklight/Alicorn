import { invokeAlicorn } from "./CallAlicorn";
import { Executor } from "./Component";
import { getWindow } from "./GetWindow";
import { showDialog } from "./MCBBS";
import { CoreInfo } from "./StarlightFunctions";

function isServerPubPage(): boolean {
  return (
    document.querySelector(
      "tbody > tr:nth-child(1) > td.plc > div.pct > div > div.typeoption > table > caption"
    )?.innerHTML === "服务器"
  );
}

function getSupportVersions(): string[] {
  const c = document.querySelector(
    "tbody > tr:nth-child(1) > td.plc > div.pct > div > div.typeoption > table > tbody > tr:nth-child(3) > td"
  );
  return c ? c.innerHTML.split("&nbsp;") : [];
}

function getServerAddress(): string {
  const c = document.getElementById("server_ip");
  return c?.innerText || "";
}

async function getCompatibleCores(versions: string[]): Promise<CoreInfo[]> {
  const allCores = (await invokeAlicorn("GetAllInstalledCores")) as Record<
    string,
    string[]
  >;
  const available: CoreInfo[] = [];
  for (const [c, vs] of Object.entries(allCores)) {
    for (const v of vs) {
      const r = (await invokeAlicorn("GetCoreInfo", c, v)) as CoreInfo;
      if (versions.includes(r.baseVersion)) {
        available.push(r);
      }
    }
  }
  return available;
}
async function openServer(
  serverAddress: string,
  container: string,
  id: string
): Promise<void> {
  await invokeAlicorn(
    "JumpTo",
    `/ReadyToLaunch/${container}/${id}/${serverAddress}`,
    "ReadyToLaunch"
  );
}

async function isServerReachable(address: string): Promise<boolean> {
  return !!(await invokeAlicorn("TestServer", address));
}

function attachJoinButton() {
  const e = document.getElementById("server_ip_menu");
  if (e) {
    e.innerHTML =
      '<span style="color:#df307f;"><b>在 Alicorn 中打开</b></span>';
  }
  const e2 = document.getElementById("server_ip");
  if (e2) {
    e2.onclick = async () => {
      showDialog(
        'Starlight 正在收集必要信息，请稍等，马上就好……<br/><i style="color:gray">已经派出了 Spike，但他可能半路上遇到了 Rarity……</i>',
        "info",
        "获取中……"
      );
      const serverAddress = trimServerAddress(getServerAddress());
      if (!(await isServerReachable(serverAddress))) {
        if (
          !(await new Promise<boolean>((resolve) => {
            showDialog(
              'Alicorn 报告此服务器不可达，无法连接。<br/>仍要尝试加入吗？<br/><i style="color:gray">Twilight 未能打开传送门</i>',
              "confirm",
              "无法使用该服务器",
              () => {
                resolve(true);
              },
              undefined,
              () => {
                resolve(false);
              },
              "",
              "仍要加入",
              "好"
            );
          }))
        ) {
          return;
        }
      }
      const allCores = await getCompatibleCores(getSupportVersions());
      if (allCores.length === 0) {
        showDialog(
          'Alicorn 报告没有可用的核心，将无法启动游戏。<br/>请试着安装一个在支持版本中指定的核心。<br/><i style="color:gray">这不是计划中的</i>',
          "alert",
          "无可用核心"
        );
        return;
      }
      if (allCores.length === 1) {
        showDialog(
          '准备就绪，请转到 Alicorn，你的游戏在那里等你。<br/><i style="color:gray">出发！</i>',
          "right",
          "就绪"
        );
        await openServer(serverAddress, allCores[0].container, allCores[0].id);
        return;
      }
      getWindow().addEventListener("selectCore", async (e) => {
        const s = (e as CustomEvent).detail;
        showDialog(
          '准备就绪，请转到 Alicorn，你的游戏在那里等你。<br/><i style="color:gray">出发！</i>',
          "right",
          "就绪"
        );
        await openServer(serverAddress, s.container, s.id);
        return;
      });
      if (allCores.length > 1) {
        const all: string = allCores
          .map((c) => {
            return `<span onclick="window.dispatchEvent(new CustomEvent('selectCore', {detail:{id:'${c.id}', container:'${c.container}'}}));">${c.container}/${c.id}</span>`;
          })
          .join("<br/>");
        showDialog(
          `Alicorn 报告有不止一个可以运行的核心，单击以选择你想要使用的。<br/><span style="cursor:pointer;">${all}</span><br/><i style="color:gray">出发！</i>`,
          "notice",
          "选择核心"
        );
      }
    };
  }
}
function trimServerAddress(origin: string): string {
  if (!origin.includes(":")) {
    return origin + ":25565";
  }
  return origin;
}

export class JoinServer extends Executor {
  execute(_document: Document, ...args: unknown[]): void {
    if (isServerPubPage()) {
      attachJoinButton();
    }
  }
}
