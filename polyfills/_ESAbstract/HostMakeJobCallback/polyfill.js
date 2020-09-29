/* global Assert, IsCallable */
// eslint-disable-next-line no-unused-vars
function HostMakeJobCallback(callback) {
    // 1. Assert: IsCallable(callback) is true.
    // Assert(IsCallable(callback) === true);
    // 2. Return the JobCallback Record { [[Callback]]: callback, [[HostDefined]]: empty }.
    return { Callback: callback, HostDefined: undefined };
}
