package skjsjhb.a2

import skjsjhb.a2.spec.io.IOUtils
import skjsjhb.a2.spec.json.Json
import skjsjhb.a2.spec.sys.AlicornRuntime
import skjsjhb.a2.spec.sys.SystemInfo

/**
 * The main Alicorn application class.
 */
class Main {
    /**
     * Starts Alicorn.
     *
     * This method is invoked by the implementation at the boot stage.
     */
    fun main() {
        println("Alicorn is running from runtime ${AlicornRuntime.vendor()}")

        AlicornRuntime.getImplProc<SystemInfo>().run {
            println("OS name: ${name()}")
            println("OS version: ${version()}")
            println("OS arch: ${arch()}")
        }

        AlicornRuntime.getImplProc<IOUtils>().run {
            println("App path: ${resourcesRoot()}")
            println("Data path: ${dataRoot()}")
        }

        val json = """
            {
                "str": "Nine",
                "num": 42,
                "bo": true,
                "nu": null,
                "o": {
                    "k": "value",
                    "arr": [0, 1, "2"]
                }
            }
        """.trimIndent()

        AlicornRuntime.getImplProc<Json>().run {
            val o = parse(json)
            o.asObject().get("o").asObject().put("k", Json.get().newObject().apply {
                put("a", 1)
                put("b", 2)
            })
            println(stringify(o))
        }

        AlicornRuntime.exit()
    }
}