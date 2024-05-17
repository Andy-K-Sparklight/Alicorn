import com.github.gradle.node.task.NodeTask

plugins {
    id("com.github.node-gradle.node")
}

tasks.register<NodeTask>("bundleUiJsDebug") {
    inputs.files(
        "esbuild.mjs",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
    )
    inputs.dir("src/main/js")
    script.set(file("esbuild.mjs"))
    args.set(listOf("debug"))
    outputs.file("build/esbuild/debug/ui.js")
    dependsOn(":ui:pnpmInstall")
}

tasks.register<NodeTask>("bundleUiJsDebugWatch") {
    inputs.files(
        "esbuild.mjs",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
    )
    inputs.dir("src/main/js")
    script.set(file("esbuild.mjs"))
    args.set(listOf("debug", "watch"))
    outputs.file("build/esbuild/debug/ui.js")
    dependsOn(":ui:pnpmInstall")
}

tasks.register<NodeTask>("bundleUiJsReleaseWatch") {
    inputs.files(
        "esbuild.mjs",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
    )
    inputs.dir("src/main/js")
    script.set(file("esbuild.mjs"))
    args.set(listOf("release", "watch"))
    outputs.file("build/esbuild/release/ui.js")
    dependsOn(":ui:pnpmInstall")
}

tasks.register<NodeTask>("bundleUiJsRelease") {
    inputs.files(
        "esbuild.mjs",
        "package.json",
        "pnpm-lock.yaml",
        "tsconfig.json",
    )
    inputs.dir("src/main/js")
    script.set(file("esbuild.mjs"))
    args.set(listOf("release"))
    outputs.file("build/esbuild/release/ui.js")
    dependsOn(":ui:pnpmInstall")
}
