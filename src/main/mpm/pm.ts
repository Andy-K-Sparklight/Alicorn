import { containers } from "@/main/container/manage";
import type { Container } from "@/main/container/spec";
import { games } from "@/main/game/manage";
import { ModrinthProvider } from "@/main/mpm/modrinth";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { alter, uniqueBy } from "@/main/util/misc";
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

function getPackageSpecifier(pkg: MpmPackage): string {
    return `${pkg.vendor}:${pkg.id}:${pkg.version}`;
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
        allPackagesMap.set(getPackageSpecifier(pkg), pkg);
    }

    for (const sp of specs) {
        const pkgs = resolved.get(sp)!;
        solver.require(Logic.exactlyOne(...pkgs.map(getPackageSpecifier)));
    }

    for (const pkg of allPackages) {
        for (const dep of pkg.dependencies) {
            if (dep.type === "require") {
                const candidates = resolved.get(dep.spec)!;
                solver.require(
                    Logic.implies(
                        `${pkg.vendor}:${pkg.id}:${pkg.version}`,
                        Logic.exactlyOne(...candidates.map(getPackageSpecifier))
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
                    solver.require(
                        Logic.implies(
                            getPackageSpecifier(pkg),
                            Logic.not(getPackageSpecifier(c))
                        )
                    );
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
            const pn = getPackageSpecifier(p);
            if (lastSln.getTrueVars().includes(pn)) {
                break; // Already the latest version
            }

            // Try to upgrade the version
            const ns = solver.solveAssuming(pn);
            if (ns) {
                solver.require(pn); // Make the upgrade permanent
                lastSln = ns;
                break;
            }
        }
    }

    const finalPkgs = lastSln.getTrueVars() as string[];

    return finalPkgs.map(p => allPackagesMap.get(p)!);
}

async function flashPackages(original: MpmPackage[], current: MpmPackage[], container: Container): Promise<void> {
    const originalSet = new Set<string>(original.map(getPackageSpecifier));
    const currentSet = new Set<string>(current.map(getPackageSpecifier));

    const toRemove = original.filter(p => !currentSet.has(getPackageSpecifier(p)));
    const toAppend = current.filter(p => !originalSet.has(getPackageSpecifier(p)));

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

    const manifest = game.mpm;

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

    games.add(alter(game, g => g.mpm.resolved = newPkgs));
}

async function addPackages(gameId: string, specs: string[]): Promise<void> {
    const game = games.get(gameId);
    const ctx = {
        gameVersion: game.versions.game,
        loader: game.installProps.type
    };

    const pkgs = await resolve(specs, ctx);

    const existingPackagesMap = new Map(
        game.mpm.resolved.map(p => {
            return [p.vendor + ":" + p.id, p];
        })
    );


    if (pkgs) {
        // First, for all the new packages, replace each one with installed version (regardless of compatibility)
        for (const [i, p] of pkgs.entries()) {
            const pu = p.vendor + ":" + p.id;
            if (existingPackagesMap.has(pu)) {
                pkgs[i] = existingPackagesMap.get(pu)!;
            }
        }

        // Check dependency compatibility of existing packages
        const allPkgs = uniqueBy([...game.mpm.resolved, ...pkgs], getPackageSpecifier);
        const allPkgNames = allPkgs.map(getPackageSpecifier);

        if (allPkgs.every(p => isDependencySatisfied(p, allPkgNames))) {
            console.debug("Incremental resolution successful.");
            await flashPackages(game.mpm.resolved, allPkgs, containers.get(game.launchHint.containerId));

            games.add(alter(game, g => {
                g.mpm.userPrompt.push(...specs);
                g.mpm.resolved = allPkgs;
            }));
            return;
        }
    }

    // Fallback to full installation
    games.add(alter(game, g => g.mpm.userPrompt.push(...specs)));
    await fullResolve(gameId);
}

function findActualPackage(spec: string, pkgs: MpmPackage[]) {
    return pkgs.find(p => matchPackageSpecifier(spec, getPackageSpecifier(p)));
}

async function removePackages(gameId: string, specs: string[]): Promise<void> {
    const game = games.get(gameId);

    const newSpecs = game.mpm.userPrompt.filter(sp => !specs.includes(sp));

    // Collect dependencies
    const checkedSpecs = new Set<string>();
    let toCheckSpecs = new Set(newSpecs);
    const neededPackages = new Set<string>();

    while (toCheckSpecs.size > 0) {
        const nt = new Set<string>();
        for (const spec of toCheckSpecs) {
            if (!checkedSpecs.has(spec)) {
                checkedSpecs.add(spec);

                const pkg = findActualPackage(spec, game.mpm.resolved);
                if (pkg) {
                    neededPackages.add(getPackageSpecifier(pkg));
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

    const newPkgs = game.mpm.resolved.filter(p => neededPackages.has(getPackageSpecifier(p)));
    console.log(`Original pkgs size: ${game.mpm.resolved.length}`);
    console.log("New pkgs size: " + newPkgs.length);

    await flashPackages(game.mpm.resolved, newPkgs, containers.get(game.launchHint.containerId));

    games.add(alter(game, g => {
        g.mpm.userPrompt = newSpecs;
        g.mpm.resolved = newPkgs;
    }));
}

export const mpm = {
    fullResolve,
    addPackages,
    removePackages
};
