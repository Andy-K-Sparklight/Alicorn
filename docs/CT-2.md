*CT-2*

# 容器

?> **本页面介绍的是：Alicorn 管理游戏文件的单位**<br/>有关管理容器的功能页面，请参见 [CT-1 容器管理器](/CT-1.md)

容器是一种结构特殊的文件夹，是 Alicorn 管理游戏文件的单位。

## 概述

容器是存放 Minecraft 和其它相关文件的地方。需要特定的结构才能被启动器读取。在 Alicorn 中，容器具有更多的信息，能够帮助 Alicorn 在容器管理方面更加出色。

## 描述

### 文件结构

容器的结构通常如下：

- **.minecraft 标准结构**。.minecraft 中的所有标准结构同样存在于 Alicorn 容器中，但 `launcher_profiles.json` 除外，因为 Alicorn 并不以此识别核心，同样 `$natives` 不存在，因为 Alicorn 提出了更好的解决方案。

- `pff2.lock`。Pff 软件安装器保存有关 Mod 的安装信息在此文件中。先前 Pff 使用的是 `pff.lock`，但此标准已经被废弃。

- `asc.lock`。ASC 容器特有的标志文件，Alicorn 以此识别一个 ASC 容器。

- `mods` 文件夹。存放 Mod 文件的地方，可以（而且建议）通过 Pff 安装，也可以手动将文件放入此目录。

- `shaderpacks` 文件夹。存放光影包的地方，当使用光影加载器（如 Iris）时，将从此读取可用的光影包。

- `alicorn-temp` 文件夹。Alicorn 存放临时文件（如 Forge 安装器）的地方，通常会自动清除其中内容，如果没有，任何 Alicorn 不在运行的时候都可以手动删除该文件夹。

此外，在 `libraries` 中还有：

- `libraries/<groupId>/<artifactId>/<version>/<artifactId>-<version>-natives-<platform>.jar` 是 Alicorn 针对不同平台分开下载保存的、压缩的原生库文件（Natives）。

- `libraries/<groupId>/<artifactId>/<version>/<artifactId>-<version>-natives-<platform>` 文件夹是 Alicorn 保存解压后的原生库文件（Natives）的地方，其中包含一份 `natives.lock.ald` 文件和其它的平台相关库（`.so` 或 `.dll`）。

这些文件结构并不是严格的，缺失某些部分可能仍然可以正常执行容器的功能。

---

### 数据结构

一个容器除了文件结构外，在 Alicorn 中还会记录如下信息：

- **类型**：可以是 ASC（文件共享宗卷）或者 MCX（扩展物理宗卷）。

- **名称**：容器的标识符，是任何地方提及此容器的方法。

- **根目录**：容器在计算机文件系统中的实际路径，取决于环境和操作系统实现，有时不能使用特殊（非 ASCII）字符。

这些数据被记录在 Alicorn 的 GDT（全局容器记录表）中。

---

### 挂载

如果 Alicorn 管理着许多容器，那么扫描、查询等操作都会需要很大开销，有鉴于此，Alicorn 容器具有挂载这一特性。当不需要使用容器时，可将其卸载，使得容器仍然记录在 GDT 中，但不再被扫描和监测；当需要使用时，可将其重新装载，让 Alicorn 继续管理它。

挂载信息被记录在 Alicorn 的 GMT（容器挂载记录表）中。

---

### ASC 和 MCX

ASC 和 MCX 是两种宗卷（工作模式），决定 Alicorn 对容器的行为。

MCX 是普通的容器，性质和以上内容完全相同，容器间彼此无关。

ASC 是 Alicorn 的一项技术，它是基于 MCX 改造而来的。其最大的特性是：`libraries`、`assets` 中的部分（或全部）文件将使用软连接进行指定，即使有许多许多 ASC 容器，它们也可以使用相同的一份文件，而不占用额外的存储空间。

## 注意事项

- **容器不是 .minecraft**。Alicorn 的容器所在的文件夹可以使用任何命名，而且其结构与 .minecraft 不完全相同，同时还具有更高级的功能。

- **MCX 和 ASC 不改变容器功能**。MCX 和 ASC 只是管理容器的模式，与容器正常执行其功能无关。

## 参见

- [CT-1 容器管理器](/CT-1.md)

- [符号链接](https://zh.wikipedia.org/wiki/%E7%AC%A6%E5%8F%B7%E9%93%BE%E6%8E%A5) - Wikipedia

- [.minecraft](https://minecraft.fandom.com/zh/wiki/.minecraft) - Minecraft Wiki

## 跋

ThatRarityEG 编写于 2021/10/10
