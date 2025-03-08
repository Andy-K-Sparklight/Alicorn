import { containers } from "@/main/container/manage";
import type { Container } from "@/main/container/spec";
import { games } from "@/main/game/manage";
import { mpmLock } from "@/main/mpm/lockfile";
import { ModrinthProvider } from "@/main/mpm/modrinth";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { uniqueBy } from "@/main/util/misc";
import fs from "fs-extra";

export interface MpmManifest {
    userPrompt: string[];
    resolved: MpmPackage[];
}

export class MpmPackageSpecifier {
    id: string;
    vendor: string;
    version: string; // An empty string for arbitrary version

    constructor(s: string) {
        const [vendor, id, version] = s.split(":");
        this.id = id || "";
        this.vendor = vendor || "";
        this.version = version || "";
    }

    toString() {
        return `${this.vendor}:${this.id}:${this.version}`;
    }
}

export interface MpmPackageDependency {
    type: "require" | "conflict";
    spec: string;
}

export interface MpmFile {
    url: string;
    sha1?: string;
    size?: number;
    fileName: string;
}

export interface MpmPackage {
    id: string;
    vendor: string;
    version: string;
    spec: string;
    files: MpmFile[];
    dependencies: MpmPackageDependency[];
}

export interface MpmContext {
    gameVersion: string;
    loader: string;
}

export interface MpmPackageProvider {
    /**
     * The vendor name of this provider.
     */
    vendorName: string;

    /**
     * Resolves the given package specifiers and return concrete packages.
     */
    resolve(specs: string[], ctx: MpmContext): Promise<MpmPackage[][]>;
}

function getProvider(vendor: string): MpmPackageProvider {
    switch (vendor) {
        case "modrinth":
            return new ModrinthProvider();
        default:
            throw `No resolver supports vendor ${vendor}`;
    }
}

async function resolvePackages(specs: string[], ctx: MpmContext): Promise<MpmPackage[][]> {
    if (specs.length === 0) return [];

    const provider = getProvider(new MpmPackageSpecifier(specs[0]).vendor);
    return provider.resolve(specs, ctx);
}

function matchPackageSpecifier(spec: string, spec1: string) {
    const sp = new MpmPackageSpecifier(spec);
    const sp1 = new MpmPackageSpecifier(spec1);

    if (sp.vendor === sp1.vendor) {
        if (sp.id && sp.version) {
            return sp1.id === sp.id && sp1.version === sp.version;
        }

        if (sp.id) {
            return sp1.id === sp.id;
        }

        if (sp.version) {
            return sp1.version === sp.version;
        }
    }

    return false;
}

function isDependencySatisfied(pkg: MpmPackage, pkgs: string[]): boolean {
    for (const dep of pkg.dependencies) {
        if (dep.type === "require") {
            if (!pkgs.some(p => matchPackageSpecifier(dep.spec, p))) {
                return false; // Required dependency not found
            }
        } else if (dep.type === "conflict") {
            if (pkgs.some(p => matchPackageSpecifier(dep.spec, p))) {
                return false; // Conflicting dependency found
            }
        }
    }

    return true;
}

/**
 * Resolves the given package specifiers and tries to provide a set of packages matching the requirements.
 */
async function resolve(specs: string[], ctx: MpmContext): Promise<MpmPackage[] | null> {
    const resolved = new Map<string, MpmPackage[]>();

    let deps = new Set(specs);

    // Resolve all possible deps
    console.debug("Collecting MPM package details...");
    while (deps.size > 0) {
        const needResolveDeps = deps.values().filter(s => !resolved.has(s)).toArray();
        const packages = await resolvePackages(needResolveDeps, ctx);

        for (const [i, ps] of packages.entries()) {
            resolved.set(needResolveDeps[i], ps);
        }

        const nd = packages
            .flatMap(ps => ps)
            .flatMap(p => p.dependencies)
            .filter(d => d.type === "require")
            .map(d => d.spec)
            .filter(s => !resolved.has(s));

        deps = new Set(nd);
    }

    // Dependency resolution
    console.debug("Resolving dependencies...");

    // @ts-expect-error No type definitions
    const { default: Logic } = await import("logic-solver");
    const solver = new Logic.Solver();

    const allPackages = resolved.values().flatMap(pkgs => pkgs).toArray();
    const allPackagesMap = new Map<string, MpmPackage>();

    for (const pkg of allPackages) {
        allPackagesMap.set(pkg.spec, pkg);
    }

    for (const sp of specs) {
        const pkgs = resolved.get(sp)!;
        solver.require(Logic.exactlyOne(...pkgs.map(p => p.spec)));
    }

    for (const pkg of allPackages) {
        for (const dep of pkg.dependencies) {
            if (dep.type === "require") {
                const candidates = resolved.get(dep.spec)!;
                solver.require(
                    Logic.implies(
                        `${pkg.vendor}:${pkg.id}:${pkg.version}`,
                        Logic.exactlyOne(...candidates.map(p => p.spec))
                    )
                );
            } else if (dep.type === "conflict") {
                const sd = new MpmPackageSpecifier(dep.spec);
                const candidates = allPackages.filter(p => {
                    if (p.vendor === sd.vendor) {
                        if (sd.id && sd.version) {
                            return p.id === sd.id && p.version === sd.version;
                        }

                        if (sd.id) {
                            return p.id === sd.id;
                        }

                        if (sd.version) {
                            return p.version === sd.version;
                        }
                    }

                    return false;
                });

                for (const c of candidates) {
                    solver.require(Logic.implies(pkg.spec, Logic.not(c.spec)));
                }
            }
        }
    }

    const sln = solver.solve();

    if (!sln) return null;

    const upgradableSpecs = resolved.keys().filter(s => s.endsWith(":")); // Filter out specs with no versions defined
    let lastSln = sln;

    for (const spec of upgradableSpecs) {
        const pkgs = resolved.get(spec)!;
        for (const p of pkgs) {
            if (lastSln.getTrueVars().includes(p.spec)) {
                break; // Already the latest version
            }

            // Try to upgrade the version
            const ns = solver.solveAssuming(p.spec);
            if (ns) {
                solver.require(p.spec); // Make the upgrade permanent
                lastSln = ns;
                break;
            }
        }
    }

    const finalPkgs = lastSln.getTrueVars() as string[];

    return finalPkgs.map(p => allPackagesMap.get(p)!);
}

async function flashPackages(original: MpmPackage[], current: MpmPackage[], container: Container): Promise<void> {
    const originalSet = new Set<string>(original.map(p => p.spec));
    const currentSet = new Set<string>(current.map(p => p.spec));

    const toRemove = original.filter(p => !currentSet.has(p.spec));
    const toAppend = current.filter(p => !originalSet.has(p.spec));

    console.debug(`Need to remove ${toRemove.length} packages and add ${toAppend.length} packages.`);

    const toRemoveFiles = toRemove.flatMap(p => p.files).map(f => container.mod(f.fileName));

    // TODO validate before removing & other addon types
    await Promise.all(toRemoveFiles.map(f => fs.remove(f)));

    const toAppendFiles: DlxDownloadRequest[] = toAppend.flatMap(p => p.files).map(f => ({
        url: f.url,
        path: container.mod(f.fileName),// TODO support other addon types
        size: f.size,
        sha1: f.sha1
    }));

    await dlx.getAll(toAppendFiles); // TODO progress and signal
}

async function fullResolve(gameId: string): Promise<void> {
    console.debug(`Installing mods for ${gameId}...`);
    const game = games.get(gameId);

    const manifest = await mpmLock.loadManifest(gameId);

    console.debug("Resolving packages...");
    const prevPkgs = manifest.resolved.concat();
    const newPkgs = await resolve(
        manifest.userPrompt,
        {
            gameVersion: game.versions.game,
            loader: game.installProps.type
        }
    );

    if (!newPkgs) {
        throw "The specified mods cannot be satisfied";
    }

    const container = containers.get(game.launchHint.containerId);

    console.debug("Flashing packages...");
    await flashPackages(prevPkgs, newPkgs, container);

    manifest.resolved = newPkgs;
    await mpmLock.saveManifest(gameId, manifest);
}

async function addPackages(gameId: string, specs: string[]): Promise<void> {
    const game = games.get(gameId);
    const ctx = {
        gameVersion: game.versions.game,
        loader: game.installProps.type
    };

    const manifest = await mpmLock.loadManifest(gameId);

    const pkgs = await resolve(specs, ctx);

    const existingPackagesMap = new Map(manifest.resolved.map(p => [p.vendor + ":" + p.id, p]));

    if (pkgs) {
        // First, for all the new packages, replace each one with installed version (regardless of compatibility)
        for (const [i, p] of pkgs.entries()) {
            const pu = p.vendor + ":" + p.id;
            if (existingPackagesMap.has(pu)) {
                pkgs[i] = existingPackagesMap.get(pu)!;
            }
        }

        // Check dependency compatibility of existing packages
        const allPkgs = uniqueBy([...manifest.resolved, ...pkgs], p => p.spec);
        const allPkgNames = allPkgs.map(p => p.spec);

        if (allPkgs.every(p => isDependencySatisfied(p, allPkgNames))) {
            console.debug("Incremental resolution successful.");
            await flashPackages(manifest.resolved, allPkgs, containers.get(game.launchHint.containerId));

            manifest.userPrompt.push(...specs);
            manifest.resolved = allPkgs;
            await mpmLock.saveManifest(gameId, manifest);
            return;
        }
    }

    // Fallback to full installation
    manifest.userPrompt.push(...specs);
    await mpmLock.saveManifest(gameId, manifest);
    await fullResolve(gameId);
}

function findActualPackage(spec: string, pkgs: MpmPackage[]) {
    return pkgs.find(p => matchPackageSpecifier(spec, p.spec));
}

async function removePackages(gameId: string, specs: string[]): Promise<void> {
    const game = games.get(gameId);

    const manifest = await mpmLock.loadManifest(gameId);

    const newSpecs = manifest.userPrompt.filter(sp => !specs.includes(sp));

    // Collect dependencies
    const checkedSpecs = new Set<string>();
    let toCheckSpecs = new Set(newSpecs);
    const neededPackages = new Set<string>();

    while (toCheckSpecs.size > 0) {
        const nt = new Set<string>();
        for (const spec of toCheckSpecs) {
            if (!checkedSpecs.has(spec)) {
                checkedSpecs.add(spec);

                const pkg = findActualPackage(spec, manifest.resolved);
                if (pkg) {
                    neededPackages.add(pkg.spec);
                    for (const dep of pkg.dependencies) {
                        if (dep.type === "require") {
                            nt.add(dep.spec);
                        }
                    }
                }
            }
        }

        toCheckSpecs = nt;
    }

    const newPkgs = manifest.resolved.filter(p => neededPackages.has(p.spec));
    console.log(`Original pkgs size: ${manifest.resolved.length}`);
    console.log("New pkgs size: " + newPkgs.length);

    await flashPackages(manifest.resolved, newPkgs, containers.get(game.launchHint.containerId));

    manifest.userPrompt = newSpecs;
    manifest.resolved = newPkgs;
    await mpmLock.saveManifest(gameId, manifest);
}

export const mpm = {
    fullResolve,
    addPackages,
    removePackages
};
