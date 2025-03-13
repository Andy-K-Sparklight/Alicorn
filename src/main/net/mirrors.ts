import { conf } from "@/main/conf/conf";
import { isTruthy } from "@/main/util/misc";
import { net } from "electron";

interface Mirror {
    name: string;
    test?: {
        url: string;
        challenge: string;
    };

    apply(origin: string): string | null;
}

const bgithub: Mirror = {
    name: "bgithub",
    test: {
        url: "https://bgithub.xyz/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0.tar.xz",
        challenge: "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0.tar.xz"
    },

    apply(origin: string): string | null {
        const u = URL.parse(origin);
        if (!u) return null;

        if (u.host === "github.com") {
            u.host = "bgithub.xyz";
            return u.toString();
        }

        return null;
    }
};

const ghfast: Mirror = {
    name: "ghfast",
    test: {
        url: "https://ghfast.top/https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0.tar.xz",
        challenge: "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0.tar.xz"
    },

    apply(origin: string): string | null {
        const u = URL.parse(origin);
        if (!u) return null;

        const githubHosts = [
            "github.com",
            "raw.githubusercontent.com",
            "gist.github.com",
            "gist.githubusercontent.com"
        ];

        if (githubHosts.includes(u.host)) {
            return `https://ghfast.top/${u}`;
        }

        return null;
    }
};

const aliyun: Mirror = {
    name: "aliyun",
    test: {
        url: "https://maven.aliyun.com/nexus/content/groups/public/com/google/guava/guava/21.0/guava-21.0.jar",
        challenge: "https://libraries.minecraft.net/com/google/guava/guava/21.0/guava-21.0.jar"
    },

    apply(origin: string) {
        const u = URL.parse(origin);
        if (!u) return null;

        if (u.host === "repo1.maven.org" && u.pathname.startsWith("/maven2")) {
            u.host = "maven.aliyun.com";
            u.pathname = "/nexus/content/groups/public" + u.pathname.slice("/maven2".length);
            return u.toString();
        }

        // It's not surprising that most libraries that the game / loaders use can be found in the central repo
        // This shall reduce the number of requests to other mirrors
        if (["maven.minecraftforge.net", "libraries.minecraft.net", "maven.fabricmc.net"].includes(u.host)) {
            u.host = "maven.aliyun.com";
            u.pathname = "/nexus/content/groups/public" + u.pathname;
            return u.toString();
        }

        return null;
    }
};

const bmclapi: Mirror | false = import.meta.env.AL_ENABLE_BMCLAPI && {
    name: "bmclapi",
    test: {
        url: "https://bmclapi2.bangbang93.com/maven/com/google/guava/guava/21.0/guava-21.0.jar",
        challenge: "https://libraries.minecraft.net/com/google/guava/guava/21.0/guava-21.0.jar"
    },
    apply(origin: string) {
        const banList = [
            // This file seems to be outdated
            "https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml"
        ];

        if (banList.includes(origin)) return null;

        if (origin === "https://dl.liteloader.com/versions/versions.json") {
            return "https://bmclapi2.bangbang93.com/maven/com/mumfrey/liteloader/versions.json";
        }

        const u = URL.parse(origin);
        if (!u) return null; // Possibly malformed URL

        if (["launcher.mojang.com", "launchermeta.mojang.com", "piston-meta.mojang.com", "piston-data.mojang.com"].includes(u.host)) {
            u.host = "bmclapi2.bangbang93.com";
            return u.toString();
        }

        // Seems that Quilt is not included in the mirror
        if (["maven.minecraftforge.net", "libraries.minecraft.net", "maven.fabricmc.net"].includes(u.host)) {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/maven" + u.pathname;
            return u.toString();
        }

        if (u.host === "files.minecraftforge.net" && u.pathname.startsWith("/maven")) {
            u.host = "bmclapi2.bangbang93.com";
            return u.toString();
        }

        if (u.host === "resources.download.minecraft.net") {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/assets" + u.pathname;
            return u.toString();
        }

        if (u.host === "authlib-injector.yushi.moe") {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/mirrors/authlib-injector" + u.pathname;
            return u.toString();
        }

        if (u.host === "meta.fabricmc.net") {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/fabric-meta" + u.pathname;
            return u.toString();
        }

        if (u.host === "maven.neoforged.net" && u.pathname.startsWith("/releases")) {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/maven" + u.pathname.slice("/releases".length);
            return u.toString();
        }

        if (u.host === "optifine.net" && u.pathname === "/downloadx" && u.searchParams.has("f")) {
            const f = u.searchParams.get("f") || "";
            const gameVersion = f.split("OptiFine_")[1]?.split("_")[0];

            if (gameVersion) {
                return `https://bmclapi2.bangbang93.com/maven/com/optifine/${gameVersion}/${f}`;
            }
        }

        if (u.host === "dl.liteloader.com" && u.pathname.startsWith("/versions")) {
            u.host = "bmclapi2.bangbang93.com";
            u.pathname = "/maven" + u.pathname.slice("/versions".length);
            return u.toString();
        }

        return null;
    }
} satisfies Mirror;

const mcim: Mirror = {
    name: "mcim",
    test: {
        url: "https://mod.mcimirror.top/curseforge/v1/mods/search?gameId=432",
        challenge: "https://api.curse.tools/v1/cf/mods/search?gameId=432"
    },
    apply(origin: string): string | null {
        const u = URL.parse(origin);
        if (!u) return null;

        if (u.host === "api.curse.tools" && u.pathname.startsWith("/v1/cf")) {
            const p = u.pathname.slice("/v1/cf".length);
            u.host = "mod.mcimirror.top";
            u.pathname = "/curseforge/v1" + p;
            return u.toString();
        }

        return null;
    }
};

const mirrorList = [mcim, aliyun, bmclapi, ghfast, bgithub].filter(isTruthy);

function getMirrors() {
    return mirrorList.filter(m => conf().net.mirror.picked.includes(m.name));
}

function apply(url: string): string[] {
    if (!conf().net.mirror.enable) {
        return [url];
    }

    const sources = [...getMirrors().map(m => m.apply(url)), url].map(u => u?.trim()).filter(isTruthy);
    return [...new Set(sources)];
}

async function bench(): Promise<void> {
    if (!conf().net.mirror.bench || mirrorList.length < 2 || conf().net.mirror.nextBenchTime > Date.now()) {
        return;
    }

    const enabledMirrors = (await Promise.all(mirrorList.map(async m => {
        if (m.test) {
            try {
                const ac = new AbortController();
                const effectiveUrl = await Promise.any([
                    digUrl(m.test.url, ac.signal),
                    digUrl(m.test.challenge, ac.signal)
                ]);
                ac.abort();

                console.debug(`Faster mirror URL: ${effectiveUrl}`);

                if (effectiveUrl === m.test.challenge) {
                    // The mirror is not faster, ignore it
                    return;
                }
            } catch {
                return;
            }
        }

        console.log(`Enabling mirror: ${m.name}`);
        return m.name;
    }))).filter(isTruthy);

    conf.alter(c => c.net.mirror.picked = enabledMirrors);
    conf.alter(c => c.net.mirror.nextBenchTime = Date.now() + 86400e3); // Bench at most once a day
}

async function digUrl(url: string, signal: AbortSignal): Promise<string> {
    console.log(`Testing URL: ${url}`);
    const timeSignal = AbortSignal.timeout(10e3); // Wait for at most 10s (this should be enough for most mirrors)
    const compoundSignal = AbortSignal.any([timeSignal, signal]);
    const res = await net.fetch(url, { cache: "reload", signal: compoundSignal });
    if (!res.ok || !res.body) {
        throw `Failed to request mirror URL ${url}: ${res.status}`;
    }
    await res.arrayBuffer();
    return url;
}

function isMirrorEnabled(name: string): boolean {
    return conf().net.mirror.picked.includes(name) && mirrorList.some(m => m.name === name);
}

export const mirror = {
    bench, apply, isMirrorEnabled
};
