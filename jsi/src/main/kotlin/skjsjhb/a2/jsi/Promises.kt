package skjsjhb.a2.jsi

import org.teavm.interop.Async
import org.teavm.interop.AsyncCallback
import org.teavm.jso.JSBody
import org.teavm.jso.core.JSArray
import org.teavm.jso.core.JSPromise
import org.teavm.jso.function.JSConsumer

/**
 * Waits for the promise to get resolved or rejected synchronously. If the promise is resolved, it forwards the value
 * as the return value. If it's rejected, an exception wrapping the error is thrown.
 */
@Suppress("UNCHECKED_CAST")
fun <T> JSPromise<T>.await(): T = nAwait(this as JSPromise<Any?>) as T

/**
 * Similar to [await], but returns null value rather than throw an exception when the promise is rejected.
 *
 * Note that this method does not distinguish between a returned null value and an error.
 */
@Suppress("UNCHECKED_CAST")
fun <T> JSPromise<T>.awaitOrNull(): T? = nAwaitOrNull(this as JSPromise<Any?>) as T?

/**
 * Similar to [await], but returns an alternative value rather than throw an exception when the promise is rejected.
 */
@Suppress("UNCHECKED_CAST")
fun <T> JSPromise<T>.awaitOrElse(alt: T): T = nAwaitOrElse(this as JSPromise<Any?>, alt) as T

/**
 * Similar to [await], but executes a generator to provide the default value, rather than throw an exception when the
 * promise is rejected.
 *
 * The getter will not be executed if the promise is resolved.
 */
@Suppress("UNCHECKED_CAST")
fun <T> JSPromise<T>.awaitOrElseGet(gen: () -> T): T = nAwaitOrElseGet(this as JSPromise<Any?>, gen) as T

@Async
private external fun nAwait(promise: JSPromise<Any?>): Any?

@Suppress("unused")
private fun nAwait(promise: JSPromise<Any?>, cb: AsyncCallback<Any?>) {
    nAwaitAsync(promise) { if (it.length == 1) cb.complete(it.get(0)) else cb.error(it.get(0).asException()) }
}

@Async
private external fun nAwaitOrNull(promise: JSPromise<Any?>): Any?

@Suppress("unused")
private fun nAwaitOrNull(promise: JSPromise<Any?>, cb: AsyncCallback<Any?>) {
    nAwaitAsync(promise) { if (it.length == 1) cb.complete(it.get(0)) else cb.complete(null) }
}

@Async
private external fun nAwaitOrElse(promise: JSPromise<Any?>, alt: Any?): Any?

@Suppress("unused")
private fun nAwaitOrElse(promise: JSPromise<Any?>, alt: Any?, cb: AsyncCallback<Any?>) {
    nAwaitAsync(promise) { if (it.length == 1) cb.complete(it.get(0)) else cb.complete(alt) }
}

@Async
private external fun nAwaitOrElseGet(promise: JSPromise<Any?>, gen: () -> Any?): Any?

@Suppress("unused")
private fun nAwaitOrElseGet(promise: JSPromise<Any?>, gen: () -> Any?, cb: AsyncCallback<Any?>) {
    nAwaitAsync(promise) { if (it.length == 1) cb.complete(it.get(0)) else cb.complete(gen()) }
}

// Returns an array describing the result.
// If length is 1, then the only element is the result.
// Otherwise, an error has happened and the first element is the error object.
@JSBody(params = ["p", "c"], script = "p.then((r)=>{c([r])}).catch((e)=>{c([e,0])})")
private external fun nAwaitAsync(promise: JSPromise<Any?>, cb: JSConsumer<JSArray<Any?>>)