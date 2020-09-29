/* global SameValue RejectPromise Type FulfillPromise Get IsCallable HostMakeJobCallback NewPromiseResolveThenableJob HostEnqueuePromiseJob */
// @ts-nocheck

// eslint-disable-next-line no-unused-vars
function CreateResolvingFunctions(promise) {
	var alreadyResolved = false;
	// 25.6.1.3.2 #sec-promise-resolve-functions
	var resolve = function PromiseResolveFunctions(resolution) {
		// 1. Let F be the active function object.
		// var F = this;
		// 2. Assert: F has a [[Promise]] internal slot whose value is an Object.
		// Assert('Promise' in F && Type(F.Promise) === 'object');
		// 3. Let promise be F.[[Promise]].
		// var promise = promise;
		// 4. Let alreadyResolved be F.[[AlreadyResolved]].
		// var alreadyResolved = F.AlreadyResolved;
		// 5. If alreadyResolved.[[Value]] is true, return undefined.
		if (alreadyResolved === true) {
			return undefined;
		}
		// 6. Set alreadyResolved.[[Value]] to true.
		alreadyResolved = true;
		// 7. If SameValue(resolution, promise) is true, then
		if (SameValue(resolution, promise) === true) {
			// a. Let selfResolutionError be a newly created TypeError object.
			var selfResolutionError = TypeError('CannotResolvePromiseWithItself');
			// b. Return RejectPromise(promise, selfResolutionError).
			return RejectPromise(promise, selfResolutionError);
		}
		// 8. If Type(resolution) is not Object, then
		if (Type(resolution) !== 'object') {
			// a. Return FulfillPromise(promise, resolution).
			return FulfillPromise(promise, resolution);
		}
		// 9. Let then be Get(resolution, "then").
		try {
			var then = Get(resolution, 'then');
		} catch (error) {
			// 10. If then is an abrupt completion, then
			// a. Return RejectPromise(promise, then.[[Value]]).
			return RejectPromise(promise, then);
		}
		// 11. Let thenAction be then.[[Value]].
		var thenAction = then;
		// 12. If IsCallable(thenAction) is false, then
		if (IsCallable(thenAction) === false) {
			// a. Return FulfillPromise(promise, resolution).
			return FulfillPromise(promise, resolution);
		}
		// 13. Let thenJobCallback be HostMakeJobCallback(thenAction).
		var thenJobCallback = HostMakeJobCallback(thenAction);
		// 14. Let job be NewPromiseResolveThenableJob(promise, resolution, thenJobCallback).
		var job = NewPromiseResolveThenableJob(promise, resolution, thenJobCallback);
		// 15. Perform HostEnqueuePromiseJob(job.[[Job]], job.[[Realm]]).
		HostEnqueuePromiseJob(job.Job, job.Realm);
		// 16. Return undefined.
		return undefined;
	};
	resolve.Promise = promise;
	resolve.AlreadyResolved = alreadyResolved;
	// 25.6.1.3.1 #sec-promise-reject-functions
	var reject = function PromiseRejectFunctions(reason) {
		// Assert('Promise' in F && Type(F.Promise) === 'object');
		// var promise = F.Promise;
		// var alreadyResolved = F.AlreadyResolved;
		if (alreadyResolved === true) {
			return undefined;
		}
		alreadyResolved = true;
		return RejectPromise(promise, reason);
	}
	reject.Promise = promise;
	reject.AlreadyResolved = alreadyResolved;
	return {
		Resolve: resolve,
		Reject: reject
	};
}
