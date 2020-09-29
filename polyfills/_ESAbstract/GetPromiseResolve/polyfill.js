/* global Get, IsCallable */
function GetPromiseResolve(promiseConstructor) {
    // 1. Assert: IsConstructor(promiseConstructor) is true.
    // Assert(IsConstructor(promiseConstructor) === true);
    // 2. Let promiseResolve be ? Get(promiseConstructor, "resolve").
    var promiseResolve = Get(promiseConstructor, 'resolve');
    // 3. If IsCallable(promiseResolve) is false, throw a TypeError exception.
    if (IsCallable(promiseResolve) === false) {
        throw TypeError(promiseResolve + " is not a function");
    }
    // 4. Return promiseResolve.
    return promiseResolve;
}
