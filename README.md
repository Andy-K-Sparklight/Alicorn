# Alicorn Launcher

# 设计目标

Alicorn 的设计目标非常多，包括大多数启动器现有的功能和一些从未出现过的新功能，因此，这些开发任务显得十分繁重——您或许想帮助一下我们？无论是 Sponsor 还是 Pull Request，甚至 Issue，我们都欣然接受。

## 目标

- 采购模式
- Doctor
- N2N 联机
- 整合包安装

## 从源代码构建

要构建 Alicorn，请这样做：

- 在您的计算机上安装 [Node.js](https://nodejs.org)，我们的 Bitbucket Pull Request Pipeline 使用 `14.16.0`，Travis CI
  持续集成使用的是最新的稳定版本，GitHub Actions Node.js CI 则使用 `15.x`。

- 在您的计算机上安装 [Git](https://git-scm.com)。（这不是必须的，如果您打算下载代码而非克隆仓库）

- 克隆本仓库：

  ```
  # GitHub（首选）
  git clone https://github.com/Andy-K-Sparklight/Alicorn.git --depth=1
  # BitBucket（仅当 GitHub 不可用时）
  git clone https://bitbucket.org/RarityEG/alicorn.git --depth=1
  ```

- 安装依赖：

  ```
  yarn
  ```

  Alicorn Launcher 有相当多的依赖，包含 Electron 及其构建工具，如果您在中国大陆，请考虑设置一个镜像或者使用代理服务器，并为 Electron 进行额外的设置。

- 运行构建：

  ```
  yarn make-all
  ```

  该命令构建所有的二进制文件并输出到 `out` 下：Windows x64，Windows ia32 和 Linux x64，macOS 目前尚不在支持范围内。

  如果您只想进行测试，请运行：

  ```
  yarn build-dll
  yarn full-test
  ```

  这不会生成可执行文件，而是直接调用 Electron 启动。
