/* global IsCallable */
// eslint-disable-next-line no-unused-vars
var HostEnqueuePromiseJob = (function (global) {
	var enqueue = IsCallable(global.setImmediate)
		? global.setImmediate
		: function (task) {
            setTimeout(task, 0);
		}; // fallback
	// eslint-disable-next-line no-unused-vars
	return function HostEnqueuePromiseJob(job) {
		enqueue(job);
	}
})(self);
