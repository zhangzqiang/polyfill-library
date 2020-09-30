/* global CreateMethodProperty Type IteratorClose NewPromiseCapability GetIterator IsCallable Call IteratorStep SpeciesConstructor IsPromise*/
/* 
	This is a modification of the es6-shim Promise polyfill to make it use the ECMAScript Abstract methods provided within polyfill-library.
*/
/*!
 * https://github.com/paulmillr/es6-shim
 * @license es6-shim Copyright 2013-2016 by Paul Miller (http://paulmillr.com)
 *   and contributors,  MIT License
 * es6-shim: v0.35.4
 * see https://github.com/paulmillr/es6-shim/blob/0.35.3/LICENSE
 * Details and documentation:
 * https://github.com/paulmillr/es6-shim/
 */
(function (global) {
	'use strict';

	var emulateES6construct = function (o, defaultNewTarget, defaultProto, slots) {
		// This is an es5 approximation to es6 construct semantics.  in es6,
		// 'new Foo' invokes Foo.[[Construct]] which (for almost all objects)
		// just sets the internal variable NewTarget (in es6 syntax `new.target`)
		// to Foo and then returns Foo().

		// Many ES6 object then have constructors of the form:
		// 1. If NewTarget is undefined, throw a TypeError exception
		// 2. Let xxx by OrdinaryCreateFromConstructor(NewTarget, yyy, zzz)

		// So we're going to emulate those first two steps.
		if (Type(o) !== 'object') {
			throw new TypeError('Constructor requires `new`: ' + defaultNewTarget.name);
		}
		var proto = defaultNewTarget.prototype;
		if (Type(proto) !== 'object') {
			proto = defaultProto;
		}
		var obj = Object.create(proto);
		for (var name in slots) {
			if (Object.prototype.hasOwnProperty.call(slots, name)) {
				var value = slots[name];
				Object.defineProperty(obj, name, {
					configurable: true,
					enumerable: false,
					writable: true,
					value: value
				});
			}
		}
		return obj;
	};

	// find an appropriate setImmediate-alike
	var makeZeroTimeout;
	if (typeof window !== 'undefined' && IsCallable(window.postMessage)) {
		makeZeroTimeout = function () {
			// from http://dbaron.org/log/20100309-faster-timeouts
			var timeouts = [];
			var messageName = 'zero-timeout-message';
			var setZeroTimeout = function (fn) {
				timeouts.push(fn);
				window.postMessage(messageName, '*');
			};
			var handleMessage = function (event) {
				if (event.source === window && event.data === messageName) {
					event.stopPropagation();
					if (timeouts.length === 0) {
						return;
					}
					var fn = timeouts.shift();
					fn();
				}
			};
			window.addEventListener('message', handleMessage, true);
			return setZeroTimeout;
		};
	}
	var makePromiseAsap = function () {
		// An efficient task-scheduler based on a pre-existing Promise
		// implementation, which we can use even if we override the
		// global Promise below (in order to workaround bugs)
		// https://github.com/Raynos/observ-hash/issues/2#issuecomment-35857671
		var P = global.Promise;
		var pr = P && P.resolve && P.resolve();
		return (
			pr &&
			function (task) {
				return pr.then(task);
			}
		);
	};
	var enqueue = IsCallable(global.setImmediate)
		? global.setImmediate
		: makePromiseAsap() ||
			(IsCallable(makeZeroTimeout)
				? makeZeroTimeout()
				: function (task) {
					setTimeout(task, 0);
				}); // fallback

	// Constants for Promise implementation
	var PROMISE_IDENTITY = function (x) {
		return x;
	};
	var PROMISE_THROWER = function (e) {
		throw e;
	};
	var PROMISE_PENDING = 0;
	var PROMISE_FULFILLED = 1;
	var PROMISE_REJECTED = 2;
	// We store fulfill/reject handlers and capabilities in a single array.
	var PROMISE_FULFILL_OFFSET = 0;
	var PROMISE_REJECT_OFFSET = 1;
	var PROMISE_CAPABILITY_OFFSET = 2;
	// This is used in an optimization for chaining promises via then.
	var PROMISE_FAKE_CAPABILITY = {};

	var enqueuePromiseReactionJob = function (handler, capability, argument) {
		enqueue(function () {
			promiseReactionJob(handler, capability, argument);
		});
	};

	var promiseReactionJob = function (handler, promiseCapability, argument) {
		'use strict';
		var handlerResult, f;
		if (promiseCapability === PROMISE_FAKE_CAPABILITY) {
			// Fast case, when we don't actually need to chain through to a
			// (real) promiseCapability.
			return handler(argument);
		}
		try {
			handlerResult = handler(argument);
			f = promiseCapability.Resolve;
		} catch (e) {
			handlerResult = e;
			f = promiseCapability.Reject;
		}
		f(handlerResult);
	};

	var fulfillPromise = function (promise, value) {
		var _promise = promise._promise;
		var length = _promise.reactionLength;
		if (length > 0) {
			enqueuePromiseReactionJob(
				_promise.fulfillReactionHandler0,
				_promise.reactionCapability0,
				value
			);
			_promise.fulfillReactionHandler0 = void 0;
			_promise.rejectReactions0 = void 0;
			_promise.reactionCapability0 = void 0;
			if (length > 1) {
				for (var i = 1, idx = 0; i < length; i++, idx += 3) {
					enqueuePromiseReactionJob(
						_promise[idx + PROMISE_FULFILL_OFFSET],
						_promise[idx + PROMISE_CAPABILITY_OFFSET],
						value
					);
					promise[idx + PROMISE_FULFILL_OFFSET] = void 0;
					promise[idx + PROMISE_REJECT_OFFSET] = void 0;
					promise[idx + PROMISE_CAPABILITY_OFFSET] = void 0;
				}
			}
		}
		_promise.result = value;
		_promise.state = PROMISE_FULFILLED;
		_promise.reactionLength = 0;
	};

	var rejectPromise = function (promise, reason) {
		var _promise = promise._promise;
		var length = _promise.reactionLength;
		if (length > 0) {
			enqueuePromiseReactionJob(
				_promise.rejectReactionHandler0,
				_promise.reactionCapability0,
				reason
			);
			_promise.fulfillReactionHandler0 = void 0;
			_promise.rejectReactions0 = void 0;
			_promise.reactionCapability0 = void 0;
			if (length > 1) {
				for (var i = 1, idx = 0; i < length; i++, idx += 3) {
					enqueuePromiseReactionJob(
						_promise[idx + PROMISE_REJECT_OFFSET],
						_promise[idx + PROMISE_CAPABILITY_OFFSET],
						reason
					);
					promise[idx + PROMISE_FULFILL_OFFSET] = void 0;
					promise[idx + PROMISE_REJECT_OFFSET] = void 0;
					promise[idx + PROMISE_CAPABILITY_OFFSET] = void 0;
				}
			}
		}
		_promise.result = reason;
		_promise.state = PROMISE_REJECTED;
		_promise.reactionLength = 0;
	};

	var createResolvingFunctions = function (promise) {
		var alreadyResolved = false;
		var resolve = function (resolution) {
			var then;
			if (alreadyResolved) {
				return;
			}
			alreadyResolved = true;
			if (resolution === promise) {
				return rejectPromise(promise, new TypeError('Self resolution'));
			}
			if (Type(resolution) !== 'object') {
				return fulfillPromise(promise, resolution);
			}
			try {
				then = resolution.then;
			} catch (e) {
				return rejectPromise(promise, e);
			}
			if (!IsCallable(then)) {
				return fulfillPromise(promise, resolution);
			}
			enqueue(function () {
				promiseResolveThenableJob(promise, resolution, then);
			});
		};
		var reject = function (reason) {
			if (alreadyResolved) {
				return;
			}
			alreadyResolved = true;
			return rejectPromise(promise, reason);
		};
		return { resolve: resolve, reject: reject };
	};

	var optimizedThen = function (then, thenable, resolve, reject) {
		// Optimization: since we discard the result, we can pass our
		// own then implementation a special hint to let it know it
		// doesn't have to create it.   (The PROMISE_FAKE_CAPABILITY
		// object is local to this implementation and unforgeable outside.)
		if (then === Promise$prototype$then) {
			Call(then, thenable, [resolve, reject, PROMISE_FAKE_CAPABILITY]);
		} else {
			Call(then, thenable, [resolve, reject]);
		}
	};
	var promiseResolveThenableJob = function (promise, thenable, then) {
		var resolvingFunctions = createResolvingFunctions(promise);
		var resolve = resolvingFunctions.resolve;
		var reject = resolvingFunctions.reject;
		try {
			optimizedThen(then, thenable, resolve, reject);
		} catch (e) {
			reject(e);
		}
	};

	var Promise$prototype, Promise$prototype$then;
	var Promise = (function () {
		var PromiseShim = function Promise(resolver) {
			if (!(this instanceof PromiseShim)) {
				throw new TypeError('Constructor Promise requires "new"');
			}
			if (this && this._promise) {
				throw new TypeError('Bad construction');
			}
			// see https://bugs.ecmascript.org/show_bug.cgi?id=2482
			if (!IsCallable(resolver)) {
				throw new TypeError('not a valid resolver');
			}
			var promise = emulateES6construct(
				this,
				PromiseShim,
				Promise$prototype,
				{
					_promise: {
						result: void 0,
						state: PROMISE_PENDING,
						// The first member of the "reactions" array is inlined here,
						// since most promises only have one reaction.
						// We've also exploded the 'reaction' object to inline the
						// "handler" and "capability" fields, since both fulfill and
						// reject reactions share the same capability.
						reactionLength: 0,
						fulfillReactionHandler0: void 0,
						rejectReactionHandler0: void 0,
						reactionCapability0: void 0
					}
				}
			);
			var resolvingFunctions = createResolvingFunctions(promise);
			var reject = resolvingFunctions.reject;
			try {
				resolver(resolvingFunctions.resolve, reject);
			} catch (e) {
				reject(e);
			}
			return promise;
		};
		return PromiseShim;
	})();
	Promise$prototype = Promise.prototype;

	var _promiseAllResolver = function (index, values, capability, remaining) {
		var alreadyCalled = false;
		return function (x) {
			if (alreadyCalled) {
				return;
			}
			alreadyCalled = true;
			values[index] = x;
			if (--remaining.count === 0) {
				var resolve = capability.Resolve;
				resolve(values); // call w/ this===undefined
			}
		};
	};

	var performPromiseAll = function (iteratorRecord, C, resultCapability) {
		var it = iteratorRecord.iterator;
		var values = [];
		var remaining = { count: 1 };
		var next, nextValue;
		var index = 0;
		// eslint-disable-next-line no-constant-condition
		while (true) {
			try {
				next = IteratorStep(it);
				if (next === false) {
					iteratorRecord.done = true;
					break;
				}
				nextValue = next.value;
			} catch (e) {
				iteratorRecord.done = true;
				throw e;
			}
			values[index] = void 0;
			var nextPromise = C.resolve(nextValue);
			var resolveElement = _promiseAllResolver(
				index,
				values,
				resultCapability,
				remaining
			);
			remaining.count += 1;
			optimizedThen(
				nextPromise.then,
				nextPromise,
				resolveElement,
				resultCapability.Reject
			);
			index += 1;
		}
		if (--remaining.count === 0) {
			var resolve = resultCapability.Resolve;
			resolve(values); // call w/ this===undefined
		}
		return resultCapability.Promise;
	};

	var performPromiseRace = function (iteratorRecord, C, resultCapability) {
		var it = iteratorRecord.iterator;
		var next, nextValue, nextPromise;
		// eslint-disable-next-line no-constant-condition
		while (true) {
			try {
				next = IteratorStep(it);
				if (next === false) {
					// NOTE: If iterable has no items, resulting promise will never
					// resolve; see:
					// https://github.com/domenic/promises-unwrapping/issues/75
					// https://bugs.ecmascript.org/show_bug.cgi?id=2515
					iteratorRecord.done = true;
					break;
				}
				nextValue = next.value;
			} catch (e) {
				iteratorRecord.done = true;
				throw e;
			}
			nextPromise = C.resolve(nextValue);
			optimizedThen(
				nextPromise.then,
				nextPromise,
				resultCapability.Resolve,
				resultCapability.Reject
			);
		}
		return resultCapability.Promise;
	};

	CreateMethodProperty(Promise, 'all', function all(iterable) {
			var C = this;
			if (Type(C) !== "object") {
				throw new TypeError('Promise is not object');
			}
			var capability = NewPromiseCapability(C);
			var iterator, iteratorRecord;
			try {
				iterator = GetIterator(iterable);
				iteratorRecord = { iterator: iterator, done: false };
				return performPromiseAll(iteratorRecord, C, capability);
			} catch (e) {
				var exception = e;
				if (iteratorRecord && !iteratorRecord.done) {
					try {
						IteratorClose(iterator, true);
					} catch (ee) {
						exception = ee;
					}
				}
				var reject = capability.Reject;
				reject(exception);
				return capability.Promise;
			}
		});

		CreateMethodProperty(Promise, 'race', function race(iterable) {
			var C = this;
			if (Type(C) !== 'object') {
				throw new TypeError('Promise is not object');
			}
			var capability = NewPromiseCapability(C);
			var iterator, iteratorRecord;
			try {
				iterator = GetIterator(iterable);
				iteratorRecord = { iterator: iterator, done: false };
				return performPromiseRace(iteratorRecord, C, capability);
			} catch (e) {
				var exception = e;
				if (iteratorRecord && !iteratorRecord.done) {
					try {
						IteratorClose(iterator, true);
					} catch (ee) {
						exception = ee;
					}
				}
				var reject = capability.Reject;
				reject(exception);
				return capability.Promise;
			}
		});

		CreateMethodProperty(Promise, 'reject', function reject(reason) {
			var C = this;
			if (Type(C) !== 'object') {
				throw new TypeError('Bad promise constructor');
			}
			var capability = NewPromiseCapability(C);
			var rejectFunc = capability.Reject;
			rejectFunc(reason); // call with this===undefined
			return capability.Promise;
		});

		CreateMethodProperty(Promise, 'resolve', function resolve(v) {
			// See https://esdiscuss.org/topic/fixing-promise-resolve for spec
			var C = this;
			if (Type(C) !== 'object') {
				throw new TypeError('Bad promise constructor');
			}
			if (IsPromise(v)) {
				var constructor = v.constructor;
				if (constructor === C) {
					return v;
				}
			}
			var capability = NewPromiseCapability(C);
			var resolveFunc = capability.Resolve;
			resolveFunc(v); // call with this===undefined
			return capability.Promise;
		});

		CreateMethodProperty(Promise$prototype, "catch", function (onRejected) {
			return this.then(null, onRejected);
		});

		CreateMethodProperty(Promise$prototype, 'then', function then(onFulfilled, onRejected) {
			var promise = this;
			if (!IsPromise(promise)) {
				throw new TypeError('not a promise');
			}
			var C = SpeciesConstructor(promise, Promise);
			var resultCapability;
			var returnValueIsIgnored =
				arguments.length > 2 &&
				arguments[2] === PROMISE_FAKE_CAPABILITY;
			if (returnValueIsIgnored && C === Promise) {
				resultCapability = PROMISE_FAKE_CAPABILITY;
			} else {
				resultCapability = NewPromiseCapability(C);
			}
			// PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability)
			// Note that we've split the 'reaction' object into its two
			// components, "capabilities" and "handler"
			// "capabilities" is always equal to `resultCapability`
			var fulfillReactionHandler = IsCallable(onFulfilled)
				? onFulfilled
				: PROMISE_IDENTITY;
			var rejectReactionHandler = IsCallable(onRejected)
				? onRejected
				: PROMISE_THROWER;
			var _promise = promise._promise;
			var value;
			if (_promise.state === PROMISE_PENDING) {
				if (_promise.reactionLength === 0) {
					_promise.fulfillReactionHandler0 = fulfillReactionHandler;
					_promise.rejectReactionHandler0 = rejectReactionHandler;
					_promise.reactionCapability0 = resultCapability;
				} else {
					var idx = 3 * (_promise.reactionLength - 1);
					_promise[
						idx + PROMISE_FULFILL_OFFSET
					] = fulfillReactionHandler;
					_promise[
						idx + PROMISE_REJECT_OFFSET
					] = rejectReactionHandler;
					_promise[
						idx + PROMISE_CAPABILITY_OFFSET
					] = resultCapability;
				}
				_promise.reactionLength += 1;
			} else if (_promise.state === PROMISE_FULFILLED) {
				value = _promise.result;
				enqueuePromiseReactionJob(
					fulfillReactionHandler,
					resultCapability,
					value
				);
			} else if (_promise.state === PROMISE_REJECTED) {
				value = _promise.result;
				enqueuePromiseReactionJob(
					rejectReactionHandler,
					resultCapability,
					value
				);
			} else {
				throw new TypeError('unexpected Promise state');
			}
			return resultCapability.Promise;
		});
	// This helps the optimizer by ensuring that methods which take
	// capabilities aren't polymorphic.
	PROMISE_FAKE_CAPABILITY = NewPromiseCapability(Promise);
	Promise$prototype$then = Promise$prototype.then;

	global.Promise = Promise;

})(self);
