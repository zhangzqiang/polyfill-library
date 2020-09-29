/* global Type */
// 7.3.9. GetMethod ( V, P )

// 9.3.3 CreateBuiltinFunction ( steps, internalSlotsList [ , realm [ , prototype ] ] )
function CreateBuiltinFunction(steps) { // eslint-disable-line no-unused-vars
	// 1. Assert: steps is either a set of algorithm steps or other definition of a function's behaviour provided in this specification.
	// 2. If realm is not present, set realm to the current Realm Record.
	// 3. Assert: realm is a Realm Record.
	// 4. If prototype is not present, set prototype to realm.[[Intrinsics]].[[%Function.prototype%]].
	// 5. Let func be a new built-in function object that when called performs the action described by steps. The new function object has internal slots whose names are the elements of internalSlotsList.
	// 6. Set func.[[Realm]] to realm.
	// 7. Set func.[[Prototype]] to prototype.
	// 8. Set func.[[Extensible]] to true.
	// 9. Set func.[[ScriptOrModule]] to null.
	// 10. Set func.[[InitialName]] to null.
	var func = new Function('return ' + steps.toString())();
	// 11. Return func.
	return func;
}
