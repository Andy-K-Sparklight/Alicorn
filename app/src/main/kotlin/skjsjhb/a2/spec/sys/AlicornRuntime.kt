package skjsjhb.a2.spec.sys

import kotlin.reflect.KClass

/**
 * Contains information and operations related to the current Alicorn runtime.
 */
abstract class AlicornRuntime {
    companion object {
        private lateinit var runtime: AlicornRuntime

        /**
         * Gets the runtime instance.
         */
        fun get(): AlicornRuntime = runtime

        /**
         * Assigns an implementation to this interface.
         *
         * This method should be called by the implementation once before starting up Alicorn.
         */
        fun assign(r: AlicornRuntime) {
            runtime = r
        }

        inline fun <reified T : Any> getImplProc(): T = get().getImplProc(T::class)

        fun vendor(): String = get().vendor()

        fun exit() {} // = get().exit()
    }

    /**
     * Requests the runtime to provide an implementation of the given interface or abstract class.
     *
     * @param what The interface to request.
     */
    abstract fun <T : Any> getImplProc(what: KClass<out T>): T

    /**
     * Gets the name of the implementation.
     */
    abstract fun vendor(): String

    /**
     * Signals that the app should now be closed.
     *
     * Implementation is expected to save changes and properly stop the application.
     */
    abstract fun exit()
}