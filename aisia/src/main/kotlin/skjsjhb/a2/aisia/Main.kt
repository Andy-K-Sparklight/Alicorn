@file:JvmName("Main")

package skjsjhb.a2.aisia

import skjsjhb.a2.Main
import skjsjhb.a2.aisia.impl.io.IOUtilsImpl
import skjsjhb.a2.aisia.impl.sys.AisiaRuntime
import skjsjhb.a2.aisia.impl.sys.ImplRegistry
import skjsjhb.a2.aisia.impl.sys.SystemInfoImpl
import skjsjhb.a2.jsi.json.JsonImpl
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

    AlicornRuntime.assign(AisiaRuntime())
    Main().main()
}

