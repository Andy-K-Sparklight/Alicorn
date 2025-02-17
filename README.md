# Alicorn Launcher

That launcher of the block game, once with the magic of friendship.

![Alicorn Badge](https://img.shields.io/badge/Alicorn-2.x-df307f)
![Node.js CI](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/build.yml/badge.svg)
![CodeQL](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/codeql.yml/badge.svg)
![Creation Date](https://img.shields.io/github/created-at/Andy-K-Sparklight/Alicorn?label=since)
![License Badge](https://img.shields.io/github/license/Andy-K-Sparklight/Alicorn)
![Repo Size](https://img.shields.io/github/repo-size/Andy-K-Sparklight/Alicorn)

## Our Goal

The development of Alicorn is based on the following vision:

- **Game First**

  Craft your game experience and click to play. Leave the technical jobs to us.

- **Free as in Pricing**

  You're paying for playing, no more for launching.[^1]

- **Free as in Freedom**

  Things related to your game really shouldn't be touched by something you can't control.

- **Cross Platform**

  Play on any computer regardless of its OS.[^2]

- **Fast**

  Spend time in your world, not entering your world.

- **Space Utilization**

  Create hundreds of game experiences while storing only one copy of game assets.

- **User First**

  Play the game in the way you like. It's never a crime to fly in your own world.[^3]

- **Privacy Aware**

  We collect limited anonymous data only for improving Alicorn. This will only happen under your approval.

## Supported Platforms

Systems:

- Microsoft Windows 10 / 11
- Apple macOS (Big Sur or later)
- GNU/Linux
    - There are no detailed compatibility metrics, but recent releases should work.

Architectures:

- `x64` (`amd64`)
- `arm64` (`aarch64`)

> [!NOTE]
> Official support for `arm64` on major platforms was only added recently (since 1.19). We're planning to provide
> addition support for earlier versions, but it's not prioritized.

## Build Instructions

See [BUILDING.md](docs/BUILDING.md).

## License

![GPL-3.0 Logo](https://www.gnu.org/graphics/gplv3-or-later.svg)

[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) (or any later version)

## FAQs

<details>
<summary>Click to Expand</summary>

> Is this project related to *[name of a company / organization]*?

No. Alicorn is an independent project. It's made by the players, for the players.

> Is it a cracked launcher? / Can I play the game without an account?

No. We provide no support for that. Note that it breaks the EULA by doing so.

> My system says that Alicorn contains virus / cannot be trusted.

Our released binaries are pulled directly from the CI artifacts which are built automatically from publicly visible
build scripts. You can always check the source code (or ask someone experienced to do so) to be convinced that our
program doesn't contain malicious code. You'll understand why we're not signing the binaries (and that's why your system
complains) if you know that it's not a process which happens for free.

> I've found a bug. / I want a new feature that's not included.

You're welcome to [open an issue](https://github.com/Andy-K-Sparklight/Alicorn/issues/new) for that.

> Electron is *[names of downsides]*. It's 2025 now, why not just use *[name of an alternative]*?

We choose Electron for its easiness in web integration,
security and the exclusion of the necessity of writing platform-dependent code.
We want to provide a software based on a framework built by a large team of experienced engineers,
limiting the bugs and pitfalls that may happen if we were inventing wheels by ourselves.

> 100+ MiBs is too large!

Anyone who creates more than one game will notice that the size of their game folders grows at the speed of hundreds of
MiBs. Even a resource pack can often be larger than Alicorn. If you're running out of available space, it's generally
suggested to start cleaning up something (e.g. temporary files, recycle bin, etc.).

> Why is Alicorn taking up GBs of memory?

Applications that perform heavy I/O operations (like Alicorn) usually ask the system for more memory to improve the
throughput. The allocated memory space will be left unused after those operations are finished, yet not being reclaimed
(actively) until the system decides to divert them to other processes. That is to say, the GBs of memory can be reused
by the game (or other apps) once needed. It shall not impact the game performance.

</details>

## Disclaimer

Alicorn is an unofficial (third-party) work. The development of Alicorn is not related to Mojang or Microsoft.

[^1]: We as developers follow the EULA of the game and advocate copyright protection.
A valid account is required to enter the game session.

[^2]: When supported by the game.

[^3]: Cheat clients are forbidden in certain servers and are protested by the community. Use them at your own risk.
