/// A set of scoped functions (like Kotlin).
pub trait TheScoped {
    /// Applies the given closure on a value, then return it.
    fn apply(mut self, what: impl FnOnce(&mut Self)) -> Self
    where Self: Sized {
        what(&mut self);
        self
    }

    /// Executes the given closure on a value, then return the result of that
    /// closure.
    fn then<R>(self, what: impl FnOnce(Self) -> R) -> R
    where Self: Sized {
        what(self)
    }
}

impl<T> TheScoped for T {}
