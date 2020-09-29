/* global Assert, Type, Get, Call, NewPromiseCapability, IsPromise, SameValue */
// @ts-nocheck
// eslint-disable-next-line no-unused-vars
function PromiseResolve(C, x) {
    // Assert(Type(C) === 'object');
    if (IsPromise(x) === true) {
        var xConstructor = Get(x, 'constructor');
        if (SameValue(xConstructor, C) === true) {
            return x;
        }
    }
    var promiseCapability = NewPromiseCapability(C);
    Call(promiseCapability.Resolve, undefined, [x]);
    return promiseCapability.Promise;
}
