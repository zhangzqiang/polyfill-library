/* eslint-env mocha, browser */
/* global proclaim */
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
