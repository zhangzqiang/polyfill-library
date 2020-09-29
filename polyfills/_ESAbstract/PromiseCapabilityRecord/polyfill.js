/* global */

// 26.6.1.1 PromiseCapability Records
// PromiseCapability Records have the fields listed in Table 77.
// Table 77: PromiseCapability Record Fields
// Field Name 	Value 	Meaning
// [[Promise]] 	An object 	An object that is usable as a promise.
// [[Resolve]] 	A function object 	The function that is used to resolve the given promise object.
// [[Reject]] 	A function object 	The function that is used to reject the given promise object.
function PromiseCapabilityRecord () { // eslint-disable-line no-unused-vars
	this.Promise = void 0;
	this.Resolve = void 0;
	this.Reject = void 0;
}
