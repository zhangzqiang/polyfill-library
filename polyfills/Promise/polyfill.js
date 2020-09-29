/* global AggregateError, CreateDataProperty, OrdinaryObjectCreate, CreateMethodProperty, PromiseResolve, Type, IteratorClose, NewPromiseCapability, Invoke, GetIterator, CreateBuiltinFunction, IsCallable, OrdinaryCreateFromConstructor, CreateResolvingFunctions, Call, Get, IteratorStep, IteratorValue, PerformPromiseThen SpeciesConstructor IsPromise*/
// @ts-nocheck
(function (global) {
	// 26.6.3.1 Promise ( executor )
	function Promise(executor) {
		// 1. If NewTarget is undefined, throw a TypeError exception.
		if (this instanceof Promise === false) {
			throw TypeError('Constructor Promise requires "new"');
		} else if (this && this.PromiseState) {
			throw new TypeError('Bad construction');
		}
		// 2. If IsCallable(executor) is false, throw a TypeError exception.
		if (IsCallable(executor) === false) {
			throw TypeError(executor + ' is not a function');
		}
		// 3. Let promise be ? OrdinaryCreateFromConstructor(NewTarget, "%Promise.prototype%", « [[PromiseState]], [[PromiseResult]], [[PromiseFulfillReactions]], [[PromiseRejectReactions]], [[PromiseIsHandled]] »).
		var promise = OrdinaryCreateFromConstructor(this, Promise.prototype, ['PromiseState', 'PromiseResult', 'PromiseFulfillReactions', 'PromiseRejectReactions', 'PromiseIsHandled']);
		// 4. Set promise.[[PromiseState]] to pending.
		promise.PromiseState = 'pending';
		// 5. Set promise.[[PromiseFulfillReactions]] to a new empty List.
		promise.PromiseFulfillReactions = [];
		// 6. Set promise.[[PromiseFulfillReactions]] to a new empty List.
		promise.PromiseRejectReactions = [];
		// 7. Set promise.[[PromiseIsHandled]] to false.
		promise.PromiseIsHandled = false;
		// 8. Let resolvingFunctions be CreateResolvingFunctions(promise).
		var resolvingFunctions = CreateResolvingFunctions(promise);
		// 9. Let completion be Call(executor, undefined, « resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]] »).
		try {
			Call(executor, undefined, [resolvingFunctions.Resolve, resolvingFunctions.Reject]);
			// 10. If completion is an abrupt completion, then
		} catch (error) {
			// a. Perform ? Call(resolvingFunctions.[[Reject]], undefined, « completion.[[Value]] »).
			Call(resolvingFunctions.Reject, undefined, [error]);
		}
		// 11. Return promise.
		return promise;
	}

	// 26.6.4.1.1 Runtime Semantics: GetPromiseResolve ( promiseConstructor )
	function GetPromiseResolve(promiseConstructor) {
		// 1. Assert: IsConstructor(promiseConstructor) is true.
		// Assert(IsConstructor(promiseConstructor) === true);
		// 2. Let promiseResolve be ? Get(promiseConstructor, "resolve").
		var promiseResolve = Get(promiseConstructor, 'resolve');
		// 3. If IsCallable(promiseResolve) is false, throw a TypeError exception.
		if (IsCallable(promiseResolve) === false) {
			throw TypeError(promiseResolve + ' is not a function');
		}
		// 4. Return promiseResolve.
		return promiseResolve;
	}

	// 26.6.4.1.2 Runtime Semantics: PerformPromiseAll ( iteratorRecord, constructor, resultCapability, promiseResolve )
	function PerformPromiseAll(iteratorRecord, constructor, resultCapability, promiseResolve) {
		// 1. Assert: IsConstructor(constructor) is true.
		// Assert(IsConstructor(constructor) === true);
		// 2. Assert: resultCapability is a PromiseCapability Record.
		// Assert(resultCapability instanceof PromiseCapabilityRecord);
		// 3. Assert: IsCallable(promiseResolve) is true.
		// Assert(IsCallable(promiseResolve) === true);
		// 4. Let values be a new empty List.
		var values = [];
		// 5. Let remainingElementsCount be the Record { [[Value]]: 1 }.
		var remainingElementsCount = {count: 1};
		// 6. Let index be 0.
		var index = 0;
		// 7. Repeat,
		// eslint-disable-next-line no-constant-condition
		while (true) {
			// 7.a. Let next be IteratorStep(iteratorRecord).
			try {
				var next = IteratorStep(iteratorRecord);
				// 7.b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
			} catch (error) {
				if (iteratorRecord) iteratorRecord.Done = true;
				// 7.c. ReturnIfAbrupt(next).
				throw error;
			}
			// 7.d. If next is false, then
			if (next === false) {
				// 7.d.i. Set iteratorRecord.[[Done]] to true.
				iteratorRecord.Done = true;
				// 7.d.ii. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] - 1.
				remainingElementsCount.count -= 1;
				// 7.d.iii. If remainingElementsCount.[[Value]] is 0, then
				if (remainingElementsCount.count === 0) {
					// 7.d.iii.1. Let valuesArray be ! CreateArrayFromList(values).
					var valuesArray = values;
					// 7.d.iii.2. Perform ? Call(resultCapability.[[Resolve]], undefined, « valuesArray »).
					Call(resultCapability.Resolve, undefined, [valuesArray]);
				}
				// 7.d.iv. Return resultCapability.[[Promise]].
				return resultCapability.Promise;
			}
			// 7.e. Let nextValue be IteratorValue(next).
			try {
				var nextValue = IteratorValue(next);
				// 7.f. If nextValue is an abrupt completion, set iteratorRecord.[[Done]] to true.
			} catch (error) {
				if (iteratorRecord) iteratorRecord.Done = true;
				// 7.g. ReturnIfAbrupt(nextValue).
				throw error;
			}
			// 7.h. Append undefined to values.
			values.push(undefined);
			// 7.i. Let nextPromise be ? Call(promiseResolve, constructor, « nextValue »).
			var nextPromise = Call(promiseResolve, constructor, [nextValue]);
			// 7.j. Let steps be the algorithm steps defined in Promise.all Resolve Element Functions.
			// var steps = PromiseAllResolveElementFunctions;
			// 7.k. Let resolveElement be ! CreateBuiltinFunction(steps, « [[AlreadyCalled]], [[Index]], [[Values]], [[Capability]], [[RemainingElements]] »).
			// var resolveElement = CreateBuiltinFunction(steps, [
			// 	"AlreadyCalled",
			// 	"Index",
			// 	"Values",
			// 	"Capability",
			// 	"RemainingElements"
			// ]);
			// 26.6.4.1.3 Promise.all Resolve Element Functions
			var resolveElement = (function(){
				// 7.l. Set resolveElement.[[AlreadyCalled]] to the Record { [[Value]]: false }.
				var AlreadyCalled = {called: false};
				// 7.m. Set resolveElement.[[Index]] to index.
				var Index = index;
				// 7.n. Set resolveElement.[[Values]] to values.
				var Values = values;
				// 7.o. Set resolveElement.[[Capability]] to resultCapability.
				var Capability = resultCapability;
				// 7.p. Set resolveElement.[[RemainingElements]] to remainingElementsCount.
				var RemainingElements = remainingElementsCount;
				// 7.q. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] + 1.
				remainingElementsCount.count += 1;
				return function PromiseAllResolveElementFunctions(x) {
				// 1. Let F be the active function object.
				// var F = resolveElement;
				// 2. Let alreadyCalled be F.[[AlreadyCalled]].
				var alreadyCalled = AlreadyCalled;
				// 3. If alreadyCalled.[[Value]] is true, return undefined.
				if (alreadyCalled.called === true) {
					return undefined;
				}
				// 4. Set alreadyCalled.[[Value]] to true.
				alreadyCalled.called = true;
				// 5. Let index be F.[[Index]].
				var index = Index;
				// 6. Let values be F.[[Values]].
				var values = Values;
				// 7. Let promiseCapability be F.[[Capability]].
				var promiseCapability = Capability;
				// 8. Let remainingElementsCount be F.[[RemainingElements]].
				var remainingElementsCount = RemainingElements;
				// 9. Set values[index] to x.
				values[index] = x;
				// 10. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] - 1.
				remainingElementsCount.count -= 1;
				// 11. If remainingElementsCount.[[Value]] is 0, then
				if (remainingElementsCount.count === 0) {
					// 11.a. Let valuesArray be ! CreateArrayFromList(values).
					var valuesArray = values;
					// 11.b. Return ? Call(promiseCapability.[[Resolve]], undefined, « valuesArray »).
					return Call(promiseCapability.Resolve, undefined, [valuesArray]);
				}
				// 12. Return undefined.
				return undefined;
			};
		}());
			// 7.r. Perform ? Invoke(nextPromise, "then", « resolveElement, resultCapability.[[Reject]] »).
			Invoke(nextPromise, 'then', [resolveElement, resultCapability.Reject]);
			// 7.s. Set index to index + 1.
			index += 1;
		}
	}

	// 26.6.4.1 Promise.all ( iterable )
	CreateMethodProperty(Promise, 'all', function all(iterable) {
		// 1. Let C be the this
		var C = this;
		// 2. Let promiseCapability be ? NewPromiseCapability(C).
		var promiseCapability = NewPromiseCapability(C);
		// 3. Let promiseResolve be GetPromiseResolve(C).
		try {
			var promiseResolve = GetPromiseResolve(C);
			// 4. IfAbruptRejectPromise(promiseResolve, promiseCapability).
		} catch (error) {
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 5. Let iteratorRecord be GetIterator(iterable).
		try {
			var iteratorRecord = GetIterator(iterable);
			// 6. IfAbruptRejectPromise(iteratorRecord, promiseCapability).
		} catch (error) {
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 7. Let result be PerformPromiseAll(iteratorRecord, C, promiseCapability, promiseResolve).
		try {
			var result = PerformPromiseAll(iteratorRecord, C, promiseCapability, promiseResolve);
			// 8. If result is an abrupt completion, then
		} catch (error) {
			// 8.a. If iteratorRecord.[[Done]] is false, set result to IteratorClose(iteratorRecord, result).
			if (iteratorRecord && iteratorRecord.Done === false) {
				result = IteratorClose(iteratorRecord, error);
			}
			// 8.b. IfAbruptRejectPromise(result, promiseCapability).
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 9. Return Completion(result).
		return result;
	});

	// 26.6.4.2.1 Runtime Semantics: PerformPromiseAllSettled ( iteratorRecord, constructor, resultCapability, promiseResolve )
	function PerformPromiseAllSettled(iteratorRecord, constructor, resultCapability, promiseResolve) {
		// 1. Assert: ! IsConstructor(constructor) is true.
		// Assert(IsConstructor(constructor) === true);
		// 2. Assert: resultCapability is a PromiseCapability Record.
		// Assert(resultCapability instanceof PromiseCapabilityRecord);
		// 3. Assert: IsCallable(promiseResolve) is true.
		// Assert(IsCallable(promiseResolve) === true);
		// 4. Let values be a new empty List.
		var values = [];
		// 5. Let remainingElementsCount be the Record { [[Value]]: 1 }.
		var remainingElementsCount = {count:1};
		// 6. Let index be 0.
		var index = 0;
		// 7. Repeat,
		// eslint-disable-next-line no-constant-condition
		while (true) {
			// 7.a. Let next be IteratorStep(iteratorRecord).
			try {
				var next = IteratorStep(iteratorRecord);
				// 7.b. Let next be IteratorStep(iteratorRecord).
			} catch (error) {
				if (iteratorRecord) iteratorRecord.Done = true;
				// 7.c. ReturnIfAbrupt(next).
				return next;
			}
			// 7.d. If next is false,
			if (next === false) {
				// 7.d.i. Set iteratorRecord.[[Done]] to true.
				iteratorRecord.Done = true;
				// 7.d.ii. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] - 1.
				remainingElementsCount.count -= 1;
				// 7.d.iii. If remainingElementsCount.[[Value]] is 0, then
				if (remainingElementsCount.count === 0) {
					// 7.d.iii.1. Let valuesArray be ! CreateArrayFromList(values).
					var valuesArray = values;
					// 7.d.iii.2. Perform ? Call(resultCapability.[[Resolve]], undefined, « valuesArray »).
					Call(resultCapability.Resolve, undefined, [valuesArray]);
				}
				// 7.d.iv. Return resultCapability.[[Promise]].
				return resultCapability.Promise;
			}
			// 7.e. Let nextValue be IteratorValue(next).
			try {
				var nextValue = IteratorValue(next);
				// 7.f. If nextValue is an abrupt completion, set iteratorRecord.[[Done]] to true.
			} catch (error) {
				if (iteratorRecord) iteratorRecord.Done = true;
				// 7.g. ReturnIfAbrupt(nextValue).
				return nextValue;
			}
			// 7.h. Append undefined to values.
			values.push(undefined);
			// 7.i. Let nextPromise be ? Call(promiseResolve, constructor, « nextValue »).
			var nextPromise = Call(promiseResolve, constructor, [nextValue]);
			// 7.j. Let steps be the algorithm steps defined in Promise.allSettled Resolve Element Functions.
			// var steps = PromiseAllSettledResolveElementFunctions;
			// 7.k. Let resolveElement be ! CreateBuiltinFunction(steps, « [[AlreadyCalled]], [[Index]], [[Values]], [[Capability]], [[RemainingElements]] »).
			// var resolveElement = CreateBuiltinFunction(steps, ['AlreadyCalled', 'Index', 'Values', 'Capability', 'RemainingElements']);
			// 7.l. Let alreadyCalled be the Record { [[Value]]: false }.
			var alreadyCalled = {called:false};
			var resolveElement = (function(){
				// 26.6.4.2.2 Promise.allSettled Resolve Element Functions
				function PromiseAllSettledResolveElementFunctions(x) {
					// 1. Let F be the active function object.
					var F = PromiseAllSettledResolveElementFunctions;
					// 2. Let alreadyCalled be F.[[AlreadyCalled]].
					var alreadyCalled = F.AlreadyCalled;
					// 3. If alreadyCalled.[[Value]] is true, return undefined.
					if (alreadyCalled.called === true) {
						return undefined;
					}
					// 4. Set alreadyCalled.[[Value]] to true.
					alreadyCalled.called = true;
					// 5. Let index be F.[[Index]].
					var index = F.Index;
					// 6. Let values be F.[[Values]].
					var values = F.Values;
					// 7. Let promiseCapability be F.[[Capability]].
					var promiseCapability = F.Capability;
					// 8. Let remainingElementsCount be F.[[RemainingElements]].
					var remainingElementsCount = F.RemainingElements;
					// 9. Let obj be ! OrdinaryObjectCreate(%Object.prototype%).
					var obj = OrdinaryObjectCreate(Object.prototype);
					// 10. Perform ! CreateDataPropertyOrThrow(obj, "status", "fulfilled").
					CreateDataProperty(obj, 'status', 'fulfilled');
					// 11. Perform ! CreateDataPropertyOrThrow(obj, "value", x).
					CreateDataProperty(obj, 'value', x);
					// 12. Set values[index] to obj.
					values[index] = obj;
					// 13. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] - 1.
					remainingElementsCount.count -= 1;
					// 14. If remainingElementsCount.[[Value]] is 0, then
					if (remainingElementsCount.count === 0) {
						// 14.a. Let valuesArray be ! CreateArrayFromList(values).
						var valuesArray = values;
						// 14.b. Return ? Call(promiseCapability.[[Resolve]], undefined, « valuesArray »).
						return Call(promiseCapability.Resolve, undefined, [valuesArray]);
					}
					// 15. Return undefined.
					return undefined;
				}
				// 7.m. Set resolveElement.[[AlreadyCalled]] to alreadyCalled.
				PromiseAllSettledResolveElementFunctions.AlreadyCalled = alreadyCalled;
				// 7.n. Set resolveElement.[[Index]] to index.
				PromiseAllSettledResolveElementFunctions.Index = index;
				// 7.o. Set resolveElement.[[Values]] to values.
				PromiseAllSettledResolveElementFunctions.Values = values;
				// 7.p. Set resolveElement.[[Capability]] to resultCapability.
				PromiseAllSettledResolveElementFunctions.Capability = resultCapability;
				// 7.q. Set resolveElement.[[RemainingElements]] to remainingElementsCount.
				PromiseAllSettledResolveElementFunctions.RemainingElements = remainingElementsCount;
				return PromiseAllSettledResolveElementFunctions;
			});
			// 7.r. Let rejectSteps be the algorithm steps defined in Promise.allSettled Reject Element Functions.
			// var rejectSteps = PromiseAllSettledRejectElementFunctions;
			// 7.s. Let rejectElement be ! CreateBuiltinFunction(rejectSteps, « [[AlreadyCalled]], [[Index]], [[Values]], [[Capability]], [[RemainingElements]] »).
			// var rejectElement = CreateBuiltinFunction(rejectSteps, ['AlreadyCalled', 'Index', 'Values', 'Capability', 'RemainingElements']);
			var rejectElement = (function(){
				// 26.6.4.2.3 Promise.allSettled Reject Element Functions
				function PromiseAllSettledRejectElementFunctions(x) {
					// 1. Let F be the active function object.
					var F = PromiseAllSettledRejectElementFunctions;
					// 2. Let alreadyCalled be F.[[AlreadyCalled]].
					var alreadyCalled = F.AlreadyCalled;
					// 3. If alreadyCalled.[[Value]] is true, return undefined.
					if (alreadyCalled.called === true) {
						return undefined;
					}
					// 4. Set alreadyCalled.[[Value]] to true.
					alreadyCalled.called = true;
					// 5. Let index be F.[[Index]].
					var index = F.Index;
					// 6. Let values be F.[[Values]].
					var values = F.Values;
					// 7. Let promiseCapability be F.[[Capability]].
					var promiseCapability = F.Capability;
					// 8. Let remainingElementsCount be F.[[RemainingElements]].
					var remainingElementsCount = F.RemainingElements;
					// 9. Let obj be ! OrdinaryObjectCreate(%Object.prototype%).
					var obj = OrdinaryObjectCreate(Object.prototype);
					// 10. Perform ! CreateDataPropertyOrThrow(obj, "status", "rejected").
					CreateDataProperty(obj, 'status', 'rejected');
					// 11. Perform ! CreateDataPropertyOrThrow(obj, "reason", x).
					CreateDataProperty(obj, 'reason', x);
					// 12. Set values[index] to obj.
					values[index] = obj;
					// 13. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] - 1.
					remainingElementsCount.count -= 1;
					// 14. If remainingElementsCount.[[Value]] is 0, then
					if (remainingElementsCount.count === 0) {
						// 14.a. Let valuesArray be ! CreateArrayFromList(values).
						var valuesArray = values;
						// 14.b. Return ? Call(promiseCapability.[[Resolve]], undefined, « valuesArray »).
						return Call(promiseCapability.Resolve, undefined, [valuesArray]);
					}
					// 15. Return undefined.
					return undefined;
				}
				// 7.t. Set rejectElement.[[AlreadyCalled]] to alreadyCalled.
				PromiseAllSettledRejectElementFunctions.AlreadyCalled = alreadyCalled;
				// 7.u. Set rejectElement.[[Index]] to index.
				PromiseAllSettledRejectElementFunctions.Index = index;
				// 7.v. Set rejectElement.[[Values]] to values.
				PromiseAllSettledRejectElementFunctions.Values = values;
				// 7.w. Set rejectElement.[[Capability]] to resultCapability.
				PromiseAllSettledRejectElementFunctions.Capability = resultCapability;
				// 7.x. Set rejectElement.[[RemainingElements]] to remainingElementsCount.
				PromiseAllSettledRejectElementFunctions.RemainingElements = remainingElementsCount;
				return PromiseAllSettledRejectElementFunctions;
			});
			// 7.y. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] + 1.
			remainingElementsCount.count += 1;
			// 7.z. Perform ? Invoke(nextPromise, "then", « resolveElement, rejectElement »).
			Invoke(nextPromise, 'then', [resolveElement, rejectElement]);
			// 7.aa. Set index to index + 1.
			index += 1;
		}
	}

	// 26.6.4.2 Promise.allSettled ( iterable )
	CreateMethodProperty(Promise, 'allSettled', function allSettled(iterable) {
		// 1. Let C be the this
		var C = this;
		// 2. Let promiseCapability be ? NewPromiseCapability(C).
		var promiseCapability = NewPromiseCapability(C);
		// 3. Let promiseResolve be GetPromiseResolve(C).
		try {
			var promiseResolve = GetPromiseResolve(C);
			// 4. IfAbruptRejectPromise(promiseResolve, promiseCapability).
		} catch (error) {
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 5. Let iteratorRecord be GetIterator(iterable).
		try {
			var iteratorRecord = GetIterator(iterable);
			// 6. IfAbruptRejectPromise(iteratorRecord, promiseCapability).
		} catch (error) {
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 7. Let result be PerformPromiseAllSettled(iteratorRecord, C, promiseCapability, promiseResolve).
		try {
			var result = PerformPromiseAllSettled(iteratorRecord, C, promiseCapability, promiseResolve);
			// 8. If result is an abrupt completion, then
		} catch (error) {
			// 8.a. If iteratorRecord.[[Done]] is false, set result to IteratorClose(iteratorRecord, result).
			if (iteratorRecord && iteratorRecord.Done === false) {
				result = IteratorClose(iteratorRecord, error);
			}
			// 8.b. IfAbruptRejectPromise(result, promiseCapability).
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 9. Return Completion(result).
		return result;
	});

	// 26.6.4.3.1 Runtime Semantics: PerformPromiseAny ( iteratorRecord, constructor, resultCapability, promiseResolve )
	function PerformPromiseAny(iteratorRecord, constructor, resultCapability, promiseResolve) {
		// 1. Assert: ! IsConstructor(constructor) is true.
		// Assert(IsConstructor(constructor) === true);
		// 2. Assert: resultCapability is a PromiseCapability Record.
		// Assert(resultCapability instanceof PromiseCapabilityRecord);
		// 3. Assert: ! IsCallable(promiseResolve) is true.
		// Assert(IsCallable(promiseResolve) === true);
		// 4. Let errors be a new empty List.
		var errors = [];
		// 5. Let remainingElementsCount be a new Record { [[Value]]: 1 }.
		var remainingElementsCount = {count:1};
		// 6. Let index be 0.
		var index = 0;
		// 7. Repeat,
		// eslint-disable-next-line no-constant-condition
		while (true) {
			// 7.a. Let next be IteratorStep(iteratorRecord).
			try {
				var next = IteratorStep(iteratorRecord);
				// 7.b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
			} catch (error_) {
				if (iteratorRecord) iteratorRecord.Done = true;
				// 7.c. ReturnIfAbrupt(next).
				throw error_;
			}
			// 7.d. If next is false, then
			if (next === false) {
				// 7.d.i. Set iteratorRecord.[[Done]] to true.
				iteratorRecord.Done = true;
				// 7.d.ii. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] - 1.
				remainingElementsCount.count -= 1;
				// 7.d.iii. If remainingElementsCount.[[Value]] is 0, then
				if (remainingElementsCount.count === 0) {
					// 7.d.iii.1. Let error be a newly created AggregateError object.
					var error = new AggregateError('PromiseAnyRejected');
					// 7.d.iii.2. Perform ! DefinePropertyOrThrow(error, "errors", Property Descriptor { [[Configurable]]: true, [[Enumerable]]: false, [[Writable]]: true, [[Value]]: errors }).
					Object.defineProperty(error, 'errors', {
						configurable: true,
						enmerable: false,
						writable: true,
						value: errors
					});
					// 7.d.iii.3. Return ThrowCompletion(error).
					throw error;
				}
				// 7.d.iii.iv. Return resultCapability.[[Promise]].
				return resultCapability.Promise;
			}
			// 7.e. Let nextValue be IteratorValue(next).
			try {
				var nextValue = IteratorValue(next);
				// 7.f. If nextValue is an abrupt completion, set iteratorRecord.[[Done]] to true.
			} catch (error_) {
				if (iteratorRecord) iteratorRecord.Done = true;
				// 7.g. ReturnIfAbrupt(nextValue).
				throw error_;
			}
			// 7.h. Append undefined to errors.
			errors.push(undefined);
			// 7.i. Let nextPromise be ? Call(promiseResolve, constructor, « nextValue »).
			var nextPromise = Call(promiseResolve, constructor, [nextValue]);
			// 7.j. Let steps be the algorithm steps defined in Promise.any Reject Element Functions.
			// var steps = PromiseAnyRejectElementFunctions;
			// 7.k. Let rejectElement be ! CreateBuiltinFunction(steps, « [[AlreadyCalled]], [[Index]], [[Errors]], [[Capability]], [[RemainingElements]] »).
			// var rejectElement = CreateBuiltinFunction(steps, ['AlreadyCalled', 'Index', 'Errors', 'Capability', 'RemainingElements']);
			var rejectElement = (function(){
				// 26.6.4.3.2 Promise.any Reject Element Functions
				function PromiseAnyRejectElementFunctions(x) {
					// 1. Let F be the active function object.
					var F = PromiseAnyRejectElementFunctions;
					// 2. Let alreadyCalled be F.[[AlreadyCalled]].
					var alreadyCalled = F.AlreadyCalled;
					// 3. If alreadyCalled.[[Value]] is true, return undefined.
					if (alreadyCalled.called) {
						return undefined;
					}
					// 4. Set alreadyCalled.[[Value]] to true.
					alreadyCalled.called = true;
					// 5. Let index be F.[[Index]].
					var index = F.Index;
					// 6. Let errors be F.[[Errors]].
					var errors = F.Errors;
					// 7. Let promiseCapability be F.[[Capability]].
					var promiseCapability = F.Capability;
					// 8. Let remainingElementsCount be F.[[RemainingElements]].
					var remainingElementsCount = F.RemainingElements;
					// 9. Set errors[index] to x.
					errors[index] = x;
					// 10. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] - 1.
					remainingElementsCount.count -= 1;
					// 11. If remainingElementsCount.[[Value]] is 0, then
					if (remainingElementsCount.count === 0) {
						// 11.a. Let error be a newly created AggregateError object.
						var error = AggregateError('PromiseAnyRejected');
						// 11.b. Perform ! DefinePropertyOrThrow(error, "errors", Property Descriptor { [[Configurable]]: true, [[Enumerable]]: false, [[Writable]]: true, [[Value]]: errors }).
						Object.defineProperty(error, 'errors', {
							configurable: true,
							enmerable: false,
							writable: true,
							value: errors
						});
						// 11.c. Return ? Call(promiseCapability.[[Reject]], undefined, « error »).
						return Call(promiseCapability.Reject, undefined, [error]);
					}
					// 12. Return undefined.
					return undefined;
				}
				// 7.l. Set rejectElement.[[AlreadyCalled]] to a new Record { [[Value]]: false }.
				PromiseAnyRejectElementFunctions.AlreadyCalled = {called:false};
				// 7.m. Set rejectElement.[[Index]] to index.
				PromiseAnyRejectElementFunctions.Index = index;
				// 7.n. Set rejectElement.[[Errors]] to errors.
				PromiseAnyRejectElementFunctions.Errors = errors;
				// 7.o. Set rejectElement.[[Capability]] to resultCapability.
				PromiseAnyRejectElementFunctions.Capability = resultCapability;
				// 7.p. Set rejectElement.[[RemainingElements]] to remainingElementsCount.
				PromiseAnyRejectElementFunctions.RemainingElements = remainingElementsCount;
				// 7.q. Set remainingElementsCount.[[Value]] to remainingElementsCount.[[Value]] + 1.
				remainingElementsCount.count += 1;
				return PromiseAnyRejectElementFunctions;
			});
			// 7.r. Perform ? Invoke(nextPromise, "then", « resultCapability.[[Resolve]], rejectElement »).
			Invoke(nextPromise, 'then', [resultCapability.Resolve, rejectElement]);
			// 7.s. Increase index by 1.
			index += 1;
		}
	}

	// 26.6.4.3 Promise.any ( iterable )
	CreateMethodProperty(Promise, 'any', function any(iterable) {
		// 1. Let C be the this
		var C = this;
		// 2. Let promiseCapability be ? NewPromiseCapability(C).
		var promiseCapability = NewPromiseCapability(C);
		// 3. Let promiseResolve be GetPromiseResolve(C).
		try {
			var promiseResolve = GetPromiseResolve(C);
			// 4. IfAbruptRejectPromise(promiseResolve, promiseCapability).
		} catch (error) {
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 5. Let iteratorRecord be GetIterator(iterable).
		try {
			var iteratorRecord = GetIterator(iterable);
			// 6. IfAbruptRejectPromise(iteratorRecord, promiseCapability).
		} catch (error) {
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 7. Let result be PerformPromiseAny(iteratorRecord, C, promiseCapability).
		try {
			var result = PerformPromiseAny(iteratorRecord, C, promiseCapability, promiseResolve);
			// 8. If result is an abrupt completion, then
		} catch (error) {
			// 8.a. If iteratorRecord.[[Done]] is false, set result to IteratorClose(iteratorRecord, result).
			if (iteratorRecord && iteratorRecord.Done === false) {
				result = IteratorClose(iteratorRecord, error);
			}
			// 8.b. IfAbruptRejectPromise(result, promiseCapability).
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 9. Return Completion(result).
		return result;
	});

	// 26.6.4.5.1 Runtime Semantics: PerformPromiseRace ( iteratorRecord, constructor, resultCapability, promiseResolve )
	function PerformPromiseRace(iteratorRecord, constructor, resultCapability, promiseResolve) {
		// 1. Assert: IsConstructor(constructor) is true.
		// Assert(IsConstructor(constructor) === true);
		// 2. Assert: IsCallable(promiseResolve) is true.
		// Assert(IsCallable(promiseResolve) === true);
		// 3. Repeat,
		// eslint-disable-next-line no-constant-condition
		while (true) {
			// 3.a. Let next be IteratorStep(iteratorRecord).
			try {
				var next = IteratorStep(iteratorRecord);
				// 3.b. If next is an abrupt completion, set iteratorRecord.[[Done]] to true.
			} catch (error) {
				if (iteratorRecord) iteratorRecord.Done = true;
				// 3.c. ReturnIfAbrupt(next).
				throw error;
			}
			// 3.d. If next is false, then
			if (next === false) {
				// 3.d.i. Set iteratorRecord.[[Done]] to true.
				iteratorRecord.Done = true;
				// 3.d.ii. Return resultCapability.[[Promise]].
				return resultCapability.Promise;
			}
			// 3.e. Let nextValue be IteratorValue(next).
			try {
				var nextValue = IteratorValue(next);
				// 3.f. If nextValue is an abrupt completion, set iteratorRecord.[[Done]] to true.
			} catch (error) {
				if (iteratorRecord) iteratorRecord.Done = true;
				// 3.g. ReturnIfAbrupt(nextValue).
				throw error;
			}
			// 3.h. Let nextPromise be ? Call(promiseResolve, constructor, « nextValue »).
			var nextPromise = Call(promiseResolve, constructor, [nextValue]);
			// 3.i. Perform ? Invoke(nextPromise, "then", « resultCapability.[[Resolve]], resultCapability.[[Reject]] »).
			Invoke(nextPromise, 'then', [resultCapability.Resolve, resultCapability.Reject]);
		}
	}

	// 26.6.4.5 Promise.race ( iterable )
	CreateMethodProperty(Promise, 'race', function race(iterable) {
		// 1. Let C be the this
		var C = this;
		// 2. Let promiseCapability be ? NewPromiseCapability(C).
		var promiseCapability = NewPromiseCapability(C);
		// 3. Let promiseResolve be GetPromiseResolve(C).
		try {
			var promiseResolve = GetPromiseResolve(C);
			// 4. IfAbruptRejectPromise(promiseResolve, promiseCapability).
		} catch (error) {
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 5. Let iteratorRecord be GetIterator(iterable).
		try {
			var iteratorRecord = GetIterator(iterable);
			// 6. IfAbruptRejectPromise(iteratorRecord, promiseCapability).
		} catch (error) {
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 7. Let result be PerformPromiseRace(iteratorRecord, C, promiseCapability, promiseResolve).
		try {
			var result = PerformPromiseRace(iteratorRecord, C, promiseCapability, promiseResolve);
			// 8. If result is an abrupt completion, then
		} catch (error) {
			// 8.a. If iteratorRecord.[[Done]] is false, set result to IteratorClose(iteratorRecord, result).
			if (iteratorRecord && iteratorRecord.Done === false) {
				result = IteratorClose(iteratorRecord, error);
			}
			// 8.b. IfAbruptRejectPromise(result, promiseCapability).
			Call(promiseCapability.Reject, undefined, [error]);
			return promiseCapability.Promise;
		}
		// 9. Return Completion(result).
		return result;
	});

	// 26.6.4.6 Promise.reject ( r )
	CreateMethodProperty(Promise, 'reject', function reject(r) {
		// 1. Let C be this
		var C = this;
		// 2. Let promiseCapability be ? NewPromiseCapability(C).
		var promiseCapability = NewPromiseCapability(C);
		// 3. Perform ? Call(promiseCapability.[[Reject]], undefined, « r »).
		Call(promiseCapability.Reject, undefined, [r]);
		// 4. Return promiseCapability.[[Promise]].
		return promiseCapability.Promise;
	});

	// 26.6.4.7 Promise.resolve ( x )
	CreateMethodProperty(Promise, 'resolve', function resolve(x) {
		// 1. Let C be the this
		var C = this;
		// 2. If Type(C) is not Object, throw a TypeError exception.
		if (Type(C) !== 'object') {
			throw TypeError('InvalidReceiver', 'Promise.resolve', C);
		}
		// 3. Return ? PromiseResolve(C, x).
		return PromiseResolve(C, x);
	});

	// 26.6.5.4 Promise.prototype.then ( onFulfilled, onRejected )
	CreateMethodProperty(Promise.prototype, 'then', function then(onFulfilled, onRejected) {
		// 1. Let promise be the this value.
		var promise = this;
		// 2. If IsPromise(promise) is false, throw a TypeError exception.
		if (!IsPromise(promise)) {
			throw new TypeError('not a promise');
		}
		// 3. Let C be ? SpeciesConstructor(promise, %Promise%).
		var C = SpeciesConstructor(promise, Promise);
		// 4. Let resultCapability be ? NewPromiseCapability(C).
		var resultCapability = NewPromiseCapability(C);
		// 5. Return PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability).
		return PerformPromiseThen(promise, onFulfilled, onRejected, resultCapability);
	});

	// 26.6.5.1 Promise.prototype.catch ( onRejected )
	CreateMethodProperty(Promise.prototype, 'catch', function (onRejected) {
		// 1. Let promise be the this value.
		var promise = this;
		// 2. Return ? Invoke(promise, "then", « undefined, onRejected »).
		return Invoke(promise, 'then', [undefined, onRejected]);
	});

	// 26.6.5.3 Promise.prototype.finally ( onFinally )
	CreateMethodProperty(Promise.prototype, 'finally', function (onFinally) {
		// 1. Let promise be the this value.
		var promise = this;
		// 2. If Type(promise) is not Object, throw a TypeError exception.
		if (Type(promise) !== 'Object') {
			throw TypeError(promise + ' is not an Object');
		}
		// 3. Let C be ? SpeciesConstructor(promise, %Promise%).
		var C = SpeciesConstructor(promise, Promise);
		// 4. Assert: IsConstructor(C) is true.
		// Assert(IsConstructor(C) === true);
		var thenFinally;
		var catchFinally;
		// 5. If IsCallable(onFinally) is false, then
		if (IsCallable(onFinally) === false) {
			// a. Let thenFinally be onFinally.
			thenFinally = onFinally;
			// b. Let catchFinally be onFinally.
			catchFinally = onFinally;
		} else { // 6. Else,
			// a. Let stepsThenFinally be the algorithm steps defined in Then Finally Functions.
			// var stepsThenFinally = ThenFinallyFunctions;
			// b. .Let thenFinally be ! CreateBuiltinFunction(stepsThenFinally, « [[Constructor]], [[OnFinally]] »).
			// thenFinally = CreateBuiltinFunction(stepsThenFinally, ['Constructor', 'OnFinally']);
			thenFinally = (function() {
				// 26.6.5.3.1 Then Finally Functions
				function ThenFinallyFunctions(value) {
					// 1. Let F be the active function object.
					var F = ThenFinallyFunctions;
					// 2. Let onFinally be F.[[OnFinally]].
					var onFinally = F.OnFinally;
					// 3. Assert: IsCallable(onFinally) is true.
					// Assert(IsCallable(onFinally));
					// 4. Let result be ? Call(onFinally, undefined).
					var result = Call(onFinally, undefined);
					// 5. Let C be F.[[Constructor]].
					var C = F.Constructor;
					// 6. Assert: IsConstructor(C) is true.
					// Assert(IsConstructor(C));
					// 7. Let promise be ? PromiseResolve(C, result).
					var promise = PromiseResolve(C, result);
					// 8. Let valueThunk be equivalent to a function that returns value.
					var valueThunk = function valueThunk (){
						return value;
					};
					// 9. Return ? Invoke(promise, "then", « valueThunk »).
					return Invoke(promise, 'then', [valueThunk]);
				}
				// c. Set thenFinally.[[Constructor]] to C.
				ThenFinallyFunctions.Constructor = C;
				// d. Set thenFinally.[[OnFinally]] to onFinally.
				ThenFinallyFunctions.OnFinally = onFinally;

				return ThenFinallyFunctions;
			}());
			// e. Let stepsCatchFinally be the algorithm steps defined in Catch Finally Functions.
			// var stepsCatchFinally = CatchFinallyFunctions;
			// f. Let catchFinally be ! CreateBuiltinFunction(stepsCatchFinally, « [[Constructor]], [[OnFinally]] »).
			// catchFinally = CreateBuiltinFunction(stepsCatchFinally, ['Constructor', 'OnFinally']);
			catchFinally = (function(){
				// 26.6.5.3.2 Catch Finally Functions
				function CatchFinallyFunctions(reason) {
					// 1. Let F be the active function object.
					var F = CatchFinallyFunctions;
					// 2. Let onFinally be F.[[OnFinally]].
					var onFinally = F.OnFinally;
					// 3. Assert: IsCallable(onFinally) is true.
					// Assert(IsCallable(onFinally));
					// 4. Let result be ? Call(onFinally, undefined).
					var result = Call(onFinally, undefined);
					// 5. Let C be F.[[Constructor]].
					var C = F.Constructor;
					// 6. Assert: IsConstructor(C) is true.
					// Assert(IsConstructor(C));
					// 7. Let promise be ? PromiseResolve(C, result).
					var promise = PromiseResolve(C, result);
					// 8. Let thrower be equivalent to a function that throws reason.
					var thrower = function thrower () {
						throw reason;
					};
					// 9. Return ? Invoke(promise, "then", « thrower »).
					return Invoke(promise, 'then', [thrower]);
				}

				// g. Set catchFinally.[[Constructor]] to C.
				CatchFinallyFunctions.Constructor = C;
				// h. Set catchFinally.[[OnFinally]] to onFinally.
				CatchFinallyFunctions.OnFinally = onFinally;

				return CatchFinallyFunctions;
			}());
		}
		// 7. Return ? Invoke(promise, "then", « thenFinally, catchFinally »).
		return Invoke(promise, 'then', [thenFinally, catchFinally]);
	});

	global.Promise = Promise;

	// #sec-get-promise-@@species
	// Promise[Symbol.species] = function (args) {
	// 	// 1. Return the this
	// 	return this;
	// }
})(self);
