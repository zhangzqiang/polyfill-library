'use strict';

// An element is connected if its shadow-including root is a document. 
Object.defineProperty(Node.prototype, 'isConnected', {
    configurable: true,
    enumerable: true,
    get: function () {
        var root = this.getRootNode({ composed: true });
        return root.nodeType === 9; // Node.DOCUMENT_NODE
    }
});
