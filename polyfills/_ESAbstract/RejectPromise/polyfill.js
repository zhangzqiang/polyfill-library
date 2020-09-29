/* global TriggerPromiseReactions */
// @ts-nocheck

// 25.6.1.7 #sec-rejectpromise
// eslint-disable-next-line no-unused-vars
function RejectPromise(promise, reason) {
    // Assert(promise.PromiseState === 'pending');
    var reactions = promise.PromiseRejectReactions;
    promise.PromiseResult = reason;
    promise.PromiseFulfillReactions = undefined;
    promise.PromiseRejectReactions = undefined;
    promise.PromiseState = 'rejected';
    // if (promise.PromiseIsHandled === false) {
    //     HostPromiseRejectionTracker(promise, 'reject');
    // }
    return TriggerPromiseReactions(reactions, reason);
}
