# Alicorn Launcher JS Edition

[English README](./README.md)

## 重要信息

我们并不想让故事就此结束，但是作为开发者，我对 Minecraft 社区已不再抱有太多的信心。因此，Alicorn 在未来将不会接收**主要更新**，也正是因此，核心版本 50 被叫做**落日**。

如果将来发现了严重的安全漏洞，Alicorn 依然会得到安全性更新，但是总体上来说，这个项目将不会继续了。

这并不意味着你必须要换一个启动器，在可预见的将来，Alicorn 应当依然能够启动未来的数个版本，但是如果你想要更好，我们推荐 [HMCL](https://github.com/huanghongxun/HMCL)，它是自由软件，性能和功能并重，并且现在依然在积极的维护中。

---

高性能并且自由的第三方 Minecraft 启动器。

![.](https://img.shields.io/badge/Alicorn-is%20cute!-df307f)
![.](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/codeql-analysis.yml/badge.svg)
![.](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/node.js.yml/badge.svg)
![.](https://deepscan.io/api/teams/16407/projects/19670/branches/514338/badge/grade.svg)
![.](https://img.shields.io/github/repo-size/Andy-K-Sparklight/Alicorn)
![.](https://img.shields.io/github/license/Andy-K-Sparklight/Alicorn)

## 为什么我们需要一个新的启动器？

很简单啊，我没有找到合适的，于是，我打算自己来编写一个。

于是，就有了 Alicorn。

## 为什么使用 Electron？

还是很简单啊，因为我喜欢。

一些其它的原因包括超快的速度和超酷的界面，以及丰富的功能支持。

体积？解决的办法总是有的，毕竟，不能就为了几秒钟的下载时间而放弃便捷和可爱啊（

## Alicorn 设计与开发原则

0. 始终自由，自由软件，自由的支援库，自由的依赖。

1. 规范代码，即时（不仅仅是及时）修复漏洞。

2. 功能和性能并列第一，有困难就克服困难。

3. 性能、字体、渲染优化均不优先考虑 Windows 平台。

4. 命令行优先与 Bash 兼容。

5. 不要太在意体积，但也不要不在意体积。

6. 别太关注什么 SOLID 还是 KISS，黑猫白猫，能抓老鼠就是好猫（

7. 终结乱码，拥抱 UTF-8（

8. LF 换行，Git 提交自动修改除外。

9. 尽力让 Alicorn 在所有平台上看着一样，但不要强求。

10. 不使用 SaaS。

## 构建 Alicorn

#### 构建 Alicorn 可执行文件

要构建 Alicorn，你需要：

- [Node.js](https://nodejs.org)

- [Git](https://git-scm.com)

- 一份好用的网络连接

- 首先，克隆本仓库：
  
  ```shell
  git clone https://github.com/Andy-K-Sparklight/Alicorn.git --depth=1
  ```

- 安装依赖：
  
  ```shell
  yarn
  ```
  
  Alicorn Launcher 有相当多的依赖，包含 Electron 及其构建工具，如果您的网络环境不好，请考虑设置一个镜像或者使用代理服务器，并为 Electron 进行额外的设置。

- 运行构建：
  
  ```shell
  yarn make
  ```
  
  该命令构建所有的二进制文件并输出到 `out` 下：Windows x64，Windows ia32，GNU/Linux x64，GNU/Linux arm64 ~~以及 macOS x64~~。该命令同时会生成对应的压缩包。
  
  _macOS 的支持已经正式告终，Alicorn 现在不再为 macOS 编写平台相关代码。已有模块仍然保留，但可能无法正常工作。_
  
  请注意非 Windows 操作系统在构建 Windows 应用时需要 wine 的支持，可参考 electron-packager 的输出信息安装。
