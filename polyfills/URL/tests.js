/* eslint-env mocha, browser */
/* global proclaim */

describe("URL", function() {
  describe("URL constructor", function() {
    it("is a function", function() {
      proclaim.isFunction(URL);
    });
    it("is has correct arity", function() {
      proclaim.arity(URL, 1);
    });
    it("is has correct name", function() {
      proclaim.hasName(URL, "URL");
    });
    it("works with absolute urls", function() {
      proclaim.deepStrictEqual(
        String(new URL("http://www.domain.com/a/b")),
        "http://www.domain.com/a/b"
      );
    });
    it("works with domain relative url and base parameter", function() {
      proclaim.deepStrictEqual(
        String(new URL("/c/d", "http://www.domain.com/a/b")),
        "http://www.domain.com/c/d"
      );
    });
    it("works with path relative url and base parameter", function() {
      proclaim.deepStrictEqual(
        String(new URL("b/c", "http://www.domain.com/a/b")),
        "http://www.domain.com/a/b/c"
      );
      proclaim.deepStrictEqual(
        String(new URL("b/c", new URL("http://www.domain.com/a/b"))),
        "http://www.domain.com/a/b/c"
      );
    });
    it("Calls toString on the parameter if it is not a string", function() {
      proclaim.deepStrictEqual(
        String(
          new URL({
            toString: function() {
              return "https://example.org/";
            }
          })
        ),
        "https://example.org/"
      );
    });

    it("works with nonspecial schemes", function() {
      proclaim.deepStrictEqual(
        String(new URL("nonspecial://example.com/")),
        "nonspecial://example.com/"
      );
    });
    it("works with non-ascii domains", function() {
      proclaim.deepStrictEqual(
        String(new URL("https://測試")),
        "https://xn--g6w251d/"
      );
      proclaim.deepStrictEqual(
        String(new URL("https://xxпривет.тест")),
        "https://xn--xx-flcmn5bht.xn--e1aybc/"
      );
      proclaim.deepStrictEqual(
        String(new URL("https://xxПРИВЕТ.тест")),
        "https://xn--xx-flcmn5bht.xn--e1aybc/"
      );
      proclaim.deepStrictEqual(
        String(new URL("http://Example.com/", "https://example.org/"))
      );
      proclaim.deepStrictEqual(
        String(new URL("https://Example.com/", "https://example.org/"))
      );
      proclaim.deepStrictEqual(
        String(new URL("nonspecial://Example.com/", "https://example.org/"))
      );
      proclaim.deepStrictEqual(
        String(new URL("http:Example.com/", "https://example.org/"))
      );
      proclaim.deepStrictEqual(
        String(new URL("https:Example.com/", "https://example.org/"))
      );
      proclaim.deepStrictEqual(
        String(new URL("nonspecial:Example.com/", "https://example.org/"))
      );
    });

    it("works with base 8/10/16 ipv4 and ipv6 addresses", function() {
      proclaim.deepStrictEqual(
        String(new URL("http://0300.168.0xF0")),
        "http://192.168.0.240/"
      );
      proclaim.deepStrictEqual(
        String(new URL("http://[20:0:0:1:0:0:0:ff]")),
        "http://[20:0:0:1::ff]/"
      );
      proclaim.deepStrictEqual(
        String(new URL("http://0300.168.0xG0")),
        "http://0300.168.0xg0/"
      );
    });

    it("works with the file scheme", function() {
      proclaim.deepStrictEqual(
        String(new URL("file:///var/log/system.log")),
        "file:///var/log/system.log"
      );
    });

    it("throws if called with no parameters", function() {
      proclaim["throws"](function() {
        new URL();
      });
    });
    it("throws if called with empty string", function() {
      proclaim["throws"](function() {
        new URL("");
      });
    });
    it("throws if called with empty string and blank base url", function() {
      proclaim["throws"](function() {
        new URL("", "about:blank");
      });
    });
    it("throws if called with an invalid url", function() {
      proclaim["throws"](function() {
        new URL("abc");
      });
    });
    it("throws if called without a scheme", function() {
      proclaim["throws"](function() {
        new URL("//abc");
      });
    });
    it("throws if called with an invalid base url", function() {
      proclaim["throws"](function() {
        new URL("http:///www.domain.com/", "abc");
      });
    });
    it("throws if called with a null base url", function() {
      proclaim["throws"](function() {
        new URL("http:///www.domain.com/", null);
      });
      proclaim["throws"](function() {
        new URL("//abc", null);
      });
    });
    it("throws if called with invalid IPv6 address", function() {
      proclaim["throws"](function() {
        new URL("http://[20:0:0:1:0:0:0:ff");
      });
      proclaim["throws"](function() {
        new URL("http://[20:0:0:1:0:0:0:fg]");
      });
    });
    it("throws if called with a forbidden host codepoint", function() {
      proclaim["throws"](function() {
        new URL("http://a%b");
      }); // no error in FF
    });
    it("throws if called with an invalid scheme", function() {
      proclaim["throws"](function() {
        new URL("1http://example.com");
      }, "incorrect scheme");
    });
  });
});
