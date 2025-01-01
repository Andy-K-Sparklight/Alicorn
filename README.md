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

## Build

> [!NOTE]
> **You may not need to build Alicorn yourself.**
> For production usages, use stable releases can help to avoid potential bugs and pitfalls.
> To access the latest features, update from the beta channel to get tested builds.
> Only build from source for development.

Alicorn can be built from any platform it runs on. The following tools are required:

- Node.js >= 22 (LTS)

  The Node.js version for building will not affect the copy bundled with Electron.

- Git

1. Get the code:

   ```shell
   git clone --filter=tree:0 https://github.com/Andy-K-Sparklight/Alicorn.git
   ```

2. Install dependencies:

   ```shell
   corepack enable
   pnpm i
   ```

3. Build and run:

    - For production:

      ```shell
      pnpm prod
      pnpm start
      ```

    - For development:

      ```shell
      pnpm dev
      ```

      This command builds the main process modules and starts a development server (with HMR) for the renderer.
      Changes made to the renderer will be reflected immediately once saved.

4. To create packaged binaries:

   ```shell
   pnpm dist
   ```

   The output files are placed at `out`.

Certain features can be toggled or adjusted during the build process. Check and edit `config.ts` for details.

## License

![GPL-3.0 Logo](https://www.gnu.org/graphics/gplv3-or-later.png)

[GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) (or any later version)

[^1]: We as developers follow the EULA of the game and advocate copyright protection.
A valid account is required to enter the game session.

[^2]: When supported by the game.

[^3]: Cheat clients are forbidden in certain servers and are protested by the community. Use them at your own risk.