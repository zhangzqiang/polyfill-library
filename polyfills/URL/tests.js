/* eslint-env mocha, browser */
/* global proclaim, Symbol */
var arePropertyDescriptorsSupported = function() {
  var obj = {};
  try {
    Object.defineProperty(obj, "x", {
      enumerable: false,
      value: obj
    });
    for (var _ in obj) {
      return false;
    }
    return obj.x === obj;
  } catch (e) {
    // this is IE 8.
    return false;
  }
};

var supportsDescriptors =
  Object.defineProperty && arePropertyDescriptorsSupported();

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
      proclaim.deepStrictEqual(String(new URL('http://Example.com/', 'https://example.org/')), 'http://example.com/');
      proclaim.deepStrictEqual(String(new URL('https://Example.com/', 'https://example.org/')), 'https://example.com/');
      proclaim.deepStrictEqual(String(new URL('nonspecial://Example.com/', 'https://example.org/')), 'nonspecial://Example.com/');
      proclaim.deepStrictEqual(String(new URL('http:Example.com/', 'https://example.org/')), 'http://example.com/');
      proclaim.deepStrictEqual(String(new URL('https:Example.com/', 'https://example.org/')), 'https://example.org/Example.com/');
      proclaim.deepStrictEqual(String(new URL('nonspecial:Example.com/', 'https://example.org/')), 'nonspecial:Example.com/');
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
      });
    });
  });
  describe("URL#href", function() {
	it("works in browsers which don't support descriptors", function() {
		var url = new URL("http://example.com/");
		proclaim.deepStrictEqual(url.href, "http://example.com/");
	});

    if (supportsDescriptors) {
		it('has correct IDL', function(){
			var descriptor = Object.getOwnPropertyDescriptor(
				URL.prototype,
				"href"
			);
			proclaim.isTrue(descriptor.enumerable);
			proclaim.isTrue(descriptor.configurable);
			proclaim.isFunction(descriptor.get);
			proclaim.isFunction(descriptor.set);
		});
		it('works', function() {
			var url = new URL("http://example.com/");
			url.searchParams.append("foo", "bar");
			proclaim.deepStrictEqual(url.href, "http://example.com/?foo=bar");

			url = new URL("http://example.com/foo");
			url.href = "https://測試";
			proclaim.deepStrictEqual(
			url.href,
			"https://xn--g6w251d/",
			"unicode parsing"
			);
			proclaim.deepStrictEqual(
			String(url),
			"https://xn--g6w251d/",
			"unicode parsing"
			);

			url = new URL("http://example.com/foo");
			url.href = "https://xxпривет.тест";
			proclaim.deepStrictEqual(
			url.href,
			"https://xn--xx-flcmn5bht.xn--e1aybc/",
			"unicode parsing"
			);
			proclaim.deepStrictEqual(
			String(url),
			"https://xn--xx-flcmn5bht.xn--e1aybc/",
			"unicode parsing"
			);

			url = new URL("http://example.com/foo");
			url.href = "https://xxПРИВЕТ.тест";
			proclaim.deepStrictEqual(
			url.href,
			"https://xn--xx-flcmn5bht.xn--e1aybc/",
			"unicode parsing"
			);
			proclaim.deepStrictEqual(
			String(url),
			"https://xn--xx-flcmn5bht.xn--e1aybc/",
			"unicode parsing"
			);

			url = new URL("http://example.com/");
			url.href = "http://0300.168.0xF0";
			proclaim.deepStrictEqual(url.href, "http://192.168.0.240/");
			proclaim.deepStrictEqual(String(url), "http://192.168.0.240/");

			url = new URL("http://example.com/");
			url.href = "http://[20:0:0:1:0:0:0:ff]";
			proclaim.deepStrictEqual(url.href, "http://[20:0:0:1::ff]/");
			proclaim.deepStrictEqual(String(url), "http://[20:0:0:1::ff]/");

			// url = new URL('http://example.com/');
			// url.href = 'http://257.168.0xF0'; // TypeError and Safari
			// proclaim.deepStrictEqual(url.href, 'http://257.168.0xf0/', 'incorrect IPv4 parsed as host'); // `F` instead of `f` in Chrome
			// proclaim.deepStrictEqual(String(url), 'http://257.168.0xf0/', 'incorrect IPv4 parsed as host'); // `F` instead of `f` in Chrome

			url = new URL("http://example.com/");
			url.href = "http://0300.168.0xG0";
			proclaim.deepStrictEqual(
			url.href,
			"http://0300.168.0xg0/",
			"incorrect IPv4 parsed as host"
			);
			proclaim.deepStrictEqual(
			String(url),
			"http://0300.168.0xg0/",
			"incorrect IPv4 parsed as host"
			);

			url = new URL("http://192.168.0.240/");
			url.href = "file:///var/log/system.log";
			proclaim.deepStrictEqual(
			url.href,
			"file:///var/log/system.log",
			"file -> ip"
			);
			proclaim.deepStrictEqual(
			String(url),
			"file:///var/log/system.log",
			"file -> ip"
			);

			url = new URL("file:///var/log/system.log");
			url.href = "http://0300.168.0xF0";
			proclaim.deepStrictEqual(
			url.href,
			"http://192.168.0.240/",
			"file -> http"
			);
			proclaim.deepStrictEqual(
			String(url),
			"http://192.168.0.240/",
			"file -> http"
			);

			// proclaim.throws(function(){ new URL('http://example.com/').href = undefined, 'incorrect URL'); // no error in Chrome
			// proclaim.throws(function(){ new URL('http://example.com/').href = '', 'incorrect URL'); // no error in Chrome
			// proclaim.throws(function(){ new URL('http://example.com/').href = 'abc', 'incorrect URL'); // no error in Chrome
			// proclaim.throws(function(){ new URL('http://example.com/').href = '//abc', 'incorrect URL'); // no error in Chrome
			// proclaim.throws(function(){ new URL('http://example.com/').href = 'http://[20:0:0:1:0:0:0:ff', 'incorrect IPv6'); // no error in Chrome
			// proclaim.throws(function(){ new URL('http://example.com/').href = 'http://[20:0:0:1:0:0:0:fg]', 'incorrect IPv6'); // no error in Chrome
			// proclaim.throws(function(){ new URL('http://example.com/').href = 'http://a%b', 'forbidden host code point'); // no error in Chrome and FF
			// proclaim.throws(function(){ new URL('http://example.com/').href = '1http://example.com', 'incorrect scheme'); // no error in Chrome
		});
      }
  });

  describe("URL#origin", function() {
    it("works", function() {
      var url = new URL("http://es6.example.com/tests.html");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "origin"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
      }

      proclaim.deepStrictEqual(url.origin, "http://es6.example.com");

      proclaim.deepStrictEqual(
        new URL("https://測試/tests").origin,
        "https://xn--g6w251d"
      );
    });
  });

  describe("URL#protocol", function() {
    it("works", function() {
      var url = new URL("http://example.com/");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "protocol"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
        proclaim.isFunction(descriptor.set);
      }

      proclaim.deepStrictEqual(url.protocol, "http:");

      if (supportsDescriptors) {
        url = new URL("http://example.com/");
        url.protocol = "https";
        proclaim.deepStrictEqual(url.protocol, "https:");
        proclaim.deepStrictEqual(String(url), "https://example.com/");

        // https://nodejs.org/api/url.html#url_special_schemes
        // url = new URL('http://example.com/');
        // url.protocol = 'fish';
        // proclaim.deepStrictEqual(url.protocol, 'http:');
        // proclaim.deepStrictEqual(url.href, 'http://example.com/');
        // proclaim.deepStrictEqual(String(url), 'http://example.com/');

        url = new URL("http://example.com/");
        url.protocol = "1http";
        proclaim.deepStrictEqual(url.protocol, "http:");
        proclaim.deepStrictEqual(
          url.href,
          "http://example.com/",
          "incorrect scheme"
        );
        proclaim.deepStrictEqual(
          String(url),
          "http://example.com/",
          "incorrect scheme"
        );
      }
    });
  });

  describe("URL#username", function() {
    it("works", function() {
      var url = new URL("http://example.com/");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "username"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
        proclaim.isFunction(descriptor.set);
      }

      proclaim.deepStrictEqual(url.username, "");

      url = new URL("http://username@example.com/");
      proclaim.deepStrictEqual(url.username, "username");

      if (supportsDescriptors) {
        url = new URL("http://example.com/");
        url.username = "username";
        proclaim.deepStrictEqual(url.username, "username");
        proclaim.deepStrictEqual(String(url), "http://username@example.com/");
      }
    });
  });

  describe("URL#password", function() {
    it("works", function() {
      var url = new URL("http://example.com/");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "password"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
        proclaim.isFunction(descriptor.set);
      }

      proclaim.deepStrictEqual(url.password, "");

      url = new URL("http://username:password@example.com/");
      proclaim.deepStrictEqual(url.password, "password");

      // url = new URL('http://:password@example.com/'); // TypeError in FF
      // proclaim.deepStrictEqual(url.password, 'password');

      if (supportsDescriptors) {
        url = new URL("http://example.com/");
        url.username = "username";
        url.password = "password";
        proclaim.deepStrictEqual(url.password, "password");
        proclaim.deepStrictEqual(
          String(url),
          "http://username:password@example.com/"
        );

        // url = new URL('http://example.com/');
        // url.password = 'password';
        // proclaim.deepStrictEqual(url.password, 'password'); // '' in FF
        // proclaim.deepStrictEqual(String(url), 'http://:password@example.com/'); // 'http://example.com/' in FF
      }
    });
  });

  describe("URL#host", function() {
    it("works", function() {
      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "host"
          );
          proclaim.isTrue(descriptor.enumerable);
          proclaim.isTrue(descriptor.configurable);
          proclaim.isFunction(descriptor.get);
          proclaim.isFunction(descriptor.set);
        }
        
      var url = new URL("http://example.com:81/path");
      proclaim.deepStrictEqual(url.host, "example.com:81");

      if (supportsDescriptors) {
        url = new URL("http://example.com:81/path");
        url.host = "example.com:82";
        proclaim.deepStrictEqual(url.host, "example.com:82");
        proclaim.deepStrictEqual(String(url), "http://example.com:82/path");

        // url = new URL('http://example.com:81/path');
        // url.host = 'other?domain.com';
        // proclaim.deepStrictEqual(String(url), 'http://other:81/path'); // 'http://other/?domain.com/path' in Safari

        url = new URL("https://www.mydomain.com:8080/path/");
        url.host = "www.otherdomain.com:80";
        proclaim.deepStrictEqual(
          url.href,
          "https://www.otherdomain.com:80/path/",
          "set default port for another protocol"
        );

        // url = new URL('https://www.mydomain.com:8080/path/');
        // url.host = 'www.otherdomain.com:443';
        // proclaim.deepStrictEqual(url.href, 'https://www.otherdomain.com/path/', 'set default port');

        url = new URL("http://example.com/foo");
        url.host = "測試";
        proclaim.deepStrictEqual(url.host, "xn--g6w251d", "unicode parsing");
        proclaim.deepStrictEqual(
          String(url),
          "http://xn--g6w251d/foo",
          "unicode parsing"
        );

        url = new URL("http://example.com/foo");
        url.host = "xxпривет.тест";
        proclaim.deepStrictEqual(
          url.host,
          "xn--xx-flcmn5bht.xn--e1aybc",
          "unicode parsing"
        );
        proclaim.deepStrictEqual(
          String(url),
          "http://xn--xx-flcmn5bht.xn--e1aybc/foo",
          "unicode parsing"
        );

        url = new URL("http://example.com/foo");
        url.host = "xxПРИВЕТ.тест";
        proclaim.deepStrictEqual(
          url.host,
          "xn--xx-flcmn5bht.xn--e1aybc",
          "unicode parsing"
        );
        proclaim.deepStrictEqual(
          String(url),
          "http://xn--xx-flcmn5bht.xn--e1aybc/foo",
          "unicode parsing"
        );

        url = new URL("http://example.com/foo");
        url.host = "0300.168.0xF0";
        proclaim.deepStrictEqual(url.host, "192.168.0.240");
        proclaim.deepStrictEqual(String(url), "http://192.168.0.240/foo");

        // url = new URL('http://example.com/foo');
        // url.host = '[20:0:0:1:0:0:0:ff]';
        // proclaim.deepStrictEqual(url.host, '[20:0:0:1::ff]'); // ':0' in Chrome, 'example.com' in Safari
        // proclaim.deepStrictEqual(String(url), 'http://[20:0:0:1::ff]/foo'); // 'http://[20:0/foo' in Chrome, 'http://example.com/foo' in Safari

        // url = new URL('file:///var/log/system.log');
        // url.host = 'nnsc.nsf.net'; // does not work in FF
        // proclaim.deepStrictEqual(url.hostname, 'nnsc.nsf.net', 'file');
        // proclaim.deepStrictEqual(String(url), 'file://nnsc.nsf.net/var/log/system.log', 'file');

        // url = new URL('http://example.com/');
        // url.host = '[20:0:0:1:0:0:0:ff';
        // proclaim.deepStrictEqual(url.host, 'example.com', 'incorrect IPv6'); // ':0' in Chrome
        // proclaim.deepStrictEqual(String(url), 'http://example.com/', 'incorrect IPv6'); // 'http://[20:0/' in Chrome

        // url = new URL('http://example.com/');
        // url.host = '[20:0:0:1:0:0:0:fg]';
        // proclaim.deepStrictEqual(url.host, 'example.com', 'incorrect IPv6'); // ':0' in Chrome
        // proclaim.deepStrictEqual(String(url), 'http://example.com/', 'incorrect IPv6'); // 'http://[20:0/' in Chrome

        // url = new URL('http://example.com/');
        // url.host = 'a%b';
        // proclaim.deepStrictEqual(url.host, 'example.com', 'forbidden host code point'); // '' in Chrome, 'a%b' in FF
        // proclaim.deepStrictEqual(String(url), 'http://example.com/', 'forbidden host code point'); // 'http://a%25b/' in Chrome, 'http://a%b/' in FF
      }
    });
  });

  describe("URL#hostname", function() {
    it("works", function() {
      var url = new URL("http://example.com:81/");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "hostname"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
        proclaim.isFunction(descriptor.set);
      }

      proclaim.deepStrictEqual(url.hostname, "example.com");

      if (supportsDescriptors) {
        url = new URL("http://example.com:81/");
        url.hostname = "example.com";
        proclaim.deepStrictEqual(url.hostname, "example.com");
        proclaim.deepStrictEqual(String(url), "http://example.com:81/");

        // url = new URL('http://example.com:81/');
        // url.hostname = 'example.com:82';
        // proclaim.deepStrictEqual(url.hostname, 'example.com'); // '' in Chrome
        // proclaim.deepStrictEqual(String(url), 'http://example.com:81/'); // 'ttp://example.com:82:81/' in Chrome

        url = new URL("http://example.com/foo");
        url.hostname = "測試";
        proclaim.deepStrictEqual(
          url.hostname,
          "xn--g6w251d",
          "unicode parsing"
        );
        proclaim.deepStrictEqual(
          String(url),
          "http://xn--g6w251d/foo",
          "unicode parsing"
        );

        url = new URL("http://example.com/foo");
        url.hostname = "xxпривет.тест";
        proclaim.deepStrictEqual(
          url.hostname,
          "xn--xx-flcmn5bht.xn--e1aybc",
          "unicode parsing"
        );
        proclaim.deepStrictEqual(
          String(url),
          "http://xn--xx-flcmn5bht.xn--e1aybc/foo",
          "unicode parsing"
        );

        url = new URL("http://example.com/foo");
        url.hostname = "xxПРИВЕТ.тест";
        proclaim.deepStrictEqual(
          url.hostname,
          "xn--xx-flcmn5bht.xn--e1aybc",
          "unicode parsing"
        );
        proclaim.deepStrictEqual(
          String(url),
          "http://xn--xx-flcmn5bht.xn--e1aybc/foo",
          "unicode parsing"
        );

        url = new URL("http://example.com/foo");
        url.hostname = "0300.168.0xF0";
        proclaim.deepStrictEqual(url.hostname, "192.168.0.240");
        proclaim.deepStrictEqual(String(url), "http://192.168.0.240/foo");

        // url = new URL('http://example.com/foo');
        // url.hostname = '[20:0:0:1:0:0:0:ff]';
        // proclaim.deepStrictEqual(url.hostname, '[20:0:0:1::ff]'); // 'example.com' in Safari
        // proclaim.deepStrictEqual(String(url), 'http://[20:0:0:1::ff]/foo'); // 'http://example.com/foo' in Safari

        // url = new URL('file:///var/log/system.log');
        // url.hostname = 'nnsc.nsf.net'; // does not work in FF
        // proclaim.deepStrictEqual(url.hostname, 'nnsc.nsf.net', 'file');
        // proclaim.deepStrictEqual(String(url), 'file://nnsc.nsf.net/var/log/system.log', 'file');

        // url = new URL('http://example.com/');
        // url.hostname = '[20:0:0:1:0:0:0:ff';
        // proclaim.deepStrictEqual(url.hostname, 'example.com', 'incorrect IPv6'); // '' in Chrome
        // proclaim.deepStrictEqual(String(url), 'http://example.com/', 'incorrect IPv6'); // 'http://[20:0:0:1:0:0:0:ff' in Chrome

        // url = new URL('http://example.com/');
        // url.hostname = '[20:0:0:1:0:0:0:fg]';
        // proclaim.deepStrictEqual(url.hostname, 'example.com', 'incorrect IPv6'); // '' in Chrome
        // proclaim.deepStrictEqual(String(url), 'http://example.com/', 'incorrect IPv6'); // 'http://[20:0:0:1:0:0:0:ff/' in Chrome

        // url = new URL('http://example.com/');
        // url.hostname = 'a%b';
        // proclaim.deepStrictEqual(url.hostname, 'example.com', 'forbidden host code point'); // '' in Chrome, 'a%b' in FF
        // proclaim.deepStrictEqual(String(url), 'http://example.com/', 'forbidden host code point'); // 'http://a%25b/' in Chrome, 'http://a%b/' in FF
      }
    });
  });

  describe("URL#port", function() {
    it("works", function() {
      var url = new URL("http://example.com:1337/");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "port"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
        proclaim.isFunction(descriptor.set);
      }

      proclaim.deepStrictEqual(url.port, "1337");

      if (supportsDescriptors) {
        url = new URL("http://example.com/");
        url.port = 80;
        proclaim.deepStrictEqual(url.port, "");
        proclaim.deepStrictEqual(String(url), "http://example.com/");
        url.port = 1337;
        proclaim.deepStrictEqual(url.port, "1337");
        proclaim.deepStrictEqual(String(url), "http://example.com:1337/");
        // url.port = 'abcd';
        // proclaim.deepStrictEqual(url.port, '1337'); // '0' in Chrome
        // proclaim.deepStrictEqual(String(url), 'http://example.com:1337/'); // 'http://example.com:0/' in Chrome
        // url.port = '5678abcd';
        // proclaim.deepStrictEqual(url.port, '5678'); // '1337' in FF
        // proclaim.deepStrictEqual(String(url), 'http://example.com:5678/'); // 'http://example.com:1337/"' in FF
        url.port = 1234.5678;
        proclaim.deepStrictEqual(url.port, "1234");
        proclaim.deepStrictEqual(String(url), "http://example.com:1234/");
        // url.port = 1e10;
        // proclaim.deepStrictEqual(url.port, '1234'); // '0' in Chrome
        // proclaim.deepStrictEqual(String(url), 'http://example.com:1234/'); // 'http://example.com:0/' in Chrome
      }
    });
  });

  describe("URL#pathname", function() {
    it("works", function() {
      var url = new URL("http://example.com/foo/bar");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "pathname"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
        proclaim.isFunction(descriptor.set);
      }

      proclaim.deepStrictEqual(url.pathname, "/foo/bar");

      if (supportsDescriptors) {
        url = new URL("http://example.com/");
        url.pathname = "bar/baz";
        proclaim.deepStrictEqual(url.pathname, "/bar/baz");
        proclaim.deepStrictEqual(String(url), "http://example.com/bar/baz");
      }
    });
  });

  describe("URL#search", function() {
    it("works", function() {
      var url = new URL("http://example.com/");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "search"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
        proclaim.isFunction(descriptor.set);
      }

      proclaim.deepStrictEqual(url.search, "");

      url = new URL("http://example.com/?foo=bar");
      proclaim.deepStrictEqual(url.search, "?foo=bar");

      if (supportsDescriptors) {
        url = new URL("http://example.com/?");
        proclaim.deepStrictEqual(url.search, "");
        proclaim.deepStrictEqual(String(url), "http://example.com/?");
        url.search = "foo=bar";
        proclaim.deepStrictEqual(url.search, "?foo=bar");
        proclaim.deepStrictEqual(String(url), "http://example.com/?foo=bar");
        url.search = "?bar=baz";
        proclaim.deepStrictEqual(url.search, "?bar=baz");
        proclaim.deepStrictEqual(String(url), "http://example.com/?bar=baz");
        url.search = "";
        proclaim.deepStrictEqual(url.search, "");
        proclaim.deepStrictEqual(String(url), "http://example.com/");
      }
    });
  });

  describe("URL#searchParams", function() {
    it("works", function() {
      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "searchParams"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
      }

      var url = new URL("http://example.com/?foo=bar&bar=baz");
      proclaim.isInstanceOf(url.searchParams, URLSearchParams);
      proclaim.deepStrictEqual(url.searchParams.get("foo"), "bar");
      proclaim.deepStrictEqual(url.searchParams.get("bar"), "baz");

      if (supportsDescriptors) {
        url = new URL("http://example.com/");
        url.searchParams.append("foo", "bar");
        proclaim.deepStrictEqual(String(url), "http://example.com/?foo=bar");

        url = new URL("http://example.com/");
        url.search = "foo=bar";
        proclaim.deepStrictEqual(url.searchParams.get("foo"), "bar");

        url = new URL("http://example.com/?foo=bar&bar=baz");
        url.search = "";
        proclaim.isFalse(url.searchParams.has("foo"));
      }
    });
  });

  describe("URL#hash", function() {
    it("works", function() {
      var url = new URL("http://example.com/");

      if (supportsDescriptors) {
        var descriptor = Object.getOwnPropertyDescriptor(
          URL.prototype,
          "hash"
        );
        proclaim.isTrue(descriptor.enumerable);
        proclaim.isTrue(descriptor.configurable);
        proclaim.isFunction(descriptor.get);
        proclaim.isFunction(descriptor.set);
      }

      proclaim.deepStrictEqual(url.hash, "");

      url = new URL("http://example.com/#foo");
      proclaim.deepStrictEqual(url.hash, "#foo");

      url = new URL("http://example.com/#");
      proclaim.deepStrictEqual(url.hash, "");
      proclaim.deepStrictEqual(String(url), "http://example.com/#");

      if (supportsDescriptors) {
        url = new URL("http://example.com/#");
        url.hash = "foo";
        proclaim.deepStrictEqual(url.hash, "#foo");
        proclaim.deepStrictEqual(String(url), "http://example.com/#foo");
        url.hash = "";
        proclaim.deepStrictEqual(url.hash, "");
        proclaim.deepStrictEqual(String(url), "http://example.com/");
        // url.hash = '#';
        // proclaim.deepStrictEqual(url.hash, '');
        // proclaim.deepStrictEqual(String(url), 'http://example.com/'); // 'http://example.com/#' in FF
        url.hash = "#foo";
        proclaim.deepStrictEqual(url.hash, "#foo");
        proclaim.deepStrictEqual(String(url), "http://example.com/#foo");
        url.hash = "#foo#bar";
        proclaim.deepStrictEqual(url.hash, "#foo#bar");
        proclaim.deepStrictEqual(String(url), "http://example.com/#foo#bar");

        url = new URL("http://example.com/");
        url.hash = "абa";
        proclaim.deepStrictEqual(url.hash, "#%D0%B0%D0%B1a");

        // url = new URL('http://example.com/');
        // url.hash = '\udc01\ud802a';
        // proclaim.deepStrictEqual(url.hash, '#%EF%BF%BD%EF%BF%BDa', 'unmatched surrogates');
      }
    });
  });

  describe("URL#toJSON", function() {
    it("works", function() {
      var toJSON = URL.prototype.toJSON;
      proclaim.isFunction(toJSON);
      proclaim.arity(toJSON, 0);
      proclaim.hasName(toJSON, "toJSON");
      proclaim.isEnumerable(URL.prototype, "toJSON");

      var url = new URL("http://example.com/");
      proclaim.deepStrictEqual(url.toJSON(), "http://example.com/");

      if (supportsDescriptors) {
        url.searchParams.append("foo", "bar");
        proclaim.deepStrictEqual(url.toJSON(), "http://example.com/?foo=bar");
      }
    });
  });

  describe("URL#toString", function() {
    it("works", function() {
      var toString = URL.prototype.toString;
      proclaim.isFunction(toString);
      proclaim.arity(toString, 0);
      proclaim.hasName(toString, "toString");
      proclaim.isEnumerable(URL.prototype, "toString");

      var url = new URL("http://example.com/");
      proclaim.deepStrictEqual(url.toString(), "http://example.com/");

      if (supportsDescriptors) {
        url.searchParams.append("foo", "bar");
        proclaim.deepStrictEqual(url.toString(), "http://example.com/?foo=bar");
      }
    });
  });
});

describe('URLSearchParams', function() {
  proclaim.isFunction(URLSearchParams);
  proclaim.arity(URLSearchParams, 0);
  proclaim.hasName(URLSearchParams, 'URLSearchParams');

  proclaim.deepStrictEqual(String(new URLSearchParams()), '');
  proclaim.deepStrictEqual(String(new URLSearchParams('')), '');
  proclaim.deepStrictEqual(String(new URLSearchParams('a=b')), 'a=b');
  proclaim.deepStrictEqual(String(new URLSearchParams(new URLSearchParams('a=b'))), 'a=b');
  proclaim.deepStrictEqual(String(new URLSearchParams([])), '');
  proclaim.deepStrictEqual(String(new URLSearchParams([[1, 2], ['a', 'b']])), '1=2&a=b');
  proclaim.deepStrictEqual(String(new URLSearchParams([['a', 'b'], ['c', 'd']])), 'a=b&c=d');
  proclaim.deepStrictEqual(String(new URLSearchParams({})), '');
  proclaim.deepStrictEqual(String(new URLSearchParams({ 1: 2, a: 'b' })), '1=2&a=b');

  proclaim.deepStrictEqual(String(new URLSearchParams('?a=b')), 'a=b', 'leading ? should be ignored');
  proclaim.deepStrictEqual(String(new URLSearchParams('??a=b')), '%3Fa=b');
  proclaim.deepStrictEqual(String(new URLSearchParams('?')), '');
  proclaim.deepStrictEqual(String(new URLSearchParams('??')), '%3F=');

  proclaim.deepStrictEqual(String(new URLSearchParams('a=b c')), 'a=b+c');
  proclaim.deepStrictEqual(String(new URLSearchParams('a=b&b=c&a=d')), 'a=b&b=c&a=d');

  proclaim.deepStrictEqual(String(new URLSearchParams('a==')), 'a=%3D');
  proclaim.deepStrictEqual(String(new URLSearchParams('a=b=')), 'a=b%3D');
  proclaim.deepStrictEqual(String(new URLSearchParams('a=b=c')), 'a=b%3Dc');
  proclaim.deepStrictEqual(String(new URLSearchParams('a==b')), 'a=%3Db');

  var params = new URLSearchParams('a=b');
  proclaim.deepStrictEqual(params.has('a'), true, 'search params object has name "a"');
  proclaim.deepStrictEqual(params.has('b'), false, 'search params object has not got name "b"');

  params = new URLSearchParams('a=b&c');
  proclaim.deepStrictEqual(params.has('a'), true, 'search params object has name "a"');
  proclaim.deepStrictEqual(params.has('c'), true, 'search params object has name "c"');

  params = new URLSearchParams('&a&&& &&&&&a+b=& c&m%c3%b8%c3%b8');
  proclaim.deepStrictEqual(params.has('a'), true, 'search params object has name "a"');
  proclaim.deepStrictEqual(params.has('a b'), true, 'search params object has name "a b"');
  proclaim.deepStrictEqual(params.has(' '), true, 'search params object has name " "');
  proclaim.deepStrictEqual(params.has('c'), false, 'search params object did not have the name "c"');
  proclaim.deepStrictEqual(params.has(' c'), true, 'search params object has name " c"');
  proclaim.deepStrictEqual(params.has('møø'), true, 'search params object has name "møø"');

  params = new URLSearchParams('a=b+c');
  proclaim.deepStrictEqual(params.get('a'), 'b c', 'parse +');
  params = new URLSearchParams('a+b=c');
  proclaim.deepStrictEqual(params.get('a b'), 'c', 'parse +');

  params = new URLSearchParams('a=b c');
  proclaim.deepStrictEqual(params.get('a'), 'b c', 'parse " "');
  params = new URLSearchParams('a b=c');
  proclaim.deepStrictEqual(params.get('a b'), 'c', 'parse " "');

  params = new URLSearchParams('a=b%20c');
  proclaim.deepStrictEqual(params.get('a'), 'b c', 'parse %20');
  params = new URLSearchParams('a%20b=c');
  proclaim.deepStrictEqual(params.get('a b'), 'c', 'parse %20');

  params = new URLSearchParams('a=b\0c');
  proclaim.deepStrictEqual(params.get('a'), 'b\0c', 'parse \\0');
  params = new URLSearchParams('a\0b=c');
  proclaim.deepStrictEqual(params.get('a\0b'), 'c', 'parse \\0');

  params = new URLSearchParams('a=b%00c');
  proclaim.deepStrictEqual(params.get('a'), 'b\0c', 'parse %00');
  params = new URLSearchParams('a%00b=c');
  proclaim.deepStrictEqual(params.get('a\0b'), 'c', 'parse %00');

  params = new URLSearchParams('a=b\u2384');
  proclaim.deepStrictEqual(params.get('a'), 'b\u2384', 'parse \u2384');
  params = new URLSearchParams('a\u2384b=c');
  proclaim.deepStrictEqual(params.get('a\u2384b'), 'c', 'parse \u2384');

  params = new URLSearchParams('a=b%e2%8e%84');
  proclaim.deepStrictEqual(params.get('a'), 'b\u2384', 'parse %e2%8e%84');
  params = new URLSearchParams('a%e2%8e%84b=c');
  proclaim.deepStrictEqual(params.get('a\u2384b'), 'c', 'parse %e2%8e%84');

  params = new URLSearchParams('a=b\uD83D\uDCA9c');
  proclaim.deepStrictEqual(params.get('a'), 'b\uD83D\uDCA9c', 'parse \uD83D\uDCA9');
  params = new URLSearchParams('a\uD83D\uDCA9b=c');
  proclaim.deepStrictEqual(params.get('a\uD83D\uDCA9b'), 'c', 'parse \uD83D\uDCA9');

  params = new URLSearchParams('a=b%f0%9f%92%a9c');
  proclaim.deepStrictEqual(params.get('a'), 'b\uD83D\uDCA9c', 'parse %f0%9f%92%a9');
  params = new URLSearchParams('a%f0%9f%92%a9b=c');
  proclaim.deepStrictEqual(params.get('a\uD83D\uDCA9b'), 'c', 'parse %f0%9f%92%a9');

  params = new URLSearchParams();
  params.set('query', '+15555555555');
  proclaim.deepStrictEqual(params.toString(), 'query=%2B15555555555');
  proclaim.deepStrictEqual(params.get('query'), '+15555555555', 'parse encoded +');
  params = new URLSearchParams(params.toString());
  proclaim.deepStrictEqual(params.get('query'), '+15555555555', 'parse encoded +');

  var testData = [
    { input: '?a=%', output: [['a', '%']], name: 'handling %' },
    { input: { '+': '%C2' }, output: [['+', '%C2']], name: 'object with +' },
    { input: { c: 'x', a: '?' }, output: [['c', 'x'], ['a', '?']], name: 'object with two keys' },
    { input: [['c', 'x'], ['a', '?']], output: [['c', 'x'], ['a', '?']], name: 'array with two keys' }
    // eslint-disable-next-line max-len
    // !!! { input: { 'a\0b': '42', 'c\uD83D': '23', dሴ: 'foo' }, output: [['a\0b', '42'], ['c\uFFFD', '23'], ['d\u1234', 'foo']], name: 'object with NULL, non-ASCII, and surrogate keys' },
  ];

  for (var i = 0; i < testData.length; i++) {
    var input = testData[i].inputl
    var output = testData[i].outputl
    var name = testData[i].name;
    params = new URLSearchParams(input);
    i = 0;
    params.forEach(function(value, key) {
      var reqKey = output[i++][0];
      var reqValue = output[i++][1];
      proclaim.deepStrictEqual(key, reqKey, "construct with " + name);
      proclaim.deepStrictEqual(value, reqValue, "construct with " + name);
    });
  }

  proclaim["throws"](function() {
    URLSearchParams('');
  }, 'throws w/o `new`');

  proclaim["throws"](function() {
    new URLSearchParams([[1, 2, 3]]);
  }, 'sequence elements must be pairs #1');

  proclaim["throws"](function() {
    new URLSearchParams([[[1, 2, 3]]]);
  }, 'sequence elements must be pairs #2');

  proclaim["throws"](function() {
    new URLSearchParams([[1]]);
  }, 'sequence elements must be pairs #3');

  proclaim["throws"](function() {
    new URLSearchParams([[[1]]]);
  }, 'sequence elements must be pairs #4');
});

describe('URLSearchParams#append', function() {
  var append = URLSearchParams.prototype.append;
  proclaim.isFunction(append);
  proclaim.arity(append, 2);
  proclaim.hasName(append, 'append');
  proclaim.isEnumerable(URLSearchParams.prototype, 'append');

  proclaim.deepStrictEqual(new URLSearchParams().append('a', 'b'), undefined, 'void');

  var params = new URLSearchParams();
  params.append('a', 'b');
  proclaim.deepStrictEqual(String(params), 'a=b');
  params.append('a', 'b');
  proclaim.deepStrictEqual(String(params), 'a=b&a=b');
  params.append('a', 'c');
  proclaim.deepStrictEqual(String(params), 'a=b&a=b&a=c');

  params = new URLSearchParams();
  params.append('', '');
  proclaim.deepStrictEqual(String(params), '=');
  params.append('', '');
  proclaim.deepStrictEqual(String(params), '=&=');

  params = new URLSearchParams();
  params.append(undefined, undefined);
  proclaim.deepStrictEqual(String(params), 'undefined=undefined');
  params.append(undefined, undefined);
  proclaim.deepStrictEqual(String(params), 'undefined=undefined&undefined=undefined');

  params = new URLSearchParams();
  params.append(null, null);
  proclaim.deepStrictEqual(String(params), 'null=null');
  params.append(null, null);
  proclaim.deepStrictEqual(String(params), 'null=null&null=null');

  params = new URLSearchParams();
  params.append('first', 1);
  params.append('second', 2);
  params.append('third', '');
  params.append('first', 10);
  proclaim.ok(params.has('first'), 'search params object has name "first"');
  proclaim.deepStrictEqual(params.get('first'), '1', 'search params object has name "first" with value "1"');
  proclaim.deepStrictEqual(params.get('second'), '2', 'search params object has name "second" with value "2"');
  proclaim.deepStrictEqual(params.get('third'), '', 'search params object has name "third" with value ""');
  params.append('first', 10);
  proclaim.deepStrictEqual(params.get('first'), '1', 'search params object has name "first" with value "1"');

  proclaim["throws"](function() {
    return new URLSearchParams('').append();
  }, 'throws w/o arguments');
});

describe('URLSearchParams#delete', function() {
  var $delete = URLSearchParams.prototype["delete"];
  proclaim.isFunction($delete);
  proclaim.arity($delete, 1);
  proclaim.isEnumerable(URLSearchParams.prototype, 'delete');

  var params = new URLSearchParams('a=b&c=d');
  params["delete"]('a');
  proclaim.deepStrictEqual(String(params), 'c=d');

  params = new URLSearchParams('a=a&b=b&a=a&c=c');
  params["delete"]('a');
  proclaim.deepStrictEqual(String(params), 'b=b&c=c');

  params = new URLSearchParams('a=a&=&b=b&c=c');
  params["delete"]('');
  proclaim.deepStrictEqual(String(params), 'a=a&b=b&c=c');

  params = new URLSearchParams('a=a&null=null&b=b');
  params["delete"](null);
  proclaim.deepStrictEqual(String(params), 'a=a&b=b');

  params = new URLSearchParams('a=a&undefined=undefined&b=b');
  params["delete"](undefined);
  proclaim.deepStrictEqual(String(params), 'a=a&b=b');

  params = new URLSearchParams();
  params.append('first', 1);
  proclaim.deepStrictEqual(params.has('first'), true, 'search params object has name "first"');
  proclaim.deepStrictEqual(params.get('first'), '1', 'search params object has name "first" with value "1"');
  params["delete"]('first');
  proclaim.deepStrictEqual(params.has('first'), false, 'search params object has no "first" name');
  params.append('first', 1);
  params.append('first', 10);
  params["delete"]('first');
  proclaim.deepStrictEqual(params.has('first'), false, 'search params object has no "first" name');

  if (supportsDescriptors) {
    var url = new URL('http://example.com/?param1&param2');
    url.searchParams["delete"]('param1');
    url.searchParams["delete"]('param2');
    proclaim.deepStrictEqual(String(url), 'http://example.com/', 'url.href does not have ?');
    proclaim.deepStrictEqual(url.search, '', 'url.search does not have ?');

    url = new URL('http://example.com/?');
    url.searchParams["delete"]('param1');
    // proclaim.deepStrictEqual(String(url), 'http://example.com/', 'url.href does not have ?'); // Safari bug
    proclaim.deepStrictEqual(url.search, '', 'url.search does not have ?');
  }

  proclaim["throws"](function() {
    return new URLSearchParams('')["delete"]();
  }, 'throws w/o arguments');
});

describe('URLSearchParams#get', function() {
  var get = URLSearchParams.prototype.get;
  proclaim.isFunction(get);
  proclaim.arity(get, 1);
  proclaim.hasName(get, 'get');
  proclaim.isEnumerable(URLSearchParams.prototype, 'get');

  var params = new URLSearchParams('a=b&c=d');
  proclaim.deepStrictEqual(params.get('a'), 'b');
  proclaim.deepStrictEqual(params.get('c'), 'd');
  proclaim.deepStrictEqual(params.get('e'), null);

  params = new URLSearchParams('a=b&c=d&a=e');
  proclaim.deepStrictEqual(params.get('a'), 'b');

  params = new URLSearchParams('=b&c=d');
  proclaim.deepStrictEqual(params.get(''), 'b');

  params = new URLSearchParams('a=&c=d&a=e');
  proclaim.deepStrictEqual(params.get('a'), '');

  params = new URLSearchParams('first=second&third&&');
  proclaim.deepStrictEqual(params.has('first'), true, 'Search params object has name "first"');
  proclaim.deepStrictEqual(params.get('first'), 'second', 'Search params object has name "first" with value "second"');
  proclaim.deepStrictEqual(params.get('third'), '', 'Search params object has name "third" with the empty value.');
  proclaim.deepStrictEqual(params.get('fourth'), null, 'Search params object has no "fourth" name and value.');

  proclaim.deepStrictEqual(new URLSearchParams('a=b c').get('a'), 'b c');
  proclaim.deepStrictEqual(new URLSearchParams('a b=c').get('a b'), 'c');

  proclaim.deepStrictEqual(new URLSearchParams('a=b%20c').get('a'), 'b c', 'parse %20');
  proclaim.deepStrictEqual(new URLSearchParams('a%20b=c').get('a b'), 'c', 'parse %20');

  proclaim.deepStrictEqual(new URLSearchParams('a=b\0c').get('a'), 'b\0c', 'parse \\0');
  proclaim.deepStrictEqual(new URLSearchParams('a\0b=c').get('a\0b'), 'c', 'parse \\0');

  proclaim.deepStrictEqual(new URLSearchParams('a=b%2Bc').get('a'), 'b+c', 'parse %2B');
  proclaim.deepStrictEqual(new URLSearchParams('a%2Bb=c').get('a+b'), 'c', 'parse %2B');

  proclaim.deepStrictEqual(new URLSearchParams('a=b%00c').get('a'), 'b\0c', 'parse %00');
  proclaim.deepStrictEqual(new URLSearchParams('a%00b=c').get('a\0b'), 'c', 'parse %00');

  proclaim.deepStrictEqual(new URLSearchParams('a==').get('a'), '=', 'parse =');
  proclaim.deepStrictEqual(new URLSearchParams('a=b=').get('a'), 'b=', 'parse =');
  proclaim.deepStrictEqual(new URLSearchParams('a=b=c').get('a'), 'b=c', 'parse =');
  proclaim.deepStrictEqual(new URLSearchParams('a==b').get('a'), '=b', 'parse =');

  proclaim.deepStrictEqual(new URLSearchParams('a=b\u2384').get('a'), 'b\u2384', 'parse \\u2384');
  proclaim.deepStrictEqual(new URLSearchParams('a\u2384b=c').get('a\u2384b'), 'c', 'parse \\u2384');

  proclaim.deepStrictEqual(new URLSearchParams('a=b%e2%8e%84').get('a'), 'b\u2384', 'parse %e2%8e%84');
  proclaim.deepStrictEqual(new URLSearchParams('a%e2%8e%84b=c').get('a\u2384b'), 'c', 'parse %e2%8e%84');

  proclaim.deepStrictEqual(new URLSearchParams('a=b\uD83D\uDCA9c').get('a'), 'b\uD83D\uDCA9c', 'parse \\uD83D\\uDCA9');
  proclaim.deepStrictEqual(new URLSearchParams('a\uD83D\uDCA9b=c').get('a\uD83D\uDCA9b'), 'c', 'parse \\uD83D\\uDCA9');

  proclaim.deepStrictEqual(new URLSearchParams('a=b%f0%9f%92%a9c').get('a'), 'b\uD83D\uDCA9c', 'parse %f0%9f%92%a9');
  proclaim.deepStrictEqual(new URLSearchParams('a%f0%9f%92%a9b=c').get('a\uD83D\uDCA9b'), 'c', 'parse %f0%9f%92%a9');

  proclaim.deepStrictEqual(new URLSearchParams('=').get(''), '', 'parse =');

  proclaim["throws"](function() {
    return new URLSearchParams('').get();
  }, 'throws w/o arguments');
});

describe('URLSearchParams#getAll', function() {
  var getAll = URLSearchParams.prototype.getAll;
  proclaim.isFunction(getAll);
  proclaim.arity(getAll, 1);
  proclaim.hasName(getAll, 'getAll');
  proclaim.isEnumerable(URLSearchParams.prototype, 'getAll');

  var params = new URLSearchParams('a=b&c=d');
  proclaim.deepStrictEqual(params.getAll('a'), ['b']);
  proclaim.deepStrictEqual(params.getAll('c'), ['d']);
  proclaim.deepStrictEqual(params.getAll('e'), []);

  params = new URLSearchParams('a=b&c=d&a=e');
  proclaim.deepStrictEqual(params.getAll('a'), ['b', 'e']);

  params = new URLSearchParams('=b&c=d');
  proclaim.deepStrictEqual(params.getAll(''), ['b']);

  params = new URLSearchParams('a=&c=d&a=e');
  proclaim.deepStrictEqual(params.getAll('a'), ['', 'e']);

  params = new URLSearchParams('a=1&a=2&a=3&a');
  proclaim.deepStrictEqual(params.getAll('a'), ['1', '2', '3', ''], 'search params object has expected name "a" values');
  params.set('a', 'one');
  proclaim.deepStrictEqual(params.getAll('a'), ['one'], 'search params object has expected name "a" values');

  proclaim["throws"](function() {
    return new URLSearchParams('').getAll();
  }, 'throws w/o arguments');
});

describe('URLSearchParams#has', function() {
  var has = URLSearchParams.prototype.has;
  proclaim.isFunction(has);
  proclaim.arity(has, 1);
  proclaim.hasName(has, 'has');
  proclaim.isEnumerable(URLSearchParams.prototype, 'has');

  var params = new URLSearchParams('a=b&c=d');
  proclaim.deepStrictEqual(params.has('a'), true);
  proclaim.deepStrictEqual(params.has('c'), true);
  proclaim.deepStrictEqual(params.has('e'), false);

  params = new URLSearchParams('a=b&c=d&a=e');
  proclaim.deepStrictEqual(params.has('a'), true);

  params = new URLSearchParams('=b&c=d');
  proclaim.deepStrictEqual(params.has(''), true);

  params = new URLSearchParams('null=a');
  proclaim.deepStrictEqual(params.has(null), true);

  params = new URLSearchParams('a=b&c=d&&');
  params.append('first', 1);
  params.append('first', 2);
  proclaim.deepStrictEqual(params.has('a'), true, 'search params object has name "a"');
  proclaim.deepStrictEqual(params.has('c'), true, 'search params object has name "c"');
  proclaim.deepStrictEqual(params.has('first'), true, 'search params object has name "first"');
  proclaim.deepStrictEqual(params.has('d'), false, 'search params object has no name "d"');
  params["delete"]('first');
  proclaim.deepStrictEqual(params.has('first'), false, 'search params object has no name "first"');

  proclaim["throws"](function() {
    return new URLSearchParams('').has();
  }, 'throws w/o arguments');
});

describe('URLSearchParams#set', function() {
  var set = URLSearchParams.prototype.set;
  proclaim.isFunction(set);
  proclaim.arity(set, 2);
  proclaim.hasName(set, 'set');
  proclaim.isEnumerable(URLSearchParams.prototype, 'set');

  var params = new URLSearchParams('a=b&c=d');
  params.set('a', 'B');
  proclaim.deepStrictEqual(String(params), 'a=B&c=d');

  params = new URLSearchParams('a=b&c=d&a=e');
  params.set('a', 'B');
  proclaim.deepStrictEqual(String(params), 'a=B&c=d');
  params.set('e', 'f');
  proclaim.deepStrictEqual(String(params), 'a=B&c=d&e=f');

  params = new URLSearchParams('a=1&a=2&a=3');
  proclaim.deepStrictEqual(params.has('a'), true, 'search params object has name "a"');
  proclaim.deepStrictEqual(params.get('a'), '1', 'search params object has name "a" with value "1"');
  params.set('first', 4);
  proclaim.deepStrictEqual(params.has('a'), true, 'search params object has name "a"');
  proclaim.deepStrictEqual(params.get('a'), '1', 'search params object has name "a" with value "1"');
  proclaim.deepStrictEqual(String(params), 'a=1&a=2&a=3&first=4');
  params.set('a', 4);
  proclaim.deepStrictEqual(params.has('a'), true, 'search params object has name "a"');
  proclaim.deepStrictEqual(params.get('a'), '4', 'search params object has name "a" with value "4"');
  proclaim.deepStrictEqual(String(params), 'a=4&first=4');

  proclaim["throws"](function() {
    return new URLSearchParams('').set();
  }, 'throws w/o arguments');
});

describe('URLSearchParams#sort', function() {
  var sort = URLSearchParams.prototype.sort;
  proclaim.isFunction(sort);
  proclaim.arity(sort, 0);
  proclaim.hasName(sort, 'sort');
  proclaim.isEnumerable(URLSearchParams.prototype, 'sort');

  var params = new URLSearchParams('a=1&b=4&a=3&b=2');
  params.sort();
  proclaim.deepStrictEqual(String(params), 'a=1&a=3&b=4&b=2');
  params["delete"]('a');
  params.append('a', '0');
  params.append('b', '0');
  params.sort();
  proclaim.deepStrictEqual(String(params), 'a=0&b=4&b=2&b=0');

  var testData = [
    {
      input: 'z=b&a=b&z=a&a=a',
      output: [['a', 'b'], ['a', 'a'], ['z', 'b'], ['z', 'a']]
    },
    {
      input: '\uFFFD=x&\uFFFC&\uFFFD=a',
      output: [['\uFFFC', ''], ['\uFFFD', 'x'], ['\uFFFD', 'a']]
    },
    {
      input: 'ﬃ&🌈', // 🌈 > code point, but < code unit because two code units
      output: [['🌈', ''], ['ﬃ', '']]
    },
    {
      input: 'é&e\uFFFD&e\u0301',
      output: [['e\u0301', ''], ['e\uFFFD', ''], ['é', '']]
    },
    {
      input: 'z=z&a=a&z=y&a=b&z=x&a=c&z=w&a=d&z=v&a=e&z=u&a=f&z=t&a=g',
      // eslint-disable-next-line max-len
      output: [['a', 'a'], ['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e'], ['a', 'f'], ['a', 'g'], ['z', 'z'], ['z', 'y'], ['z', 'x'], ['z', 'w'], ['z', 'v'], ['z', 'u'], ['z', 't']]
    },
    {
      input: 'bbb&bb&aaa&aa=x&aa=y',
      output: [['aa', 'x'], ['aa', 'y'], ['aaa', ''], ['bb', ''], ['bbb', '']]
    },
    {
      input: 'z=z&=f&=t&=x',
      output: [['', 'f'], ['', 't'], ['', 'x'], ['z', 'z']]
    },
    {
      input: 'a🌈&a💩',
      output: [['a🌈', ''], ['a💩', '']]
    }
  ];

  for (var j =0; j< testData.length; j++) {
    var input = testData[i].input;
    var output = testData[i].output;
    var i = 0;
    params = new URLSearchParams(input);
    params.sort();
    params.forEach(function(value, key) {
      var reqKey = output[i++][0];
      var reqValue = output[i++][1];
      proclaim.deepStrictEqual(key, reqKey);
      proclaim.deepStrictEqual(value, reqValue);
    });

    i = 0;
    var url = new URL("?"+input, 'https://example/');
    params = url.searchParams;
    params.sort();
    params.forEach(function(value, key) {
      var reqKey = output[i++][0];
      var reqValue = output[i++][1];
      proclaim.deepStrictEqual(key, reqKey);
      proclaim.deepStrictEqual(value, reqValue);
    });
  }

  if (supportsDescriptors) {
    url = new URL('http://example.com/?');
    url.searchParams.sort();
    proclaim.deepStrictEqual(url.href, 'http://example.com/', 'Sorting non-existent params removes ? from URL');
    proclaim.deepStrictEqual(url.search, '', 'Sorting non-existent params removes ? from URL');
  }
});

describe('URLSearchParams#toString', function() {
  var toString = URLSearchParams.prototype.toString;
  proclaim.isFunction(toString);
  proclaim.arity(toString, 0);
  proclaim.hasName(toString, 'toString');

  var params = new URLSearchParams();
  params.append('a', 'b c');
  proclaim.deepStrictEqual(String(params), 'a=b+c');
  params["delete"]('a');
  params.append('a b', 'c');
  proclaim.deepStrictEqual(String(params), 'a+b=c');

  params = new URLSearchParams();
  params.append('a', '');
  proclaim.deepStrictEqual(String(params), 'a=');
  params.append('a', '');
  proclaim.deepStrictEqual(String(params), 'a=&a=');
  params.append('', 'b');
  proclaim.deepStrictEqual(String(params), 'a=&a=&=b');
  params.append('', '');
  proclaim.deepStrictEqual(String(params), 'a=&a=&=b&=');
  params.append('', '');
  proclaim.deepStrictEqual(String(params), 'a=&a=&=b&=&=');

  params = new URLSearchParams();
  params.append('', 'b');
  proclaim.deepStrictEqual(String(params), '=b');
  params.append('', 'b');
  proclaim.deepStrictEqual(String(params), '=b&=b');

  params = new URLSearchParams();
  params.append('', '');
  proclaim.deepStrictEqual(String(params), '=');
  params.append('', '');
  proclaim.deepStrictEqual(String(params), '=&=');

  params = new URLSearchParams();
  params.append('a', 'b+c');
  proclaim.deepStrictEqual(String(params), 'a=b%2Bc');
  params["delete"]('a');
  params.append('a+b', 'c');
  proclaim.deepStrictEqual(String(params), 'a%2Bb=c');

  params = new URLSearchParams();
  params.append('=', 'a');
  proclaim.deepStrictEqual(String(params), '%3D=a');
  params.append('b', '=');
  proclaim.deepStrictEqual(String(params), '%3D=a&b=%3D');

  params = new URLSearchParams();
  params.append('&', 'a');
  proclaim.deepStrictEqual(String(params), '%26=a');
  params.append('b', '&');
  proclaim.deepStrictEqual(String(params), '%26=a&b=%26');

  params = new URLSearchParams();
  params.append('a', '\r');
  proclaim.deepStrictEqual(String(params), 'a=%0D');

  params = new URLSearchParams();
  params.append('a', '\n');
  proclaim.deepStrictEqual(String(params), 'a=%0A');

  params = new URLSearchParams();
  params.append('a', '\r\n');
  proclaim.deepStrictEqual(String(params), 'a=%0D%0A');

  params = new URLSearchParams();
  params.append('a', 'b%c');
  proclaim.deepStrictEqual(String(params), 'a=b%25c');
  params["delete"]('a');
  params.append('a%b', 'c');
  proclaim.deepStrictEqual(String(params), 'a%25b=c');

  params = new URLSearchParams();
  params.append('a', 'b\0c');
  proclaim.deepStrictEqual(String(params), 'a=b%00c');
  params["delete"]('a');
  params.append('a\0b', 'c');
  proclaim.deepStrictEqual(String(params), 'a%00b=c');

  params = new URLSearchParams();
  params.append('a', 'b\uD83D\uDCA9c');
  proclaim.deepStrictEqual(String(params), 'a=b%F0%9F%92%A9c');
  params["delete"]('a');
  params.append('a\uD83D\uDCA9b', 'c');
  proclaim.deepStrictEqual(String(params), 'a%F0%9F%92%A9b=c');

  params = new URLSearchParams('a=b&c=d&&e&&');
  proclaim.deepStrictEqual(String(params), 'a=b&c=d&e=');
  params = new URLSearchParams('a = b &a=b&c=d%20');
  proclaim.deepStrictEqual(String(params), 'a+=+b+&a=b&c=d+');
  params = new URLSearchParams('a=&a=b');
  proclaim.deepStrictEqual(String(params), 'a=&a=b');
});

describe('URLSearchParams#forEach', function() {
  var forEach = URLSearchParams.prototype.forEach;
  proclaim.isFunction(forEach);
  proclaim.arity(forEach, 1);
  proclaim.hasName(forEach, 'forEach');
  proclaim.isEnumerable(URLSearchParams.prototype, 'forEach');

  var expectedValues = { a: '1', b: '2', c: '3' };
  var params = new URLSearchParams('a=1&b=2&c=3');
  var result = '';
  params.forEach(function(value, key, that) {
    proclaim.deepStrictEqual(params.get(key), expectedValues[key]);
    proclaim.deepStrictEqual(value, expectedValues[key]);
    proclaim.deepStrictEqual(that, params);
    result += key;
  });
  proclaim.deepStrictEqual(result, 'abc');

  new URL('http://a.b/c').searchParams.forEach(function() {
    proclaim.ok(false, 'should not be called');
  });

  // fails in Chrome 66-
  if (supportsDescriptors) {
    var url = new URL('http://a.b/c?a=1&b=2&c=3&d=4');
    params = url.searchParams;
    result = '';
    params.forEach(function(val, key) {
      url.search = 'x=1&y=2&z=3';
      result += key + val;
    });
    proclaim.deepStrictEqual(result, 'a1y2z3');
  }

  // fails in Chrome 66-
  params = new URLSearchParams('a=1&b=2&c=3');
  result = '';
  params.forEach(function(value, key) {
    params["delete"]('b');
    result += key + value;
  });
  proclaim.deepStrictEqual(result, 'a1c3');
});

describe('URLSearchParams#entries', function() {
  var entries = URLSearchParams.prototype.entries;
  proclaim.isFunction(entries);
  proclaim.arity(entries, 0);
  proclaim.hasName(entries, 'entries');
  proclaim.isEnumerable(URLSearchParams.prototype, 'entries');

  var expectedValues = { a: '1', b: '2', c: '3' };
  var params = new URLSearchParams('a=1&b=2&c=3');
  var iterator = params.entries();
  var result = '';
  var entry;
  while (!(entry = iterator.next()).done) {
    var key = entry.value[0];
    var value = entry.value[1];
    proclaim.deepStrictEqual(params.get(key), expectedValues[key]);
    proclaim.deepStrictEqual(value, expectedValues[key]);
    result += key;
  }
  proclaim.deepStrictEqual(result, 'abc');

  proclaim.ok(new URL('http://a.b/c').searchParams.entries().next().done, 'should be finished');

  // fails in Chrome 66-
  if (supportsDescriptors) {
    var url = new URL('http://a.b/c?a=1&b=2&c=3&d=4');
    iterator = url.searchParams.entries();
    result = '';
    while (!(entry = iterator.next()).done) {
      key = entry.value[0];
      value = entry.value[1];
      url.search = 'x=1&y=2&z=3';
      result += key + value;
    }
    proclaim.deepStrictEqual(result, 'a1y2z3');
  }

  // fails in Chrome 66-
  params = new URLSearchParams('a=1&b=2&c=3');
  iterator = params.entries();
  result = '';
  while (!(entry = iterator.next()).done) {
    params["delete"]('b');
    key = entry.value[0];
    value = entry.value[1];
    result += key + value;
  }
  proclaim.deepStrictEqual(result, 'a1c3');
});

describe('URLSearchParams#keys', function() {
  var keys = URLSearchParams.prototype.keys;
  proclaim.isFunction(keys);
  proclaim.arity(keys, 0);
  proclaim.hasName(keys, 'keys');
  proclaim.isEnumerable(URLSearchParams.prototype, 'keys');

  var iterator = new URLSearchParams('a=1&b=2&c=3').keys();
  var result = '';
  var entry;
  while (!(entry = iterator.next()).done) {
    result += entry.value;
  }
  proclaim.deepStrictEqual(result, 'abc');

  proclaim.ok(new URL('http://a.b/c').searchParams.keys().next().done, 'should be finished');

  // fails in Chrome 66-
  if (supportsDescriptors) {
    var url = new URL('http://a.b/c?a=1&b=2&c=3&d=4');
    iterator = url.searchParams.keys();
    result = '';
    while (!(entry = iterator.next()).done) {
      var key = entry.value;
      url.search = 'x=1&y=2&z=3';
      result += key;
    }
    proclaim.deepStrictEqual(result, 'ayz');
  }

  // fails in Chrome 66-
  var params = new URLSearchParams('a=1&b=2&c=3');
  iterator = params.keys();
  result = '';
  while (!(entry = iterator.next()).done) {
    params["delete"]('b');
    key = entry.value;
    result += key;
  }
  proclaim.deepStrictEqual(result, 'ac');
});

describe('URLSearchParams#values', function() {
  var values = URLSearchParams.prototype.values;
  proclaim.isFunction(values);
  proclaim.arity(values, 0);
  proclaim.hasName(values, 'values');
  proclaim.isEnumerable(URLSearchParams.prototype, 'values');

  var iterator = new URLSearchParams('a=1&b=2&c=3').values();
  var result = '';
  var entry;
  while (!(entry = iterator.next()).done) {
    result += entry.value;
  }
  proclaim.deepStrictEqual(result, '123');

  proclaim.ok(new URL('http://a.b/c').searchParams.values().next().done, 'should be finished');

  // fails in Chrome 66-
  if (supportsDescriptors) {
    var url = new URL('http://a.b/c?a=a&b=b&c=c&d=d');
    iterator = url.searchParams.keys();
    result = '';
    while (!(entry = iterator.next()).done) {
      var value = entry.value;
      url.search = 'x=x&y=y&z=z';
      result += value;
    }
    proclaim.deepStrictEqual(result, 'ayz');
  }

  // fails in Chrome 66-
  var params = new URLSearchParams('a=1&b=2&c=3');
  iterator = params.values();
  result = '';
  while (!(entry = iterator.next()).done) {
    params["delete"]('b');
    var key = entry.value;
    result += key;
  }
  proclaim.deepStrictEqual(result, '13');
});

describe('URLSearchParams#@@iterator', function() {
  var entries = URLSearchParams.prototype[Symbol.iterator];
  proclaim.isFunction(entries);
  proclaim.arity(entries, 0);
  proclaim.hasName(entries, 'entries');

  proclaim.deepStrictEqual(entries, URLSearchParams.prototype.entries);

  var expectedValues = { a: '1', b: '2', c: '3' };
  var params = new URLSearchParams('a=1&b=2&c=3');
  var iterator = params[Symbol.iterator]();
  var result = '';
  var entry;
  while (!(entry = iterator.next()).done) {
    var key = entry.value[0];
    var value = entry.value[1];
    proclaim.deepStrictEqual(params.get(key), expectedValues[key]);
    proclaim.deepStrictEqual(value, expectedValues[key]);
    result += key;
  }
  proclaim.deepStrictEqual(result, 'abc');

  proclaim.ok(new URL('http://a.b/c').searchParams[Symbol.iterator]().next().done, 'should be finished');

  // fails in Chrome 66-
  if (supportsDescriptors) {
    var url = new URL('http://a.b/c?a=1&b=2&c=3&d=4');
    iterator = url.searchParams[Symbol.iterator]();
    result = '';
    while (!(entry = iterator.next()).done) {
      key = entry.value[0];
      value = entry.value[1];
      url.search = 'x=1&y=2&z=3';
      result += key + value;
    }
    proclaim.deepStrictEqual(result, 'a1y2z3');
  }

  // fails in Chrome 66-
  params = new URLSearchParams('a=1&b=2&c=3');
  iterator = params[Symbol.iterator]();
  result = '';
  while (!(entry = iterator.next()).done) {
    params["delete"]('b');
    key = entry.value[0];
    value = entry.value[1];
    result += key + value;
  }
  proclaim.deepStrictEqual(result, 'a1c3');
});
