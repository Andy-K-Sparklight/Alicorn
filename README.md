# Alicorn Launcher

Alicorn 的设计目标非常多，包括大多数启动器现有的功能和一些从未出现过的新功能，因此，这些开发任务显得十分繁重——您或许想帮助一下我们？无论是 Sponsor 还是 Pull Request，甚至 Issue，我们都欣然接受。

Alicorn 是完全自由的第三方 Minecraft 启动器。

## 从源代码构建

#### 构建产品

要构建 Alicorn，请这样做：

- 在您的计算机上安装 [Node.js](https://nodejs.org)，我们的 GitHub Actions Node.js CI 使用 `15.x`，Vercel 使用 14.x。

- 在您的计算机上安装 [Git](https://git-scm.com)。（这不是必须的，如果您打算下载代码而非克隆仓库）

- 克隆本仓库：
  
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
  
  该命令构建所有的二进制文件并输出到 `out` 下：Windows x64，Windows ia32，GNU/Linux x64 以及 macOS x64。该命令同时会生成对应的压缩包。
  
  请注意非 Windows 操作系统在构建 Windows 应用时需要 wine 的支持，可参考 electron-packager 的输出信息安装。

#### 构建开发

如果你正在考虑向 Alicorn 提交代码，你可能需要使用如下的命令：

```shell
yarn wd 
# yarn watch-dev 的缩写
```

这很适合在 VSCodium 的终端中持续增量编译，同时比全量编译更快。

要启动开发环境的 Alicorn，可使用：

```shell
yarn lc
# yarn launch-dev 的缩写
```

### 提交代码

如果你已经写好了一个相当酷的功能，你当然可以把它合并到 Alicorn 中（或者说，合并到我们的 Alicorn 仓库中），但在你继续之前，要注意几件事情：

- 代码需要使用 Prettier 进行规范化

- 除非不得已，不要忽略 ESLint 的警告

- **所有的功能更新必须测试**，测试发现有重大问题的功能需要在修复问题后再提交，有一些难以修复的小问题（或者历史遗留问题）可以先行提交

- **所有的质量更新必须有用**，用于修复的代码就算不能解决问题，也不能做无用的事，比如：
  
  ```typescript
  // 有问题的代码
  await got("https://www.google.com");
  
  // 就不要写
  await got.get("https://www.google.com", {timeout: 5000});
  ```

- 代码如需要其它的软件包作为依赖，这个软件必须是**自由软件**，否则，你需要寻找它的自由替代品，或者自己编写一个（大部分的 NPM 软件包都是自由的）

- 如果修改了构建流程，也必须修改 Actions 的设置来使得你的构建在 Actions 上能够运行

- 你的代码需要以**自由软件**的形式合并，并且也需要使用 GNU 通用公共许可证（第三版或之后版本）进行许可

当你发起合并请求时即视为你已经阅读并同意以上内容。
