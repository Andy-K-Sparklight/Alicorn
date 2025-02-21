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
        const u = URL.parse(origin);
        if (!u) return null; // Possibly malformed URL

        if (["launcher.mojang.com", "launchermeta.mojang.com", "piston-meta.mojang.com", "piston-data.mojang.com"].includes(u.host)) {
            u.host = "bmclapi2.bangbang93.com";
            return u.toString();
        }

        // We're not including Quilt here as it seems not included
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

        return null;
    }
} satisfies Mirror;

const mirrorList = [aliyun, bmclapi].filter(isTruthy);

function getMirrors() {
    return mirrorList.filter(m => conf().net.mirror.picked.includes(m.name));
}

function apply(url: string): string[] {
    const sources = [...getMirrors().map(m => m.apply(url)), url].filter(isTruthy);
    return [...new Set(sources)];
}

async function bench(): Promise<void> {
    if (!conf().net.mirror.bench || mirrorList.length < 2) {
        return;
    }

    const enabledMirrors: string[] = [];

    for (const m of mirrorList) {
        if (m.test) {
            try {
                const s1 = await testSpeed(m.test.url);
                const s2 = await testSpeed(m.test.challenge);

                if (s1 <= s2) {
                    // The mirror is not faster, ignore it
                    continue;
                }
            } catch (e) {
                console.warn(`Unable to test mirror ${m.name}, skipped.`);
                continue; // Mirror downed
            }
        }

        console.log(`Enabling mirror: ${m.name}`);
        enabledMirrors.push(m.name);
    }

    conf.alter(c => c.net.mirror.picked = enabledMirrors);
}

async function testSpeed(url: string): Promise<number> {
    console.log(`Testing URL: ${url}`);
    const t = Date.now();
    const res = await net.fetch(url, { cache: "reload" });
    if (!res.ok) return -1;
    const arr = await res.arrayBuffer();
    const speed = arr.byteLength / (Date.now() - t);
    console.log(`Estimated speed: ${speed} (KB/s)`);
    return speed;
}

export const mirror = {
    bench, apply
};
