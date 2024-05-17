package skjsjhb.a2.yuki.impl.sys

import skjsjhb.a2.spec.sys.SystemInfo

class SystemInfoImpl : SystemInfo {
    override fun name(): String =
        System.getProperty("os.name").lowercase().let {
            if (it.contains("windows")) "windows"
            else if (it.contains("mac")) "osx"
            else "linux"
        }

    override fun version(): String = System.getProperty("os.version")

    override fun arch(): String = System.getProperty("os.arch")

    override fun isArm(): Boolean = listOf("arm", "aarch").any { arch().lowercase().contains(it) }
}