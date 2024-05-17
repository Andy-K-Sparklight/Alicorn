package skjsjhb.a2.jsi

import org.teavm.jso.core.JSError

/**
 * Transform this possible-error object into a string representing it.
 */
fun Any?.toErrorString(): String =
    when (this) {
        is JSError -> "$name: $message"
        null -> "null"
        else -> toString()
    }

/**
 * Creates an exception from this object.
 */
fun Any?.asException(): Exception = RuntimeException(toErrorString())