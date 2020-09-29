/* global IsCallable IsConstructor PromiseCapabilityRecord Construct Type */
// @ts-nocheck

// 26.6.1.5 NewPromiseCapability ( C )
function NewPromiseCapability(C) { // eslint-disable-line no-unused-vars
	// 1. If IsConstructor(C) is false, throw a TypeError exception.
	if (IsConstructor(C) === false) {
		throw TypeError('Bad promise constructor');
	}
	// 2. NOTE: C is assumed to be a constructor function that supports the parameter conventions of the Promise constructor (see 26.6.3.1).
	// 3. Let promiseCapability be the PromiseCapability Record { [[Promise]]: undefined, [[Resolve]]: undefined, [[Reject]]: undefined }.
	var promiseCapability = new PromiseCapabilityRecord();
	// 4. Let steps be the algorithm steps defined in GetCapabilitiesExecutor Functions.
	// var steps = GetCapabilitiesExecutorFunctions;
	// 5. Let executor be ! CreateBuiltinFunction(steps, « [[Capability]] »).
	// 25.6.1.5.1 #sec-getcapabilitiesexecutor-functions
	var executor = function GetCapabilitiesExecutorFunctions(resolve, reject) {
		// 1. Let F be the active function object.
		// var F = this;
		// 2. Assert: F has a [[Capability]] internal slot whose value is a PromiseCapability Record.
		// 3. Let promiseCapability be F.[[Capability]].
		// var promiseCapability = F.Capability;
		// 4. If promiseCapability.[[Resolve]] is not undefined, throw a TypeError exception.
		if (Type(promiseCapability.Resolve) !== 'undefined') {
			return TypeError('ResolvePromiseCapabilityFunctionAlreadySet');
		}
		// 5. If promiseCapability.[[Reject]] is not undefined, throw a TypeError exception.
		if (Type(promiseCapability.Reject) !== 'undefined') {
			return TypeError('RejectPromiseCapabilityFunctionAlreadySet');
		}
		// 6. Set promiseCapability.[[Resolve]] to resolve.
		promiseCapability.Resolve = resolve;
		// 7. Set promiseCapability.[[Reject]] to reject.
		promiseCapability.Reject = reject;
		// 8. Return undefined.
		return undefined;
	}

	// 6. Set executor.[[Capability]] to promiseCapability.
	executor.Capability = promiseCapability;
	// 7. Let promise be ? Construct(C, « executor »).
	var promise = Construct(C, [executor]);
	// 8. If IsCallable(promiseCapability.[[Resolve]]) is false, throw a TypeError exception.
	if (IsCallable(promiseCapability.Resolve) === false) {
		return TypeError('PromiseResolveFunction ' + promiseCapability.Resolve);
	}
	// 9. If IsCallable(promiseCapability.[[Reject]]) is false, throw a TypeError exception.
	if (IsCallable(promiseCapability.Reject) === false) {
		return TypeError('PromiseRejectFunction ' + promiseCapability.Reject);
	}
	// 10. Set promiseCapability.[[Promise]] to promise.
	promiseCapability.Promise = promise;
	// 11. Return promiseCapability.
	return promiseCapability;
}
