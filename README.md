# Alicorn Launcher

> [!NOTE]
> The developers behind Alicorn have shifted since early 2023.
> We're now planning to commit major changes to Alicorn for new features, improved stability,
> optimized code and better user-experience.

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

- **Not Opinionated**

  Play the game in the way you like. It's never a crime to fly in your own world.[^3]

- **Privacy Aware**

  We collect no data for analysis. There's no option to enable it.

## Supported Platforms

> [!NOTE]
> Platforms that do not have corresponding LWJGL artifacts are unsupported.

> [!IMPORTANT]
> Certain game experiences may not be available on platforms that Alicorn runs on.

Systems:

- Microsoft Windows 10 / 11
- Apple macOS (Big Sur or later)
- GNU/Linux
    - There are no detailed compatibility metrics, but recent releases should work.

Architectures:

- `x64` (`amd64`)
- `arm64` (`aarch64`)

## Build Instructions

> [!NOTE]
> **You may not need to build Alicorn yourself.**
> For production usages, use stable releases can help to avoid potential bugs and pitfalls.
> To access the latest features, update from the beta channel to get tested builds.
> Only build from source for development.

### Prerequisites

You can build Alicorn for **preview** on any platform it runs on.
For **packaging**, however, there are several limitations:

- ARM64 platforms other than macOS cannot be used for packaging.
- DMG images can only be generated on macOS. It's skipped on other platforms.

The following tools are required:

- Bun (v1.1 or later)

  We use Bun to run our build tools for performance reasons.
  The Bun version for building will not affect the Node.js version bundled with Electron.

- Git

- Node.js (v23 or later), when packaging. (**NOT** needed for development)

- Wine, when building on non-Windows platforms.

> [!IMPORTANT]
> There is a known bug with Bun 1.2.1 and 1.2.2 that causes Vite to fail the build process.
> Avoid these versions when installing.

### Get the Source Code

```shell
git clone --filter=tree:0 https://github.com/Andy-K-Sparklight/Alicorn.git
```

Flag `--filter=tree:0` reduces the amount of files to receive, yet preserves the commits.

### Build and Preview

Install dependencies:

```shell
bun install
```

> [!TIP]
> Alicorn has a set of customizable build options which toggles or adjusts certain features.
> These options can help when building Alicorn with different "flavors".
> See `config.ts` for details.

> [!IMPORTANT]
> Additional files (known as "vendors") may need to be downloaded during the build process.
> Keep online when building.

Preview for production:

```shell
bun prod
bun start
```

Preview for development (with live reload):

```shell
bun dev
```

### Create Packaged Binaries

This is a bit tricky as Bun skips "untrusted" post-install scripts, which are needed for modules like
`electron-installer-dmg`. Hence, it's required to reinstall the modules using `npm` before building:

```shell
npm install
npm run dist
```

The output files locate at `dist`, including:

- Unpacked (directory) files of the app.
- Corresponding archives (`.dmg` must be built on macOS).

## License

![GPL-3.0 Logo](https://www.gnu.org/graphics/gplv3-or-later.png)

[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) (or any later version)

## Disclaimer

Alicorn is an unofficial (third-party) work. The development of Alicorn is not related to Mojang or Microsoft.

[^1]: We as developers follow the EULA of the game and advocate copyright protection.
A valid account is required to enter the game session.

[^2]: When supported by the game.

[^3]: Cheat clients are forbidden in certain servers and are protested by the community. Use them at your own risk.
