plugins {
    kotlin("jvm") version "1.9.24" apply false
    id("com.github.node-gradle.node") version "7.0.2"
}

allprojects {
    repositories {
        mavenCentral()
    }
    tasks.withType<Copy>().configureEach {
        duplicatesStrategy = DuplicatesStrategy.INCLUDE
    }
}

configure(listOf(project(":aisia"), project(":neko"), project(":ui"))) {
    apply(plugin = "com.github.node-gradle.node")
    node {
        download = true
        version = "22.1.0"
        pnpmVersion = "9.1.1"
        pnpmWorkDir.set(rootProject.file(".gradle/pnpm"))
        workDir.set(rootProject.file(".gradle/nodejs"))
    }
}