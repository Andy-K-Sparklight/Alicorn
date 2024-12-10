# Alicorn Launcher JS Edition

[中文 README](./README_ZH.md)

## Collaborator's Note

This is skjsjhb, a user of the Alicorn launcher.

It's 2024.03 now. Years have passed since the release of Alicorn, and this project has been staled since early 2023,
after the original maintainer has left the community. MCBBS is also downed, together with the mirror. Quilt has been
adopted widely, while Forge has become NeoForged. Things changed a lot.

I'm not in the development team (I wasn't invited, sadly), which means I'm not an official maintainer of Alicorn.
However, I decide to continue to add necessary patches. As I do not own the token of most platforms Alicorn was using, I
might re-create certain content (e.g. actions) with my keys. Also, my code (and design) style is different as
Sparklight, making breaking changes quite possible.

Most updates will be backed by my Kotlin-based launcher (I won't put a link here to avoid annoying people). The features
will be tested and backported to Alicorn. See the repository of the new launcher for details.

Thanks for supporting Alicorn. Also thanks for loving the block game. Welcome to the age of Sakura (1.20.x). We don't
have more ponies, but luckily we're still here.

## IMPORTANT

This was posted by the original maintainer and is now outdated.

> As I, the developer, decided not to contribute to the Minecraft communities, this project **won't receive major
updates** since Core 50 (that's why I call it Sunset).
>
> If servere security vulnerbilities are found in the future, patches might still be available. However, generally, this
> project is now discontinued.
>
> It doesn't mean you have to switch to another launcher, but if you wish to, we
> recommand [HMCL](https://github.com/huanghongxun/HMCL), it's a free software (as in freedom) and is still being
> actively
> maintained.

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

  This will generate binaries and put them under `out`, including Windows x64, Windows ia32, GNU/Linux x64, GNU/Linux
  arm64 ~~and macOS x64~~. This will also generate corresponding archives.

  _The support for macOS has ended and no more platform dependent code will be commited. The modules present are still
  kept, but might not run correctly._

  You also need `wine` to complete the cross build progress on platforms other than Windows. Follow the instructions
  given by `electron-packager`.
