// @ts-nocheck
/* eslint-env mocha browser */
/* globals proclaim Promise sinon */

// browser compatibility: old browsers don't have strict mode, so skip
// a few tests which rely on strict mode behavior for `this`.
var hasStrictMode = function () {
	return this === null;
}.call(null);

var hasNativeSetPrototypeOf = Object.setPrototypeOf && Object.setPrototypeOf.toString().indexOf('native code') !== -1;

describe('25.4.3 The Promise Constructor', function () {
	'use strict';
	it('is the initial value of the Promise property of the global object', function () {
		proclaim.strictEqual(Promise, self.Promise);
	});

	it('can be called as a function');
	// requires a functioning ES6 Symbol.create
	//, function () {
	//	var p = Promise[Symbol.create]();
	// proclaim.doesNotThrow(function () {
	// Promise.call(p, function () {});
	// });
	//});

	it('can be used as the value in an extends clause');

	// "Subclass constructors that intend to inherit the specified
	// Promise behaviour must include a 'super' call to Promise"

	// subclass constructors MAY include a 'super' call to Promise

	// subclass constructors *that intend to inherit specified Promise
	// behavior* MUST include such a call
});

describe('25.4.3.1 Promise ( executor )', function () {
	'use strict';
	it("throws TypeError when 'this' is not of type Object", function () {
		proclaim['throws'](function () {
			Promise.call(3, function () {});
		}, TypeError);
	});

	it("throws TypeError if 'this' is a constructed, but unresolved Promise", function (done) {
		'use strict';
		var resolveP,
			p = new Promise(function (resolve, _reject) {
				resolveP = resolve;
			});

		// promise's [[PromiseState]] internal slot should be 'pending'
		// should throw
		proclaim['throws'](function () {
			Promise.call(p, function (resolve, _reject) {
				resolve(2);
			});
		}, TypeError);

		// receive first resolution
		p.then(function (resolved) {
			proclaim.equal(1, resolved);
		})
			.then(done)['catch'](done);

		resolveP(1);
	});

	it("throws TypeError if 'this' is a resolved Promise", function (done) {
		var p = new Promise(function (resolve, _reject) {
			resolve(1);
		});

		function afterFirstResolution() {
			// if promise's [[PromiseState]] internal slot is not 'undefined'
			// should throw
			proclaim['throws'](function () {
				Promise.call(p, function (resolve, _reject) {
					resolve(2);
				});
			}, TypeError);

			// affirm that previous resolution is still settled
			p.then(function (resolved) {
				proclaim.equal(1, resolved);
			})
				.then(done)['catch'](done);
		}

		// receive first resolution
		p.then(function (resolved) {
			proclaim.equal(resolved, 1);

			Promise.resolve().then(afterFirstResolution)['catch'](done);
		})['catch'](done);
	});

	it("throws TypeError if 'executor' is not Callable", function () {
		proclaim['throws'](function () {
			new Promise('not callable');
		}, TypeError);
	});
});

describe('25.4.3.1.1 InitializePromise ( promise, executor )', function () {
	'use strict';
	it('returns a promise');
	it("invokes the executor with 'this' = 'undefined'", function () {
		var savedThis;
		new Promise(function () {
			savedThis = this;
		});

		if (hasStrictMode) {
			proclaim.equal(undefined, savedThis);
		}
	});
	it('catches exceptions thrown from executor and turns them into reject', function (done) {
		// if completion is an abrupt completion
		var errorObject = {};

		var p = new Promise(function () {
			throw errorObject;
		});

		p.then(undefined, function (err) {
			if (hasStrictMode) {
				proclaim.equal(undefined, this);
			}
			proclaim.equal(errorObject, err);
		})
			.then(done)['catch'](done);
	});

	it("returns a promise either in the 'pending' or 'rejected' state");
});

describe('25.4.3.2 new Promise ( ... argumentsList )', function () {
	'use strict';
	it('is a constructor call');
});

describe('25.4.4 Properties of the Promise Constructor', function () {
	'use strict';
	it('has a [[Protoype]] internal slot whose value is the Function prototype object');
	it('has a length property whose value is 1', function () {
		proclaim.equal(1, Promise.length);
	});
});

describe('Promise constructor', function () {
	'use strict';
	it('is provided', function () {
		proclaim.equal(typeof Promise, 'function');
	});

	it('returns a new Promise', function () {
		var p = new Promise(function () {});

		proclaim.ok(p instanceof Promise);
	});
});

var failIfThrows = function (done) {
	'use strict';

	return function (e) {
		done(e || new Error());
	};
};

describe('Promise', function () {
	'use strict';

	specify('sanity check: a fulfilled promise calls its fulfillment handler', function (done) {
		Promise.resolve(5)
			.then(function (value) {
				proclaim.strictEqual(value, 5);
			})
			.then(done, failIfThrows(done));
	});

	specify('directly resolving the promise with itself', function (done) {
		var resolvePromise;
		var promise = new Promise(function (resolve) {
			resolvePromise = resolve;
		});

		resolvePromise(promise);

		promise
			.then(
				function () {
					proclaim.ok(false, 'Should not be fulfilled');
				},
				function (err) {
					proclaim.ok(err instanceof TypeError);
				}
			)
			.then(done, failIfThrows(done));
	});

	specify('Stealing a resolver and using it to trigger possible reentrancy bug (#83)', function () {
		var stolenResolver;
		var StealingPromiseConstructor = function StealingPromiseConstructor(resolver) {
			stolenResolver = resolver;
			resolver(
				function () {},
				function () {}
			);
		};

		var iterable = {};
		var atAtIterator = '@@iterator'; // on firefox, at least.
		iterable[atAtIterator] = function () {
			stolenResolver(null, null);
			throw new Error(0);
		};

		proclaim.doesNotThrow(function () {
			Promise.all.call(StealingPromiseConstructor, iterable);
		});
	});

	specify('resolve with a thenable calls it once', function () {
		var resolve;
		var p = new Promise(function (r) {
			resolve = r;
		});
		var count = 0;
		resolve({
			then: function () {
				count += 1;
				throw new RangeError('reject the promise');
			}
		});
		var a = p
			.then(function () {})['catch'](function (err) {
				proclaim.equal(count, 1);
				proclaim.ok(err instanceof RangeError);
			});
		var b = p
			.then(function () {})['catch'](function (err) {
				proclaim.equal(count, 1);
				proclaim.ok(err instanceof RangeError);
			});
		return Promise.all([a, b]);
	});

	specify('resolve with a thenable that throws on .then, rejects the promise synchronously', function () {
		var resolve;
		var p = new Promise(function (r) {
			resolve = r;
		});
		var count = 0;
		var thenable = Object.defineProperty({}, 'then', {
			get: function () {
				count += 1;
				throw new RangeError('no then for you');
			}
		});
		resolve(thenable);
		proclaim.equal(count, 1);
		var a = p
			.then(function () {})['catch'](function (err) {
				proclaim.equal(count, 1);
				proclaim.ok(err instanceof RangeError);
			});
		var b = p
			.then(function () {})['catch'](function (err) {
				proclaim.equal(count, 1);
				proclaim.ok(err instanceof RangeError);
			});
		return Promise.all([a, b]);
	});
});

describe('Promise.resolve', function () {
	'use strict';

	it('should not be enumerable', function () {
		proclaim.isNotEnumerable(Promise, 'resolve');
	});

	it('should return a resolved promise', function (done) {
		var value = {};
		Promise.resolve(value).then(function (result) {
			proclaim.deepEqual(result, value);
			done();
		}, failIfThrows(done));
	});

	it('throws when receiver is a primitive', function () {
		var promise = Promise.resolve();
		proclaim['throws'](function () {
			Promise.resolve.call(undefined, promise);
		});
		proclaim['throws'](function () {
			Promise.resolve.call(null, promise);
		});
		proclaim['throws'](function () {
			Promise.resolve.call('', promise);
		});
		proclaim['throws'](function () {
			Promise.resolve.call(42, promise);
		});
		proclaim['throws'](function () {
			Promise.resolve.call(false, promise);
		});
		proclaim['throws'](function () {
			Promise.resolve.call(true, promise);
		});
	});
});

describe('Promise.reject', function () {
	'use strict';

	it('should not be enumerable', function () {
		proclaim.isNotEnumerable(Promise, 'reject');
	});

	it('should return a rejected promise', function (done) {
		var value = {};
		Promise.reject(value).then(failIfThrows(done), function (result) {
			proclaim.deepEqual(result, value);
			done();
		});
	});

	it('throws when receiver is a primitive', function () {
		var promise = Promise.reject();
		proclaim['throws'](function () {
			Promise.reject.call(undefined, promise);
		});
		proclaim['throws'](function () {
			Promise.reject.call(null, promise);
		});
		proclaim['throws'](function () {
			Promise.reject.call('', promise);
		});
		proclaim['throws'](function () {
			Promise.reject.call(42, promise);
		});
		proclaim['throws'](function () {
			Promise.reject.call(false, promise);
		});
		proclaim['throws'](function () {
			Promise.reject.call(true, promise);
		});
		promise.then(null, function () {}); // silence unhandled rejection errors in Chrome
	});
});

var delayPromise = function (value, ms) {
	'use strict';

	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve(value);
		}, ms);
	});
};

describe('Promise.race', function () {
	'use strict';

	it('should not be enumerable', function () {
		proclaim.isNotEnumerable(Promise, 'race');
	});

	it('should fulfill if all promises are settled and the ordinally-first is fulfilled', function (done) {
		var iterable = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];

		Promise.race(iterable)
			.then(function (value) {
				proclaim.strictEqual(value, 1);
			})
			.then(done, failIfThrows(done));
	});

	it('should reject if all promises are settled and the ordinally-first is rejected', function (done) {
		var iterable = [Promise.reject(1), Promise.reject(2), Promise.resolve(3)];

		Promise.race(iterable)
			.then(
				function () {
					proclaim(false, 'should never get here');
				},
				function (reason) {
					proclaim.strictEqual(reason, 1);
				}
			)
			.then(done, failIfThrows(done));
	});

	it('should settle in the same way as the first promise to settle', function (done) {
		// ensure that even if timeouts are delayed an all execute together,
		// p2 will settle first.
		var p2 = delayPromise(2, 200);
		var p1 = delayPromise(1, 1000);
		var p3 = delayPromise(3, 500);
		var iterable = [p1, p2, p3];

		Promise.race(iterable)
			.then(function (value) {
				proclaim.strictEqual(value, 2);
			})
			.then(done, failIfThrows(done));
	});

	// see https://github.com/domenic/promises-unwrapping/issues/75
	it('should never settle when given an empty iterable', function (done) {
		var iterable = [];
		var settled = false;

		Promise.race(iterable).then(
			function () {
				settled = true;
			},
			function () {
				settled = true;
			}
		);

		setTimeout(function () {
			proclaim.strictEqual(settled, false);
			done();
		}, 300);
	});

	it('should reject with a TypeError if given a non-iterable', function (done) {
		var notIterable = {};

		Promise.race(notIterable)
			.then(
				function () {
					proclaim(false, 'should never get here');
				},
				function (reason) {
					proclaim(reason instanceof TypeError);
				}
			)
			.then(done, failIfThrows(done));
	});
});
// tests from promises-aplus-tests

describe('Promises/A+ Tests', function () {
	var adapter = {
		// an adapter from es6 spec to Promises/A+
		deferred: function () {
			var result = {};
			result.promise = new Promise(function (resolve, reject) {
				result.resolve = resolve;
				result.reject = reject;
			});
			return result;
		},
		resolved: Promise.resolve.bind(Promise),
		rejected: Promise.reject.bind(Promise)
	};
	var assert = proclaim;

	var resolved = adapter.resolved;
	var rejected = adapter.rejected;
	var deferred = adapter.deferred;

	var testFulfilled = function (value, test) {
		specify('already-fulfilled', function (done) {
			test(resolved(value), done);
		});

		specify('immediately-fulfilled', function (done) {
			var d = deferred();
			test(d.promise, done);
			d.resolve(value);
		});

		specify('eventually-fulfilled', function (done) {
			var d = deferred();
			test(d.promise, done);
			setTimeout(function () {
				d.resolve(value);
			}, 50);
		});
	};

	var testRejected = function (reason, test) {
		specify('already-rejected', function (done) {
			test(rejected(reason), done);
		});

		specify('immediately-rejected', function (done) {
			var d = deferred();
			test(d.promise, done);
			d.reject(reason);
		});

		specify('eventually-rejected', function (done) {
			var d = deferred();
			test(d.promise, done);
			setTimeout(function () {
				d.reject(reason);
			}, 50);
		});
	};

	var dummy = { dummy: 'dummy' }; // we fulfill or reject with this when we don't intend to test against it

	var reasons = {};
	reasons['`undefined`'] = function () {
		return undefined;
	};

	reasons['`null`'] = function () {
		return null;
	};

	reasons['`false`'] = function () {
		return false;
	};

	reasons['`0`'] = function () {
		return 0;
	};

	reasons['an error'] = function () {
		return new Error();
	};

	reasons['an error without a stack'] = function () {
		var error = new Error();
		delete error.stack;

		return error;
	};

	reasons['a date'] = function () {
		return new Date();
	};

	reasons['an object'] = function () {
		return {};
	};

	reasons['an always-pending thenable'] = function () {
		return { then: function () {} };
	};

	reasons['a fulfilled promise'] = function () {
		return resolved(dummy);
	};

	reasons['a rejected promise'] = function () {
		return rejected(dummy);
	};

	var thenables = {};
	var other = { other: 'other' }; // a value we don't want to be strict equal to

	thenables.fulfilled = {
		'a synchronously-fulfilled custom thenable': function (value) {
			return {
				then: function (onFulfilled) {
					onFulfilled(value);
				}
			};
		},

		'an asynchronously-fulfilled custom thenable': function (value) {
			return {
				then: function (onFulfilled) {
					setTimeout(function () {
						onFulfilled(value);
					}, 0);
				}
			};
		},

		'a synchronously-fulfilled one-time thenable': function (value) {
			var numberOfTimesThenRetrieved = 0;
			return Object.create(null, {
				then: {
					get: function () {
						if (numberOfTimesThenRetrieved === 0) {
							++numberOfTimesThenRetrieved;
							return function (onFulfilled) {
								onFulfilled(value);
							};
						}
						return null;
					}
				}
			});
		},

		'a thenable that tries to fulfill twice': function (value) {
			return {
				then: function (onFulfilled) {
					onFulfilled(value);
					onFulfilled(other);
				}
			};
		},

		'a thenable that fulfills but then throws': function (value) {
			return {
				then: function (onFulfilled) {
					onFulfilled(value);
					throw other;
				}
			};
		},

		'an already-fulfilled promise': function (value) {
			return resolved(value);
		},

		'an eventually-fulfilled promise': function (value) {
			var d = deferred();
			setTimeout(function () {
				d.resolve(value);
			}, 50);
			return d.promise;
		}
	};

	thenables.rejected = {
		'a synchronously-rejected custom thenable': function (reason) {
			return {
				then: function (onFulfilled, onRejected) {
					onRejected(reason);
				}
			};
		},

		'an asynchronously-rejected custom thenable': function (reason) {
			return {
				then: function (onFulfilled, onRejected) {
					setTimeout(function () {
						onRejected(reason);
					}, 0);
				}
			};
		},

		'a synchronously-rejected one-time thenable': function (reason) {
			var numberOfTimesThenRetrieved = 0;
			return Object.create(null, {
				then: {
					get: function () {
						if (numberOfTimesThenRetrieved === 0) {
							++numberOfTimesThenRetrieved;
							return function (onFulfilled, onRejected) {
								onRejected(reason);
							};
						}
						return null;
					}
				}
			});
		},

		'a thenable that immediately throws in `then`': function (reason) {
			return {
				then: function () {
					throw reason;
				}
			};
		},

		'an object with a throwing `then` accessor': function (reason) {
			return Object.create(null, {
				then: {
					get: function () {
						throw reason;
					}
				}
			});
		},

		'an already-rejected promise': function (reason) {
			return rejected(reason);
		},

		'an eventually-rejected promise': function (reason) {
			var d = deferred();
			setTimeout(function () {
				d.reject(reason);
			}, 50);
			return d.promise;
		}
	};

	describe('2.1.2', function () {
		describe('2.1.2.1: When fulfilled, a promise: must not transition to any other state.', function () {
			testFulfilled(dummy, function (promise, done) {
				var onFulfilledCalled = false;

				promise.then(
					function onFulfilled() {
						onFulfilledCalled = true;
					},
					function onRejected() {
						assert.strictEqual(onFulfilledCalled, false);
						done();
					}
				);

				setTimeout(done, 100);
			});

			specify('trying to fulfill then immediately reject', function (done) {
				var d = deferred();
				var onFulfilledCalled = false;

				d.promise.then(
					function onFulfilled() {
						onFulfilledCalled = true;
					},
					function onRejected() {
						assert.strictEqual(onFulfilledCalled, false);
						done();
					}
				);

				d.resolve(dummy);
				d.reject(dummy);
				setTimeout(done, 100);
			});

			specify('trying to fulfill then reject, delayed', function (done) {
				var d = deferred();
				var onFulfilledCalled = false;

				d.promise.then(
					function onFulfilled() {
						onFulfilledCalled = true;
					},
					function onRejected() {
						assert.strictEqual(onFulfilledCalled, false);
						done();
					}
				);

				setTimeout(function () {
					d.resolve(dummy);
					d.reject(dummy);
				}, 50);
				setTimeout(done, 100);
			});

			specify('trying to fulfill immediately then reject delayed', function (done) {
				var d = deferred();
				var onFulfilledCalled = false;

				d.promise.then(
					function onFulfilled() {
						onFulfilledCalled = true;
					},
					function onRejected() {
						assert.strictEqual(onFulfilledCalled, false);
						done();
					}
				);

				d.resolve(dummy);
				setTimeout(function () {
					d.reject(dummy);
				}, 50);
				setTimeout(done, 100);
			});
		});
	});
	describe('2.1.3', function () {
		describe('2.1.3.1: When rejected, a promise: must not transition to any other state.', function () {
			testRejected(dummy, function (promise, done) {
				var onRejectedCalled = false;

				promise.then(
					function onFulfilled() {
						assert.strictEqual(onRejectedCalled, false);
						done();
					},
					function onRejected() {
						onRejectedCalled = true;
					}
				);

				setTimeout(done, 100);
			});

			specify('trying to reject then immediately fulfill', function (done) {
				var d = deferred();
				var onRejectedCalled = false;

				d.promise.then(
					function onFulfilled() {
						assert.strictEqual(onRejectedCalled, false);
						done();
					},
					function onRejected() {
						onRejectedCalled = true;
					}
				);

				d.reject(dummy);
				d.resolve(dummy);
				setTimeout(done, 100);
			});

			specify('trying to reject then fulfill, delayed', function (done) {
				var d = deferred();
				var onRejectedCalled = false;

				d.promise.then(
					function onFulfilled() {
						assert.strictEqual(onRejectedCalled, false);
						done();
					},
					function onRejected() {
						onRejectedCalled = true;
					}
				);

				setTimeout(function () {
					d.reject(dummy);
					d.resolve(dummy);
				}, 50);
				setTimeout(done, 100);
			});

			specify('trying to reject immediately then fulfill delayed', function (done) {
				var d = deferred();
				var onRejectedCalled = false;

				d.promise.then(
					function onFulfilled() {
						assert.strictEqual(onRejectedCalled, false);
						done();
					},
					function onRejected() {
						onRejectedCalled = true;
					}
				);

				d.reject(dummy);
				setTimeout(function () {
					d.resolve(dummy);
				}, 50);
				setTimeout(done, 100);
			});
		});
	});

	describe('2.2.1', function () {
		describe('2.2.1: Both `onFulfilled` and `onRejected` are optional arguments.', function () {
			describe('2.2.1.1: If `onFulfilled` is not a function, it must be ignored.', function () {
				describe('applied to a directly-rejected promise', function () {
					function testNonFunction(nonFunction, stringRepresentation) {
						specify('`onFulfilled` is ' + stringRepresentation, function (done) {
							rejected(dummy).then(nonFunction, function () {
								done();
							});
						});
					}

					testNonFunction(undefined, '`undefined`');
					testNonFunction(null, '`null`');
					testNonFunction(false, '`false`');
					testNonFunction(5, '`5`');
					testNonFunction({}, 'an object');
				});

				describe('applied to a promise rejected and then chained off of', function () {
					function testNonFunction(nonFunction, stringRepresentation) {
						specify('`onFulfilled` is ' + stringRepresentation, function (done) {
							rejected(dummy)
								.then(function () {}, undefined)
								.then(nonFunction, function () {
									done();
								});
						});
					}

					testNonFunction(undefined, '`undefined`');
					testNonFunction(null, '`null`');
					testNonFunction(false, '`false`');
					testNonFunction(5, '`5`');
					testNonFunction({}, 'an object');
				});
			});

			describe('2.2.1.2: If `onRejected` is not a function, it must be ignored.', function () {
				describe('applied to a directly-fulfilled promise', function () {
					function testNonFunction(nonFunction, stringRepresentation) {
						specify('`onRejected` is ' + stringRepresentation, function (done) {
							resolved(dummy).then(function () {
								done();
							}, nonFunction);
						});
					}

					testNonFunction(undefined, '`undefined`');
					testNonFunction(null, '`null`');
					testNonFunction(false, '`false`');
					testNonFunction(5, '`5`');
					testNonFunction({}, 'an object');
				});

				describe('applied to a promise fulfilled and then chained off of', function () {
					function testNonFunction(nonFunction, stringRepresentation) {
						specify('`onRejected` is ' + stringRepresentation, function (done) {
							resolved(dummy)
								.then(undefined, function () {})
								.then(function () {
									done();
								}, nonFunction);
						});
					}

					testNonFunction(undefined, '`undefined`');
					testNonFunction(null, '`null`');
					testNonFunction(false, '`false`');
					testNonFunction(5, '`5`');
					testNonFunction({}, 'an object');
				});
			});
		});
	});
	var sentinel = { sentinel: 'sentinel' }; // a sentinel fulfillment value to test for with strict equality

	describe('2.2.2', function () {
		describe('2.2.2: If `onFulfilled` is a function,', function () {
			describe('2.2.2.1: it must be called after `promise` is fulfilled, with `promise`’s fulfillment value as its ' + 'first argument.', function () {
				testFulfilled(sentinel, function (promise, done) {
					promise.then(function onFulfilled(value) {
						assert.strictEqual(value, sentinel);
						done();
					});
				});
			});

			describe('2.2.2.2: it must not be called before `promise` is fulfilled', function () {
				specify('fulfilled after a delay', function (done) {
					var d = deferred();
					var isFulfilled = false;

					d.promise.then(function onFulfilled() {
						assert.strictEqual(isFulfilled, true);
						done();
					});

					setTimeout(function () {
						d.resolve(dummy);
						isFulfilled = true;
					}, 50);
				});

				specify('never fulfilled', function (done) {
					var d = deferred();
					var onFulfilledCalled = false;

					d.promise.then(function onFulfilled() {
						onFulfilledCalled = true;
						done();
					});

					setTimeout(function () {
						assert.strictEqual(onFulfilledCalled, false);
						done();
					}, 150);
				});
			});

			describe('2.2.2.3: it must not be called more than once.', function () {
				specify('already-fulfilled', function (done) {
					var timesCalled = 0;

					resolved(dummy).then(function onFulfilled() {
						assert.strictEqual(++timesCalled, 1);
						done();
					});
				});

				specify('trying to fulfill a pending promise more than once, immediately', function (done) {
					var d = deferred();
					var timesCalled = 0;

					d.promise.then(function onFulfilled() {
						assert.strictEqual(++timesCalled, 1);
						done();
					});

					d.resolve(dummy);
					d.resolve(dummy);
				});

				specify('trying to fulfill a pending promise more than once, delayed', function (done) {
					var d = deferred();
					var timesCalled = 0;

					d.promise.then(function onFulfilled() {
						assert.strictEqual(++timesCalled, 1);
						done();
					});

					setTimeout(function () {
						d.resolve(dummy);
						d.resolve(dummy);
					}, 50);
				});

				specify('trying to fulfill a pending promise more than once, immediately then delayed', function (done) {
					var d = deferred();
					var timesCalled = 0;

					d.promise.then(function onFulfilled() {
						assert.strictEqual(++timesCalled, 1);
						done();
					});

					d.resolve(dummy);
					setTimeout(function () {
						d.resolve(dummy);
					}, 50);
				});

				specify('when multiple `then` calls are made, spaced apart in time', function (done) {
					var d = deferred();
					var timesCalled = [0, 0, 0];

					d.promise.then(function onFulfilled() {
						assert.strictEqual(++timesCalled[0], 1);
					});

					setTimeout(function () {
						d.promise.then(function onFulfilled() {
							assert.strictEqual(++timesCalled[1], 1);
						});
					}, 50);

					setTimeout(function () {
						d.promise.then(function onFulfilled() {
							assert.strictEqual(++timesCalled[2], 1);
							done();
						});
					}, 100);

					setTimeout(function () {
						d.resolve(dummy);
					}, 150);
				});

				specify('when `then` is interleaved with fulfillment', function (done) {
					var d = deferred();
					var timesCalled = [0, 0];

					d.promise.then(function onFulfilled() {
						assert.strictEqual(++timesCalled[0], 1);
					});

					d.resolve(dummy);

					d.promise.then(function onFulfilled() {
						assert.strictEqual(++timesCalled[1], 1);
						done();
					});
				});
			});
		});
	});
	describe('2.2.3', function () {
		describe('2.2.3: If `onRejected` is a function,', function () {
			describe('2.2.3.1: it must be called after `promise` is rejected, with `promise`’s rejection reason as its ' + 'first argument.', function () {
				testRejected(sentinel, function (promise, done) {
					promise.then(null, function onRejected(reason) {
						assert.strictEqual(reason, sentinel);
						done();
					});
				});
			});

			describe('2.2.3.2: it must not be called before `promise` is rejected', function () {
				specify('rejected after a delay', function (done) {
					var d = deferred();
					var isRejected = false;

					d.promise.then(null, function onRejected() {
						assert.strictEqual(isRejected, true);
						done();
					});

					setTimeout(function () {
						d.reject(dummy);
						isRejected = true;
					}, 50);
				});

				specify('never rejected', function (done) {
					var d = deferred();
					var onRejectedCalled = false;

					d.promise.then(null, function onRejected() {
						onRejectedCalled = true;
						done();
					});

					setTimeout(function () {
						assert.strictEqual(onRejectedCalled, false);
						done();
					}, 150);
				});
			});

			describe('2.2.3.3: it must not be called more than once.', function () {
				specify('already-rejected', function (done) {
					var timesCalled = 0;

					rejected(dummy).then(null, function onRejected() {
						assert.strictEqual(++timesCalled, 1);
						done();
					});
				});

				specify('trying to reject a pending promise more than once, immediately', function (done) {
					var d = deferred();
					var timesCalled = 0;

					d.promise.then(null, function onRejected() {
						assert.strictEqual(++timesCalled, 1);
						done();
					});

					d.reject(dummy);
					d.reject(dummy);
				});

				specify('trying to reject a pending promise more than once, delayed', function (done) {
					var d = deferred();
					var timesCalled = 0;

					d.promise.then(null, function onRejected() {
						assert.strictEqual(++timesCalled, 1);
						done();
					});

					setTimeout(function () {
						d.reject(dummy);
						d.reject(dummy);
					}, 50);
				});

				specify('trying to reject a pending promise more than once, immediately then delayed', function (done) {
					var d = deferred();
					var timesCalled = 0;

					d.promise.then(null, function onRejected() {
						assert.strictEqual(++timesCalled, 1);
						done();
					});

					d.reject(dummy);
					setTimeout(function () {
						d.reject(dummy);
					}, 50);
				});

				specify('when multiple `then` calls are made, spaced apart in time', function (done) {
					var d = deferred();
					var timesCalled = [0, 0, 0];

					d.promise.then(null, function onRejected() {
						assert.strictEqual(++timesCalled[0], 1);
					});

					setTimeout(function () {
						d.promise.then(null, function onRejected() {
							assert.strictEqual(++timesCalled[1], 1);
						});
					}, 50);

					setTimeout(function () {
						d.promise.then(null, function onRejected() {
							assert.strictEqual(++timesCalled[2], 1);
							done();
						});
					}, 100);

					setTimeout(function () {
						d.reject(dummy);
					}, 150);
				});

				specify('when `then` is interleaved with rejection', function (done) {
					var d = deferred();
					var timesCalled = [0, 0];

					d.promise.then(null, function onRejected() {
						assert.strictEqual(++timesCalled[0], 1);
					});

					d.reject(dummy);

					d.promise.then(null, function onRejected() {
						assert.strictEqual(++timesCalled[1], 1);
						done();
					});
				});
			});
		});
	});
	describe('2.2.4', function () {
		describe('2.2.4: `onFulfilled` or `onRejected` must not be called until the execution context stack contains only ' + 'platform code.', function () {
			describe('`then` returns before the promise becomes fulfilled or rejected', function () {
				testFulfilled(dummy, function (promise, done) {
					var thenHasReturned = false;

					promise.then(function onFulfilled() {
						assert.strictEqual(thenHasReturned, true);
						done();
					});

					thenHasReturned = true;
				});
				testRejected(dummy, function (promise, done) {
					var thenHasReturned = false;

					promise.then(null, function onRejected() {
						assert.strictEqual(thenHasReturned, true);
						done();
					});

					thenHasReturned = true;
				});
			});

			describe('Clean-stack execution ordering tests (fulfillment case)', function () {
				specify('when `onFulfilled` is added immediately before the promise is fulfilled', function () {
					var d = deferred();
					var onFulfilledCalled = false;

					d.promise.then(function onFulfilled() {
						onFulfilledCalled = true;
					});

					d.resolve(dummy);

					assert.strictEqual(onFulfilledCalled, false);
				});

				specify('when `onFulfilled` is added immediately after the promise is fulfilled', function () {
					var d = deferred();
					var onFulfilledCalled = false;

					d.resolve(dummy);

					d.promise.then(function onFulfilled() {
						onFulfilledCalled = true;
					});

					assert.strictEqual(onFulfilledCalled, false);
				});

				specify('when one `onFulfilled` is added inside another `onFulfilled`', function (done) {
					var promise = resolved();
					var firstOnFulfilledFinished = false;

					promise.then(function () {
						promise.then(function () {
							assert.strictEqual(firstOnFulfilledFinished, true);
							done();
						});
						firstOnFulfilledFinished = true;
					});
				});

				specify('when `onFulfilled` is added inside an `onRejected`', function (done) {
					var promise = rejected();
					var promise2 = resolved();
					var firstOnRejectedFinished = false;

					promise.then(null, function () {
						promise2.then(function () {
							assert.strictEqual(firstOnRejectedFinished, true);
							done();
						});
						firstOnRejectedFinished = true;
					});
				});

				specify('when the promise is fulfilled asynchronously', function (done) {
					var d = deferred();
					var firstStackFinished = false;

					setTimeout(function () {
						d.resolve(dummy);
						firstStackFinished = true;
					}, 0);

					d.promise.then(function () {
						assert.strictEqual(firstStackFinished, true);
						done();
					});
				});
			});

			describe('Clean-stack execution ordering tests (rejection case)', function () {
				specify('when `onRejected` is added immediately before the promise is rejected', function () {
					var d = deferred();
					var onRejectedCalled = false;

					d.promise.then(null, function onRejected() {
						onRejectedCalled = true;
					});

					d.reject(dummy);

					assert.strictEqual(onRejectedCalled, false);
				});

				specify('when `onRejected` is added immediately after the promise is rejected', function () {
					var d = deferred();
					var onRejectedCalled = false;

					d.reject(dummy);

					d.promise.then(null, function onRejected() {
						onRejectedCalled = true;
					});

					assert.strictEqual(onRejectedCalled, false);
				});

				specify('when `onRejected` is added inside an `onFulfilled`', function (done) {
					var promise = resolved();
					var promise2 = rejected();
					var firstOnFulfilledFinished = false;

					promise.then(function () {
						promise2.then(null, function () {
							assert.strictEqual(firstOnFulfilledFinished, true);
							done();
						});
						firstOnFulfilledFinished = true;
					});
				});

				specify('when one `onRejected` is added inside another `onRejected`', function (done) {
					var promise = rejected();
					var firstOnRejectedFinished = false;

					promise.then(null, function () {
						promise.then(null, function () {
							assert.strictEqual(firstOnRejectedFinished, true);
							done();
						});
						firstOnRejectedFinished = true;
					});
				});

				specify('when the promise is rejected asynchronously', function (done) {
					var d = deferred();
					var firstStackFinished = false;

					setTimeout(function () {
						d.reject(dummy);
						firstStackFinished = true;
					}, 0);

					d.promise.then(null, function () {
						assert.strictEqual(firstStackFinished, true);
						done();
					});
				});
			});
		});
	});

	describe('2.2.5', function () {
		describe('2.2.5 `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value).', function () {
			describe('strict mode', function () {
				specify('fulfilled', function (done) {
					if (hasStrictMode) {
						resolved(dummy).then(function onFulfilled() {
							try {
								assert.strictEqual(this, undefined);
								done();
							} catch (error){
								done(error);
							}
						});
					} else {
						done();
					}
				});

				specify('rejected', function (done) {
					if (hasStrictMode) {
						rejected(dummy).then(null, function onRejected() {
							'use strict';

							try {
								assert.strictEqual(this, undefined);
								done();
							} catch (error){
								done(error);
							}
						});
					} else {
						done();
					}
				});
			});

			describe('sloppy mode', function () {
				specify('fulfilled', function (done) {
					resolved(dummy).then(function onFulfilled() {
						try {
							assert.strictEqual(this, window);
							done();
						} catch (error){
							done(error);
						}
					});
				});

				specify('rejected', function (done) {
					rejected(dummy).then(null, function onRejected() {
						try {
							assert.strictEqual(this, window);
							done();
						} catch (error){
							done(error);
						}
					});
				});
			});
		});
	});

	describe('2.2.6', function () {
		var dummy = { dummy: 'dummy' }; // we fulfill or reject with this when we don't intend to test against it
		var other = { other: 'other' }; // a value we don't want to be strict equal to
		var sentinel = { sentinel: 'sentinel' }; // a sentinel fulfillment value to test for with strict equality
		var sentinel2 = { sentinel2: 'sentinel2' };
		var sentinel3 = { sentinel3: 'sentinel3' };

		function callbackAggregator(times, ultimateCallback) {
			var soFar = 0;
			return function () {
				if (++soFar === times) {
					ultimateCallback();
				}
			};
		}

		describe('2.2.6: `then` may be called multiple times on the same promise.', function () {
			describe('2.2.6.1: If/when `promise` is fulfilled, all respective `onFulfilled` callbacks must execute in the ' + 'order of their originating calls to `then`.', function () {
				describe('multiple boring fulfillment handlers', function () {
					testFulfilled(sentinel, function (promise, done) {
						var handler1 = sinon.stub().returns(other);
						var handler2 = sinon.stub().returns(other);
						var handler3 = sinon.stub().returns(other);

						var spy = sinon.spy();
						promise.then(handler1, spy);
						promise.then(handler2, spy);
						promise.then(handler3, spy);

						promise.then(function (value) {
							assert.strictEqual(value, sentinel);

							sinon.assert.calledWith(handler1, sinon.match.same(sentinel));
							sinon.assert.calledWith(handler2, sinon.match.same(sentinel));
							sinon.assert.calledWith(handler3, sinon.match.same(sentinel));
							sinon.assert.notCalled(spy);

							done();
						});
					});
				});

				describe('multiple fulfillment handlers, one of which throws', function () {
					testFulfilled(sentinel, function (promise, done) {
						var handler1 = sinon.stub().returns(other);
						var handler2 = sinon.stub()['throws'](other);
						var handler3 = sinon.stub().returns(other);

						var spy = sinon.spy();
						promise.then(handler1, spy);
						promise.then(handler2, spy);
						promise.then(handler3, spy);

						promise.then(function (value) {
							assert.strictEqual(value, sentinel);

							sinon.assert.calledWith(handler1, sinon.match.same(sentinel));
							sinon.assert.calledWith(handler2, sinon.match.same(sentinel));
							sinon.assert.calledWith(handler3, sinon.match.same(sentinel));
							sinon.assert.notCalled(spy);

							done();
						});
					});
				});

				describe('results in multiple branching chains with their own fulfillment values', function () {
					testFulfilled(dummy, function (promise, done) {
						var semiDone = callbackAggregator(3, done);

						promise
							.then(function () {
								return sentinel;
							})
							.then(function (value) {
								assert.strictEqual(value, sentinel);
								semiDone();
							});

						promise
							.then(function () {
								throw sentinel2;
							})
							.then(null, function (reason) {
								assert.strictEqual(reason, sentinel2);
								semiDone();
							});

						promise
							.then(function () {
								return sentinel3;
							})
							.then(function (value) {
								assert.strictEqual(value, sentinel3);
								semiDone();
							});
					});
				});

				describe('`onFulfilled` handlers are called in the original order', function () {
					testFulfilled(dummy, function (promise, done) {
						var handler1 = sinon.spy(function handler1() {});
						var handler2 = sinon.spy(function handler2() {});
						var handler3 = sinon.spy(function handler3() {});

						promise.then(handler1);
						promise.then(handler2);
						promise.then(handler3);

						promise.then(function () {
							sinon.assert.callOrder(handler1, handler2, handler3);
							done();
						});
					});

					describe('even when one handler is added inside another handler', function () {
						testFulfilled(dummy, function (promise, done) {
							var handler1 = sinon.spy(function handler1() {});
							var handler2 = sinon.spy(function handler2() {});
							var handler3 = sinon.spy(function handler3() {});

							promise.then(function () {
								handler1();
								promise.then(handler3);
							});
							promise.then(handler2);

							promise.then(function () {
								// Give implementations a bit of extra time to flush their internal queue, if necessary.
								setTimeout(function () {
									sinon.assert.callOrder(handler1, handler2, handler3);
									done();
								}, 15);
							});
						});
					});
				});
			});

			describe('2.2.6.2: If/when `promise` is rejected, all respective `onRejected` callbacks must execute in the ' + 'order of their originating calls to `then`.', function () {
				describe('multiple boring rejection handlers', function () {
					testRejected(sentinel, function (promise, done) {
						var handler1 = sinon.stub().returns(other);
						var handler2 = sinon.stub().returns(other);
						var handler3 = sinon.stub().returns(other);

						var spy = sinon.spy();
						promise.then(spy, handler1);
						promise.then(spy, handler2);
						promise.then(spy, handler3);

						promise.then(null, function (reason) {
							assert.strictEqual(reason, sentinel);

							sinon.assert.calledWith(handler1, sinon.match.same(sentinel));
							sinon.assert.calledWith(handler2, sinon.match.same(sentinel));
							sinon.assert.calledWith(handler3, sinon.match.same(sentinel));
							sinon.assert.notCalled(spy);

							done();
						});
					});
				});

				describe('multiple rejection handlers, one of which throws', function () {
					testRejected(sentinel, function (promise, done) {
						var handler1 = sinon.stub().returns(other);
						var handler2 = sinon.stub()['throws'](other);
						var handler3 = sinon.stub().returns(other);

						var spy = sinon.spy();
						promise.then(spy, handler1);
						promise.then(spy, handler2);
						promise.then(spy, handler3);

						promise.then(null, function (reason) {
							assert.strictEqual(reason, sentinel);

							sinon.assert.calledWith(handler1, sinon.match.same(sentinel));
							sinon.assert.calledWith(handler2, sinon.match.same(sentinel));
							sinon.assert.calledWith(handler3, sinon.match.same(sentinel));
							sinon.assert.notCalled(spy);

							done();
						});
					});
				});

				describe('results in multiple branching chains with their own fulfillment values', function () {
					testRejected(sentinel, function (promise, done) {
						var semiDone = callbackAggregator(3, done);

						promise
							.then(null, function () {
								return sentinel;
							})
							.then(function (value) {
								assert.strictEqual(value, sentinel);
								semiDone();
							});

						promise
							.then(null, function () {
								throw sentinel2;
							})
							.then(null, function (reason) {
								assert.strictEqual(reason, sentinel2);
								semiDone();
							});

						promise
							.then(null, function () {
								return sentinel3;
							})
							.then(function (value) {
								assert.strictEqual(value, sentinel3);
								semiDone();
							});
					});
				});

				describe('`onRejected` handlers are called in the original order', function () {
					testRejected(dummy, function (promise, done) {
						var handler1 = sinon.spy(function handler1() {});
						var handler2 = sinon.spy(function handler2() {});
						var handler3 = sinon.spy(function handler3() {});

						promise.then(null, handler1);
						promise.then(null, handler2);
						promise.then(null, handler3);

						promise.then(null, function () {
							sinon.assert.callOrder(handler1, handler2, handler3);
							done();
						});
					});

					describe('even when one handler is added inside another handler', function () {
						testRejected(dummy, function (promise, done) {
							var handler1 = sinon.spy(function handler1() {});
							var handler2 = sinon.spy(function handler2() {});
							var handler3 = sinon.spy(function handler3() {});

							promise.then(null, function () {
								handler1();
								promise.then(null, handler3);
							});
							promise.then(null, handler2);

							promise.then(null, function () {
								// Give implementations a bit of extra time to flush their internal queue, if necessary.
								setTimeout(function () {
									sinon.assert.callOrder(handler1, handler2, handler3);
									done();
								}, 15);
							});
						});
					});
				});
			});
		});
	});
	describe('2.2.7', function () {
		var dummy = { dummy: 'dummy' }; // we fulfill or reject with this when we don't intend to test against it
		var sentinel = { sentinel: 'sentinel' }; // a sentinel fulfillment value to test for with strict equality
		var other = { other: 'other' }; // a value we don't want to be strict equal to

		describe('2.2.7: `then` must return a promise: `promise2 = promise1.then(onFulfilled, onRejected)`', function () {
			specify('is a promise', function () {
				var promise1 = deferred().promise;
				var promise2 = promise1.then();

				assert(typeof promise2 === 'object' || typeof promise2 === 'function');
				assert.notStrictEqual(promise2, null);
				assert.strictEqual(typeof promise2.then, 'function');
			});

			describe('2.2.7.1: If either `onFulfilled` or `onRejected` returns a value `x`, run the Promise Resolution ' + 'Procedure `[[Resolve]](promise2, x)`', function () {
				specify('see separate 3.3 tests', function () {});
			});

			describe('2.2.7.2: If either `onFulfilled` or `onRejected` throws an exception `e`, `promise2` must be rejected ' + 'with `e` as the reason.', function () {
				function testReason(expectedReason, stringRepresentation) {
					describe('The reason is ' + stringRepresentation, function () {
						testFulfilled(dummy, function (promise1, done) {
							var promise2 = promise1.then(function onFulfilled() {
								throw expectedReason;
							});

							promise2.then(null, function onPromise2Rejected(actualReason) {
								assert.strictEqual(actualReason, expectedReason);
								done();
							});
						});
						testRejected(dummy, function (promise1, done) {
							var promise2 = promise1.then(null, function onRejected() {
								throw expectedReason;
							});

							promise2.then(null, function onPromise2Rejected(actualReason) {
								assert.strictEqual(actualReason, expectedReason);
								done();
							});
						});
					});
				}

				Object.keys(reasons).forEach(function (stringRepresentation) {
					testReason(reasons[stringRepresentation](), stringRepresentation);
				});
			});

			describe('2.2.7.3: If `onFulfilled` is not a function and `promise1` is fulfilled, `promise2` must be fulfilled ' + 'with the same value.', function () {
				function testNonFunction(nonFunction, stringRepresentation) {
					describe('`onFulfilled` is ' + stringRepresentation, function () {
						testFulfilled(sentinel, function (promise1, done) {
							var promise2 = promise1.then(nonFunction);

							promise2.then(function onPromise2Fulfilled(value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});
				}

				testNonFunction(undefined, '`undefined`');
				testNonFunction(null, '`null`');
				testNonFunction(false, '`false`');
				testNonFunction(5, '`5`');
				testNonFunction({}, 'an object');
				testNonFunction(
					[
						function () {
							return other;
						}
					],
					'an array containing a function'
				);
			});

			describe('2.2.7.4: If `onRejected` is not a function and `promise1` is rejected, `promise2` must be rejected ' + 'with the same reason.', function () {
				function testNonFunction(nonFunction, stringRepresentation) {
					describe('`onRejected` is ' + stringRepresentation, function () {
						testRejected(sentinel, function (promise1, done) {
							var promise2 = promise1.then(null, nonFunction);

							promise2.then(null, function onPromise2Rejected(reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});
				}

				testNonFunction(undefined, '`undefined`');
				testNonFunction(null, '`null`');
				testNonFunction(false, '`false`');
				testNonFunction(5, '`5`');
				testNonFunction({}, 'an object');
				testNonFunction(
					[
						function () {
							return other;
						}
					],
					'an array containing a function'
				);
			});
		});
	});

	describe('2.3.1', function () {
		var dummy = { dummy: 'dummy' }; // we fulfill or reject with this when we don't intend to test against it

		describe("2.3.1: If `promise` and `x` refer to the same object, reject `promise` with a `TypeError' as the reason.", function () {
			specify('via return from a fulfilled promise', function (done) {
				var promise = resolved(dummy).then(function () {
					return promise;
				});

				promise.then(null, function (reason) {
					assert(reason instanceof TypeError);
					done();
				});
			});

			specify('via return from a rejected promise', function (done) {
				var promise = rejected(dummy).then(null, function () {
					return promise;
				});

				promise.then(null, function (reason) {
					assert(reason instanceof TypeError);
					done();
				});
			});
		});
	});

	describe('2.3.2', function () {
		var dummy = { dummy: 'dummy' }; // we fulfill or reject with this when we don't intend to test against it
		var sentinel = { sentinel: 'sentinel' }; // a sentinel fulfillment value to test for with strict equality

		function testPromiseResolution(xFactory, test) {
			specify('via return from a fulfilled promise', function (done) {
				var promise = resolved(dummy).then(function onBasePromiseFulfilled() {
					return xFactory();
				});

				test(promise, done);
			});

			specify('via return from a rejected promise', function (done) {
				var promise = rejected(dummy).then(null, function onBasePromiseRejected() {
					return xFactory();
				});

				test(promise, done);
			});
		}

		describe('2.3.2: If `x` is a promise, adopt its state', function () {
			describe('2.3.2.1: If `x` is pending, `promise` must remain pending until `x` is fulfilled or rejected.', function () {
				function xFactory() {
					return deferred().promise;
				}

				testPromiseResolution(xFactory, function (promise, done) {
					var wasFulfilled = false;
					var wasRejected = false;

					promise.then(
						function onPromiseFulfilled() {
							wasFulfilled = true;
						},
						function onPromiseRejected() {
							wasRejected = true;
						}
					);

					setTimeout(function () {
						assert.strictEqual(wasFulfilled, false);
						assert.strictEqual(wasRejected, false);
						done();
					}, 100);
				});
			});

			describe('2.3.2.2: If/when `x` is fulfilled, fulfill `promise` with the same value.', function () {
				describe('`x` is already-fulfilled', function () {
					function xFactory() {
						return resolved(sentinel);
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(function onPromiseFulfilled(value) {
							assert.strictEqual(value, sentinel);
							done();
						});
					});
				});

				describe('`x` is eventually-fulfilled', function () {
					var d = null;

					function xFactory() {
						d = deferred();
						setTimeout(function () {
							d.resolve(sentinel);
						}, 50);
						return d.promise;
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(function onPromiseFulfilled(value) {
							assert.strictEqual(value, sentinel);
							done();
						});
					});
				});
			});

			describe('2.3.2.3: If/when `x` is rejected, reject `promise` with the same reason.', function () {
				describe('`x` is already-rejected', function () {
					function xFactory() {
						return rejected(sentinel);
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(null, function onPromiseRejected(reason) {
							assert.strictEqual(reason, sentinel);
							done();
						});
					});
				});

				describe('`x` is eventually-rejected', function () {
					var d = null;

					function xFactory() {
						d = deferred();
						setTimeout(function () {
							d.reject(sentinel);
						}, 50);
						return d.promise;
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(null, function onPromiseRejected(reason) {
							assert.strictEqual(reason, sentinel);
							done();
						});
					});
				});
			});
		});
	});

	describe('2.3.3', function () {
		var dummy = { dummy: 'dummy' }; // we fulfill or reject with this when we don't intend to test against it
		var sentinel = { sentinel: 'sentinel' }; // a sentinel fulfillment value to test for with strict equality
		var other = { other: 'other' }; // a value we don't want to be strict equal to
		var sentinelArray = [sentinel]; // a sentinel fulfillment value to test when we need an array

		function testPromiseResolution(xFactory, test) {
			specify('via return from a fulfilled promise', function (done) {
				var promise = resolved(dummy).then(function onBasePromiseFulfilled() {
					return xFactory();
				});

				test(promise, done);
			});

			specify('via return from a rejected promise', function (done) {
				var promise = rejected(dummy).then(null, function onBasePromiseRejected() {
					return xFactory();
				});

				test(promise, done);
			});
		}

		function testCallingResolvePromise(yFactory, stringRepresentation, test) {
			describe('`y` is ' + stringRepresentation, function () {
				describe('`then` calls `resolvePromise` synchronously', function () {
					function xFactory() {
						return {
							then: function (resolvePromise) {
								resolvePromise(yFactory());
							}
						};
					}

					testPromiseResolution(xFactory, test);
				});

				describe('`then` calls `resolvePromise` asynchronously', function () {
					function xFactory() {
						return {
							then: function (resolvePromise) {
								setTimeout(function () {
									resolvePromise(yFactory());
								}, 0);
							}
						};
					}

					testPromiseResolution(xFactory, test);
				});
			});
		}

		function testCallingRejectPromise(r, stringRepresentation, test) {
			describe('`r` is ' + stringRepresentation, function () {
				describe('`then` calls `rejectPromise` synchronously', function () {
					function xFactory() {
						return {
							then: function (resolvePromise, rejectPromise) {
								rejectPromise(r);
							}
						};
					}

					testPromiseResolution(xFactory, test);
				});

				describe('`then` calls `rejectPromise` asynchronously', function () {
					function xFactory() {
						return {
							then: function (resolvePromise, rejectPromise) {
								setTimeout(function () {
									rejectPromise(r);
								}, 0);
							}
						};
					}

					testPromiseResolution(xFactory, test);
				});
			});
		}

		function testCallingResolvePromiseFulfillsWith(yFactory, stringRepresentation, fulfillmentValue) {
			testCallingResolvePromise(yFactory, stringRepresentation, function (promise, done) {
				promise.then(function onPromiseFulfilled(value) {
					assert.strictEqual(value, fulfillmentValue);
					done();
				});
			});
		}

		function testCallingResolvePromiseRejectsWith(yFactory, stringRepresentation, rejectionReason) {
			testCallingResolvePromise(yFactory, stringRepresentation, function (promise, done) {
				promise.then(null, function onPromiseRejected(reason) {
					assert.strictEqual(reason, rejectionReason);
					done();
				});
			});
		}

		function testCallingRejectPromiseRejectsWith(reason, stringRepresentation) {
			testCallingRejectPromise(reason, stringRepresentation, function (promise, done) {
				promise.then(null, function onPromiseRejected(rejectionReason) {
					assert.strictEqual(rejectionReason, reason);
					done();
				});
			});
		}

		describe('2.3.3: Otherwise, if `x` is an object or function,', function () {
			describe('2.3.3.1: Let `then` be `x.then`', function () {
				describe('`x` is an object with null prototype', function () {
					var numberOfTimesThenWasRetrieved = null;

					beforeEach(function () {
						numberOfTimesThenWasRetrieved = 0;
					});

					function xFactory() {
						return Object.create(null, {
							then: {
								get: function () {
									++numberOfTimesThenWasRetrieved;
									return function thenMethodForX(onFulfilled) {
										onFulfilled();
									};
								}
							}
						});
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(function () {
							assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
							done();
						});
					});
				});

				describe('`x` is an object with normal Object.prototype', function () {
					var numberOfTimesThenWasRetrieved = null;

					beforeEach(function () {
						numberOfTimesThenWasRetrieved = 0;
					});

					function xFactory() {
						return Object.create(Object.prototype, {
							then: {
								get: function () {
									++numberOfTimesThenWasRetrieved;
									return function thenMethodForX(onFulfilled) {
										onFulfilled();
									};
								}
							}
						});
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(function () {
							assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
							done();
						});
					});
				});

				describe('`x` is a function', function () {
					var numberOfTimesThenWasRetrieved = null;

					beforeEach(function () {
						numberOfTimesThenWasRetrieved = 0;
					});

					function xFactory() {
						function x() {}

						Object.defineProperty(x, 'then', {
							get: function () {
								++numberOfTimesThenWasRetrieved;
								return function thenMethodForX(onFulfilled) {
									onFulfilled();
								};
							}
						});

						return x;
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(function () {
							assert.strictEqual(numberOfTimesThenWasRetrieved, 1);
							done();
						});
					});
				});
			});

			describe('2.3.3.2: If retrieving the property `x.then` results in a thrown exception `e`, reject `promise` with ' + '`e` as the reason.', function () {
				function testRejectionViaThrowingGetter(e, stringRepresentation) {
					function xFactory() {
						return Object.create(Object.prototype, {
							then: {
								get: function () {
									throw e;
								}
							}
						});
					}

					describe('`e` is ' + stringRepresentation, function () {
						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, e);
								done();
							});
						});
					});
				}

				Object.keys(reasons).forEach(function (stringRepresentation) {
					testRejectionViaThrowingGetter(reasons[stringRepresentation], stringRepresentation);
				});
			});

			describe('2.3.3.3: If `then` is a function, call it with `x` as `this`, first argument `resolvePromise`, and ' + 'second argument `rejectPromise`', function () {
				describe('Calls with `x` as `this` and two function arguments', function () {
					function xFactory() {
						var x = {
							then: function (onFulfilled, onRejected) {
								assert.strictEqual(this, x);
								assert.strictEqual(typeof onFulfilled, 'function');
								assert.strictEqual(typeof onRejected, 'function');
								onFulfilled();
							}
						};
						return x;
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(function () {
							done();
						});
					});
				});

				describe('Uses the original value of `then`', function () {
					var numberOfTimesThenWasRetrieved = null;

					beforeEach(function () {
						numberOfTimesThenWasRetrieved = 0;
					});

					function xFactory() {
						return Object.create(Object.prototype, {
							then: {
								get: function () {
									if (numberOfTimesThenWasRetrieved === 0) {
										return function (onFulfilled) {
											onFulfilled();
										};
									}
									return null;
								}
							}
						});
					}

					testPromiseResolution(xFactory, function (promise, done) {
						promise.then(function () {
							done();
						});
					});
				});

				describe('2.3.3.3.1: If/when `resolvePromise` is called with value `y`, run `[[Resolve]](promise, y)`', function () {
					describe('`y` is not a thenable', function () {
						testCallingResolvePromiseFulfillsWith(
							function () {
								return undefined;
							},
							'`undefined`',
							undefined
						);
						testCallingResolvePromiseFulfillsWith(
							function () {
								return null;
							},
							'`null`',
							null
						);
						testCallingResolvePromiseFulfillsWith(
							function () {
								return false;
							},
							'`false`',
							false
						);
						testCallingResolvePromiseFulfillsWith(
							function () {
								return 5;
							},
							'`5`',
							5
						);
						testCallingResolvePromiseFulfillsWith(
							function () {
								return sentinel;
							},
							'an object',
							sentinel
						);
						testCallingResolvePromiseFulfillsWith(
							function () {
								return sentinelArray;
							},
							'an array',
							sentinelArray
						);
					});

					describe('`y` is a thenable', function () {
						Object.keys(thenables.fulfilled).forEach(function (stringRepresentation) {
							function yFactory() {
								return thenables.fulfilled[stringRepresentation](sentinel);
							}

							testCallingResolvePromiseFulfillsWith(yFactory, stringRepresentation, sentinel);
						});

						Object.keys(thenables.rejected).forEach(function (stringRepresentation) {
							function yFactory() {
								return thenables.rejected[stringRepresentation](sentinel);
							}

							testCallingResolvePromiseRejectsWith(yFactory, stringRepresentation, sentinel);
						});
					});

					describe('`y` is a thenable for a thenable', function () {
						Object.keys(thenables.fulfilled).forEach(function (outerStringRepresentation) {
							var outerThenableFactory = thenables.fulfilled[outerStringRepresentation];

							Object.keys(thenables.fulfilled).forEach(function (innerStringRepresentation) {
								var innerThenableFactory = thenables.fulfilled[innerStringRepresentation];

								var stringRepresentation = outerStringRepresentation + ' for ' + innerStringRepresentation;

								function yFactory() {
									return outerThenableFactory(innerThenableFactory(sentinel));
								}

								testCallingResolvePromiseFulfillsWith(yFactory, stringRepresentation, sentinel);
							});

							Object.keys(thenables.rejected).forEach(function (innerStringRepresentation) {
								var innerThenableFactory = thenables.rejected[innerStringRepresentation];

								var stringRepresentation = outerStringRepresentation + ' for ' + innerStringRepresentation;

								function yFactory() {
									return outerThenableFactory(innerThenableFactory(sentinel));
								}

								testCallingResolvePromiseRejectsWith(yFactory, stringRepresentation, sentinel);
							});
						});
					});
				});

				describe('2.3.3.3.2: If/when `rejectPromise` is called with reason `r`, reject `promise` with `r`', function () {
					Object.keys(reasons).forEach(function (stringRepresentation) {
						testCallingRejectPromiseRejectsWith(reasons[stringRepresentation](), stringRepresentation);
					});
				});

				describe('2.3.3.3.3: If both `resolvePromise` and `rejectPromise` are called, or multiple calls to the same ' + 'argument are made, the first call takes precedence, and any further calls are ignored.', function () {
					describe('calling `resolvePromise` then `rejectPromise`, both synchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									resolvePromise(sentinel);
									rejectPromise(other);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` synchronously then `rejectPromise` asynchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									resolvePromise(sentinel);

									setTimeout(function () {
										rejectPromise(other);
									}, 0);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` then `rejectPromise`, both asynchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									setTimeout(function () {
										resolvePromise(sentinel);
									}, 0);

									setTimeout(function () {
										rejectPromise(other);
									}, 0);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` with an asynchronously-fulfilled promise, then calling ' + '`rejectPromise`, both synchronously', function () {
						function xFactory() {
							var d = deferred();
							setTimeout(function () {
								d.resolve(sentinel);
							}, 50);

							return {
								then: function (resolvePromise, rejectPromise) {
									resolvePromise(d.promise);
									rejectPromise(other);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` with an asynchronously-rejected promise, then calling ' + '`rejectPromise`, both synchronously', function () {
						function xFactory() {
							var d = deferred();
							setTimeout(function () {
								d.reject(sentinel);
							}, 50);

							return {
								then: function (resolvePromise, rejectPromise) {
									resolvePromise(d.promise);
									rejectPromise(other);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});

					describe('calling `rejectPromise` then `resolvePromise`, both synchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									rejectPromise(sentinel);
									resolvePromise(other);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});

					describe('calling `rejectPromise` synchronously then `resolvePromise` asynchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									rejectPromise(sentinel);

									setTimeout(function () {
										resolvePromise(other);
									}, 0);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});

					describe('calling `rejectPromise` then `resolvePromise`, both asynchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									setTimeout(function () {
										rejectPromise(sentinel);
									}, 0);

									setTimeout(function () {
										resolvePromise(other);
									}, 0);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` twice synchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise) {
									resolvePromise(sentinel);
									resolvePromise(other);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` twice, first synchronously then asynchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise) {
									resolvePromise(sentinel);

									setTimeout(function () {
										resolvePromise(other);
									}, 0);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` twice, both times asynchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise) {
									setTimeout(function () {
										resolvePromise(sentinel);
									}, 0);

									setTimeout(function () {
										resolvePromise(other);
									}, 0);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` with an asynchronously-fulfilled promise, then calling it again, both ' + 'times synchronously', function () {
						function xFactory() {
							var d = deferred();
							setTimeout(function () {
								d.resolve(sentinel);
							}, 50);

							return {
								then: function (resolvePromise) {
									resolvePromise(d.promise);
									resolvePromise(other);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, sentinel);
								done();
							});
						});
					});

					describe('calling `resolvePromise` with an asynchronously-rejected promise, then calling it again, both ' + 'times synchronously', function () {
						function xFactory() {
							var d = deferred();
							setTimeout(function () {
								d.reject(sentinel);
							}, 50);

							return {
								then: function (resolvePromise) {
									resolvePromise(d.promise);
									resolvePromise(other);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});

					describe('calling `rejectPromise` twice synchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									rejectPromise(sentinel);
									rejectPromise(other);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});

					describe('calling `rejectPromise` twice, first synchronously then asynchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									rejectPromise(sentinel);

									setTimeout(function () {
										rejectPromise(other);
									}, 0);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});

					describe('calling `rejectPromise` twice, both times asynchronously', function () {
						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									setTimeout(function () {
										rejectPromise(sentinel);
									}, 0);

									setTimeout(function () {
										rejectPromise(other);
									}, 0);
								}
							};
						}

						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(null, function (reason) {
								assert.strictEqual(reason, sentinel);
								done();
							});
						});
					});

					describe('saving and abusing `resolvePromise` and `rejectPromise`', function () {
						var savedResolvePromise, savedRejectPromise;

						function xFactory() {
							return {
								then: function (resolvePromise, rejectPromise) {
									savedResolvePromise = resolvePromise;
									savedRejectPromise = rejectPromise;
								}
							};
						}

						beforeEach(function () {
							savedResolvePromise = null;
							savedRejectPromise = null;
						});

						testPromiseResolution(xFactory, function (promise, done) {
							var timesFulfilled = 0;
							var timesRejected = 0;

							promise.then(
								function () {
									++timesFulfilled;
								},
								function () {
									++timesRejected;
								}
							);

							if (savedResolvePromise && savedRejectPromise) {
								savedResolvePromise(dummy);
								savedResolvePromise(dummy);
								savedRejectPromise(dummy);
								savedRejectPromise(dummy);
							}

							setTimeout(function () {
								savedResolvePromise(dummy);
								savedResolvePromise(dummy);
								savedRejectPromise(dummy);
								savedRejectPromise(dummy);
							}, 50);

							setTimeout(function () {
								assert.strictEqual(timesFulfilled, 1);
								assert.strictEqual(timesRejected, 0);
								done();
							}, 100);
						});
					});
				});

				describe('2.3.3.3.4: If calling `then` throws an exception `e`,', function () {
					describe('2.3.3.3.4.1: If `resolvePromise` or `rejectPromise` have been called, ignore it.', function () {
						describe('`resolvePromise` was called with a non-thenable', function () {
							function xFactory() {
								return {
									then: function (resolvePromise) {
										resolvePromise(sentinel);
										throw other;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(function (value) {
									assert.strictEqual(value, sentinel);
									done();
								});
							});
						});

						describe('`resolvePromise` was called with an asynchronously-fulfilled promise', function () {
							function xFactory() {
								var d = deferred();
								setTimeout(function () {
									d.resolve(sentinel);
								}, 50);

								return {
									then: function (resolvePromise) {
										resolvePromise(d.promise);
										throw other;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(function (value) {
									assert.strictEqual(value, sentinel);
									done();
								});
							});
						});

						describe('`resolvePromise` was called with an asynchronously-rejected promise', function () {
							function xFactory() {
								var d = deferred();
								setTimeout(function () {
									d.reject(sentinel);
								}, 50);

								return {
									then: function (resolvePromise) {
										resolvePromise(d.promise);
										throw other;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(null, function (reason) {
									assert.strictEqual(reason, sentinel);
									done();
								});
							});
						});

						describe('`rejectPromise` was called', function () {
							function xFactory() {
								return {
									then: function (resolvePromise, rejectPromise) {
										rejectPromise(sentinel);
										throw other;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(null, function (reason) {
									assert.strictEqual(reason, sentinel);
									done();
								});
							});
						});

						describe('`resolvePromise` then `rejectPromise` were called', function () {
							function xFactory() {
								return {
									then: function (resolvePromise, rejectPromise) {
										resolvePromise(sentinel);
										rejectPromise(other);
										throw other;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(function (value) {
									assert.strictEqual(value, sentinel);
									done();
								});
							});
						});

						describe('`rejectPromise` then `resolvePromise` were called', function () {
							function xFactory() {
								return {
									then: function (resolvePromise, rejectPromise) {
										rejectPromise(sentinel);
										resolvePromise(other);
										throw other;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(null, function (reason) {
									assert.strictEqual(reason, sentinel);
									done();
								});
							});
						});
					});

					describe('2.3.3.3.4.2: Otherwise, reject `promise` with `e` as the reason.', function () {
						describe('straightforward case', function () {
							function xFactory() {
								return {
									then: function () {
										throw sentinel;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(null, function (reason) {
									assert.strictEqual(reason, sentinel);
									done();
								});
							});
						});

						describe('`resolvePromise` is called asynchronously before the `throw`', function () {
							function xFactory() {
								return {
									then: function (resolvePromise) {
										setTimeout(function () {
											resolvePromise(other);
										}, 0);
										throw sentinel;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(null, function (reason) {
									assert.strictEqual(reason, sentinel);
									done();
								});
							});
						});

						describe('`rejectPromise` is called asynchronously before the `throw`', function () {
							function xFactory() {
								return {
									then: function (resolvePromise, rejectPromise) {
										setTimeout(function () {
											rejectPromise(other);
										}, 0);
										throw sentinel;
									}
								};
							}

							testPromiseResolution(xFactory, function (promise, done) {
								promise.then(null, function (reason) {
									assert.strictEqual(reason, sentinel);
									done();
								});
							});
						});
					});
				});
			});

			describe('2.3.3.4: If `then` is not a function, fulfill promise with `x`', function () {
				function testFulfillViaNonFunction(then, stringRepresentation) {
					var x = null;

					beforeEach(function () {
						x = { then: then };
					});

					function xFactory() {
						return x;
					}

					describe('`then` is ' + stringRepresentation, function () {
						testPromiseResolution(xFactory, function (promise, done) {
							promise.then(function (value) {
								assert.strictEqual(value, x);
								done();
							});
						});
					});
				}

				testFulfillViaNonFunction(5, '`5`');
				testFulfillViaNonFunction({}, 'an object');
				testFulfillViaNonFunction([function () {}], 'an array containing a function');
				testFulfillViaNonFunction(/a-b/i, 'a regular expression');
				testFulfillViaNonFunction(Object.create(Function.prototype), 'an object inheriting from `Function.prototype`');
			});
		});
	});
	describe('2.3.4', function () {
		var dummy = { dummy: 'dummy' }; // we fulfill or reject with this when we don't intend to test against it

		describe('2.3.4: If `x` is not an object or function, fulfill `promise` with `x`', function () {
			function testValue(expectedValue, stringRepresentation, beforeEachHook, afterEachHook) {
				describe('The value is ' + stringRepresentation, function () {
					if (typeof beforeEachHook === 'function') {
						beforeEach(beforeEachHook);
					}
					if (typeof afterEachHook === 'function') {
						afterEach(afterEachHook);
					}

					testFulfilled(dummy, function (promise1, done) {
						var promise2 = promise1.then(function onFulfilled() {
							return expectedValue;
						});

						promise2.then(function onPromise2Fulfilled(actualValue) {
							assert.strictEqual(actualValue, expectedValue);
							done();
						});
					});
					testRejected(dummy, function (promise1, done) {
						var promise2 = promise1.then(null, function onRejected() {
							return expectedValue;
						});

						promise2.then(function onPromise2Fulfilled(actualValue) {
							assert.strictEqual(actualValue, expectedValue);
							done();
						});
					});
				});
			}

			testValue(undefined, '`undefined`');
			testValue(null, '`null`');
			testValue(false, '`false`');
			testValue(true, '`true`');
			testValue(0, '`0`');

			testValue(
				true,
				'`true` with `Boolean.prototype` modified to have a `then` method',
				function () {
					Boolean.prototype.then = function () {};
				},
				function () {
					delete Boolean.prototype.then;
				}
			);

			testValue(
				1,
				'`1` with `Number.prototype` modified to have a `then` method',
				function () {
					Number.prototype.then = function () {};
				},
				function () {
					delete Number.prototype.then;
				}
			);
		});
	});
});
describe('Evil promises should not be able to break invariants', function () {
	'use strict';

	specify('resolving to a promise that calls onFulfilled twice', function (done) {
		// note that we have to create a trivial subclass, as otherwise the
		// Promise.resolve(evilPromise) is just the identity function.
		// (And in fact, most native Promise implementations use a private
		// [[PromiseConstructor]] field in `Promise.resolve` which can't be
		// easily patched in an ES5 engine, so instead of
		// `Promise.resolve(evilPromise)` we'll use
		// `new Promise(function(r){r(evilPromise);})` below.)
		var EvilPromise = function (executor) {
			var self = new Promise(executor);
			Object.setPrototypeOf(self, EvilPromise.prototype);
			return self;
		};
		if (!hasNativeSetPrototypeOf) {
			return done();
		} // skip test if on IE < 11
		Object.setPrototypeOf(EvilPromise, Promise);
		EvilPromise.prototype = Object.create(Promise.prototype, {
			constructor: { value: EvilPromise }
		});

		var evilPromise = EvilPromise.resolve();
		evilPromise.then = function (f) {
			f(1);
			f(2);
		};

		var calledAlready = false;
		new Promise(function (r) {
			r(evilPromise);
		})
			.then(function (value) {
				proclaim.strictEqual(calledAlready, false);
				calledAlready = true;
				proclaim.strictEqual(value, 1);
			})
			.then(done, done);
	});
});

describe('Promise.all', function () {
	'use strict';

	it('should not be enumerable', function () {
		proclaim.isNotEnumerable(Promise, 'all');
	});

	it('fulfills if passed an empty array', function (done) {
		var iterable = [];

		Promise.all(iterable)
			.then(function (value) {
				proclaim(Array.isArray(value));
				proclaim.deepEqual(value, []);
			})
			.then(done, failIfThrows(done));
	});

	it('fulfills if passed an empty array-like', function (done) {
		var f = function () {
			Promise.all(arguments)
				.then(function (value) {
					proclaim(Array.isArray(value));
					proclaim.deepEqual(value, []);
				})
				.then(done, failIfThrows(done));
		};
		f();
	});

	it('fulfills if passed an array of mixed fulfilled promises and values', function (done) {
		var iterable = [0, Promise.resolve(1), 2, Promise.resolve(3), 4];

		Promise.all(iterable)
			.then(function (value) {
				proclaim(Array.isArray(value));
				proclaim.deepEqual(value, [0, 1, 2, 3, 4]);
			})
			.then(done, failIfThrows(done));
	});

	it('rejects if any passed promise is rejected', function (done) {
		var foreverPending = new Promise(function () {});
		var error = new Error('Rejected');
		var rejected = Promise.reject(error);

		var iterable = [foreverPending, rejected];

		Promise.all(iterable)
			.then(
				function () {
					proclaim(false, 'should never get here');
				},
				function (reason) {
					proclaim.strictEqual(reason, error);
				}
			)
			.then(done, failIfThrows(done));
	});

	it('resolves foreign thenables', function (done) {
		var normal = Promise.resolve(1);
		var foreign = {
			then: function (f) {
				f(2);
			}
		};

		var iterable = [normal, foreign];

		Promise.all(iterable)
			.then(function (value) {
				proclaim.deepEqual(value, [1, 2]);
			})
			.then(done, failIfThrows(done));
	});

	it('fulfills when passed an sparse array, giving `undefined` for the omitted values', function (done) {
		/* eslint-disable no-sparse-arrays */
		var iterable = [Promise.resolve(0), , , Promise.resolve(1)];
		/* eslint-enable no-sparse-arrays */

		Promise.all(iterable)
			.then(function (value) {
				proclaim.deepEqual(value, [0, undefined, undefined, 1]);
			})
			.then(done, failIfThrows(done));
	});

	it('does not modify the input array', function (done) {
		var input = [0, 1];
		var iterable = input;

		Promise.all(iterable)
			.then(function (value) {
				proclaim.notStrictEqual(input, value);
			})
			.then(done, failIfThrows(done));
	});

	it('should reject with a TypeError if given a non-iterable', function (done) {
		var notIterable = {};

		Promise.all(notIterable)
			.then(
				function () {
					proclaim(false, 'should never get here');
				},
				function (reason) {
					proclaim(reason instanceof TypeError);
				}
			)
			.then(done, failIfThrows(done));
	});

	// test cases from
	// https://github.com/domenic/promises-unwrapping/issues/89#issuecomment-33110203
	var tamper = function (p) {
		// eslint-disable-next-line no-param-reassign
		p.then = function (fulfill, reject) {
			fulfill('tampered');
			return Promise.prototype.then.call(this, fulfill, reject);
		};
		return p;
	};

	it('should be robust against tampering (1)', function (done) {
		var g = [tamper(Promise.resolve(0))];
		// Prevent countdownHolder.[[Countdown]] from ever reaching zero
		Promise.all(g).then(function () {
			done();
		}, failIfThrows(done));
	});

	it('should be robust against tampering (2)', function (done) {
		// Promise from Promise.all resolved before arguments
		var fulfillCalled = false;

		var g = [
			Promise.resolve(0),
			tamper(Promise.resolve(1)),
			Promise.resolve(2)
				.then(function () {
					proclaim(!fulfillCalled, 'should be resolved before all()');
				})
				.then(function () {
					proclaim(!fulfillCalled, 'should be resolved before all()');
				})['catch'](failIfThrows(done))
		];
		Promise.all(g)
			.then(function () {
				proclaim(!fulfillCalled, 'should be resolved last');
				fulfillCalled = true;
			})
			.then(done, failIfThrows(done));
	});

	it('should be robust against tampering (3)', function (done) {
		var g = [Promise.resolve(0), tamper(Promise.resolve(1)), Promise.reject(2)];
		// Promise from Promise.all resolved despite rejected promise in arguments
		Promise.all(g)
			.then(
				function () {
					throw new Error('should not reach here!');
				},
				function (e) {
					proclaim.strictEqual(e, 2);
				}
			)
			.then(done, failIfThrows(done));
	});

	it('should be robust against tampering (4)', function (done) {
		var hijack = true;
		var actualArguments = [];
		var P = function (resolver) {
			var self;
			if (hijack) {
				hijack = false;
				self = new Promise(function (resolve, reject) {
					return resolver(function (values) {
						// record arguments & # of times resolve function is called
						actualArguments.push(values.slice());
						return resolve(values);
					}, reject);
				});
			} else {
				self = new Promise(resolver);
			}
			Object.setPrototypeOf(self, P.prototype);
			return self;
		};
		if (!hasNativeSetPrototypeOf) {
			return done();
		} // skip test if on IE < 11
		Object.setPrototypeOf(P, Promise);
		P.prototype = Object.create(Promise.prototype, {
			constructor: { value: P }
		});
		P.resolve = function (p) {
			return p;
		};

		var g = [Promise.resolve(0), tamper(Promise.resolve(1)), Promise.resolve(2)];

		// Promise.all calls resolver twice
		P.all(g)['catch'](failIfThrows(done));
		Promise.resolve()
			.then(function () {
				proclaim.deepEqual(actualArguments, [[0, 'tampered', 2]]);
			})
			.then(done, failIfThrows(done));
	});
});
describe('Support user subclassing of Promise', function () {
	'use strict';

	it('should work if you do it right', function (done) {
		// This is the "correct" es6-compatible way.
		// (Thanks, @domenic and @zloirock!)
		var MyPromise = function (executor) {
			var self = new Promise(executor);
			Object.setPrototypeOf(self, MyPromise.prototype);
			self.mine = 'yeah';
			return self;
		};
		if (!hasNativeSetPrototypeOf) {
			return done();
		} // skip test if on IE < 11
		Object.setPrototypeOf(MyPromise, Promise);
		MyPromise.prototype = Object.create(Promise.prototype, {
			constructor: { value: MyPromise }
		});

		// let's try it!
		var p1 = MyPromise.resolve(5);
		proclaim.strictEqual(p1.mine, 'yeah');
		p1 = p1.then(function (x) {
			proclaim.strictEqual(x, 5);
		});
		proclaim.strictEqual(p1.mine, 'yeah');

		var p2 = new MyPromise(function (r) {
			r(6);
		});
		proclaim.strictEqual(p2.mine, 'yeah');
		p2 = p2.then(function (x) {
			proclaim.strictEqual(x, 6);
		});
		proclaim.strictEqual(p2.mine, 'yeah');

		var p3 = MyPromise.all([p1, p2]);
		proclaim.strictEqual(p3.mine, 'yeah');
		p3.then(function () {
			done();
		}, done);
	});

	it("should throw if you don't inherit at all", function () {
		var MyPromise = function () {};
		proclaim['throws'](function () {
			Promise.all.call(MyPromise, []);
		}, TypeError);
	});
});

describe('finally', function () {
	it('is a function', function () {
		proclaim.isFunction(Promise.prototype['finally']);
	});

	it('has correct arity', function () {
		proclaim.arity(Promise.prototype['finally'], 1);
	});

	it('is not enumerable', function () {
		proclaim.isNotEnumerable(Promise.prototype, 'finally');
	});
	it("does not take any arguments", function () {
		return Promise.resolve("ok")['finally'](function (val) {
			proclaim.equal(val, undefined);
		});
	});

	it("can throw errors and be caught", function () {
		return Promise.resolve("ok")['finally'](function () {
			throw "error";
		})['catch'](function (e) {
			proclaim.equal(e, 'error');
		});
	});

	it("resolves with resolution value if finally method doesn't throw", function () {
		return Promise.resolve("ok")['finally'](function () {
		}).then(function (val) {
			proclaim.equal(val, 'ok');
		});
	});

	it("rejects with rejection value if finally method doesn't throw", function () {
		return Promise.reject("error")['finally'](function () {
		})['catch'](function (val) {
			proclaim.equal(val, 'error');
		});
	});

	it('when resolved, only calls finally once', function () {
		var called = 0;
		return Promise.resolve(42)['finally'](function () {
			called++;
		}).then(function () {
			proclaim.strictEqual(called, 1);
		});
	});

	it('when rejected, only calls finally once', function () {
		var called = 0;
		return Promise.reject(42)['finally'](function () {
			called++;
		})['catch'](function () {
			proclaim.strictEqual(called, 1);
		});
	});
});

// These tests are taken from https://github.com/tc39/proposal-promise-finally/blob/master/test/test.js
// Licensed under MIT
var someRejectionReason = { message: 'some rejection reason' };
var anotherReason = { message: 'another rejection reason' };

describe('onFinally', function() {
	this.timeout(10000);
	describe('no callback', function() {
		specify('from resolved', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})['finally']()
				.then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function() {
			return Promise.reject(someRejectionReason)['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})['finally']()
				.then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(reason) {
					proclaim.strictEqual(reason, someRejectionReason);
				});
		});
	});

	describe('throws an exception', function() {
		specify('from resolved', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					throw someRejectionReason;
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(reason) {
					proclaim.strictEqual(reason, someRejectionReason);
				});
		});

		specify('from rejected', function() {
			return Promise.reject(anotherReason)['finally'](function onFinally() {
				proclaim.ok(arguments.length === 0);
				throw someRejectionReason;
			}).then(function onFulfilled() {
				throw new Error('should not be called');
			}, function onRejected(reason) {
				proclaim.strictEqual(reason, someRejectionReason);
			});
		});
	});

	describe('returns a non-promise', function() {
		specify('from resolved', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return 4;
				}).then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function() {
			return Promise.reject(anotherReason)['catch'](function(e) {
					proclaim.strictEqual(e, anotherReason);
					throw e;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					throw someRejectionReason;
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, someRejectionReason);
				});
		});
	});

	describe('returns a pending-forever promise', function() {
		specify('from resolved', function(done) {
			Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 0.1e3);
					return new Promise(function() {}); // forever pending
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function(done) {
			Promise.reject(someRejectionReason)['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 0.1e3);
					return new Promise(function() {}); // forever pending
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});
	});

	describe('returns an immediately-fulfilled promise', function() {
		specify('from resolved', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return Promise.resolve(4);
				}).then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function() {
			return Promise.reject(someRejectionReason)['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return Promise.resolve(4);
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, someRejectionReason);
				});
		});
	});

	describe('returns an immediately-rejected promise', function() {
		specify('from resolved ', function() {
			return Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return Promise.reject(4);
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, 4);
				});
		});

		specify('from rejected', function() {
			var newReason = {};
			return Promise.reject(someRejectionReason)['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					return Promise.reject(newReason);
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, newReason);
				});
		});
	});

	describe('returns a fulfilled-after-a-second promise', function() {
		specify('from resolved', function(done) {
			Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new Promise(function(resolve) {
						setTimeout(function() { return resolve(4);}, 1e3);
					});
				}).then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function(done) {
			Promise.reject(3)['catch'](function(e) {
					proclaim.strictEqual(e, 3);
					throw e;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new Promise(function(resolve) {
						setTimeout(function() { return resolve(4);}, 1e3);
					});
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, 3);
				});
		});
	});

	describe('returns a rejected-after-a-second promise', function() {
		specify('from resolved', function(done) {
			Promise.resolve(3)
				.then(function(x) {
					proclaim.strictEqual(x, 3);
					return x;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new Promise(function(resolve, reject) {
						setTimeout(function() { return reject(4);}, 1e3);
					});
				}).then(function onFulfilled(x) {
					proclaim.strictEqual(x, 3);
				}, function onRejected() {
					throw new Error('should not be called');
				});
		});

		specify('from rejected', function(done) {
			Promise.reject(someRejectionReason)['catch'](function(e) {
					proclaim.strictEqual(e, someRejectionReason);
					throw e;
				})['finally'](function onFinally() {
					proclaim.ok(arguments.length === 0);
					setTimeout(done, 1.5e3);
					return new Promise(function(resolve, reject) {
						setTimeout(function() { return reject(anotherReason);}, 1e3);
					});
				}).then(function onFulfilled() {
					throw new Error('should not be called');
				}, function onRejected(e) {
					proclaim.strictEqual(e, anotherReason);
				});
		});
	});
});
