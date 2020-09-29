/* global Assert IsCallable Call */
// eslint-disable-next-line no-unused-vars
function HostCallJobCallback(jobCallback, V, argumentsList) {
    // 1. Assert: IsCallable(jobCallback.[[Callback]]) is true.
    // Assert(IsCallable(jobCallback.Callback) === true);
    // 1. Return ? Call(jobCallback.[[Callback]], V, argumentsList).
    return Call(jobCallback.Callback, V, argumentsList);
}
