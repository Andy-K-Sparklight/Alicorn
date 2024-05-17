package skjsjhb.a2.spec.json

interface JsonObject : JsonValue {
    fun get(key: String): JsonValue

    fun put(key: String, value: JsonValue)

    fun put(key: String, value: String) = put(key, Json.get().newPrimitive(value))

    fun put(key: String, value: Number) = put(key, Json.get().newPrimitive(value))

    fun put(key: String, value: Boolean) = put(key, Json.get().newPrimitive(value))

    fun remove(key: String)

    fun keys(): List<String>
}