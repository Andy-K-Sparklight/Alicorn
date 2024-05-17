package skjsjhb.a2.jsi.json

import org.teavm.jso.core.JSArray
import skjsjhb.a2.spec.json.JsonArray
import skjsjhb.a2.spec.json.JsonValue

/**
 * An implementation of [JsonArray] backed by JavaScript engine natively.
 */
class JsonArrayImpl(val array: JSArray<Any?>) : JsonArray, AbstractMutableList<JsonValue>() {
    private fun checkBounds(index: Int) {
        if (index < 0 || index >= size) throw IndexOutOfBoundsException("Index $index is not within this array")
    }

    override fun isNull(): Boolean = false

    override fun isUndefined(): Boolean = false

    override fun add(index: Int, element: JsonValue) {
        checkBounds(index)
        for (i in size downTo index + 1) {
            array.set(i, array[i - 1])
        }
        array.set(index, element.toJsValue())
    }

    override val size: Int
        get() = array.length

    override fun get(index: Int): JsonValue {
        checkBounds(index)
        return array[index].toJsonValue()
    }

    override fun removeAt(index: Int): JsonValue {
        checkBounds(index)
        val origin = array[index]
        for (i in index..size - 2) {
            array[i] = array[i + 1]
        }
        array.pop()
        return origin.toJsonValue()
    }

    override fun set(index: Int, element: JsonValue): JsonValue {
        checkBounds(index)
        return array[index].also { array[index] = element.toJsValue() }.toJsonValue()
    }

    override fun equals(other: Any?): Boolean = other is JsonArrayImpl && array == other.array

    override fun hashCode(): Int = array.hashCode()
}