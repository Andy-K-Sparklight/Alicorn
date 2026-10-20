# Alicorn Launcher

*Now With the Power of Rhythm*

A faithful launcher for composable games.

![Alicorn Badge](https://img.shields.io/badge/Alicorn-4.x-df307f)
![Rust CI](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/rust.yml/badge.svg)
![CodeQL](https://github.com/Andy-K-Sparklight/Alicorn/actions/workflows/codeql.yml/badge.svg)
![Creation Date](https://img.shields.io/github/created-at/Andy-K-Sparklight/Alicorn?label=since)
![License Badge](https://img.shields.io/github/license/Andy-K-Sparklight/Alicorn)
![Repo Size](https://img.shields.io/github/repo-size/Andy-K-Sparklight/Alicorn)

## A New Story To Write

[Team Rhytick](https://github.com/TeamRhytick) is joining the development of Alicorn, favoring its
performance and design philosophy. We're adjusting the future design of Alicorn as a response.

> [!TIP]
> Rhytick is a club focusing on presenting open and fun music games (which explains quiet a lot why
they want Alicorn for launching support — the charts!).

### What That Means to Alicorn

TL;DR: It's no longer block-game-only.

We're extending Alicorn to become a general-purpose **launcher framework** to support distribution,
maintenance and community integration for **composable** games & applications. "Composable" here
refers to products that require many components (e.g. libraries, mods, assets) to be assembled
together before they can be run. Such products are usually customizable and benefit from launcher
features.

In the future, Alicorn will focus on providing hardened, performant and size-efficient launcher
infrastructure, while allowing users who wish to deploy their product to customize it using
protocols and modules.

### What Will Change

The main change will be **stability** and **update frequency**. In particular, commits will be first
added to an internal repo, and will be mirrored to the GitHub only after being audited. This means
that nightly commits might not be immediately, but will be eventually, available to all.

Another major change will be less specialization. For example, you might no longer see a pixelated
block-style welcome screen in the future. Instead, Alicorn may present a list of built-in games for
you to select.

### What Stay Unchanged

Alicorn will stay:

- Free as in freedom. Alicorn will continue to be open & libre to all, with no hidden or proprietary
  features. Rhytick release their games with the same vision, so we're betting on them!
- Open and friendly. We still process issues, pull requests and discussions actively.
- Clean and safe. No ads, no hidden trackers, no data collection for marketing.
- Here. So long as Sparklight's account stay available, we won't move this repository elsewhere.
- Standalone. Rhytick is collaborating with, rather than acquiring, Alicorn. Alicorn won't subject
  to code of conduct, confidentiality rules, contribution requirement or other management policies
  of Rhytick.

> [!NOTE]
> Alicorn may, however, present the name or logo of Rhytick in a fair form according to their
contribution.

## About Contrail

> [!WARNING]
> *Contrail* is currently incomplete.
>
> We're actively developing towards it. However, before this alert is removed, content written below
may not be fully represented in the application.
>
> Want to get things landed faster? Get involved by
opening [issues](https://github.com/Andy-K-Sparklight/Alicorn/issues/new)
or [pull requests](https://github.com/Andy-K-Sparklight/Alicorn/compare)!

"Contrail" is the codename of Alicorn 4.x (aka. Alicorn R). It's a major rewrite of the codebase
aiming to improve the performance and stability of Alicorn. Highlights include:

- **Bye bye, Electron.**

  Electron has been our good old friend since the first day Alicorn is built. Fairly speaking,
  Electron is suitable for almost any desktop app but game launchers. Chromium eats memory and takes
  up space in modpacks, and while not necessarily making Alicorn slow, it's indeed one of the major
  blockers of extending the use cases.

  As part of Contrail, Alicorn is phasing Electron out progressively, and will completely drop it at
  completion. A new native framework, plus some helper crates, will serve the UI of Alicorn.

- **Fewer errors.**

  What Rust brings to Alicorn is not only memory safety, it's the philosophy "be prepared for it or
  forbid doing so". Problems shall happen much less often in Contrail, and at the very least,
  Alicorn can quit with a proper reason when something goes really wrong.

- **Human checked.**

  Vibe a launcher is easy. Vibe a checked one is not. Starting from Contrail, each line of code in
  Alicorn will be reviewed and audited much more carefully, in order to prevent bugs and hidden
  costs.

- **Always here.**

  Each feature previously included in Alicorn will continue to be supported, surviving refactors and
  rewrites. Time files, people changes, but Alicorn will always be here.

## Supported Platforms

Alicorn covers all platforms that the game it launches officially runs on. For a particular subset
of unsupported game configurations, Alicorn can also try to run them on unsupported platforms or
architectures, but it's highly experimental and brittle.

## Build Instructions

See [BUILDING.md](docs/BUILDING.md).

## License

- Copyright © 2021-2022 Andy K Rarity Sparklight ("ThatRarityEG")
- Copyright © 2024-2026 Ted Gao ("skjsjhb")
- Copyright © 2026 Team Rhytick

![GPL-3.0 Logo](https://www.gnu.org/graphics/gplv3-or-later.svg)

This project is licensed under
the [GNU General Public License, Version 3](https://www.gnu.org/licenses/gpl-3.0.html), or a later
version published by the Free Software Foundation, at your opinion.

## Disclaimer

Alicorn is a work collaborated with Team Rhytick. No other affiliations. Apart from official Team
Rhytick products, Alicorn is unofficial with regard to other games & applications, together with
their vendors.

Absolutely no warranty.
