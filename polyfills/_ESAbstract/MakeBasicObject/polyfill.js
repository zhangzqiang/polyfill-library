// eslint-disable-next-line no-unused-vars
function MakeBasicObject(internalSlotsList) {
	// 1.  Assert: internalSlotsList is a List of internal slot names.
	// Assert(Array.isArray(internalSlotsList));
	// 2.  Let obj be a newly created object with an internal slot for each name in internalSlotsList.
	// 3.  Set obj's essential internal methods to the default ordinary object definitions specified in 9.1.
	var obj = Object();
	internalSlotsList.forEach(function(s) {
		obj[s] = undefined;
	});
	// 4.  Assert: If the caller will not be overriding both obj's [[GetPrototypeOf]] and [[SetPrototypeOf]] essential internal methods, then internalSlotsList contains [[Prototype]].
	// 5.  Assert: If the caller will not be overriding all of obj's [[SetPrototypeOf]], [[IsExtensible]], and [[PreventExtensions]] essential internal methods, then internalSlotsList contains [[Extensible]].
	// 6.  If internalSlotsList contains [[Extensible]], then set obj.[[Extensible]] to true.
	// if (internalSlotsList.includes('Extensible')) {
	// 	obj.Extensible = true;
	// }
	// 7.  Return obj.
	return obj;
}
