/* global MakeBasicObject */
// @ts-nocheck

function OrdinaryObjectCreate(proto, additionalInternalSlotsList) { // eslint-disable-line no-unused-vars
	// 1. Let internalSlotsList be « [[Prototype]], [[Extensible]] ».
	var internalSlotsList = ['Prototype', 'Extensible'];
	// 2. If additionalInternalSlotsList is present, append each of its elements to internalSlotsList.
	if (additionalInternalSlotsList !== undefined) {
		internalSlotsList.push.apply(internalSlotsList, additionalInternalSlotsList);
	}
	// 3. Let O be ! MakeBasicObject(internalSlotsList).
	var O = MakeBasicObject(internalSlotsList);
	// 4. Set O.[[Prototype]] to proto.
	O.Prototype = proto;
	// 5. Return O.
	return O;
}
