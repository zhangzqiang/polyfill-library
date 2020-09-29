/* global CreateResolvingFunctions HostCallJobCallback Call Completion */
// @ts-nocheck

// #sec-newpromiseresolvethenablejob
// eslint-disable-next-line no-unused-vars
function NewPromiseResolveThenableJob(promiseToResolve, thenable, then) {
    // 1. Let job be a new Job abstract closure with no parameters that captures
    //    promiseToResolve, thenable, and then and performs the following steps when called:
    var job = function() {
        // a. Let resolvingFunctions be CreateResolvingFunctions(promiseToResolve).
        var resolvingFunctions = CreateResolvingFunctions(promiseToResolve);
        // b. Let thenCallResult be HostCallJobCallback(then, thenable, « resolvingFunctions.[[Resolve]], resolvingFunctions.[[Reject]] »).
        try {
            var thenCallResult = HostCallJobCallback(then, thenable, [resolvingFunctions.Resolve, resolvingFunctions.Reject]);
        // c. If thenCallResult is an abrupt completion, then
        } catch (error) {
            // i .Let status be Call(resolvingFunctions.[[Reject]], undefined, « thenCallResult.[[Value]] »).
            var status = Call(resolvingFunctions.Reject, undefined, [error]);
            // ii. Return Completion(status).
            return status;
        }
        // d. Return Completion(thenCallResult).
        return thenCallResult;
    };
    // 2. Let getThenRealmResult be GetFunctionRealm(then.[[Callback]]).
    // var getThenRealmResult = GetFunctionRealm(then.Callback);
    // 3. If getThenRealmResult is a normal completion, then let thenRealm be getThenRealmResult.[[Value]].
    var thenRealm;
    // if (getThenRealmResult instanceof NormalCompletion) {
    //     thenRealm = getThenRealmResult;
    // } else {
    //   // 4. Else, let _thenRealm_ be the current Realm Record.
    //     thenRealm = surroundingAgent.currentRealmRecord;
    // }
    // 5. NOTE: _thenRealm_ is never *null*. When _then_.[[Callback]] is a revoked Proxy and no code runs, _thenRealm_ is used to create error objects.
    // 6. Return { [[Job]]: job, [[Realm]]: thenRealm }.
    return { Job: job, Realm: thenRealm };
}
