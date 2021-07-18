import pkg from "../../../package.json";

// MAINTAINERS ONLY

export default {
  Lang: "简体中文",
  LaunchPad: "启动游戏",
  InstallCore: "安装 Minecraft 核心",
  ContainerManager: "管理容器",
  ReadyToLaunch: "出发吧!",
  Version: "启动器信息",
  AccountManager: "Yggdrasil 帐户管理器",
  JavaSelector: "Java 选择器",
  Options: "选项",
  CrashReportDisplay: "启动疑难解答",
  PffFront: "Pff 软件安装器",
  Welcome: "欢迎回来",
  "System.Error": "Oops！系统错误：",
  "System.JumpPageWarn.Title": "要离开当前页面吗？",
  "System.JumpPageWarn.Description":
    "该页面想要告知您，您不应该在此时离开它，因为您可能有未保存的修改，或者该页面有些操作正在进行。仍要切换页面吗？",
  "System.JumpPageWarn.Yes": "仍然切换",
  "System.JumpPageWarn.No": "留在当前页面",
  "MainMenu.QuickManageAccount": "管理帐户",
  "MainMenu.QuickJavaSelector": "选择 Java",
  "MainMenu.Exit": "退出",
  "MainMenu.Browser": "以全新的方式访问中文论坛",
  "MainMenu.Version": "版本信息",
  "MainMenu.QuickOptions": "调整启动器的设置",
  "MainMenu.OpenDevToolsFormal": "调试页面",
  "MainMenu.OpenDevToolsKidding": "不要按下这个键！",
  "MainMenu.QuickInstallCore": "安装核心",
  "MainMenu.QuickLaunchPad": "启动游戏",
  "MainMenu.QuickManageContainer": "管理容器",
  "Operating.PleaseWait": "请稍等",
  "Operating.Failed": "操作失败……",
  "Operating.FailedConfirm": "好",
  "Operating.FailedInfo":
    "进行操作时遇到问题，请重试，如果问题依然存在，请向我们反馈。",
  "Operating.FailedSayings": [
    "为什么会变成这样呢？",
    "嗯……您能给我半分钟吗？让我冷静下……谢谢！",
    "幸亏我们在出现重大事故前阻止了操作。",
    "就差了那么一点点……",
    "别慌，只是一点小麻烦……唔？",
    "问题不大！嗯……但愿如此。",
    "对不起对不起！我刚刚睡着了……",
    "没有哪只小马是完美无缺的，您……能理解吗？",
    "再试试？或许这只是一场噩梦而已……",
    "为什么不试试使用 GNU/Linux 呢？那样肯定就不会出问题了……哦，您已经在用了啊……",
  ],
  "Operating.PleaseWaitDetail": "正在进行操作……这可能需要几分钟。",
  "CoreInfo.Introduction.Forge": "此核心可以加载 Forge Mod",
  "CoreInfo.Introduction.Fabric": "此核心可以加载 Fabric Mod",
  "CoreInfo.CorruptedWarning": "无法读取 - 启动引导文件若非遗失，即为无效",
  "CoreInfo.Reload": "重新加载",
  "CoreInfo.Launch": "启动",
  "CoreInfo.At": "核心 {ID} 位于容器 {Container} 上",
  "CoreInfo.Pff": "对此核心启动 Pff",
  "ReadyToLaunch.CouldNotLoad":
    "无法加载 - 该核心可能已经被移动或损毁\n如果你是通过除启动台之外的地方进入这里，那么原始链接的指向可能已经失效",
  "ReadyToLaunch.Go": "出发吧！",
  "ReadyToLaunch.Hint": "正在启动位于容器 {Container} 上的核心 {ID}",
  "ReadyToLaunch.Progress":
    "正在并发处理 {Current} 个下载任务，最大并发允许 {BufferMax}，还有 {Pending} 个任务队列中",
  "ReadyToLaunch.StartAuthTitle": "确保那是你",
  "ReadyToLaunch.StartAuthMsg": "选择一个方式验证您的身份",
  "ReadyToLaunch.UseMZ": "Microsoft 帐户",
  "ReadyToLaunch.UseYG": "Yggdrasil 帐户",
  "ReadyToLaunch.UseAL": "本地帐户",
  "ReadyToLaunch.Next": "继续",
  "ReadyToLaunch.UseALName": "玩家名",
  "ReadyToLaunch.UseYGChoose": "使用该帐户",
  "ReadyToLaunch.DefaultJava": "默认（全局）",
  "ReadyToLaunch.Status.Pending": "准备就绪",
  "ReadyToLaunch.Status.CheckingLibs": "正在检查和补充支援库",
  "ReadyToLaunch.Status.CheckingAssets": "正在检查和补充游戏资源",
  "ReadyToLaunch.Status.PreparingMods": "正在准备您的 Mod",
  "ReadyToLaunch.Status.PerformingAuth": "正在验证您的帐户",
  "ReadyToLaunch.Status.GeneratingArgs": "正在生成启动指令",
  "ReadyToLaunch.Status.Finished": "完毕，Minecraft 进程运行中……",
  "ReadyToLaunch.Status.Short.Pending": "开始",
  "ReadyToLaunch.Start": "启动",
  "ReadyToLaunch.Restart": "重新启动",
  "ReadyToLaunch.MSLogout": "登出 Microsoft 帐户",
  "ReadyToLaunch.MSLogoutRunning": "正在登出……",
  "ReadyToLaunch.MSLogoutDone": "已登出",
  "ReadyToLaunch.JCheck.TooOLD": "警告 - 该 JRE 太旧啦！启动可能出现问题。",
  "ReadyToLaunch.JCheck.TooNEW": "警告 - 该 JRE 太新啦！启动可能出现问题。",
  "ReadyToLaunch.WarnError.Title": "Minecraft 似乎未正常运行……",
  "ReadyToLaunch.WarnError.Yes": "是的，为我分析问题",
  "ReadyToLaunch.WarnError.No": "不必，游戏已正常运行",
  "ReadyToLaunch.WarnError.Description":
    "Minecraft 实例没有正常退出，你想要对本次启动进行分析吗？",
  "ReadyToLaunch.Status.Short.CheckingLibs": "检查支援库",
  "ReadyToLaunch.Status.Short.CheckingAssets": "检查游戏资源",
  "ReadyToLaunch.Status.Short.PerformingAuth": "验证帐户",
  "ReadyToLaunch.Status.Short.PreparingMods": "准备 Mod",
  "ReadyToLaunch.Status.Short.GeneratingArgs": "生成启动指令",
  "ReadyToLaunch.Status.Short.Finished": "完毕",
  "ReadyToLaunch.WaitingText": [
    "暴风雨的来临需要酝酿，新冒险的开始需要准备。",
    "这可能需要几分钟，不过只有你第一次玩某个版本时会这样。",
    "这也许只需要十几秒钟，而且并不是小概率。",
    "云宝，慢一点！太快了系统吃不消的！",
    "你知道吗？他们依旧在移除HIM。",
    "您知道吗？您很幸运，之前这些工作是由玩家手工完成的。",
    "您知道吗？Alicorn 的作者是一只小马……好吧，事实上是小马国女孩（小声",
    "您应该多使用 Fabric，它在高版本中的表现更好。",
    "您知道 Microsoft 帐户背后的验证过程吗？大致有五步。",
    "Mojang 又名 Bugjump……哦，当然，我是开玩笑的啦～",
    "{UserName} 可爱~",
    "Alicorn 是自由软件！您完全可以将她用于任何用途！",
    "感谢 Node.js，现在验证您的资源文件又快又准确。",
    "就算您把并发数提升到 1000 个并发，Alicorn 也没有丝毫压力 —— 有压力的是您的电脑",
    "请说出新人常用的启动器。不太确定？你确定吗？",
    "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee —— 这被称作咏 e",
    "别催了别催了，森林蝙蝠已经准备好加速了。",
    "Minecraft 和我的世界不是一个东西吗？",
    "Minecraft 和我的世界真的不是一个东西！",
    "为了防止世界被破坏，为了守护世界的和平。",
    "即使世界只剩最后一个方块，我们依然为之拼尽全力。",
    "这里的梗很多来自于 MCBBS。",
    "这里更多的梗不是来自 MCBBS。",
    "这条消息永远不会显示在启动页面上，是不是很神奇呢？",
    "我们的目标是让木板发光。",
    "现在木板发光了，但我们有了新的目标。",
    "就在刚刚过去的几分钟里，我们已经和 Mojang 的服务器进行了许多次对话。",
    "让您在这里等待确实很不礼貌，但是我们更不想让您的游戏崩溃！",
    "友谊就是魔法！！！（嗯……我是不是太大声了……",
    "如果您安装了太多的 Mod，Alicorn 可能需要很长的时间来准备它们。",
    "您的每一次文件访问都会被缓存加速！嗯……只要它不出问题……",
    `这是 Alicorn 版本 ${pkg.appVersion}，是一个测试版本。`,
  ],
  "VersionView.Name": "Alicorn 启动器",
  "VersionView.AuthorName": "作者",
  "VersionView.Authors": "RarityEG",
  "VersionView.Description":
    "这是 Alicorn 的测试版本，可能存在重大问题，请谨慎使用。",
  "VersionView.Copyright1":
    "Alicorn 启动器是自由软件，复制、修改和重新分发等行为应遵循 GNU GENERAL PUBLIC LICENSE Version 3.0 许可证。",
  "VersionView.Copyright2":
    "Copyright (C) 2021 Andy K Rarity Sparklight\n\n" +
    "以下内容是原始版权声明的中文翻译，不是官方内容，不具有法律效力，只有英文原版的声明具有此等效力。\n" +
    "该程序是免费软件：您可以根据自由软件基金会发布的 GNU 通用公共许可证（第三版）的条款重新分发和/或修改它。\n" +
    "分发此程序是希望它有用，但不作任何保证；甚至没有对适销性或针对特定目的的适用性的暗示保证。有关更多详细信息，请参阅 GNU 通用公共许可证（第三版）原文。",
  "VersionView.FreeSoftwareClaim":
    "我们提倡软件自由，Alicorn 不会依赖任何非自由的组件或服务，因此，如果你发现我们没有支持某些常见的服务（如某些下载镜像源），请在提问前先查看它们的许可。" +
    "同样，如果你发现 Alicorn 依赖着某个非自由的组件或服务，那一定是我们弄错了，请告知我们，我们将以最快速度移除它。",
  "VersionView.SuperCowPower": "本启动器具有超级牛力。",
  "ContainerManager.RootDir": "起始于",
  "ContainerManager.OpenInDir": "在系统中打开",
  "ContainerManager.Add": "添加 Minecraft 容器",
  "ContainerManager.AddDescription":
    "添加容器很简单：选择一个文件夹并给它起一个名字！",
  "ContainerManager.EnterName": "Minecraft 容器名",
  "ContainerManager.Dir": "挂载点",
  "ContainerManager.Select": "选择挂载点",
  "ContainerManager.InvalidName": "无效容器名",
  "ContainerManager.InvalidDir": "无效挂载点",
  "ContainerManager.Type.Physical": "MCX 扩展物理宗卷",
  "ContainerManager.Type.Shared": "ASC 文件共享宗卷",
  "ContainerManager.Remove": "解除链接",
  "ContainerManager.Mount": "装载该容器",
  "ContainerManager.Unmount": "卸载该容器",
  "ContainerManager.Clear": "抹掉该容器",
  "ContainerManager.Cores": "{Count} 个核心",
  "ContainerManager.CoresLoading": "清点核心中",
  "ContainerManager.AskRemove": "解除链接此容器？",
  "ContainerManager.AskRemoveDetail":
    "这不会修改任何游戏文件，您可以稍后重新导入该容器。",
  "ContainerManager.AskClear": "抹掉此 Minecraft 容器？该操作不可撤销！",
  "ContainerManager.AskClearDetail":
    "抹掉容器将失去其中的全部数据，包括存档、Mod 和其它可能重要的内容！确定要这样做，{UserName}？Alicorn 同时会解除该容器的链接。",
  "ContainerManager.Yes": "是的，我要这样做",
  "ContainerManager.No": "不，不要这样做",
  "ContainerManager.Continue": "继续",
  "ContainerManager.Cancel": "取消",
  "InstallCore.InstallMinecraft": "安装 Minecraft",
  "InstallCore.InstallForge": "安装 Forge",
  "InstallCore.InstallFabric": "安装 Fabric",
  "InstallCore.TargetContainer": "目标容器",
  "InstallCore.Unknown": "未能确定",
  "InstallCore.Release": "Minecraft 稳定版",
  "InstallCore.Snapshot": "Minecraft 快照",
  "InstallCore.OldAlpha": "早期 Alpha 版",
  "InstallCore.OldBeta": "早期 Beta 版",
  "InstallCore.MinecraftArch": "Minecraft 类型",
  "InstallCore.Start": "开始安装",
  "InstallCore.Confirm.Ready": "准备开始安装",
  "InstallCore.Confirm.Hint": "将安装以下核心到指定的 Minecraft 容器中：",
  "InstallCore.Confirm.OK": "开始操作",
  "InstallCore.MinecraftVersion": "Minecraft 版本号",
  "InstallCore.ForgeVersion": "Forge 版本号",
  "InstallCore.ForgeBaseVersion": "目标 Minecraft 版本号",
  "InstallCore.FabricVersion": "Fabric 版本号",
  "InstallCore.FabricBaseVersion": "目标 Minecraft 版本号",
  "AccountManager.Remove": "移除帐户",
  "InstallCore.Success": "成功安装了核心",
  "AccountManager.Refresh": "刷新令牌",
  "AccountManager.EnterPassword": "输入密码",
  "AccountManager.Password": "您的密码",
  "AccountManager.EnterPasswordHint": "为您的帐户输入密码",
  "AccountManager.Failed":
    "验证失败 - 我们无法验证您的帐户，请检查密码或稍后再试",
  "AccountManager.Validate": "验证",
  "AccountManager.DeleteTitle": "移除帐户？",
  "AccountManager.DeleteMsg": "下次使用此帐户时，您需要重新添加和登录它。",
  "AccountManager.Yes": "移除",
  "AccountManager.No": "取消",
  "AccountManager.AddTitle": "添加 Yggdrasil 帐户",
  "AccountManager.AddMsg": "输入您的帐户",
  "AccountManager.Email": "帐户名称或邮箱",
  "AccountManager.Host": "服务主机",
  "AccountManager.UseCustomHost": "使用自定义的服务主机",
  "AccountManager.UseNide8": "使用统一通行证",
  "AccountManager.Warn":
    "安全警示 - 请确认这是您信任的服务主机，登录一个随意的服务主机可能会威胁您的数据安全",
  "AccountManager.Next": "下一步",
  "AccountManager.Reload": "重新加载",
  "AccountManager.AddYggdrasil": "添加 Yggdrasil 帐户",
  "AccountManager.Note":
    "如果您使用 Microsoft 帐户或本地帐户，则无需在此配置，请直接启动游戏，当启动时将（如果必要）询问您相关的信息。",
  "JavaSelector.CustomAdd": "我想手动定位一个 Java 运行时",
  "JavaSelector.SelectJavaTitle": "Java 运行时",
  "JavaSelector.SelectJava": "选择 Java 运行时",
  "JavaSelector.CannotLoad": "读取中",
  "JavaSelector.CannotLoadDetail":
    "正在读取该 Java 运行时 - 如果这条消息一直没有消失，那么该 Java 运行时可能已经损坏",
  "JavaSelector.Loading": "请稍等，正在您的设备上查找所有可用的 Java 运行时……",
  "JavaSelector.Reload": "重新查找 Java 运行时",
  "JavaSelector.GetNew":
    "下载 AdoptOpenJDK JRE 16（适用于 Minecraft 17 及更新版本）",
  "JavaSelector.GetOld":
    "下载 AdoptOpenJDK JRE V8（适用于 Minecraft 16 及更旧版本）",
  "JavaSelector.Warn32":
    "性能警示 - Minecraft 在 32 位 Java VM 上可能无法发挥出最好性能。",
  "JavaSelector.WarnClient":
    "性能警示 - Minecraft 在 Client Java VM 上可能无法发挥出最好性能。",
  "JavaSelector.WarnNonFree":
    "许可警示 - 这不是自由软件！Alicorn 建议您使用自由的 OpenJDK 运行时代替该非自由的运行时，这可以避免带来的麻烦。",
  "Options.AutoSave": "您的修改会自动保存。某些选项只能适用于特定平台。",
  "Options.Hint":
    "Alicorn 的默认值即是建议值，如果您不明确知道一个设置项的作用，请不要修改它。\n带 * 的项目是开发人员选项，胡乱修改它们可能导致严重后果！",
  "Options.Enabled": "已启用",
  "Options.Disabled": "已禁用",
  "Options.cx.shared-root.title": "共享文件存储位置",
  "Options.cx.shared-root.desc":
    "使用软连接连接到可复用的文件，那么这些文件应当存储在哪里 - 请留出足够的空间以存储文件",
  "Options.startup-page.url.title": "主页路径",
  "Options.startup-page.url.desc":
    "选择进入启动器时主页的路径 - 用于实际切换页面",
  "Options.startup-page.name.title": "主页名称",
  "Options.startup-page.name.desc": "选择进入启动器时主页的名称 - 用于显示标题",
  "Options.theme.primary.main.title": "基本颜色（主要）",
  "Options.theme.primary.main.desc": "菜单栏和标题文本将使用此颜色",
  "Options.theme.primary.light.title": "基本颜色（亮色）",
  "Options.theme.primary.light.desc": "部分高亮文本使用此颜色",
  "Options.theme.secondary.main.title": "次要颜色（主要）",
  "Options.theme.secondary.main.desc": "普通文本使用此颜色",
  "Options.theme.secondary.light.title": "次要颜色（亮色）",
  "Options.theme.secondary.light.desc": "背景等位置使用此颜色",
  "Options.interactive.i-have-a-crush-on-al.title": "I \u2764 AL",
  "Options.interactive.i-have-a-crush-on-al.desc":
    "我喜欢这个启动器……她好可爱～",
  "Options.dev.f12.title": "F12 调试 *",
  "Options.dev.f12.desc":
    "按下 F12 以调试 Alicorn 渲染进程 - 请当心，胡乱使用 DevTools 可能导致启动器故障或您的数据丢失！",
  "Options.hot-key.title": "Alicorn 快捷键",
  "Options.hot-key.desc": "启用快捷键以进行高效操作 - 查看帮助以了解使用方法",
  "Options.dev.quick-reload.title": "快速重载 *",
  "Options.dev.quick-reload.desc":
    "按 Ctrl+R 快速重新加载启动器 - 这可能导致数据丢失和功能异常，仅应当用于开发",
  "Options.download.mirror.title": "下载源镜像",
  "Options.download.mirror.desc":
    "只能选择 {AlicornHome} 下的镜像描述文件，不含扩展名，none 表示不使用镜像 - 通常需要从 alicorn、tss 或 none 中选择，胡乱选择不存在的镜像将可能导致下载故障！",
  "Options.dev.explicit-error-throw.title": "显式抛出错误 *",
  "Options.dev.explicit-error-throw.desc":
    "在系统错误发生时额外使用一个对话框告知您错误信息 - 仅在开发时才有使用价值",
  "Options.dev.title": "开发人员模式 *",
  "Options.dev.desc":
    "打开开发人员模式，然后再次看看那些之前让你感到迷惑的标签 - 它们只会对开发人员显示正确的内容",
  "Options.reset.title": "重置为默认值",
  "Options.reset.desc":
    "在下次启动时将设置重置为当前版本的默认内容 - 在 Alicorn 频繁更新时很有用，但您的所有改动都将丢失",
  "Options.pff.cache-root.title": "Pff 文件缓存位置",
  "Options.pff.cache-root.desc":
    "设置 Pff 的文件缓存目录 - 这是必须的，有助于加快软件包的安装速度，留空以使用默认目录 {AlicornHome}",
  "Options.pff.page-size.title": "Pff 查询分页大小",
  "Options.pff.page-size.desc":
    "进行模糊查询时请求的的分页大小 - 这项设置可能并不很有用，但如果 Pff 不能正确查找您的 Mod，可以扩大该值",
  "Options.pff.api-base.title": "Pff API 起始 URL",
  "Options.pff.api-base.desc":
    "指定 Pff 在安装软件包时使用的起始 URL，所有的请求都将发往该 URL - 如果你使用自己的软件源，这会很有用",
  "Options.java.search-depth.title": "JRE 搜索深度",
  "Options.java.search-depth.desc":
    "仅从根目录（Program Files 或者 /）搜索一定深度，不要搜索整台计算机 - 设置为 0 以不限制",
  "Options.java.simple-search.title": "JRE 快速搜索",
  "Options.java.simple-search.desc":
    "仅使用命令和环境变量寻找 JRE，不要搜索整台计算机 - 如果您知道如何设置，这可以非常快",
  "Options.user.name.title": "您的昵称",
  "Options.user.name.desc": "Alicorn 会用这个名字亲切地称呼您 - 嗯……可爱~",
  "Options.launch.jim.title": "适用于 Windows 的 JRE 进程优先级调整",
  "Options.launch.jim.desc":
    "调整 JRE 进程的优先级以优化游戏运行，但对系统和其它应用有较大影响 - 该操作有几率导致系统不稳定，如果您不知道您在做什么，请不要启用它",
  "Options.web.global-proxy.title": "浏览器 HTTP 代理",
  "Options.web.global-proxy.desc":
    "设置用于 Alicorn 附属浏览器的代理 - 所有流量都将通过代理服务器转发，下载器不受此设置影响，部分操作系统对此设置不敏感",
  "Options.web.allow-natives.title": "启用 Web Node 集成 *",
  "Options.web.allow-natives.desc":
    "在 Alicorn 附属浏览器中启用 Node.js API 的支持 - 允许 Web 程序与 Alicorn 进行集成，但它将您的计算机操作权限直接授予 Web 页面，非常危险，只应当用于开发！",
  "Options.updator.use-update.title": "自动更新",
  "Options.updator.use-update.desc":
    "启用来自 Alicorn 的自动更新，以及时获取新功能 - 在测试阶段，这尤其重要",
  "Options.download.concurrent.chunk-size.title": "并发下载区块大小",
  "Options.download.concurrent.chunk-size.desc":
    "进行并发分段下载时每个文件段的大小，单位 KB - 调太低了对你的处理器是一种折磨",
  "Options.download.pff.chunk-size.title": "Pff 并发下载区块大小",
  "Options.download.pff.chunk-size.desc":
    "Pff 的并发下载区块大小，由于下载 Mod 和下载游戏资源网络环境不同，需要单独的设置",
  "Options.download.concurrent.timeout.title": "请求等待时间",
  "Options.download.concurrent.timeout.desc":
    "在提交错误前最长允许的服务器响应时间，单位毫秒 - 该值过高或过低都可能导致部分文件下载失败",
  "Options.download.pff.timeout.title": "Pff 请求等待时间",
  "Options.download.pff.timeout.desc":
    "Pff 的请求等待时间，由于下载 Mod 和下载游戏资源网络环境不同，需要单独的设置",
  "Options.download.concurrent.tries-per-chunk.title": "重试次数",
  "Options.download.concurrent.tries-per-chunk.desc":
    "在放弃某个文件的下载前最多的重试次数 - 说真的，调高了真没有什么用，就是多浪费一些时间",
  "Options.download.no-validate.title": "不进行文件校验",
  "Options.download.no-validate.desc":
    "信任下载的文件，直接存储，不检查其是否完整或有效 - 这可以提升速度，但会在出现问题时更难进行排查",
  "Options.download.concurrent.max-tasks.title": "并发下载任务数",
  "Options.download.concurrent.max-tasks.desc":
    "允许下载器同时进行的最多下载任务数，一个文件的多个分段视为一个任务 - 如果计算机性能较差，可以将该值调低",
  "Options.download.pff.max-tasks.title": "Pff 并发下载任务数",
  "Options.download.pff.max-tasks.desc":
    "Pff 的并发下载任务数，由于下载 Mod 和下载游戏资源网络环境不同，需要单独的设置",
  "Options.modx.global-dynamic-load-mods.title": "Mod 动态加载",
  "Options.modx.global-dynamic-load-mods.desc":
    "在启动时根据启动的核心自动移动无法加载的 Mod - 如果这项功能导致您的 Mod 出现问题，请关闭它",
  "Options.modx.ignore-non-standard-mods.title": "忽略无法读取的 Mod",
  "Options.modx.ignore-non-standard-mods.desc":
    "动态加载 Mod 时遇到无法读取的 Mod 信息时，不要移动，将其保留在 Mod 文件夹中 - 如果您使用 LiteLoader，请开启它",
  "Options.cmc.disable-log4j-config.title": "不使用 Log4j 配置文件",
  "Options.cmc.disable-log4j-config.desc":
    "不使用 Mojang 提供的 Log4j 配置文件以在启动疑难解答中获得更清晰的日志 - 副作用是输出到文件的日志会很混乱",
  "CrashReportDisplay.BaseInfo": "基本信息",
  "CrashReportDisplay.BaseInfo.ID": "启动档案名称",
  "CrashReportDisplay.BaseInfo.BaseVersion": "Mojang 版本",
  "CrashReportDisplay.BaseInfo.AssetIndex": "游戏资源版本",
  "CrashReportDisplay.BaseInfo.Time": "发布时间",
  "CrashReportDisplay.BaseInfo.Modded": "模组支持",
  "CrashReportDisplay.BaseInfo.Modded.Yes": "是",
  "CrashReportDisplay.BaseInfo.Modded.No": "否",
  "CrashReportDisplay.BaseInfo.Modded.Unknown": "不确定",
  "CrashReportDisplay.LaunchTrackCount": "支援信息",
  "CrashReportDisplay.Libraries": "支援库",
  "CrashReportDisplay.Assets": "游戏资源",
  "CrashReportDisplay.Total": "总计",
  "CrashReportDisplay.Resolved": "可用",
  "CrashReportDisplay.Mods": "模组",
  "CrashReportDisplay.Mods.Name": "名称",
  "CrashReportDisplay.Mods.Reserved": "保留",
  "CrashReportDisplay.Mods.Moved": "已移动",
  "CrashReportDisplay.Mods.Failed": "错误",
  "CrashReportDisplay.CrashReport": "原始崩溃报告",
  "CrashReportDisplay.Analyze": "崩溃报告分析",
  "CrashReportDisplay.Analyze.Line": "行",
  "CrashReportDisplay.Analyze.Suggestions": "以下是可用的建议",
  "CrashReportDisplay.Analyze.NoSuggestions": "没有可用的建议",
  "CrashReportDisplay.BBCode": "发布到 MCBBS 求助",
  "CrashReportDisplay.Logs": "日志",
  "CrashReportDisplay.Copy": "复制到剪贴板",
  "Welcome.Suggest.Part1": [
    "['{Config:interactive.i-have-a-crush-on-al}'=='false']今天是 {Date}，欢迎您使用 Alicorn Launcher，{UserName}！",
    "[new Date().getHours()>=18]好上晚！哦，我刚刚在练习古小马语……",
    "[(()=>{const hours=new Date().getHours();return hours>=23||hours<=6;})()]好困……这个时候叫我……？",
    "[(()=>{const hours=new Date().getHours();return hours>=23||hours<=6;})()]我尊重你的选择……但是我也要休息啊……",
    "[(()=>{const hours=new Date().getHours();return hours>=7&&hours<=11;})()]上午好！今天的天气真不错……什么？我猜错了？这不能怪我，要不你来预测天气试试？",
    "[new Date().getHours()==12]正午到！六分仪已经就绪，出发！",
    "[(()=>{const hours=new Date().getHours();return hours>=7&&hours<=9;})()]早上好！来一杯牛奶……？",
    "无论什么时候你需要我，我都在这里的啦……",
    "什么事？",
    "我是谁？我就是 Alicorn Launcher，你好！",
    "['{Config:interactive.i-have-a-crush-on-al}'=='true']在你面前的我不只是代码和逻辑！我就是我自己，所以，如果你喜欢我，那就放心喜欢吧～",
    "['{Config:interactive.i-have-a-crush-on-al}'=='true']你这是什么眼神……唔？唔唔唔！放开我！",
    "['{Config:interactive.i-have-a-crush-on-al}'=='true']这两只小马耳朵？很可爱？想摸摸吗？",
    "['{Config:updator.use-update}'=='false']不要担心升级！更新后的我就像暮光公主变成坎高学生一样，虽然样子不同，但我不会忘了你的！",
    "我相信每个人都有一颗小马般的心～",
    "[(()=>{const hours=new Date().getHours();return hours>=18&&hours<=21;})()]虽然我还小，但我觉得在这个浪漫的晚上，似乎也可以小酌一杯苹果酒～",
    "['{Config:interactive.i-have-a-crush-on-al}'=='true']嗯……不行，不能抱我……",
  ],
  "Welcome.Suggest.Part2": [
    "有什么很想做的事情吗？没有？那么为什么不来试试启动游戏呢？\n\n" +
      "单击右上角的「启动台」按钮，选择一个你喜欢的核心，单击它右上角的「启动」按钮就可以进入启动页面，单击页面中央的「确认启动」按钮，并选择一个合适的帐号，游戏就会开始加载进程了……\n\n" +
      "偶尔你可能会碰到「Minecraft 似乎未正常运行」提示，如果你的游戏确实没有正常运行，不要惊慌，单击「是的，为我分析问题」，进入「启动疑难解答」页面。在那里，你可以查看崩溃报告分析结果、Mod 列表，或者通过最底下的「发布到 MCBBS 求助」按钮生成可用的代码，并前往 MCBBS（我的世界中文论坛）问答板块发帖求助。\n\n" +
      "当然，你可能希望登录游戏来使用皮肤，你或许已经注意到，Microsoft 帐户可以直接登录，那么 Mojang 帐户呢？别急，在右上角找到「帐户管理」，切换到此页面，单击「添加帐户」，输入邮箱和密码，就可以登录到 Mojang 的验证服务器，下次启动游戏就可以使用它了。" +
      "另外，我不会记住你的密码，因此如果你太久没有玩游戏，Mojang 会认为你已经离线，下次游戏时你可能需要重新输入密码，不过别担心，我会帮你的啦～",
    "在安装 Mod？受够了 CurseForge 的人机验证？那就让 Pff 来吧！\n\n" +
      "你首先要安装希望玩此 Mod 的核心，可以通过右上角的「安装核心」按钮直达，当你安装时，除了安装 Minecraft 的相应版本（这是必须的），也不要忘了安装对应版本的 Mod 加载器——可能是 Forge 或者 Fabric，安装前请确认 Java 运行时可以正常工作。\n\n" +
      "一旦你成功安装了核心，在启动台找到它，单击其右上角的「对此核心启动 Pff」，Pff 就会自动适配到该核心的版本。" +
      "在那里输入你想安装 Mod 的名称，哦对了，是英文名。例如，如果要安装「暮色森林」，最好输入「the-twilight-forest」（不含引号），那是它的 Slug（CurseForge 上的文本 ID）。当然，一些差别也是允许的，例如「twilight-forest」、「twilight frs」都可以指向该 Mod，但是「tforest」则是不行的。" +
      "一般而言，将 Mod 的名字变成小写（如果你忘了，Pff 也会为你完成这项工作），空格用减号替换，Pff 就可以工作。\n\n" +
      "按下右侧的箭头即可开始安装，下载 Mod 仍要从 CurseForge CDN 官方下载，取决于你的网络环境，它有时可能无法连接，如果这样，Pff 会等待一段时间后超时。不过只要服务器可以连接，Pff 将使用更小的文件分段和更大的并发数来强行加快下载速度。当然，如果条件允许，设置一个 HTTP 代理并通过内置浏览器下载是最有效的解决方案。",
    "准备加入服务器？当然，我希望你玩得开心，然而，并非所有的服务器都是善意的。在我这里（包括 Pff 和 CMC——你忠实的助理组），你（和你的游戏）相当安全，但服务器的世界充满了危险。如果你信任我，这里有一些建议，能够帮你规避一些风险……\n\n" +
      "使用靠谱的客户端。我为你下载的客户端很大程度上可信（如果你没有随便修改镜像列表），但服务器提供的整合包的可靠性就值得画个问号。你知道有玩家的计算机被蓄意设计的启动器强制蓝屏了吗？你知道某些软件允许服主对你全屏截图吗？避免这些威胁的最简单方法是使用你自己的启动器。" +
      "如果服务器要求使用他们提供的启动器，你可以选择不游玩。将你的安全置于他人的掌控之中不是一个明智的选择。\n\n" +
      "不要随意充值。这种现象常常发生在快餐服务器中，他们搞到一些利润之后就关服跑路。你的积蓄很可能付诸东流。请在充值前问自己三个问题：我真的希望把我的积蓄送给这个服务器吗？我真的信任这个服务器的运营团队吗？如果出现了纠纷，我真的有能力挽回我的损失吗？如果你的回答都是「是的」，仍然需要小心，要留下可靠的交易记录，并且明确收款方到底是谁。" +
      "另外，不要透露你的任何隐私信息，无论是向谁！——除非你有充分的理由希望别人了解有关你的一切。注册服务器帐号时，请不要使用已经用过的密码——请试着重新设计一个，以免万一他人利用你的密码猜测你的其它信息——并不是没有发生过！\n\n" +
      "总而言之，我会尽力不让你受到伤害，我也不希望让那些劣质的服务器影响你对 Minecraft 这款游戏的感受，所以我才会在这里。",
    "来自开发人员的信息：试试我们新添加的特色功能「ASC 文件共享宗卷」吧！\n\n" +
      "以往，你的游戏（包括支援库，游戏资源，启动档案，引导器）被保存在一个容器中，我称它为 MCS 标准物理宗卷。由于我在执行各种功能时会在其中创建不同的文件，因此由我管理的标准宗卷被称为 MCX 扩展物理宗卷。每个 MCX 拥有独有的一份文件，稳定性强，即使一个容器损坏也不会影响其它容器。" +
      "然而，在整合游戏（使用整合包的游戏）流行的当下，你可能需要为每个包创建单独的容器，这会占用很多空间，而且降低速度，于是我为你准备了一个新的格式：ASC 文件共享宗卷。\n\n" +
      "ASC 的结构与 MCX 几乎一样，但它有一个特点：大多数文件不是真实的文件，它们是 Symbolic Link，连接到一个特定的位置，你的文件实际上都存储在那里。这允许复用那些在每个容器中经常出现的文件，节省一些空间。要使用这项功能，只需要在创建新容器时选择「ASC 文件共享宗卷」——所有的 ASC 会共享支援库、游戏资源、Mod，但不会共享启动档案、存档或者你自己添加的内容。\n\n" +
      "当然，ASC 也有一些问题：它不稳定，Symbolic Link 在不同操作系统上的表现不太一样；它不健壮，共享文件的损坏，哪怕是一个，也将导致所有 ASC 出现问题。不过，ASC 在一般游戏方面已经足够了，如果你需要较高的安全性，才需要考虑 MCX。",
  ],
  "Welcome.Suggest.Others": "以下内容可能也会有帮助……",
  "Welcome.Suggest.LastSuccessfulLaunch": "最近一次游戏",
  "PffFront.Slug": "软件名",
  "PffFront.QuickWatch": "软件包速览",
  "PffFront.Hint":
    "灰色名称的软件包可能无法适配当前版本。\n单击软件包名称可以在文件资源管理器中查看它。",
};
