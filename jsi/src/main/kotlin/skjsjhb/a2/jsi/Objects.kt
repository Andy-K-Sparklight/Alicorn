package skjsjhb.a2.jsi

import org.teavm.jso.JSBody
import org.teavm.jso.JSByRef
import org.teavm.jso.JSObject
import org.teavm.jso.core.JSArray
import org.teavm.jso.core.JSString

/**
 * Retrieve the value of the given key from the object.
 */
fun JSObject.get(key: String): Any? = nObjectGet(this, JSString.valueOf(key))

/**
 * Sets the value of the given key from the object.
 */
fun JSObject.set(key: String, value: Any?) = nObjectSet(this, key, value)

/**
 * Converts the array into a Java array.
 *
 * The new array is backed by the original array, i.e. changes in one reflect in the other.
 */
fun JSArray<Byte>.asArray(): ByteArray = nArrayConv(this)

/**
 * Removes the given key from the object.
 */
fun JSObject.remove(key: String) = nObjectRemove(this, key)

/**
 * Creates a list containing all values in the array.
 */
fun <T> JSArray<T>.toList(): List<T> =
    ArrayList<T>(length).also {
        for (i in 0..<length) {
            it[i] = get(i)
        }
    }

@JSBody(params = ["o", "k"], script = "delete o[k];")
private external fun nObjectRemove(obj: Any, key: Any?)

@JSBody(params = ["o", "k"], script = "return o[k];")
private external fun nObjectGet(obj: Any, key: Any?): Any?

@JSBody(params = ["o", "k", "v"], script = "o[k] = v;")
private external fun nObjectSet(obj: Any, key: Any?, value: Any?)

@JSByRef
@JSBody(params = ["a"], script = "return a;")
private external fun nArrayConv(a: JSArray<Byte>): ByteArray