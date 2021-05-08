# Alicorn Launcher

**Alicorn 在开发中！**

Alicorn 的开发还没有完成，您可以到 [这里](https://www.mcbbs.net/thread-1196771-1-1.html) 阅读有关 InDev 的发行信息。

Alicorn Launcher 是 Minecraft（Java 版）第三方启动器，目的在于提供针对国内用户的更好体验。

## 功能列表（设计）

- 【已完成】对具有 Minecraft 标准启动引导 JSON 文件之核心的启动

- 【已完成】对 Minecraft 下载镜像站点的支持

- 对 OpenJDK 11 的支持（而非默认的 Java Runtime Environment 8）

- 【已完成】对海外资源速度受限的*并发 - 分段*下载算法

- 【已完成】基于彼此隔离的“容器”进行文件管理

- 【已完成】Mod 信息读取与自动加载

- Minecraft 及其 Mod 化版本的自动化部署

- 常见崩溃错误的智能分析

- 能够解决问题的疑难解答

- …（未列出）

## 基于 TypeScript

Alicorn 是基于 Node.js 与 Electron，使用 TypeScript 进行编写的——听到 Electron，**不要**再想到巨卡巨吃内存的 Atom 啦！经过大量的优化，Alicorn 的**开发**
环境测试内存占用可以达到 .NET **生产**环境的 60% 甚至更低！（这是我没有想到的）

我们决定使用 Web 技术是有原因的。TypeScript 的特性允许我们在具有接近 Java 的严谨代码逻辑时，也能利用它的灵活性来做一些其它语言做不到的事情——这让我们在诸如读取启动引导文件时节省了不少时间。

另一个好处就是**更新**。只要你成功安装了 Alicorn（的 Electron 底层）一次，将来 Alicorn 便可进行“无感更新”——简单地下载几 KB 的 JavaScript
代码即可完成更新。我们认为，与其打断你启动游戏的兴致去进行更新，不如让我们为你完成这项工作。

也正是如此，你下载的 Alicorn 二进制文件并不总是内置了最新的 JavaScript 代码——但是你启动的一瞬间，Alicorn 就会知道该更新到哪个版本。下次启动时，Alicorn 就会载入新的代码进行运行。

（未完待续…）
