# Alicorn Launcher

*Now Contrail*

A faithful launcher for the block game, trying to regain the magic of friendship.

![Alicorn Badge](https://img.shields.io/badge/Alicorn-4.x-df307f)
![Node.js CI](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/rust.yml/badge.svg)
![CodeQL](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/codeql.yml/badge.svg)
![Creation Date](https://img.shields.io/github/created-at/Andy-K-Sparklight/Alicorn?label=since)
![License Badge](https://img.shields.io/github/license/Andy-K-Sparklight/Alicorn)
![Repo Size](https://img.shields.io/github/repo-size/Andy-K-Sparklight/Alicorn)

> [!WARNING]
> *Contrail* is currently incomplete.
>
> We're actively developing towards it. However, before this alert is removed, content written below
may not be fully represented in the application.
>
> Want to get things landed faster? Get involved by
opening [issues](https://github.com/Andy-K-Sparklight/Alicorn/issues/new) or
[pull requests](https://github.com/Andy-K-Sparklight/Alicorn/compare)!

## About Contrail

"Contrail" is the codename of Alicorn 4.x (aka. Alicorn R). It's a major rewrite of the codebase
aiming to improve the performance and stability of Alicorn. Highlights include:

- **Bye bye, Electron.**

  Electron has been our good old friend since the first day Alicorn is built. Fairly speaking,
  Electron is suitable for almost any desktop app but block game launchers. Chromium eats memory and
  takes up space in modpacks, and while not necessarily making Alicorn slow, it's indeed one of the
  major blockers of extending the use cases.

  As part of Contrail, Alicorn is phasing Electron out progressively, and will completely drop it at
  completion. A new native framework, plus some helper crates, will serve the UI of Alicorn.

- **Fewer errors.**

  What Rust brings to Alicorn is not only memory safety, it's the philosophy "be prepared for it or
  forbid doing so". Problems shall happen much less often in Contrail, and at the very least,
  Alicorn can quit with a proper reason when something goes really wrong.

- **MCP bundled.**

  Your agent can fix your game with shell, but it does so much more efficiently when tools are
  available. Contrail includes MCP tools that helps your agent to debug or create — and also saves
  you some tokens!

- **Server tools.**

  Though planned to be experimental, Contrail will come with server support, including plugins, web
  UI, daemon mod, etc. The reason is simple (and should convince you): I've got tired of popping up
  a code editor every time I want a new plugin!

- **Human checked.**

  Vibe a launcher is easy. Vibe a checked one is not. Starting from Contrail, each line of code in
  Alicorn will be reviewed and audited much more carefully, in order to prevent bugs and hidden
  costs.

- **Always here.**

  Each feature previously included in Alicorn will continue to be supported, surviving refactors and
  rewrites. Time files, people changes, but Alicorn will always be here.

## Philosophy

Alicorn is built with the following vision:

- **Launching works forever.**

  Alicorn launches each and every game version, paired with popular mod loaders, on available
  platforms. Rift works. Forge on 1.5.2 works. RubyDung works. All at this moment.

- **Available to all.**

  GPLv3-licensed. No hidden trackers, no ads, no paid versions, no cheat client lockdowns[^1].
  Everything ready for use.

- **Powerful while easy.**

  Alicorn aims to become a comprehensive toolkit while maintaining excellent usability. You don't
  have to know about versions, mod loaders or JVM to get started, but when you do want fine-grained
  control for something crazy, you can always count on Alicorn.

## Supported Platforms

Alicorn covers all platforms that the game officially runs on. For a particular subset of game
configurations, Alicorn can also try to run them on unsupported platforms or architectures, but it's
highly experimental and brittle.

## Build Instructions

See [BUILDING.md](docs/BUILDING.md).

## License

- Copyright © 2021-2022 Andy K Rarity Sparklight ("ThatRarityEG")
- Copyright © 2024-2026 Ted Gao ("skjsjhb")

![GPL-3.0 Logo](https://www.gnu.org/graphics/gplv3-or-later.svg)

This project is licensed under
the [GNU General Public License, Version 3](https://www.gnu.org/licenses/gpl-3.0.html), or a later
version published by the Free Software Foundation, at your opinion.

## Disclaimer

Alicorn is an unofficial (third-party) work. The development of Alicorn is not related to Mojang or
Microsoft.

Absolutely no warranty.

[^1]: But really, cheating is prohibited on most servers. Alicorn won't stop you — but you've been
warned!
