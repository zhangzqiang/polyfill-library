/* global Assert PromiseReactionRecord HostCallJobCallback Completion NormalCompletion ThrowCompletion Call */
// @ts-nocheck

// #sec-newpromisereactionjob
// eslint-disable-next-line no-unused-vars
function NewPromiseReactionJob(reaction, argument) {
    // 1. Let job be a new Job abstract closure with no parameters that captures
    //    reaction and argument and performs the following steps when called:
    var job = function() {
        // a. Assert: reaction is a PromiseReaction Record.
        // Assert(reaction instanceof PromiseReactionRecord);
        // b. Let promiseCapability be reaction.[[Capability]].
        var promiseCapability = reaction.Capability;
        // c. Let type be reaction.[[Type]].
        var type = reaction.Type;
        // d. Let handler be reaction.[[Handler]].
        var handler = reaction.Handler;
        var handlerResult;
        var handlerResultAbruptCompletion;
        // e. If handler is empty, then
        if (handler === undefined) {
            // i. If type is Fulfill, let handlerResult be NormalCompletion(argument).
            if (type === 'Fulfill') {
                handlerResult = argument;
            } else {
                // 1. Assert: type is Reject.
                // Assert(type === 'Reject');
                // 2. Let handlerResult be ThrowCompletion(argument).
                handlerResultAbruptCompletion = argument;
            }
        } else {
            // f. Else, let handlerResult be HostCallJobCallback(handler, undefined, « argument »).
            try {
                handlerResult = HostCallJobCallback(handler, undefined, [argument]);
            } catch (error) {
                handlerResultAbruptCompletion = error;
            }
        }
        // g. If promiseCapability is undefined, then
        if (promiseCapability === undefined) {
            // i. Assert: handlerResult is not an abrupt completion.
            // Assert(!(handlerResult instanceof AbruptCompletion));
            // ii. Return NormalCompletion(empty).
            return undefined;
        }
        var status;
        // h. If handlerResult is an abrupt completion, then
        if (handlerResultAbruptCompletion) {
            // i. Let status be Call(promiseCapability.[[Reject]], undefined, « handlerResult.[[Value]] »).
            status = Call(promiseCapability.Reject, undefined, [handlerResultAbruptCompletion]);
        } else {
            // ii. Let status be Call(promiseCapability.[[Resolve]], undefined, « handlerResult.[[Value]] »).
            status = Call(promiseCapability.Resolve, undefined, [handlerResult]);
        }
        // j. Return Completion(status).
        return status;
    };
    // 2. Let handlerRealm be null.
    var handlerRealm = null;
    // 3. If reaction.[[Handler]] is not empty, then
    // if (reaction.Handler !== undefined) {
    //     // a. Let getHandlerRealmResult be GetFunctionRealm(reaction.[[Handler]].[[Callback]]).
    //     var getHandlerRealmResult = GetFunctionRealm(reaction.Handler.Callback);
    //     // b. If getHandlerRealmResult is a normal completion, then set handlerRealm to getHandlerRealmResult.[[Value]].
    //     if (getHandlerRealmResult instanceof NormalCompletion) {
    //         handlerRealm = getHandlerRealmResult;
    //     } else {
    //         // c. Else, set _handlerRealm_ to the current Realm Record.
    //         handlerRealm = surroundingAgent.currentRealmRecord;
    //     }
    //     // d. NOTE: _handlerRealm_ is never *null* unless the handler is *undefined*. When the handler
    //     //    is a revoked Proxy and no ECMAScript code runs, _handlerRealm_ is used to create error objects.
    // }
    // 4. Return { [[Job]]: job, [[Realm]]: handlerRealm }.
    return { Job: job, Realm: handlerRealm };
}
