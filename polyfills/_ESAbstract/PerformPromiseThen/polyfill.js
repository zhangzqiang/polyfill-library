/* global IsCallable HostMakeJobCallback PromiseReactionRecord NewPromiseReactionJob HostEnqueuePromiseJob */
// @ts-nocheck

// 25.6.5.4.1 #sec-performpromisethen
// eslint-disable-next-line no-unused-vars
function PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability) {
	// 1. Assert: IsPromise(promise) is true.
	// Assert(IsPromise(promise) === true);
	// 2. If resultCapability is not present, then
	if (resultCapability === undefined) {
		// a. Set resultCapability to undefined.
		resultCapability = undefined;
	}
	var onFulfilledJobCallback;
	// 3. If IsCallable(onFulfilled) is false, then
	if (IsCallable(onFulfilled) === false) {
		// a. Let onFulfilledJobCallback be empty.
		onFulfilledJobCallback = HostMakeJobCallback(function (x) {
			return x;
		});
	} else {
		// 4. Else,
		// a. Let onFulfilledJobCallback be HostMakeJobCallback(onFulfilled).
		onFulfilledJobCallback = HostMakeJobCallback(onFulfilled);
	}
	var onRejectedJobCallback;
	// 5. If IsCallable(onRejected) is false, then
	if (IsCallable(onRejected) === false) {
		// a. Let onRejectedJobCallback be empty.
		onRejectedJobCallback = HostMakeJobCallback(function (e) {
			throw e;
		});
	} else {
		// 6. Else,
		onRejectedJobCallback = HostMakeJobCallback(onRejected);
	}
	// 7. Let fulfillReaction be the PromiseReaction { [[Capability]]: resultCapability, [[Type]]: Fulfill, [[Handler]]: onFulfilled }.
	var fulfillReaction = new PromiseReactionRecord({
		Capability: resultCapability,
		Type: 'Fulfill',
		Handler: onFulfilledJobCallback
	});
	// 8. Let rejectReaction be the PromiseReaction { [[Capability]]: resultCapability, [[Type]]: Reject, [[Handler]]: onRejected }.
	var rejectReaction = new PromiseReactionRecord({
		Capability: resultCapability,
		Type: 'Reject',
		Handler: onRejectedJobCallback
	});
	// 9. If promise.[[PromiseState]] is pending, then
	if (promise.PromiseState === 'pending') {
		// a. Append fulfillReaction as the last element of the List that is promise.[[PromiseFulfillReactions]].
		promise.PromiseFulfillReactions.push(fulfillReaction);
		// b. Append rejectReaction as the last element of the List that is promise.[[PromiseRejectReactions]].
		promise.PromiseRejectReactions.push(rejectReaction);
	} else if (promise.PromiseState === 'fulfilled') {
		// a. Let value be promise.[[PromiseResult]].
		var value = promise.PromiseResult;
		// b. Let fulfillJob be NewPromiseReactionJob(fulfillReaction, value).
		var fulfillJob = NewPromiseReactionJob(fulfillReaction, value);
		// c. Perform HostEnqueuePromiseJob(fulfillJob.[[Job]], fulfillJob.[[Realm]]).
		HostEnqueuePromiseJob(fulfillJob.Job, fulfillJob.Realm);
	} else {
		// a. Assert: The value of promise.[[PromiseState]] is rejected.
		// Assert(promise.PromiseState === 'rejected');
		// b. Let reason be promise.[[PromiseResult]].
		var reason = promise.PromiseResult;
		// c. If promise.[[PromiseIsHandled]] is false, perform HostPromiseRejectionTracker(promise, "handle").
		// if (promise.PromiseIsHandled === false) {
		// 	HostPromiseRejectionTracker(promise, 'handle');
		// }
		// d. Let rejectJob be NewPromiseReactionJob(rejectReaction, reason).
		var rejectJob = NewPromiseReactionJob(rejectReaction, reason);
		// e. Perform HostEnqueuePromiseJob(rejectJob.[[Job]], rejectJob.[[Realm]]).
		HostEnqueuePromiseJob(rejectJob.Job, rejectJob.Realm);
	}
	// 12. Set promise.[[PromiseIsHandled]] to true.
	promise.PromiseIsHandled = true;
	// 13. If resultCapability is undefined, then
	if (resultCapability === undefined) {
		// a. Return undefined.
		return undefined;
	} else {
		// 14. Else,
		// a. Return resultCapability.[[Promise]].
		return resultCapability.Promise;
	}
}
