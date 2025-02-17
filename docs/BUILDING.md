# Build Instructions

> [!NOTE]
> **You may not need to build Alicorn yourself.**
> For production usages, use stable releases can help to avoid potential bugs and pitfalls.
> To access the latest features, update from the beta channel to get tested builds.
> Only build from source for development.

## Prerequisites

Alicorn can be built for **preview** on any platform it runs on.
For **packaging**, however, there are limitations:

- ARM64 platforms other than macOS cannot be used for packaging.
- Platform-specific installers (`.msi` on Windows, `.dmg` on macOS, etc.) require the corresponding OS.

The following tools are required:

- Bun (v1.2.2 or later)

  We use Bun to run our build tools for performance reasons.
  The Bun version for building will not affect the Node.js version bundled with Electron.

- Git, when fetching the code via cloning.

  It's not recommended to download the code tarball as you'll have to pull the latest code manually.

- Wine, when packaging on non-Windows platforms.

- Node.js (v23 or later), when packaging. (**NOT** needed for previewing)

- WiX Toolset v3, when packaging for Windows. (The version matters!)

## Get the Source Code

```shell
git clone --filter=tree:0 https://github.com/Andy-K-Sparklight/Alicorn.git
```

Flag `--filter=tree:0` reduces the amount of files to receive, yet preserves the commit history.

## Build and Preview

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

> [!NOTE]
> There is a [known issue](https://github.com/electron/electron/issues/42510) related to sandboxing on Ubuntu 24.x (and
> likely later versions) that makes Alicorn fail to launch. Use the command below as a workaround while waiting for a
> fix:
>
> ```shell
> sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
> ```

## Create Packaged Binaries

This is a bit tricky as Bun skips "untrusted" post-install scripts, which are needed for modules like
`electron-installer-dmg`. Hence, it's required to reinstall the modules using `npm` before building:

```shell
npm install
npm run dist
```

The output files locate at `dist`, including:

- Unpacked (directory) files of the app.
- Archives of these directories.
- Hot update bundles (useful when building a custom release channel).
- Platform-specific installers.
