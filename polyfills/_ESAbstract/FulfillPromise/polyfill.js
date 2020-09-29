/* global Assert TriggerPromiseReactions */
// @ts-nocheck

// 25.6.1.4 #sec-fulfillpromise
// eslint-disable-next-line no-unused-vars
function FulfillPromise(promise, value) {
    // Assert(promise.PromiseState === 'pending');
    var reactions = promise.PromiseFulfillReactions;
    promise.PromiseResult = value;
    promise.PromiseFulfillReactions = undefined;
    promise.PromiseRejectReactions = undefined;
    promise.PromiseState = 'fulfilled';
    return TriggerPromiseReactions(reactions, value);
}
