plugins {
    kotlin("jvm")
    application
}

application {
    mainClass = "skjsjhb.a2.yuki.Main"
}

dependencies {
    implementation(project(":app"))
}

tasks.register<Copy>("copyUiContentDebug") {
    from(rootProject.file("ui/build/esbuild/debug"))
    into("build/resources/main")
    dependsOn(":ui:bundleUiJsDebug")
}

tasks.register<Copy>("copyUiContentRelease") {
    from(rootProject.file("ui/build/esbuild/release"))
    into("build/resources/main")
    dependsOn(":ui:bundleUiJsRelease")
}

tasks.register("runYukiAppDebug") {
    dependsOn(":yuki:copyUiContentDebug", ":yuki:run")
    tasks.named("run").get().mustRunAfter(":yuki:copyUiContentDebug")
}

tasks.register("runYukiAppRelease") {
    dependsOn(":yuki:copyUiContentRelease", ":yuki:run")
    tasks.named("run").get().mustRunAfter(":yuki:copyUiContentRelease")
}
