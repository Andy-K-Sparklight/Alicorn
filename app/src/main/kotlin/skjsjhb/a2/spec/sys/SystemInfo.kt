package skjsjhb.a2.spec.sys

interface SystemInfo {
    companion object {
        /**
         * Gets an instance using [AlicornRuntime.getImplProc].
         */
        fun get(): SystemInfo = AlicornRuntime.getImplProc<SystemInfo>()
    }

    /**
     * Gets the canonical name of the current OS.
     *
     * The return value is standardized to be one of `windows`, `osx` and `linux`.
     */
    fun name(): String

    /**
     * Gets the version of the current OS.
     */
    fun version(): String

    /**
     * Gets the architecture of the current OS.
     */
    fun arch(): String

    /**
     * Checks if the current OS uses ARM architecture.
     */
    fun isArm(): Boolean
}