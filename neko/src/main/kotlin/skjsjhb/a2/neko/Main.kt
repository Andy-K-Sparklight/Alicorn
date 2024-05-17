@file:JvmName("Main")

package skjsjhb.a2.neko

import skjsjhb.a2.Main
import skjsjhb.a2.jsi.json.JsonImpl
import skjsjhb.a2.neko.impl.io.IOUtilsImpl
import skjsjhb.a2.neko.impl.sys.ImplRegistry
import skjsjhb.a2.neko.impl.sys.NekoRuntime
import skjsjhb.a2.neko.impl.sys.SystemInfoImpl
import skjsjhb.a2.spec.io.IOUtils
import skjsjhb.a2.spec.json.Json
import skjsjhb.a2.spec.sys.AlicornRuntime
import skjsjhb.a2.spec.sys.SystemInfo

fun main() {
    with(ImplRegistry) {
        add<SystemInfo>(SystemInfoImpl())
        add<IOUtils>(IOUtilsImpl())
        add<Json>(JsonImpl())
    }

    AlicornRuntime.assign(NekoRuntime())
    Main().main()
}

