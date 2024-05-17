package skjsjhb.a2.spec.json

interface JsonPrimitive : JsonValue {
    /**
     * Checks if the JSON value is a boolean.
     */
    fun isBoolean(): Boolean

    /**
     * Gets the value as if it's a boolean.
     */
    fun asBoolean(): Boolean

    /**
     * Checks if the JSON value is a string.
     */
    fun isString(): Boolean

    /**
     * Gets the value as if it's a string.
     */
    fun asString(): String

    /**
     * Checks if the JSON value is a number.
     */
    fun isNumber(): Boolean

    /**
     * Gets the value as if it's a number.
     */
    fun asNumber(): Number

    /**
     * Sets the value.
     */
    fun set(v: Boolean)

    /**
     * Sets the value.
     */
    fun set(v: String)

    /**
     * Sets the value.
     */
    fun set(v: Number)

    /**
     * Sets the value to null.
     */
    fun setNull()

    /**
     * Sets the value to undefined.
     */
    fun setUndefined()
}