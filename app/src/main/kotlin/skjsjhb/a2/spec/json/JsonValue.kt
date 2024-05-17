package skjsjhb.a2.spec.json

/**
 * The root interface of the JSON parsing system.
 */
interface JsonValue {
    /**
     * Checks if the JSON value is `null`.
     */
    fun isNull(): Boolean

    /**
     * Checks if the JSON value is `undefined`.
     */
    fun isUndefined(): Boolean

    /**
     * Casts this value to primitive value.
     */
    fun asPrimitive() = this as JsonPrimitive

    /**
     * Casts this value to object.
     */
    fun asObject() = this as JsonObject

    /**
     * Casts this value to array.
     */
    fun asArray() = this as JsonArray
}