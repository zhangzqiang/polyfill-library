/* global RejectPromise */
// @ts-nocheck

// 25.6.1.3.1 #sec-promise-reject-functions
// eslint-disable-next-line no-unused-vars
function PromiseRejectFunctions(reason) {
    var F = this;

    // Assert('Promise' in F && Type(F.Promise) === 'object');
    var promise = F.Promise;
    var alreadyResolved = F.AlreadyResolved;
    if (alreadyResolved === true) {
        return undefined;
    }
    alreadyResolved = true;
    return RejectPromise(promise, reason);
}
