package skjsjhb.a2.spec.json

import skjsjhb.a2.spec.sys.AlicornRuntime

interface Json {
    companion object {
        fun get(): Json = AlicornRuntime.getImplProc<Json>()
    }

    fun parse(src: String): JsonValue

    fun stringify(obj: JsonValue): String

    fun newObject(): JsonObject

    fun newArray(): JsonArray

    fun newPrimitive(value: Number): JsonPrimitive

    fun newPrimitive(value: Boolean): JsonPrimitive

    fun newPrimitive(value: String): JsonPrimitive

    fun nullValue(): JsonPrimitive
}