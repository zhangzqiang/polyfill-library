/* eslint-env mocha */
/* globals proclaim */

it('is enumerable', function () {
	proclaim.isEnumerable(Node.prototype, 'isConnected');
});

it('is false if ndoe is not connected to a document', function() {
    var node = document.createElement('a');
    proclaim.isFalse(node.isConnected);
});

it('is true if ndoe is connected to a document', function() {
    var node = document.createElement('a');
    var body = document.querySelector('body');
    body.appendChild(node);
    proclaim.isTrue(node.isConnected);
});
