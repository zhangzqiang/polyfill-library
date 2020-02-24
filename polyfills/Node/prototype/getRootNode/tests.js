/* eslint-env mocha */
/* globals proclaim */

function supportsShadowRoot() {
  return typeof Element.prototype.attachShadow === "function";
}

it("is a function", function() {
  proclaim.isFunction(Node.prototype.getRootNode);
});

it("has correct arity", function() {
  proclaim.arity(Node.prototype.getRootNode, 1);
});

it("has correct name", function() {
  proclaim.hasName(Node.prototype.getRootNode, "getRootNode");
});

it("is not enumerable", function() {
  proclaim.isNotEnumerable(Node.prototype, "getRootNode");
});

describe("Node.prototype.getRootNode", function describeGetRootNode() {
  var realms = [];

  function createRealmn() {
    var iframe = document.createElement("iframe");
    iframe.src = window.location;
    document.body.appendChild(iframe);

    realms.push(iframe);

    return iframe.contentWindow;
  }

  function createShadowRoot(document) {
    var node = document.createElement("div");
    document.body.appendChild(node);
    var shadowRoot = node.attachShadow({ mode: "open" });
    var shadowNode = document.createElement("div");
    shadowRoot.appendChild(shadowNode);

    return { root: shadowRoot, node: shadowNode };
  }

  afterEach(function cleanupRealms() {
    for (var i = 0; i < realms.length; i++) {
      realms[i].remove();
    }

    realms = [];
  });

  describe("returns the root of detached trees", function testGetRootDetached() {
    function run(document) {
      var rootNode = document.createElement("div");
      var childNode = document.createElement("div");
      var descendantNode = document.createElement("div");

      rootNode.appendChild(childNode);
      childNode.appendChild(descendantNode);

      proclaim.deepStrictEqual(descendantNode.getRootNode(), rootNode);
    }

    it("current realmn", function inRealmn() {
      run(window.document);
    });

    it("cross-realmn", function outRealmn() {
      run(createRealmn().document);
    });
  });

  describe("returns the root of attached trees", function testGetRootAttached() {
    function run(document) {
      var rootNode = document.createElement("div");
      var childNode = document.createElement("div");
      var descendantNode = document.createElement("div");

      document.body.appendChild(rootNode);
      rootNode.appendChild(childNode);
      childNode.appendChild(descendantNode);

      proclaim.deepStrictEqual(descendantNode.getRootNode(), document);
    }

    it("current realmn", function inRealmn() {
      run(window.document);
    });

    it("cross-realmn", function outRealmn() {
      run(createRealmn().document);
    });
  });

  describe("returns itself if it is the root", function testGetSelf() {
    function run(document) {
      var detachedNode = document.createElement("div");

      proclaim.deepStrictEqual(detachedNode.getRootNode(), detachedNode);
      proclaim.deepStrictEqual(document.getRootNode(), document);
    }

    it("current realmn", function inRealmn() {
      run(window.document);
    });

    it("cross-realmn", function outRealmn() {
      run(createRealmn().document);
    });
  });

  describe("works with shadow roots", function testGetShadow() {
    function run(document) {
      var elems = createShadowRoot(document);
      proclaim.deepStrictEqual(elems.node.getRootNode(), elems.root);
    }

    it("current realmn", function inRealmn() {
      if (!supportsShadowRoot()) {
        this.skip();
        return;
      }

      run(window.document);
    });

    it("cross-realmn", function outRealmn() {
      if (!supportsShadowRoot()) {
        this.skip();
        return;
      }

      run(createRealmn().document);
    });
  });

  describe("\"composed\" option returns the shadow root's host's root", function testGetShadowsRoot() {
    function run(document) {
      var elems = createShadowRoot(document);
      proclaim.deepStrictEqual(
        elems.node.getRootNode({ composed: true }),
        document
      );
    }

    it("current realmn", function inRealmn() {
      if (!supportsShadowRoot()) {
        this.skip();
        return;
      }

      run(window.document);
    });

    it("cross-realmn", function outRealmn() {
      if (!supportsShadowRoot()) {
        this.skip();
        return;
      }

      run(createRealmn().document);
    });
  });

  describe('"composed" option defaults to false', function testComposed() {
    function run(document) {
      var elems = createShadowRoot(document);
      proclaim.deepStrictEqual(
        elems.node.getRootNode(),
        elems.node.getRootNode({ composed: false })
      );
    }

    it("current realmn", function inRealmn() {
      if (!supportsShadowRoot()) {
        this.skip();
        return;
      }

      run(window.document);
    });

    it("cross-realmn", function outRealmn() {
      if (!supportsShadowRoot()) {
        this.skip();
        return;
      }

      run(createRealmn().document);
    });
  });
});
