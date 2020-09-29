/* global NewPromiseReactionJob, HostEnqueuePromiseJob */

// #sec-triggerpromisereactions
// eslint-disable-next-line no-unused-vars
function TriggerPromiseReactions(reactions, argument) {
    // 1. For each reaction in reactions, in original insertion order, do
    reactions.forEach(function(reaction) {
        // a. Let job be NewPromiseReactionJob(reaction, argument).
        var job = NewPromiseReactionJob(reaction, argument);
        // b. Perform HostEnqueuePromiseJob(job.[[Job]], job.[[Realm]]).
        HostEnqueuePromiseJob(job.Job, job.Realm);
    });
    // 2. Return undefined.
    return undefined;
}
