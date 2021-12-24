# Alicorn Launcher

高性能并且自由的第三方 Minecraft 启动器。

## 为什么我们需要一个新的启动器？

很简单啊，我没有找到合适的，于是，我打算自己来编写一个。

现有的启动器没有哪个满足我的需求，我想要的启动器，可不是他们那个样子的。

于是，就有了 Alicorn。

## 为什么使用 Electron？

还是很简单啊，因为我喜欢。

一些其它的原因包括超快的速度和超酷的界面，以及丰富的功能支持。

体积？解决的办法总是有的，毕竟，不能就为了几秒钟的下载时间而放弃便捷和可爱啊（

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
  
  该命令构建所有的二进制文件并输出到 `out` 下：Windows x64，Windows ia32，GNU/Linux x64 以及 macOS x64。该命令同时会生成对应的压缩包。
  
  请注意非 Windows 操作系统在构建 Windows 应用时需要 wine 的支持，可参考 electron-packager 的输出信息安装。
