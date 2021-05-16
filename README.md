# Alicorn Launcher

## 从源代码构建

要构建 Alicorn，请这样做：

- 在您的计算机上安装 [Node.js](https://nodejs.org)，我们的 Pull Request Pipeline 使用 `14.16.0`，持续集成使用的是最新的稳定版本，各位开发人员使用的版本则分别是：

  - RarityEG：`15.13.0`

- 在您的计算机上安装 [Git](https://git-scm.com)。

- 克隆本仓库：

  ```
  git clone https://bitbucket.org/RarityEG/alicorn.git
  ```

  如果您只想进行构建，请指定 `--depth 1` 以去除不必要的历史提交记录。

- 安装依赖：

  ```
  yarn
  ```

- 运行构建：

  - 发行版：

    ```
    yarn release-full
    ```

  - 开发版：

    ```
    yarn build-dll
    yarn build-full
    ```

  - 测试：

    ```
    yarn quick-test
    ```

  本仓库内没有指定构建二进制文件的工具，因为 Alicorn 的二进制文件是在本地用 Electron 额外构建的，本仓库仅发布 JavaScript 产品更新。

