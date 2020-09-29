/* global Assert PromiseCapabilityRecord isFunctionObject */
// @ts-nocheck

// eslint-disable-next-line no-unused-vars
function PromiseReactionRecord (O) {
    // Assert(O.Capability instanceof PromiseCapabilityRecord || O.Capability === undefined);
    // Assert(O.Type === 'Fulfill' || O.Type === 'Reject');
    // Assert(O.Handler === undefined || isFunctionObject(O.Handler.Callback));
    this.Capability = O.Capability;
    this.Type = O.Type;
    this.Handler = O.Handler;
}
