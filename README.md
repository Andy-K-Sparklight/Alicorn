# The Alicorn (Again) Launcher

This is an official (or officially authorized) rewrite of the original Alicorn launcher.

## What Has Happened?

> The sun sets but it will always rise.

### A Short, Sad Story

This was posted by the original maintainer @Andy-K-Sparklight.

> As I, the developer, decided not to contribute to the Minecraft communities, this project **won't receive major
> updates** since Core 50 (that's why I call it Sunset).
>
> If servere security vulnerbilities are found in the future, patches might still be available. However, generally, this
> project is now discontinued.
>
> It doesn't mean you have to switch to another launcher, but if you wish to, we recommand *\[deleted\]*, it's a free
> software (as in freedom) and is still being actively maintained.

In short, the original author, who has designed and created Alicorn, has left.

There used to be an organization @AlicornUnionMC, which seems to play the role of the development team of Alicorn.
However, the organization is now inactive since the left of the owner.

The macOS support was originally maintained by @Nana-Sakura, but hasn't been updated due to the staled upstream.

### Again the Story

Being invited as a collaborator at early 2024, I (@skjsjhb) am now responsible for the development of Alicorn.

The process was not easy. One major reason is that the original codebase is just a bunch of s... supercomplex code.
Inexperienced designs, vulnerable code without tests, cumbersome (and slow) build process and unclear documents, naming
a few, make patches and drop-in replacements almost impossible. Failures, bugs, errors, and finally, my patience for
TypeScript is drained out.

After some research I've decided to port Alicorn to [TeaVM](https://teavm.org/), using Kotlin. This approach allows me
to code using the language that I'm familiar with, while also providing a smoother curve when porting the existing
TypeScript codebase via interoperability with JS.

So that's it, the new Alicorn. With bloaty Electron as always, complicated JS stuff as always, codebase maintained by
a single developer as always, and still here, as always.

## Notable Changes

The list below may be updated during the development / migration without prior notice.

### Functional

- [ ] New UI designed for easier access and efficiency.
- [ ] Support NeoForged.
- [ ] Support modloader installation of specific version.
- [ ] Adopt a better resource-level update system.
- [ ] Support multiple vanilla accounts.
- [ ] Add advanced launch controls.
- [ ] Add support for official Java runtimes.
- [ ] Remove or replace vulnerable and immature modules.
- [ ] Changes about third-party authorization services (see below).
- [ ] Support macOS.
- [ ] ...More in planning

### Performance

- [ ] Improve overall performance.
- [ ] Reduce download bottleneck.
- [ ] Reduce application startup time.
- [ ] ...More in planning

## Third-Party Authorization Services

The trend of using third-party authorization service via mods or plugins are getting more popular for recent years.
These services manage to change the behavior of the Mojang authorization library, making the game send requests to their
authorization server instead of Microsoft ones. There are several reasons to do so:

- The network of the server is limited and cannot access Microsoft services.
- The server has custom capes or skins which haven't been or cannot be uploaded to the official server.
- The server operator want more a more fine-grained control over the accounts.

We don't know the attitude that Mojang takes towards them, nor their technical details, but this is the fact that these
services **are being used**. Alicorn stands strongly together with the community and tries to be inclusive. Thus, this
feature gets implemented in Alicorn.

However, supporting these services brings a new challenge: dealing with cracked accounts. We are aware of the cases that
these services are being abused, not for authorizing against a specific (game) server, but for cracking the game. We're
not letting this happen. We haven't ever support any form of cracking or cheating, and we never will.

Considering the requirements and limitations, Alicorn adopts a way of dealing with cracking similar to Mojang. In the
vanilla launcher, users are required to log-in once to access the offline mode. In Alicorn things are going to be
similar: a successful authorization (against the official server) is required before the third-party authorization
plugin becomes available.

## For Hacked Clients

It's true that valid use cases of hacked clients do exist (e.g. special servers, singleplayer, creating a video clip,
etc.), but, generally these clients are being abused to harm the community.

Alicorn does not prohibit anyone from launching these clients, but when it detects any, it shows up a confimation dialog
before the first launch, warns about the possible consequences, and guides the user to use these clients properly. In
particular, users are required to choose an answer for the question "Why do you use this hacked client?". We don't
collect the answers, but it acts as a way of self-introspecting for users.

Issues and pull requests specific to hacked clients won't be supported, though they can still be resolved by community
members.

## How to Build

### Choose the Runtime

The new Alicorn comes with three alternative runtimes:

- ERT: Codename *Aisia*. The original yet stable runtime based on [Electron](https://www.electronjs.org/). Now ready for
  use.
- NRT: Codename *Neko*. A new, lightweight runtime based on [Neutralino](https://neutralino.js.org/). Working in
  progress.
- JRT: Codename *Yuki*. A new, heavy but reliable runtime based
  on [JetBrains Runtime](https://github.com/JetBrains/JetBrainsRuntime). Working in progress.

The differences between the three runtimes are as follows (bold means better):

|               | ERT (Aisia)          | NRT (Neko)            | JRT (Yuki)      |
|---------------|----------------------|-----------------------|-----------------|
| Dependencies  | **Nothing**          | WebView2 or WebKitGTK | **Nothing**     |
| Robustness    | Mostly[^1]           | With caveats[^2]      | **Solid**       |
| Backend       | TeaVM                | TeaVM                 | **Java**        |
| Throughput    | Medium               | Restrained            | **High**        |
| Unpacked Size | Large (~200 MiB)     | **Concise (~10 MiB)** | Huge (~300 MiB) |
| Memory Usage  | Demanding (~600 MiB) | **Low (~200 MiB)**    | Hungry[^3]      |
| Features      | **Full**             | Not guaranteed[^4]    | **Full**        |

[^1]: Electron is robust enough if following its security guidelines strictly. Unfortunately, it's almost impossible to
stick to the rules without paying unrealistic much effort.

[^2]: Due to platform limitations, some APIs are implemented using unusal approaches, which can be error-prone.

[^3]: Depending on JVM options.

[^4]: Most missing APIs (e.g. unlimited network access) can be *emulated* (NOT *implemented*), but being barely usable.

> [!TIP]
> The reason these runtimes exist is actually a trade-off between performance, robustness and portability. As a
> full-featured, cross-plaform launcher, Alicorn faces the serious challenge from limited technology stacks. For the
> sceneraios that the app size must be strictly measured or, in opposite, intensive tasks must be executed, we use
> alternative runtimes to meet these requirements without losing usability.

### Prerequisites

> [!NOTE]
> Node.js and Gradle are **NOT** needed. Besides, the build system won't pick any even if there are local installations.

- **JDK 21**. Eclipse Temurin 21 is verified to work.
- **Git**. To clone the repository and checkout the code.

Build steps:

1. Clone the repository. A partial treeless clone should be sufficient for both single-time build and development:

   ```shell
   git clone --filter=tree:0 https://github.com/Andy-K-Sparklight/Alicorn.git
   cd Alicorn
   ```

2. Build and run with Gradle.

   To run Alicorn based on ERT:

   ```shell
   ./gradlew runAisiaAppDebug
   ```

   To run Alicorn based on NRT:

   ```shell
   ./gradlew runNekoAppDebug
   ```

   To run Alicorn based on JRT:

   ```shell
   ./gradlew runYukiAppDebug
   ```

   > [!TIP]
   > For Windows Command Prompt, use `gradlew` instead of `./gradlew`.

   The build script downloads extra components during the first build and each time the dependency gets updated. Make
   sure to keep online when running the build.

   `run<Name>AppDebug` generates a debug build and run it. Other useful tasks include:
    - `run<Name>AppRelease`: Generates a release build and run it.
    - `assemble<Name>AppDebug`: Assembles the app using debug profile, but does not run it.
    - `assemble<Name>AppRelease`: Assembles the app using release profile, but does not run it.

   Where `<Name>` is `Aisia` for ERT, `Neko` for NRT, and `Yuki` for JRT.

## Disclaimer

This project is not official, nor related to Mojang Studios or Microsoft Corporation.

This project is non-profit and won't ask for payment under any circumstances.

Java(TM) is a trademark of Oracle.

## License

Copyright (C) 2021-2024 Annie K Rarity Sparklight, 2023-2024 Ted "skjsjhb" Gao.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the
implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
details.

You should have received a copy of the GNU General Public License along with this program. If not,
see <https://www.gnu.org/licenses/>.
