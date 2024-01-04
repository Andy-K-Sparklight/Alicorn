# Alicorn Launcher JS Edition

[中文 README](./README_ZH.md)

## IMPORTANT

As I, the developer, decided not to contribute to the Minecraft communities, this project **won't receive major updates** since Core 50 (that's why I call it Sunset).

If servere security vulnerbilities are found in the future, patches might still be available. However, generally, this project is now discontinued.

It doesn't mean you have to switch to another launcher, but if you wish to, we recommand [HMCL](https://github.com/huanghongxun/HMCL), it's a free software (as in freedom) and is still being actively maintained.

---

A third party Minecraft launcher, with high performance and freedom.

![.](https://img.shields.io/badge/Alicorn-is%20cute!-df307f)
![.](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/codeql-analysis.yml/badge.svg)
![.](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/node.js.yml/badge.svg)
![.](https://deepscan.io/api/teams/16407/projects/19670/branches/514338/badge/grade.svg)
![.](https://img.shields.io/github/repo-size/Andy-K-Sparklight/Alicorn)
![.](https://img.shields.io/github/license/Andy-K-Sparklight/Alicorn)

## Why Yet Another Launcher?

It's simple: I've been using different launchers and none of them can meet my requirements.

And that's why we develop Alicorn.

## Why Electron?

Still simple: I fancy it!

Some other reasons include awesomely spectacular speed, etc.

There's no need to consider size. After all, nothing is bigger than your OS ;)

## Principles

0. Free as in freedom.

1. Code quality and bug fixes.

2. Even weight on functionalities and performance.

3. Windows last.

4. Bash first.

5. Size is not that important, but sometimes is important.

6. Throw away those stereotypes, the runnable is the best.

7. Embrace UTF-8.

8. Line Feed only.

9. Try to make Alicorn looks the same in different platforms, but not definitely.

10. No SaaS.

## Build

#### Build Executable

To build Alicorn, you'll need:

- [Node.js](https://nodejs.org)

- [Git](https://git-scm.com)

- Clone the repository:
  
  ```shell
  git clone https://github.com/Andy-K-Sparklight/Alicorn.git --depth=1
  ```

- Install dependencies:
  
  ```shell
  yarn
  ```

- Run build:
  
  ```shell
  yarn make
  ```
  
  This will generate binaries and put them under `out`, including Windows x64, Windows ia32, GNU/Linux x64, GNU/Linux arm64 ~~and macOS x64~~. This will also generate corresponding archives.
  
  _The support for macOS has ended and no more platform dependent code will be commited. The modules present are still kept, but might not run correctly._
  
  You also need `wine` to complete the cross build progress on platforms other than Windows. Follow the instructions given by `electron-packager`.
