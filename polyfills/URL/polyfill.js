/* global Reflect, Symbol */
var NativeURL = URL;
(function(global) {
  var has = Reflect.has;
  var failure = {};
  /**
   * Creates an array containing the numeric code points of each Unicode
   * character in the string. While JavaScript uses UCS-2 internally,
   * this function will convert a pair of surrogate halves (each of which
   * UCS-2 exposes as separate characters) into a single code point,
   * matching UTF-16.
   */
  function ucs2decode(string) {
    var output = [];
    var counter = 0;
    var length = string.length;
    while (counter < length) {
      var value = string.charCodeAt(counter++);
      if (value >= 0xd800 && value <= 0xdbff && counter < length) {
        // It's a high surrogate, and there is a next character.
        var extra = string.charCodeAt(counter++);
        if ((extra & 0xfc00) == 0xdc00) {
          // Low surrogate.
          output.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
        } else {
          // It's an unmatched surrogate; only append this code unit, in case the
          // next code unit is the high surrogate of a surrogate pair.
          output.push(value);
          counter--;
        }
      } else {
        output.push(value);
      }
    }
    return output;
  }

  function trimControlChars(url) {
    // eslint-disable-next-line no-control-regex
    return url.replace(/^[\u0000-\u001F\u0020]+|[\u0000-\u001F\u0020]+$/g, "");
  }

  function trimTabAndNewline(url) {
    // eslint-disable-next-line no-control-regex
    return url.replace(/\u0009|\u000A|\u000D/g, "");
  }

  var INVALID_AUTHORITY = "Invalid authority";
  var INVALID_SCHEME = "Invalid scheme";
  var INVALID_HOST = "Invalid host";
  var INVALID_PORT = "Invalid port";

  var EOF;

  // https://url.spec.whatwg.org/#forbidden-host-code-point
  function containsForbiddenHostCodePoint(string) {
    // A forbidden host code point is U+0000 NULL, U+0009 TAB, U+000A LF, U+000D CR, U+0020 SPACE, U+0023 (#), U+0025 (%), U+002F (/), U+003A (:), U+003F (?), U+0040 (@), U+005B ([), U+005C (\), or U+005D (]).
    return (
      string.search(
        // eslint-disable-next-line no-control-regex
        /\u0000|\u0009|\u000A|\u000D|\u0020|#|%|\/|:|\?|@|\[|\\|\]/
      ) !== -1
    );
  }

  // https://url.spec.whatwg.org/#shorten-a-urls-path
  function shortenUrlPath(url) {
    // 1. Let path be url’s path.
    var path = url.path;
    // 2. If path is empty, then return.
    if (path.length === 0) {
      return;
    }
    // 3. If url’s scheme is "file", path’s size is 1, and path[0] is a normalized Windows drive letter, then return.
    if (
      url.scheme === "file" &&
      path.length === 1 &&
      isNormalizedWindowsDriveLetter(path[0])
    ) {
      return;
    }
    // 4. Remove path’s last item.
    path.pop();
  }

  function strictlySplitByteSequence(buf, cp) {
    var list = [];
    var last = 0;
    var i = buf.indexOf(cp);
    while (i >= 0) {
      list.push(buf.slice(last, i));
      last = i + 1;
      i = buf.indexOf(cp, last);
    }
    if (last !== buf.length) {
      list.push(buf.slice(last));
    }
    return list;
  }

  function replaceByteInByteSequence(buf, from, to) {
    var i = buf.indexOf(from);
    while (i >= 0) {
      buf[i] = to;
      i = buf.indexOf(from, i + 1);
    }
    return buf;
  }

  // https://url.spec.whatwg.org/#concept-urlencoded-parser
  // The application/x-www-form-urlencoded parser takes a byte sequence input, and then runs these steps:
  function parseUrlencoded(input) {
    // 1. Let sequences be the result of splitting input on 0x26 (&).
    var sequences = strictlySplitByteSequence(input, "&");
    // 2. Let output be an initially empty list of name-value tuples where both name and value hold a string.
    var output = [];
    // 3. For each byte sequence bytes in sequences:
    for (var i = 0; i < sequences.length; i++) {
      var bytes = sequences[i];
      // 3.1. If bytes is the empty byte sequence, then continue.
      if (bytes.length === 0) {
        continue;
      }
      // 3.2. If bytes contains a 0x3D (=), then let name be the bytes from the start of bytes up to but excluding its first 0x3D (=), and let value be the bytes, if any, after the first 0x3D (=) up to the end of bytes. If 0x3D (=) is the first byte, then name will be the empty byte sequence. If it is the last, then value will be the empty byte sequence.
      // 3.3. Otherwise, let name have the value of bytes and let value be the empty byte sequence.
      var name;
      var value;
      var indexOfEqual = bytes.indexOf("=");

      if (indexOfEqual >= 0) {
        name = bytes.slice(0, indexOfEqual);
        value = bytes.slice(indexOfEqual + 1);
      } else {
        name = bytes;
        value = "";
      }
      // 3.4. Replace any 0x2B (+) in name and value with 0x20 (SP).
      name = replaceByteInByteSequence(name, ("+"), (" "));
      value = replaceByteInByteSequence(value, ("+"), (" "));
      // 3.5. Let nameString and valueString be the result of running UTF-8 decode without BOM on the percent decoding of name and value, respectively.
      var nameString = percentDecode(name).toString();
      var valueString = percentDecode(value).toString();
      // 3.6. Append (nameString, valueString) to output.
      output.push([nameString, valueString]);
    }
    // 4. Return output.
    return output;
  }

  var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1
  var base = 36;
  var tMin = 1;
  var tMax = 26;
  var skew = 38;
  var damp = 700;
  var initialBias = 72;
  var initialN = 128; // 0x80
  var delimiter = "-"; // '\x2D'
  var regexNonASCII = /[^\0-\u007E]/; // non-ASCII chars
  var regexSeparators = /[.\u3002\uFF0E\uFF61]/g; // RFC 3490 separators
  var OVERFLOW_ERROR = "Overflow: input needs wider integers to process";
  var baseMinusTMin = base - tMin;
  var floor = Math.floor;
  var stringFromCharCode = String.fromCharCode;

  /**
   * Converts a digit/integer into a basic code point.
   */
  var digitToBasic = function(digit) {
    //  0..25 map to ASCII a..z or A..Z
    // 26..35 map to ASCII 0..9
    return digit + 22 + 75 * (digit < 26);
  };

  /**
   * Bias adaptation function as per section 3.4 of RFC 3492.
   * https://tools.ietf.org/html/rfc3492#section-3.4
   */
  var adapt = function(delta, numPoints, firstTime) {
    var k = 0;
    delta = firstTime ? floor(delta / damp) : delta >> 1;
    delta += floor(delta / numPoints);
    for (; delta > (baseMinusTMin * tMax) >> 1; k += base) {
      delta = floor(delta / baseMinusTMin);
    }
    return floor(k + ((baseMinusTMin + 1) * delta) / (delta + skew));
  };

  /**
   * Converts a string of Unicode symbols (e.g. a domain name label) to a
   * Punycode string of ASCII-only symbols.
   */
  // eslint-disable-next-line  max-statements
  var encode = function(input) {
    var output = [];

    // Convert the input in UCS-2 to an array of Unicode code points.
    input = ucs2decode(input);

    // Cache the length.
    var inputLength = input.length;

    // Initialize the state.
    var n = initialN;
    var delta = 0;
    var bias = initialBias;
    var i, currentValue;

    // Handle the basic code points.
    for (i = 0; i < input.length; i++) {
      currentValue = input[i];
      if (currentValue < 0x80) {
        output.push(stringFromCharCode(currentValue));
      }
    }

    var basicLength = output.length; // number of basic code points.
    var handledCPCount = basicLength; // number of code points that have been handled;

    // Finish the basic string with a delimiter unless it's empty.
    if (basicLength) {
      output.push(delimiter);
    }

    // Main encoding loop:
    while (handledCPCount < inputLength) {
      // All non-basic code points < n have been handled already. Find the next larger one:
      var m = maxInt;
      for (i = 0; i < input.length; i++) {
        currentValue = input[i];
        if (currentValue >= n && currentValue < m) {
          m = currentValue;
        }
      }

      // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>, but guard against overflow.
      var handledCPCountPlusOne = handledCPCount + 1;
      if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
        throw RangeError(OVERFLOW_ERROR);
      }

      delta += (m - n) * handledCPCountPlusOne;
      n = m;

      for (i = 0; i < input.length; i++) {
        currentValue = input[i];
        if (currentValue < n && ++delta > maxInt) {
          throw RangeError(OVERFLOW_ERROR);
        }
        if (currentValue == n) {
          // Represent delta as a generalized variable-length integer.
          var q = delta;
          for (var k = base /* no condition */; ; k += base) {
            var t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
            if (q < t) break;
            var qMinusT = q - t;
            var baseMinusT = base - t;
            output.push(
              stringFromCharCode(digitToBasic(t + (qMinusT % baseMinusT)))
            );
            q = floor(qMinusT / baseMinusT);
          }

          output.push(stringFromCharCode(digitToBasic(q)));
          bias = adapt(
            delta,
            handledCPCountPlusOne,
            handledCPCount == basicLength
          );
          delta = 0;
          ++handledCPCount;
        }
      }

      ++delta;
      ++n;
    }
    return output.join("");
  };

  function punycodeToAscii(input) {
    var encoded = [];
    var labels = input
      .toLowerCase()
      .replace(regexSeparators, "\u002E")
      .split(".");
    var i, label;
    for (i = 0; i < labels.length; i++) {
      label = labels[i];
      encoded.push(regexNonASCII.test(label) ? "xn--" + encode(label) : label);
    }
    return encoded.join(".");
  }

  // https://url.spec.whatwg.org/#concept-domain-to-ascii
  // eslint-disable-next-line no-unused-vars
  function domainToASCII(domain, beStrict) {
    // 1. If beStrict is not given, set it to false.
    if (arguments.length < 1) {
      beStrict = false;
    }
    // 2. Let result be the result of running Unicode ToASCII with domain_name set to domain, UseSTD3ASCIIRules set to beStrict, CheckHyphens set to false, CheckBidi set to true, CheckJoiners set to true, Transitional_Processing set to false, and VerifyDnsLength set to beStrict.
    var result = punycodeToAscii(domain);
    // 3. If result is a failure value, validation error, return failure.
    if (result === null) {
      return failure;
    }
    // 4. Return result.
    return result;
  }

  // https://url.spec.whatwg.org/#single-dot-path-segment
  // A single-dot path segment must be "." or an ASCII case-insensitive match for "%2e".
  function isSingleDot(buffer) {
    return buffer === "." || buffer.toLowerCase() === "%2e";
  }

  // https://url.spec.whatwg.org/#double-dot-path-segment
  // A double-dot path segment must be ".." or an ASCII case-insensitive match for ".%2e", "%2e.", or "%2e%2e".
  function isDoubleDot(buffer) {
    buffer = buffer.toLowerCase();
    return (
      buffer === ".." ||
      buffer === "%2e." ||
      buffer === ".%2e" ||
      buffer === "%2e%2e"
    );
  }

  // https://url.spec.whatwg.org/#windows-drive-letter
  // A Windows drive letter is two code points, of which the first is an ASCII alpha and the second is either U+003A (:) or U+007C (|).
  function isWindowsDriveLetter(string) {
    return (
      string.length === 2 &&
      isASCIIAlpha(string.codePointAt(0)) &&
      (string[1] === ":" || string[1] === "|")
    );
  }

  // https://url.spec.whatwg.org/#normalized-windows-drive-letter
  // A normalized Windows drive letter is a Windows drive letter of which the second code point is U+003A (:).
  function isNormalizedWindowsDriveLetter(string) {
    return isWindowsDriveLetter(string) && string[1] === ":";
  }

  // https://url.spec.whatwg.org/#start-with-a-windows-drive-letter
  // A string starts with a Windows drive letter if all of the following are true:
  // its length is greater than or equal to 2
  // its first two code points are a Windows drive letter
  // its length is 2 or its third code point is U+002F (/), U+005C (\), U+003F (?), or U+0023 (#).
  var startsWithWindowsDriveLetter = function(string) {
    var third;
    return (
      string.length > 1 &&
      isWindowsDriveLetter(string.slice(0, 2)) &&
      (string.length == 2 ||
        (third = string.charAt(2)) === "/" ||
        third === "\\" ||
        third === "?" ||
        third === "#")
    );
  };

  function isASCIIDigit(c) {
    return /\d/.test(c)
  }

  function isASCIIAlpha(c) {
    return /[A-Za-z]/.test(c);
  }

  function isASCIIAlphanumeric(c) {
    return isASCIIAlpha(c) || isASCIIDigit(c);
  }

  function isASCIIHex(c) {
    return /^[\dA-Fa-f]+$/.test(c);
  }

  // https://url.spec.whatwg.org/#percent-decode
  function percentDecode(input) {
    // 1. Let output be an empty byte sequence.
    var output = "";
    // 2. For each byte byte in input:
    for (var i = 0; i < input.length; ++i) {
      // 2.1. If byte is not 0x25 (%), then append byte to output.
      if (input[i] !== codePointFor("%")) {
        output += input[i];
        // 2.2. Otherwise, if byte is 0x25 (%) and the next two bytes after byte in input are not in the ranges 0x30 (0) to 0x39 (9), 0x41 (A) to 0x46 (F), and 0x61 (a) to 0x66 (f), all inclusive, append byte to output.
      } else if (
        (input[i] === codePointFor("%") && !isASCIIHex(input[i + 1])) ||
        !isASCIIHex(input[i + 2])
      ) {
        output += input[i];
        // 2.3. Otherwise:
      } else {
        // 2.3.1. Let bytePoint be the two bytes after byte in input, decoded, and then interpreted as hexadecimal number.
        var bytePoint = parseInt(input.slice(i + 1, i + 3).toString(), 16);
        // 2.3.2. Append a byte whose value is bytePoint to output
        output += bytePoint;
        // 2.3.3. Skip the next two bytes in input.
        i += 2;
      }
    }
    // 3. Return output.
    return output;
  }

  // States:
  var SCHEME_START = {};
  var SCHEME = {};
  var NO_SCHEME = {};
  var SPECIAL_RELATIVE_OR_AUTHORITY = {};
  var PATH_OR_AUTHORITY = {};
  var RELATIVE = {};
  var RELATIVE_SLASH = {};
  var SPECIAL_AUTHORITY_SLASHES = {};
  var SPECIAL_AUTHORITY_IGNORE_SLASHES = {};
  var AUTHORITY = {};
  var HOST = {};
  var HOSTNAME = {};
  var PORT = {};
  var FILE = {};
  var FILE_SLASH = {};
  var FILE_HOST = {};
  var PATH_START = {};
  var PATH = {};
  var CANNOT_BE_A_BASE_URL_PATH = {};
  var QUERY = {};
  var FRAGMENT = {};

  var specialSchemes = {
    ftp: 21,
    file: null,
    http: 80,
    https: 443,
    ws: 80,
    wss: 443
  };

  // function at(input, idx) {
  //   var c = input[idx];
  //   return isNaN(c) ? undefined : String.fromCodePoint(c);
  // }

  // https://url.spec.whatwg.org/#is-special
  // A URL is special if its scheme is a special scheme. A URL is not special if its scheme is not a special scheme.
  function isSpecial(url) {
    return has(specialSchemes, url.scheme);
  }

  // https://url.spec.whatwg.org/#include-credentials
  // A URL includes credentials if its username or password is not the empty string.
  function includesCredentials(url) {
    return url.username != "" || url.password != "";
  }

  // https://url.spec.whatwg.org/#c0-control-percent-encode-set
  var C0ControlPercentEncodeSet = {};

  // https://url.spec.whatwg.org/#fragment-percent-encode-set
  // The fragment percent-encode set is the C0 control percent-encode set and U+0020 SPACE, U+0022 ("), U+003C (<), U+003E (>), and U+0060 (`).
  var fragmentPercentEncodeSet = Object.assign({}, C0ControlPercentEncodeSet, {
    " ": 1,
    '"': 1,
    "<": 1,
    ">": 1,
    "`": 1
  });

  // https://url.spec.whatwg.org/#path-percent-encode-set
  // The path percent-encode set is the fragment percent-encode set and U+0023 (#), U+003F (?), U+007B ({), and U+007D (}).
  var pathPercentEncodeSet = Object.assign({}, fragmentPercentEncodeSet, {
    "#": 1,
    "?": 1,
    "{": 1,
    "}": 1
  });
  // https://url.spec.whatwg.org/#userinfo-percent-encode-set
  // The userinfo percent-encode set is the path percent-encode set and U+002F (/), U+003A (:), U+003B (;), U+003D (=), U+0040 (@), U+005B ([), U+005C (\), U+005D (]), U+005E (^), and U+007C (|).
  var userinfoPercentEncodeSet = Object.assign({}, pathPercentEncodeSet, {
    "/": 1,
    ":": 1,
    ";": 1,
    "=": 1,
    "@": 1,
    "[": 1,
    "\\": 1,
    "]": 1,
    "^": 1,
    "|": 1
  });

  // https://url.spec.whatwg.org/#utf-8-percent-encode
  function percentEncode(char, set) {
    var code = char.codePointAt(0);
    // 1. If codePoint is not in percentEncodeSet, then return codePoint.
    if (code > 0x20 && code < 0x7f && !has(set, char)) {
      return char;
    }
    // 2. Let bytes be the result of running UTF-8 encode on codePoint.
    // 3. Percent encode each byte in bytes, and then return the results concatenated, in the same order.
    return encodeURIComponent(char);
  }

  function codePointFor(char) {
    return char.codePointAt(0);
  }

  // https://url.spec.whatwg.org/#ipv4-number-parser
  function parseIPv4Number(input) {
    // 1. Let R be 10.
    var R = 10;

    // 2. If input contains at least two code points and the first two code points are either "0x" or "0X", then:
    if (
      input.length >= 2 &&
      input.charAt(0) === "0" &&
      input.charAt(1).toLowerCase() === "x"
    ) {
      // 2.1. Set validationErrorFlag.

      // 2.2. Remove the first two code points from input.
      input = input.substring(2);
      // 2.3. Set R to 16.
      R = 16;
      // 3. Otherwise, if input contains at least two code points and the first code point is U+0030 (0), then:
    } else if (input.length >= 2 && input.charAt(0) === "0") {
      // 3.1. Set validationErrorFlag.

      // 3.2. Remove the first code point from input.
      input = input.substring(1);
      // 3.3. Set R to 8.
      R = 8;
    }

    // 4. If input is the empty string, then return zero.
    if (input === "") {
      return 0;
    }

    var regex = /[^0-7]/;
    if (R === 10) {
      regex = /[^0-9]/;
    }
    if (R === 16) {
      regex = /[^0-9A-Fa-f]/;
    }

    // 5. If input contains a code point that is not a radix-R digit, then return failure.
    if (regex.test(input)) {
      return failure;
    }

    // 6. Return the mathematical integer value that is represented by input in radix-R notation,
    // using ASCII hex digits for digits with values 0 through 15.
    return parseInt(input, R);
  }

  // https://url.spec.whatwg.org/#concept-ipv4-parser
  function parseIPv4(input) {
    // 1. Let validationErrorFlag be unset.
    // 2. Let parts be input split on U+002E (.)
    var parts = input.split(".");
    // 3. If the last item in parts is the empty string, then:
    if (parts[parts.length - 1] === "") {
      // 3.1. Set validationErrorFlag.
      // 3.2. If parts has more than one item, then remove the last item from parts.
      if (parts.length > 1) {
        parts.pop();
      }
    }

    // 4. If parts has more than four items, return input.
    if (parts.length > 4) {
      return input;
    }

    // 5. Let numbers be the empty list.
    var numbers = [];
    // 6. For each part in parts:
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      // 6.1. If part is the empty string, return input.
      if (part === "") {
        return input;
      }
      // 6.2. Let n be the result of parsing part using validationErrorFlag.
      var n = parseIPv4Number(part);
      // 6.3. If n is failure, return input.
      if (n === failure) {
        return input;
      }

      // 6.4. Append n to numbers.
      numbers.push(n);
    }

    // 7. If validationErrorFlag is set, validation error.
    // 8. If any item in numbers is greater than 255, validation error.

    // 9. If any but the last item in numbers is greater than 255, return failure.
    for (var j = 0; j < numbers.length - 1; ++j) {
      if (numbers[j] > 255) {
        return failure;
      }
    }
    // 10. If the last item in numbers is greater than or equal to 256(5 − the number of items in numbers), validation error, return failure.
    if (numbers[numbers.length - 1] >= Math.pow(256, 5 - numbers.length)) {
      return failure;
    }

    // 11. Let ipv4 be the last item in numbers.
    // 12. Remove the last item from numbers.
    var ipv4 = numbers.pop();
    // 13. Let counter be zero.
    var counter = 0;

    // 14. For each n in numbers:
    for (var k = 0; k < numbers.length; k++) {
      n = numbers[k];
      // 14.1. Increment ipv4 by n × 256(3 − counter).
      ipv4 += n * Math.pow(256, 3 - counter);
      // 14.2. Increment counter by 1.
      counter += 1;
    }

    // 15. Return ipv4.
    return ipv4;
  }

  // https://url.spec.whatwg.org/#concept-ipv6-parser
  function parseIPv6(input) {
    // 1. Let address be a new IPv6 address whose IPv6 pieces are all 0.
    var address = [0, 0, 0, 0, 0, 0, 0, 0];
    // 2. Let pieceIndex be 0.
    var pieceIndex = 0;
    // 3. Let compress be null
    var compress = null;
    // 4. Let pointer be a pointer into input, initially 0 (pointing to the first code point).
    var pointer = 0;

    // 5. If c is U+003A (:), then:
    var c = input[pointer];
    if (c === ":") {
      // 5.1. If remaining does not start with U+003A (:), validation error, return failure.
      if (input[pointer + 1] !== ":") {
        return failure;
      }
      // 5.2. Increase pointer by 2.
      pointer += 2;
      // 5.3. Increase pieceIndex by 1 and then set compress to pieceIndex.
      pieceIndex += 1;
      compress = pieceIndex;
    }

    // 6. While c is not the EOF code point:
    while (pointer < input.length) {
      // 6.1. If pieceIndex is 8, validation error, return failure.
      if (pieceIndex === 8) {
        return failure;
      }

      // 6.2. If c is U+003A (:), then:
      if (input[pointer] === ":") {
        // 6.2.1. If compress is non-null, validation error, return failure.
        if (compress !== null) {
          return failure;
        }
        // 6.2.2. Increase pointer and pieceIndex by 1, set compress to pieceIndex, and then continue.
        pointer += 1;
        pieceIndex += 1;
        compress = pieceIndex;
        continue;
      }

      // 6.3. Let value and length be 0.
      var value = 0;
      var length = 0;

      // 6.4. While length is less than 4 and c is an ASCII hex digit, set value to value × 0x10 + c interpreted as hexadecimal number, and increase pointer and length by 1.
      while (length < 4 && isASCIIHex(input[pointer])) {
        value = value * 0x10 + parseInt(input.charAt(pointer), 16);
        ++pointer;
        ++length;
      }

      // 6.5. If c is U+002E (.), then:
      if (input[pointer] === ".") {
        // 6.5.1. If length is 0, validation error, return failure.
        if (length === 0) {
          return failure;
        }
        // 6.5.2. Decrease pointer by length.
        pointer -= length;

        // 6.5.3. If pieceIndex is greater than 6, validation error, return failure.
        if (pieceIndex > 6) {
          return failure;
        }
        // 6.5.4. Let numbersSeen be 0.
        var numbersSeen = 0;

        // 6.5.5. While c is not the EOF code point:
        while (input[pointer] !== undefined) {
          // 6.5.5.1. Let ipv4Piece be null.
          var ipv4Piece = null;
          // 6.5.5.2. If numbersSeen is greater than 0, then:
          if (numbersSeen > 0) {
            // 6.5.5.2.1. If c is a U+002E (.) and numbersSeen is less than 4, then increase pointer by 1.
            if (input[pointer] === "." && numbersSeen < 4) {
              pointer += 1;
              // 6.5.5.2.2. Otherwise, validation error, return failure.
            } else {
              return failure;
            }
          }

          // 6.5.5.3. If c is not an ASCII digit, validation error, return failure.
          if (!isASCIIDigit(input[pointer])) {
            return failure;
          }
          // 6.5.5.4. While c is an ASCII digit:
          while (isASCIIDigit(input[pointer])) {
            // 6.5.5.4.1. Let number be c interpreted as decimal number.
            var number = parseInt(input.charAt(pointer), 10);
            // 6.5.5.4.2. If ipv4Piece is null, then set ipv4Piece to number.
            if (ipv4Piece === null) {
              ipv4Piece = number;
              // Otherwise, if ipv4Piece is 0, validation error, return failure.
            } else if (ipv4Piece === 0) {
              return failure;
              // Otherwise, set ipv4Piece to ipv4Piece × 10 + number.
            } else {
              ipv4Piece = ipv4Piece * 10 + number;
            }
            // 6.5.5.4.3. If ipv4Piece is greater than 255, validation error, return failure.
            if (ipv4Piece > 255) {
              return failure;
            }
            // 6.5.5.4.4. If ipv4Piece is greater than 255, validation error, return failure.
            pointer += 1;
          }

          // 6.5.5.5. Set address[pieceIndex] to address[pieceIndex] × 0x100 + ipv4Piece.
          address[pieceIndex] = address[pieceIndex] * 0x100 + ipv4Piece;

          // 6.5.5.6. Increase numbersSeen by 1.
          numbersSeen += 1;

          // 6.5.5.7. If numbersSeen is 2 or 4, then increase pieceIndex by 1.
          if (numbersSeen === 2 || numbersSeen === 4) {
            pieceIndex += 1;
          }
        }

        // 6.5.6. If numbersSeen is not 4, validation error, return failure.
        if (numbersSeen !== 4) {
          return failure;
        }

        // 6.5.7. Break.
        break;
        // 6.6. Otherwise, if c is U+003A (:):
      } else if (input[pointer] === ":") {
        // 6.6.1. Increase pointer by 1.
        pointer += 1;
        // 6.6.2. If c is the EOF code point, validation error, return failure.
        if (input[pointer] === undefined) {
          return failure;
        }
        // 6.7. Otherwise, if c is not the EOF code point, validation error, return failure.
      } else if (input[pointer] !== undefined) {
        return failure;
      }

      // 6.8. Set address[pieceIndex] to value.
      address[pieceIndex] = value;
      // 6.9. Increase pieceIndex by 1.
      pieceIndex += 1;
    }

    // 7. If compress is non-null, then:
    if (compress !== null) {
      // 7.1. Let swaps be pieceIndex − compress.
      var swaps = pieceIndex - compress;
      // 7.2. Set pieceIndex to 7.
      pieceIndex = 7;
      // 7.3. While pieceIndex is not 0 and swaps is greater than 0, swap address[pieceIndex] with address[compress + swaps − 1], and then decrease both pieceIndex and swaps by 1.
      while (pieceIndex !== 0 && swaps > 0) {
        var temp = address[compress + swaps - 1];
        address[compress + swaps - 1] = address[pieceIndex];
        address[pieceIndex] = temp;
        --pieceIndex;
        --swaps;
      }
      // 8. Otherwise, if compress is null and pieceIndex is not 8, validation error, return failure.
    } else if (compress === null && pieceIndex !== 8) {
      return failure;
    }

    // 9. Return address.
    return address;
  }

  // https://url.spec.whatwg.org/#forbidden-host-code-point
  function containsForbiddenHostCodePointExcludingPercent(string) {
    // A forbidden host code point is U+0000 NULL, U+0009 TAB, U+000A LF, U+000D CR, U+0020 SPACE, U+0023 (#), U+0025 (%), U+002F (/), U+003A (:), U+003F (?), U+0040 (@), U+005B ([), U+005C (\), or U+005D (]).
    // TODO FIX -- Uses unicode escape regex which I'm not sure works in IE8
    return (
      string.search(
        // eslint-disable-next-line no-control-regex
        /\u0000|\u0009|\u000A|\u000D|\u0020|#|\/|:|\?|@|\[|\\|\]/
      ) !== -1
    );
  }

  // https://url.spec.whatwg.org/#concept-opaque-host-parser
  function parseOpaqueHost(input) {
    // 1. If input contains a forbidden host code point excluding U+0025 (%), validation error, return failure.
    if (containsForbiddenHostCodePointExcludingPercent(input)) {
      return failure;
    }

    // 2. Let output be the empty string.
    var output = "";
    var decoded = Array.from(input);
    // 3. For each code point in input, UTF-8 percent encode it using the C0 control percent-encode set, and append the result to output.
    for (var i = 0; i < decoded.length; ++i) {
      output += percentEncode(decoded[i], C0ControlPercentEncodeSet);
    }
    // 4. Return output.
    return output;
  }

  // https://url.spec.whatwg.org/#concept-host-parser
  function parseHost(input, isNotSpecialArg) {
    // 1. If isNotSpecial is not given, then set isNotSpecial to false.
    if (arguments.length < 1) {
      isNotSpecialArg = false;
    }
    // 2. If input starts with U+005B ([), then:
    if (input[0] === "[") {
      // 2.1. If input does not end with U+005D (]), validation error, return failure
      if (input[input.length - 1] !== "]") {
        return failure;
      }

      // 2.2. Return the result of IPv6 parsing input with its leading U+005B ([) and trailing U+005D (]) removed.
      return parseIPv6(input.substring(1, input.length - 1));
    }

    // 3. If isNotSpecial is true, then return the result of opaque-host parsing input.
    if (isNotSpecialArg) {
      return parseOpaqueHost(input);
    }
    // 4. Let domain be the result of running UTF-8 decode without BOM on the string percent decoding of input.
    var domain = percentDecode(input);
    // 5. Let asciiDomain be the result of running domain to ASCII on domain.
    var asciiDomain = domainToASCII(domain);
    // 6. If asciiDomain is failure, validation error, return failure.
    if (asciiDomain === failure) {
      return failure;
    }

    // 7. If asciiDomain contains a forbidden host code point, validation error, return failure.
    if (containsForbiddenHostCodePoint(asciiDomain)) {
      return failure;
    }

    // 8. Let ipv4Host be the result of IPv4 parsing asciiDomain.
    var ipv4Host = parseIPv4(asciiDomain);
    // 9. If ipv4Host is an IPv4 address or failure, return ipv4Host
    if (typeof ipv4Host === "number" || ipv4Host === failure) {
      return ipv4Host;
    }

    // 10. Return asciiDomain
    return asciiDomain;
  }
  // https://url.spec.whatwg.org/#concept-basic-url-parser
  // The basic URL parser takes a string input, optionally with a base URL base, optionally with an encoding encoding override, optionally with a URL url and a state override state override, and then runs these steps:
  function URLStateMachine(input, base, encodingOverride, url, stateOverride) {
    this.input = input;
    this.stateOverride = stateOverride;
    this.url = url;
    this.failure = false;
    this.parseError = false;

    // 1. If url is not given:
    if (!this.url) {
      // 1.1. Set url to a new URL.
      this.url = {
        // https://url.spec.whatwg.org/#concept-url
        scheme: "",
        username: "",
        password: "",
        host: null,
        port: null,
        path: [],
        query: null,
        fragment: null,
        cannotBeABaseURL: false
      };

      // 1.2. If input contains any leading or trailing C0 control or space, validation error.
      // 1.3. Remove any leading and trailing C0 control or space from input.
      var res = trimControlChars(this.input);
      if (res !== this.input) {
        this.parseError = true;
      }
      this.input = res;
    }
    // 2. If input contains any ASCII tab or newline, validation error.
    // 3. Remove all ASCII tab or newline from input.
    res = trimTabAndNewline(this.input);
    if (res !== this.input) {
      this.parseError = true;
    }
    this.input = res;

    // 4. Let state be state override if given, or scheme start state otherwise.
    this.state = stateOverride || SCHEME_START;
    // 5. If base is not given, set it to null.
    this.base = base || null;
    // 6. Let encoding be UTF-8.
    // 7. If encoding override is given, set encoding to the result of getting an output encoding from encoding override.
    this.encodingOverride = encodingOverride || "utf-8";
    // 8. Let buffer be the empty string.
    this.buffer = "";
    // 9. Let the @ flag, [] flag, and passwordTokenSeenFlag be unset.
    this.atFlag = false;
    this.arrFlag = false;
    this.passwordTokenSeenFlag = false;

    // 10. Let pointer be a pointer to first code point in input.
    this.pointer = 0;

    var codePoints = Array.from(this.input);

    // 11. Keep running the following state machine by switching on state.
    // If after a run pointer points to the EOF code point, go to the next step.
    // Otherwise, increase pointer by one and continue with the state machine.
    while (this.pointer <= codePoints.length) {
      var c = codePoints[this.pointer] || EOF;
      switch (this.state) {
        // https://url.spec.whatwg.org/#scheme-start-state
        case SCHEME_START: {
          // 1. If c is an ASCII alpha, append c, lowercased, to buffer, and set state to scheme state.
          if (c && isASCIIAlpha(c)) {
            this.buffer += c.toLowerCase();
            this.state = SCHEME;
            // 2. Otherwise, if state override is not given, set state to no scheme state, and decrease pointer by one.
          } else if (!stateOverride) {
            this.state = NO_SCHEME;
            continue;
            // 3. Otherwise, validation error, return failure.
          } else {
            this.failure = INVALID_SCHEME
            return this;
          }
          break;
        }

        // https://url.spec.whatwg.org/#scheme-state
        case SCHEME: {
          // 1. If c is an ASCII alphanumeric, U+002B (+), U+002D (-), or U+002E (.), append c, lowercased, to buffer.
          if (
            c &&
            (isASCIIAlphanumeric(c) || c == "+" || c == "-" || c == ".")
          ) {
            this.buffer += c.toLowerCase();
            // 2. Otherwise, if c is U+003A (:), then:
          } else if (c == ":") {
            // 2.1. If state override is given, then:
            if (stateOverride) {
              // 2.1.1. If url’s scheme is a special scheme and buffer is not a special scheme, then return.
              if (
                isSpecial(this.url) === true &&
                !has(specialSchemes, this.buffer)
              ) {
                return this;
              }
              // 2.1.2. If url’s scheme is not a special scheme and buffer is a special scheme, then return.
              if (
                isSpecial(this.url) === false &&
                has(specialSchemes, this.buffer)
              ) {
                return this;
              }
              // 2.1.3. If url includes credentials or has a non-null port, and buffer is "file", then return.
              if (
                this.buffer == "file" &&
                (includesCredentials(this.url) || this.url.port !== null)
              ) {
                return this;
              }
              // 2.1.4. If url’s scheme is "file" and its host is an empty host or null, then return.
              if (this.url.scheme == "file" && !this.url.host) {
                return this;
              }
            }
            // 2.2. Set url’s scheme to buffer.
            this.url.scheme = this.buffer;
            // 2.3. If state override is given, then:
            if (stateOverride) {
              // 2.3.1 If url’s port is url’s scheme’s default port, then set url’s port to null.
              if (isSpecial(this.url) && specialSchemes[this.url.scheme] == this.url.port)
                this.url.port = null;
              // 2.3.2 Return.
              return this;
            }
            // 2.4. Set buffer to the empty string.
            this.buffer = "";
            // 2.5. If url’s scheme is "file", then:
            if (this.url.scheme == "file") {
              // 2.5.1. If remaining does not start with "//", validation error.
              // TODO
              // 2.5.2. Set state to file state.
              this.state = FILE;
              // 2.6. Otherwise, if url is special, base is non-null, and base’s scheme is equal to url’s scheme, set state to special relative or authority state.
            } else if (isSpecial(this.url) && base && base.scheme == this.url.scheme) {
              this.state = SPECIAL_RELATIVE_OR_AUTHORITY;
              // 2.7. Otherwise, if url is special, set state to special authority slashes state.
            } else if (isSpecial(this.url)) {
              this.state = SPECIAL_AUTHORITY_SLASHES;
              // 2.8. Otherwise, if remaining starts with an U+002F (/), set state to path or authority state and increase pointer by one.
            } else if (codePoints[this.pointer + 1] == "/") {
              this.state = PATH_OR_AUTHORITY;
              this.pointer++;
              // 2.9. Otherwise, set url’s cannot-be-a-base-URL flag, append an empty string to url’s path, and set state to cannot-be-a-base-URL path state.
            } else {
              this.url.path.push("");
              this.url.cannotBeABaseURL = true;
              this.state = CANNOT_BE_A_BASE_URL_PATH;
            }
            // 3. Otherwise, if state override is not given, set buffer to the empty string, state to no scheme state, and start over (from the first code point in input).
          } else if (!stateOverride) {
            this.buffer = "";
            this.state = NO_SCHEME;
            this.pointer = 0;
            continue;
            // 4. Otherwise, validation error, return failure.
          } else {
            this.failure = INVALID_SCHEME;
            return this;
          }
          break;
        }
        // https://url.spec.whatwg.org/#no-scheme-state
        case NO_SCHEME: {
          // 1. If base is null, or base’s cannot-be-a-base-URL flag is set and c is not U+0023 (#), validation error, return failure.
          if (!base || (base.cannotBeABaseURL && c != "#")) {
            this.failure = INVALID_SCHEME;
            return this;
          }
          // 2. Otherwise, if base’s cannot-be-a-base-URL flag is set and c is U+0023 (#), set url’s scheme to base’s scheme, url’s path to a copy of base’s path, url’s query to base’s query, url’s fragment to the empty string, set url’s cannot-be-a-base-URL flag, and set state to fragment state.
          if (base.cannotBeABaseURL && c == "#") {
            this.url.scheme = base.scheme;
            this.url.path = base.path.slice();
            this.url.query = base.query;
            this.url.fragment = "";
            this.url.cannotBeABaseURL = true;
            this.state = FRAGMENT;
            break;
          }
          // 3. Otherwise, if base’s scheme is not "file", set state to relative state and decrease pointer by one.
          // 4. Otherwise, set state to file state and decrease pointer by one.
          this.state = base.scheme == "file" ? FILE : RELATIVE;
          continue;
        }
        // https://url.spec.whatwg.org/#special-relative-or-authority-state
        case SPECIAL_RELATIVE_OR_AUTHORITY: {
          // 1. If c is U+002F (/) and remaining starts with U+002F (/), then set state to special authority ignore slashes state and increase pointer by one.
          if (c == "/" && codePoints[this.pointer + 1] == "/") {
            this.state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
            this.pointer++;
            // 2. Otherwise, validation error, set state to relative state and decrease pointer by one.
          } else {
            this.state = RELATIVE;
            continue;
          }
          break;
        }
        // https://url.spec.whatwg.org/#path-or-authority-state
        case PATH_OR_AUTHORITY: {
          // 1. If c is U+002F (/), then set state to authority state.
          if (c == "/") {
            this.state = AUTHORITY;
            break;
            // 2. Otherwise, set state to path state, and decrease pointer by one.
          } else {
            this.state = PATH;
            continue;
          }
        }
        // https://url.spec.whatwg.org/#relative-state
        case RELATIVE: {
          // 1. Set url’s scheme to base’s scheme, and then, switching on c:
          this.url.scheme = base.scheme;
          // The EOF code point
          if (c == EOF) {
            // 1. Set url’s username to base’s username, url’s password to base’s password, url’s host to base’s host, url’s port to base’s port, url’s path to a copy of base’s path, and url’s query to base’s query.
            this.url.username = base.username;
            this.url.password = base.password;
            this.url.host = base.host;
            this.url.port = base.port;
            this.url.path = base.path.slice();
            this.url.query = base.query;
            // U+002F (/)
          } else if (c == "/" || (c == "\\" && isSpecial(this.url))) {
            // 1. Set state to relative slash state.
            this.state = RELATIVE_SLASH;
            // U+003F (?)
          } else if (c == "?") {
            // 1. Set url’s username to base’s username, url’s password to base’s password, url’s host to base’s host, url’s port to base’s port, url’s path to a copy of base’s path, url’s query to the empty string, and state to query state.
            this.url.username = base.username;
            this.url.password = base.password;
            this.url.host = base.host;
            this.url.port = base.port;
            this.url.path = base.path.slice();
            this.url.query = "";
            this.state = QUERY;
            // U+0023 (#)
          } else if (c == "#") {
            // 1. Set url’s username to base’s username, url’s password to base’s password, url’s host to base’s host, url’s port to base’s port, url’s path to a copy of base’s path, url’s query to base’s query, url’s fragment to the empty string, and state to fragment state.
            this.url.username = base.username;
            this.url.password = base.password;
            this.url.host = base.host;
            this.url.port = base.port;
            this.url.path = base.path.slice();
            this.url.query = base.query;
            this.url.fragment = "";
            this.state = FRAGMENT;
            // Otherwise
          } else {
            // 1. If url is special and c is U+005C (\), validation error, set state to relative slash state.
            // TODO: Line 322

            // 2. Otherwise, run these steps:
            // 2.1. Set url’s username to base’s username, url’s password to base’s password, url’s host to base’s host, url’s port to base’s port, url’s path to a copy of base’s path, and then remove url’s path’s last item, if any.
            // 2.2 Set state to path state, and decrease pointer by one
            this.url.username = base.username;
            this.url.password = base.password;
            this.url.host = base.host;
            this.url.port = base.port;
            this.url.path = base.path.slice();
            this.url.path.pop();
            this.state = PATH;
            continue;
          }
          break;
        }
        // https://url.spec.whatwg.org/#relative-slash-state
        case RELATIVE_SLASH: {
          // 1. If url is special and c is U+002F (/) or U+005C (\), then:
          if (isSpecial(this.url) && (c == "/" || c == "\\")) {
            // 1.1. If c is U+005C (\), validation error.
            // 1.2. Set state to special authority ignore slashes state.
            this.state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
            // 2. Otherwise, if c is U+002F (/), then set state to authority state.
          } else if (c == "/") {
            this.state = AUTHORITY;
            // 3. Otherwise, set url’s username to base’s username, url’s password to base’s password, url’s host to base’s host, url’s port to base’s port, state to path state, and then, decrease pointer by one.
          } else {
            this.url.username = base.username;
            this.url.password = base.password;
            this.url.host = base.host;
            this.url.port = base.port;
            this.state = PATH;
            continue;
          }
          break;
        }
        // https://url.spec.whatwg.org/#special-authority-slashes-state
        case SPECIAL_AUTHORITY_SLASHES: {
          // 1. If c is U+002F (/) and remaining starts with U+002F (/), then set state to special authority ignore slashes state and increase pointer by one.
          this.state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
          if (c == "/" && this.buffer.charAt(this.pointer + 1) == "/") {
            this.state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
            this.pointer++;
            break;
            // 2. Otherwise, validation error, set state to special authority ignore slashes state, and decrease pointer by one.
          } else {
            this.state = SPECIAL_AUTHORITY_IGNORE_SLASHES;
            continue;
          }
        }
        // https://url.spec.whatwg.org/#special-authority-ignore-slashes-state
        case SPECIAL_AUTHORITY_IGNORE_SLASHES: {
          // 1. If c is neither U+002F (/) nor U+005C (\), then set state to authority state and decrease pointer by one.
          if (c != "/" && c != "\\") {
            this.state = AUTHORITY;
            continue;
            // 2. Otherwise, validation error.
          } else {
            break;
          }
        }
        // https://url.spec.whatwg.org/#authority-state
        case AUTHORITY: {
          // 1. If c is U+0040 (@), then:
          if (c == "@") {
            // 1.1. Validation error.
            // 1.2. If the @ flag is set, prepend "%40" to buffer.
            if (this.atFlag) {
              this.buffer = "%40" + this.buffer;
            }
            // 1.3. Set the @ flag.
            this.atFlag = true;

            var bufferCodePoints = Array.from(this.buffer);
            // 4. For each codePoint in buffer
            for (var i = 0; i < bufferCodePoints.length; i++) {
              var codePoint = bufferCodePoints[i];
              // 1.4.1. If codePoint is U+003A (:) and passwordTokenSeenFlag is unset, then set passwordTokenSeenFlag and continue.
              if (codePoint == ":" && !this.passwordTokenSeenFlag) {
                this.passwordTokenSeenFlag = true;
                continue;
              }
              // 1.4.2. Let encodedCodePoints be the result of running UTF-8 percent encode codePoint using the userinfo percent-encode set.
              var encodedCodePoints = percentEncode(
                codePoint,
                userinfoPercentEncodeSet
              );
              // 1.4.3. If passwordTokenSeenFlag is set, then append encodedCodePoints to url’s password.
              if (this.passwordTokenSeenFlag) {
                this.url.password += encodedCodePoints;
                // 1.4.4. Otherwise, append encodedCodePoints to url’s username.
              } else {
                this.url.username += encodedCodePoints;
              }
            }
            // 1.5. Set buffer to the empty string.
            this.buffer = "";
            // 2. Otherwise, if one of the following is true
            // c is the EOF code point, U+002F (/), U+003F (?), or U+0023 (#)
            // url is special and c is U+005C (\)
          } else if (
            c == EOF ||
            c == "/" ||
            c == "?" ||
            c == "#" ||
            (c == "\\" && isSpecial(this.url))
          ) {
            // 1.2.1. If @ flag is set and buffer is the empty string, validation error, return failure.
            if (this.atFlag && this.buffer == "") {
              this.failure = INVALID_AUTHORITY;
              return this;
            }
            // 1.2.2. Decrease pointer by the number of code points in buffer plus one, set buffer to the empty string, and set state to host state.
            this.pointer -= Array.from(this.buffer).length + 1;
            this.buffer = "";
            this.state = HOST;
            // 3. Otherwise, append c to buffer.
          } else this.buffer += c;
          break;
        }
        // https://url.spec.whatwg.org/#host-state
        // https://url.spec.whatwg.org/#hostname-state
        case HOST:
        case HOSTNAME: {
          // 1. If state override is given and url’s scheme is "file", then decrease pointer by one and set state to file host state.
          if (stateOverride && this.url.scheme == "file") {
            this.state = FILE_HOST;
            continue;
            // 2. Otherwise, if c is U+003A (:) and the [] flag is unset, then:
          } else if (c == ":" && !this.arrFlag) {
            // 2.1. If buffer is the empty string, validation error, return failure.
            if (this.buffer == "") {
              this.failure = INVALID_HOST;
              return this;
            }
            // 2.2. Let host be the result of host parsing buffer with url is not special.
            var host = parseHost(this.buffer, !isSpecial(this.url));
            // 2.3. If host is failure, then return failure.
            if (host === failure) {
              this.failure = host;
              return this;
            }
            // 2.4. Set url’s host to host, buffer to the empty string, and state to port state.
            this.url.host = host;
            this.buffer = "";
            this.state = PORT;
            // 2.5. If state override is given and state override is hostname state, then return.
            if (stateOverride == HOSTNAME) {
              return this;
            }
            // 3. Otherwise, if one of the following is true
            // c is the EOF code point, U+002F (/), U+003F (?), or U+0023 (#)
            // url is special and c is U+005C (\)
          } else if (
            c == EOF ||
            c == "/" ||
            c == "?" ||
            c == "#" ||
            (c == "\\" && isSpecial(this.url))
          ) {
            // 3.1. If url is special and buffer is the empty string, validation error, return failure.
            if (isSpecial(this.url) && this.buffer == "") {
              this.failure = INVALID_HOST;
              return this;
            }
            // 3.2. Otherwise, if state override is given, buffer is the empty string, and either url includes credentials or url’s port is non-null, validation error, return.
            if (
              stateOverride &&
              this.buffer == "" &&
              (includesCredentials(this.url) || this.url.port !== null)
            ) {
              return this;
            }
            // 3.3. Let host be the result of host parsing buffer with url is not special.
            host = parseHost(this.buffer, !isSpecial(this.url));
            // 3.4. If host is failure, then return failure.
            if (host === failure) {
              this.failure = host;
              return this;
            }
            // 3.5. Set url’s host to host, buffer to the empty string, and state to path start state.
            this.url.host = host;
            this.buffer = "";
            this.state = PATH_START;
            // 3.6. If state override is given, then return.
            if (stateOverride) {
              return this;
            }
            continue;
            // 4. Otherwise
          } else {
            // 4.1. If c is U+005B ([), then set the [] flag.
            if (c == "[") {
              this.arrFlag = true;
              // 4.2. If c is U+005D (]), then unset the [] flag.
            } else if (c == "]") {
              this.arrFlag = false;
            }
            // 4.3. Append c to buffer
            this.buffer += c;
          }
          break;
        }
        // https://url.spec.whatwg.org/#port-state
        case PORT: {
          // 1. If c is an ASCII digit, append c to buffer.
          if (isASCIIDigit(c)) {
            this.buffer += c;
            // 2. Otherwise, if one of the following is true
            // c is the EOF code point, U+002F (/), U+003F (?), or U+0023 (#)
            // url is special and c is U+005C (\)
            // state override is given
          } else if (
            c == EOF ||
            c == "/" ||
            c == "?" ||
            c == "#" ||
            (c == "\\" && isSpecial(this.url)) ||
            stateOverride
          ) {
            // 2.1. If buffer is not the empty string, then:
            if (this.buffer != "") {
              // 2.1.1. Let port be the mathematical integer value that is 
              // represented by buffer in radix-10 using ASCII digits for 
              // digits with values 0 through 9.
              var port = parseInt(this.buffer, 10);
              // 2.1.2. If port is greater than 216 − 1, validation error, 
              // return failure.
              if (port > 0xffff) {
                this.failure = INVALID_PORT;
                return this;
              }
              // 2.1.3. Set url’s port to null, if port is url’s scheme’s 
              // default port, and to port otherwise.
              this.url.port =
                isSpecial(this.url) && port === specialSchemes[this.url.scheme]
                  ? null
                  : port;
              // 2.1.4. Set buffer to the empty string.
              this.buffer = "";
            }
            // 2.2. If state override is given, then return.
            if (stateOverride) {
              return this;
            }
            // 2.3. Set state to path start state, and decrease pointer by one.
            this.state = PATH_START;
            continue;
            // 3. Otherwise, validation error, return failure.
          } else {
            this.failure = INVALID_PORT;
            return this;
          }
          break;
        }
        // https://url.spec.whatwg.org/#file-state
        case FILE: {
          // 1. Set url’s scheme to "file".
          this.url.scheme = "file";
          // 2. If c is U+002F (/) or U+005C (\), then:
          if (c == "/" || c == "\\") {
            // 2.1. If c is U+005C (\), validation error.
            // 2.2. Set state to file slash state.
            this.state = FILE_SLASH;
            // 3. Otherwise, if base is non-null and base’s scheme is "file",
            // switch on c:
          } else if (base && base.scheme == "file") {
            // The EOF code point
            if (c == EOF) {
              // 1. Set url’s host to base’s host, url’s path to a copy of 
              // base’s path, and url’s query to base’s query.
              this.url.host = base.host;
              this.url.path = base.path.slice();
              this.url.query = base.query;
              // U+003F (?)
            } else if (c == "?") {
              // 1. Set url’s host to base’s host, url’s path to a copy of 
              // base’s path, url’s query to the empty string, and state to 
              // query state.
              this.url.host = base.host;
              this.url.path = base.path.slice();
              this.url.query = "";
              this.state = QUERY;
              // U+0023 (#)
            } else if (c == "#") {
              // 1. Set url’s host to base’s host, url’s path to a copy of 
              // base’s path, url’s query to base’s query, url’s fragment 
              // to the empty string, and state to fragment state.
              this.url.host = base.host;
              this.url.path = base.path.slice();
              this.url.query = base.query;
              this.url.fragment = "";
              this.state = FRAGMENT;
              // Otherwise
            } else {
              // 1. If the substring from pointer in input does not start with
              // a Windows drive letter, then set url’s host to base’s host,
              // url’s path to a copy of base’s path, and then shorten url’s path.
              if (
                !startsWithWindowsDriveLetter(
                  codePoints.slice(this.pointer).join("")
                )
              ) {
                this.url.host = base.host;
                this.url.path = base.path.slice();
                shortenUrlPath(this.url);
                // 1. Let path be url’s path.
              }
              // 2. Otherwise, validation error.
              // 3. Set state to path state, and decrease pointer by one.
              this.state = PATH;
              continue;
            }
            // 4. Otherwise, set state to path state, and decrease pointer by one.
          } else {
            this.state = PATH;
            continue;
          }
          break;
        }
        // https://url.spec.whatwg.org/#file-slash-state
        case FILE_SLASH: {
          // 1. If c is U+002F (/) or U+005C (\), then:
          if (c == "/" || c == "\\") {
            // 1.1. If c is U+005C (\), validation error.
            // 1.2. Set state to file host state.
            this.state = FILE_HOST;
            break;
            // 2. Otherwise.
          } else {
            // 2.1. If base is non-null, base’s scheme is "file", and the 
            // substring from pointer in input does not start with a Windows
            //  drive letter, then:
            if (
              base &&
              base.scheme == "file" &&
              !startsWithWindowsDriveLetter(
                codePoints.slice(this.pointer).join("")
              )
            ) {
              // 2.1.1. If base’s path[0] is a normalized Windows drive letter,
              // then append base’s path[0] to url’s path.
              if (isNormalizedWindowsDriveLetter(base.path[0])) {
                this.url.path.push(base.path[0]);
                // 2.1.2. Otherwise, set url’s host to base’s host.
              } else {
                this.url.host = base.host;
              }
            }
            // 2.2. Set state to path state, and decrease pointer by one.
            this.state = PATH;
            continue;
          }
        }
        // https://url.spec.whatwg.org/#file-host-state
        case FILE_HOST: {
          // 1. If c is the EOF code point, U+002F (/), U+005C (\), U+003F (?),
          // or U+0023 (#), then decrease pointer by one and then:
          if (c == EOF || c == "/" || c == "\\" || c == "?" || c == "#") {
            // 1.1. If state override is not given and buffer is a Windows 
            // drive letter, validation error, set state to path state.
            if (!stateOverride && isWindowsDriveLetter(this.buffer)) {
              this.state = PATH;
              // 1.2. Otherwise, if buffer is the empty string, then:
            } else if (this.buffer == "") {
              // 1.2.1. Set url’s host to the empty string.
              this.url.host = "";
              // 1.2.2. If state override is given, then return.
              if (stateOverride) return this;
              // 1.2.3. Set state to path start state.
              this.state = PATH_START;
              // 1.3. Otherwise, run these steps:
            } else {
              // 1.3.1. Let host be the result of host parsing buffer with url
              //  is not special.
              host = parseHost(this.buffer, !isSpecial(this.url));
              // 1.3.2. If host is failure, then return failure.
              if (host === failure) {
                this.failure = host;
                return this;
              }
              // 1.3.3. If host is "localhost", then set host to the empty string.
              if (this.url.host == "localhost") this.url.host = "";
              // 1.3.4. Set url’s host to host.  -- Done as part of step 1.3.1
              // 1.3.5. If state override is given, then return.
              if (stateOverride) return this;
              // 1.3.6. Set buffer to the empty string and state to path start
              // state
              this.buffer = "";
              this.state = PATH_START;
            }
            continue;
            // 2. Otherwise, append c to buffer.
          } else this.buffer += c;
          break;
        }
        // https://url.spec.whatwg.org/#path-start-state
        case PATH_START: {
          // 1. If url is special, then:
          if (isSpecial(this.url)) {
            // 1.1. If c is U+005C (\), validation error.
            // 1.2. Set state to path state.
            this.state = PATH;
            // 1.3. If c is neither U+002F (/) nor U+005C (\), then decrease 
            // pointer by one.
            if (c != "/" && c != "\\") continue;
            // 2. Otherwise, if state override is not given and c is U+003F (?),
            // set url’s query to the empty string and state to query state.
          } else if (!stateOverride && c == "?") {
            this.url.query = "";
            this.state = QUERY;
            // 3. Otherwise, if state override is not given and c is U+0023 (#),
            // set url’s fragment to the empty string and state to fragment state.
          } else if (!stateOverride && c == "#") {
            this.url.fragment = "";
            this.state = FRAGMENT;
            // 4. Otherwise, if c is not the EOF code point:
          } else if (c != EOF) {
            // 4.1. Set state to path state.
            this.state = PATH;
            // 4.2. If c is not U+002F (/), then decrease pointer by one.
            if (c != "/") continue;
          }
          break;
        }
        // https://url.spec.whatwg.org/#path-state
        case PATH: {
          // 1. If one of the following is true
          // c is the EOF code point or U+002F (/)
          // url is special and c is U+005C (\)
          // state override is not given and c is U+003F (?) or U+0023 (#)
          if (
            c == EOF ||
            c == "/" ||
            (c == "\\" && isSpecial(this.url)) ||
            (!stateOverride && (c == "?" || c == "#"))
          ) {
            // 1.1. If url is special and c is U+005C (\), validation error.
            // 1.2. If buffer is a double-dot path segment, shorten url’s path,
            // and then if neither c is U+002F (/), nor url is special and c 
            // is U+005C (\), append the empty string to url’s path.
            if (isDoubleDot(this.buffer)) {
              shortenUrlPath(url);
              // 1. Let path be url’s path.
              if (c != "/" && !(c == "\\" && isSpecial(this.url))) {
                this.url.path.push("");
              }
              // 1.3. Otherwise, if buffer is a single-dot path segment and if
              // neither c is U+002F (/), nor url is special and c is
              // U+005C (\), append the empty string to url’s path.
            } else if (isSingleDot(this.buffer)) {
              if (c != "/" && !(c == "\\" && isSpecial(this.url))) {
                this.url.path.push("");
              }
              // 1.4. Otherwise, if buffer is not a single-dot path segment, then:
            } else {
              // 1.4.1. If url’s scheme is "file", url’s path is empty, and 
              // buffer is a Windows drive letter, then:
              if (
                this.url.scheme == "file" &&
                !this.url.path.length &&
                isWindowsDriveLetter(this.buffer)
              ) {
                // 1.4.1.1 If url’s host is neither the empty string nor null, 
                // validation error, set url’s host to the empty string.
                if (this.url.host) this.url.host = "";
                // 1.4.1.2 Replace the second code point in buffer with U+003A (:).
                this.buffer = this.buffer.charAt(0) + ":";
              }
              // 1.4.2. Append buffer to url’s path.
              this.url.path.push(this.buffer);
            }
            // 1.5. Set buffer to the empty string.
            this.buffer = "";
            // 1.6. If url’s scheme is "file" and c is the EOF code point,
            // U+003F (?), or U+0023 (#), then while url’s path’s size is 
            // greater than 1 and url’s path[0] is the empty string, 
            // validation error, remove the first item from url’s path.
            if (this.url.scheme == "file" && (c == EOF || c == "?" || c == "#")) {
              while (this.url.path.length > 1 && this.url.path[0] === "") {
                this.url.path.shift();
              }
            }
            // 1.7. If c is U+003F (?), then set url’s query to the empty 
            // string and state to query state.
            if (c == "?") {
              this.url.query = "";
              this.state = QUERY;
              // 1.8. If c is U+0023 (#), then set url’s fragment to the 
              // empty string and state to fragment state.
            } else if (c == "#") {
              this.url.fragment = "";
              this.state = FRAGMENT;
            }
            // 2. Otherwise, run these steps:
          } else {
            // 2.1. If c is not a URL code point and not U+0025 (%), validation error.
            // 2.2. If c is U+0025 (%) and remaining does not start with two ASCII hex digits, validation error.
            // 2.3. UTF-8 percent encode c using the path percent-encode set, and append the result to buffer.
            this.buffer += percentEncode(c, pathPercentEncodeSet);
          }
          break;
        }
        // https://url.spec.whatwg.org/#cannot-be-a-base-url-path-state
        case CANNOT_BE_A_BASE_URL_PATH:
          // 1. If c is U+003F (?), then set url’s query to the empty string and state to query state.
          if (c == "?") {
            this.url.query = "";
            this.state = QUERY;
            // 2. Otherwise, if c is U+0023 (#), then set url’s fragment to the empty string and state to fragment state.
          } else if (c == "#") {
            this.url.fragment = "";
            this.state = FRAGMENT;
            // 3. Otherwise:
          } else if (c != EOF) {
            // 1. If c is not the EOF code point, not a URL code point, and not U+0025 (%), validation error.
            // 2. If c is U+0025 (%) and remaining does not start with two ASCII hex digits, validation error.
            // 3. If c is not the EOF code point, UTF-8 percent encode c using the C0 control percent-encode set, and append the result to url’s path[0].
            this.url.path[0] += percentEncode(c, C0ControlPercentEncodeSet);
          }
          break;
        // https://url.spec.whatwg.org/#query-state
        case QUERY: {
          // 1. If encoding is not UTF-8 and one of the following is true
          // url is not special
          // url’s scheme is "ws" or "wss"
          // then set encoding to UTF-8.
          // 2. If state override is not given and c is U+0023 (#), then set url’s fragment to the empty string and state to fragment state.
          if (!stateOverride && c == "#") {
            this.url.fragment = "";
            this.state = FRAGMENT;
            // 3. Otherwise, if c is not the EOF code point:
          } else if (c != EOF) {
            // 3.1. If c is not a URL code point and not U+0025 (%), validation error.
            // 3.2. If c is U+0025 (%) and remaining does not start with two ASCII hex digits, validation error.
            // 3.3. Let bytes be the result of encoding c using encoding.
            // 3.4. If bytes starts with `&#` and ends with 0x3B (;), then:
            // 3.4.1. Replace `&#` at the start of bytes with `%26%23`.
            // 3.4.2. Replace 0x3B (;) at the end of bytes with `%3B`.
            // 3.4.3. Append bytes, isomorphic decoded, to url’s query.
            // 3.5. Otherwise, for each byte in bytes:
            // 3.5.1. // If one of the following is true
            // byte is less than 0x21 (!)
            // byte is greater than 0x7E (~)
            // byte is 0x22 ("), 0x23 (#), 0x3C (<), or 0x3E (>)
            // byte is 0x27 (') and url is special
            // then append byte, percent encoded, to url’s query.
            if (c == "'" && isSpecial(this.url)) {
              this.url.query += "%27";
            } else if (c == "#") {
              this.url.query += "%23";
              // 3.5.2. Otherwise, append a code point whose value is byte to url’s query.
            } else {
              this.url.query += percentEncode(c, C0ControlPercentEncodeSet);
            }
          }
          break;
        }
        // https://url.spec.whatwg.org/#fragment-state
        case FRAGMENT: {
          // 1. Switching on c:
          // The EOF code point
          // 1.1. Do nothing.
          // U+0000 NULL
          // 1.1. Validation error.
          // Otherwise
          // 1.1. If c is not a URL code point and not U+0025 (%), validation error.
          // 1.2. If c is U+0025 (%) and remaining does not start with two ASCII hex digits, validation error.
          // 1.3. UTF-8 percent encode c using the fragment percent-encode set and append the result to url’s fragment.
          if (c != EOF)
            this.url.fragment += percentEncode(c, fragmentPercentEncodeSet);
          break;
        }
      }

      this.pointer++;
    }
    return this;
  }

  // https://url.spec.whatwg.org/#dom-url-url
  function basicURLParse(input, options) {
    if (options === undefined) {
      options = {};
    }

    var usm = new URLStateMachine(
      input,
      options.baseURL,
      options.encodingOverride,
      options.url,
      options.stateOverride
    );
    if (usm.failure) {
      return null;
    }

    return usm.url;
  }

  function arePropertyDescriptorsSupported() {
    var obj = {};
    try {
      Object.defineProperty(obj, "x", {
        enumerable: false,
        value: obj
      });
      /* eslint-disable no-unused-vars, no-restricted-syntax */
      for (var _ in obj) {
        return false;
      }
      /* eslint-enable no-unused-vars, no-restricted-syntax */
      return obj.x === obj;
    } catch (e) {
      // this is IE 8.
      return false;
    }
  }

  var supportsDescriptors =
    Object.defineProperty && arePropertyDescriptorsSupported();

  function URL(url /* , base */) {
    var base = arguments[1];
    if (arguments.length  == 0) {
      throw new TypeError('At least 1 argument required, but only 0 passed');
    }
    url = String(url);

    // 1. var parsedBase be null.
    var parsedBase = null;
    // 2 If base is given, then:
    if (base !== undefined) {
      // 2.1 var parsedBase be the result of running the basic URL parser on base.
      parsedBase = basicURLParse(String(base));
      if (parsedBase === null) {
        // 2.2 If parsedBase is failure, then throw a TypeError.
        throw new TypeError("Invalid base URL: " + base);
      }
    }

    // 3. Let parsedURL be the result of running the basic URL parser on url with parsedBase.
    var parsedURL = basicURLParse(url, {
      baseURL: parsedBase
    });
    // 4. If parsedURL is failure, then throw a TypeError.
    if (parsedURL === null) {
      throw new TypeError("Invalid URL: " + url);
    }

    // 5. Let query be parsedURL’s query, if that is non-null, and the empty string otherwise.
    var query = parsedURL.query !== null ? parsedURL.query : "";

    // 6. Let result be a new URL object
    // 7. Set result’s url to parsedURL.
    this._url = parsedURL;

    // We cannot invoke the "new URLSearchParams object" algorithm without going through the constructor, which strips
    // question mark by default. Therefore the doNotStripQMark hack is used.
    // 8. Set result’s query object to a new URLSearchParams object using query, and then set that query object’s url object to result.
    doNotStripQMark = true;
    this._query = new URLSearchParams(query);
    this._query._url = this;

    if (!supportsDescriptors) {
      this.href = serializeURL(this._url);
      this.origin = serializeURLOrigin(this._url);
      this.protocol = this._url.scheme + ":";
      this.username = this._url.username;
      this.password = this._url.password;
      this.host = getHost.call(this);
      this.hostname = getHostname.call(this);
      this.port = getPort.call(this);
      this.pathname = getPathname.call(this);
      this.search = getSearch.call(this);
      this.searchParams = this._query;
      this.hash = getHash.call(this);
    }

    // 9. Return result.
    return this;
  }

  // https://url.spec.whatwg.org/#dom-url-tojson
  // The href attribute’s getter and the toJSON() method, when invoked, must return the serialization of context object’s url.
  URL.prototype.toJSON = function toJSON() {
    return this.href;
  };
  // https://url.spec.whatwg.org/#URL-stringification-behavior
  URL.prototype.toString = function toString() {
    return this.href;
  };

  function getHost() {
    // 1. Let url be context object’s url.
    var url = this._url;

    // 2. If url’s host is null, return the empty string.
    if (url.host === null) {
      return "";
    }

    // 3. If url’s port is null, return url’s host, serialized.
    if (url.port === null) {
      return serializeHost(url.host);
    }

    // 4. Return url’s host, serialized, followed by U+003A (:) and url’s port, serialized.
    return serializeHost(url.host) + ":" + serializeInteger(url.port);
  }

  function getHostname() {
    // 1. If context object’s url’s host is null, return the empty string.
    if (this._url.host === null) {
      return "";
    }
    // 2. Return context object’s url’s host, serialized.
    return serializeHost(this._url.host);
  }

  function getPort() {
    // 1. If context object’s url’s port is null, return the empty string.
    if (this._url.port === null) {
      return "";
    }
    // 2. Return context object’s url’s port, serialized.
    return serializeInteger(this._url.port);
  }

  function getPathname() {
    // 1. If context object’s url’s cannot-be-a-base-URL flag is set, then return context object’s url’s path[0].
    if (this._url.cannotBeABaseURL) {
      return this._url.path[0];
    }
    // 2. If context object’s url’s path is empty, then return the empty string.
    if (this._url.path.length === 0) {
      return "";
    }
    // 3. Return U+002F (/), followed by the strings in context object’s url’s path (including empty strings), if any, separated from each other by U+002F (/).
    return "/" + this._url.path.join("/");
  }

  function getSearch() {
    // 1. If context object’s url’s query is either null or the empty string, return the empty string.
    if (this._url.query === null || this._url.query === "") {
      return "";
    }
    // 2. Return U+003F (?), followed by context object’s url’s query.
    return "?" + this._url.query;
  }

  function getHash() {
    // 1. If context object’s url’s fragment is either null or the empty string, return the empty string.
    if (this._url.fragment === null || this._url.fragment === "") {
      return "";
    }
    // 2. Return U+0023 (#), followed by context object’s url’s fragment.
    return "#" + this._url.fragment;
  }
  // https://url.spec.whatwg.org/#cannot-have-a-username-password-port
  function cannotHaveAUsernamePasswordPort(url) {
    // A URL cannot have a username/password/port if its host is null or the empty string, its cannot-be-a-base-URL flag is set, or its scheme is "file".
    return (
      url.host === null ||
      url.host === "" ||
      url.cannotBeABaseURL ||
      url.scheme === "file"
    );
  }
  if (supportsDescriptors) {
    // https://url.spec.whatwg.org/#dom-url-href
    Object.defineProperty(URL.prototype, "href", {
      enumerable: true,
      configurable: true,
      // The href attribute’s getter and the toJSON() method, when invoked, must return the serialization of context object’s url.
      get: function href() {
        return serializeURL(this._url);
      },
      // The href attribute’s setter must run these steps:
      set: function href(value) {
        // 1. Let parsedURL be the result of running the basic URL parser on the given value.
        var parsedURL = basicURLParse(value);
        // 2. If parsedURL is failure, then throw a TypeError.
        if (parsedURL === null) {
          throw new TypeError("Invalid URL: " + value);
        }

        // 3. Set context object’s url to parsedURL.
        this._url = parsedURL;

        // 4. Empty context object’s query object’s list.
        this._query._list.splice(0);
        // 5. Let query be context object’s url’s query.
        var query = parsedURL.query;
        // 6. If query is non-null, then set context object’s query object’s list to the result of parsing query.
        if (query !== null) {
          this._query._list = parseUrlencoded(query);
        }
      }
    });
    // https://url.spec.whatwg.org/#dom-url-origin
    Object.defineProperty(URL.prototype, "origin", {
      enumerable: true,
      configurable: true,
      // The origin attribute’s getter must return the serialization of context object’s url’s origin. [HTML]
      get: function origin() {
        return serializeURLOrigin(this._url);
      }
    });
    // https://url.spec.whatwg.org/#dom-url-protocol
    Object.defineProperty(URL.prototype, "protocol", {
      enumerable: true,
      configurable: true,
      // The protocol attribute’s getter must return context object url’s scheme, followed by U+003A (:).
      get: function protocol() {
        return this._url.scheme + ":";
      },
      // The protocol attribute’s setter must basic URL parse the given value, followed by U+003A (:), with context object’s url as url and scheme start state as state override.
      set: function protocol(v) {
        basicURLParse(v + ":", {
          url: this._url,
          stateOverride: SCHEME_START
        });
      }
    });
    // https://url.spec.whatwg.org/#dom-url-username
    Object.defineProperty(URL.prototype, "username", {
      enumerable: true,
      configurable: true,
      // The username attribute’s getter must return context object’s url’s username.
      get: function username() {
        return this._url.username;
      },
      // The username attribute’s setter must run these steps:
      set: function username(v) {
        // 1. If context object’s url cannot have a username/password/port, then return.
        if (cannotHaveAUsernamePasswordPort(this._url)) {
          return;
        }
        // 2. Set the username given context object’s url and the given value.
        setTheUsername(this._url, v);
      }
    });
    // https://url.spec.whatwg.org/#dom-url-password
    Object.defineProperty(URL.prototype, "password", {
      enumerable: true,
      configurable: true,
      // The password attribute’s getter must return context object’s url’s password.
      get: function password() {
        return this._url.password;
      },
      // The password attribute’s setter must run these steps:
      set: function password(v) {
        // 1. If context object’s url cannot have a username/password/port, then return.
        if (cannotHaveAUsernamePasswordPort(this._url)) {
          return;
        }
        // 2. Set the password given context object’s url and the given value.
        setThePassword(this._url, v);
      }
    });
    // https://url.spec.whatwg.org/#dom-url-host
    Object.defineProperty(URL.prototype, "host", {
      enumerable: true,
      configurable: true,
      get: getHost,
      // The host attribute’s setter must run these steps:
      set: function host(v) {
        // 1. If context object’s url’s cannot-be-a-base-URL flag is set, then return.
        if (this._url.cannotBeABaseURL) {
          return;
        }
        // 2. Basic URL parse the given value with context object’s url as url and host state as state override.
        basicURLParse(v, {
          url: this._url,
          stateOverride: HOST
        });
      }
    });
    // https://url.spec.whatwg.org/#dom-url-hostname
    Object.defineProperty(URL.prototype, "hostname", {
      enumerable: true,
      configurable: true,
      // The hostname attribute’s getter must run these steps:
      get: getHostname,
      // The hostname attribute’s setter must run these steps:
      set: function hostname(v) {
        // 1. If context object’s url’s cannot-be-a-base-URL flag is set, then return.
        if (this._url.cannotBeABaseURL) {
          return;
        }
        // 2. Basic URL parse the given value with context object’s url as url and hostname state as state override.
        basicURLParse(v, {
          url: this._url,
          stateOverride: HOSTNAME
        });
      }
    });
    // https://url.spec.whatwg.org/#dom-url-port
    Object.defineProperty(URL.prototype, "port", {
      enumerable: true,
      configurable: true,
      // The port attribute’s getter must run these steps:
      get: getPort,
      // The port attribute’s setter must run these steps:
      set: function port(v) {
        // 1. If context object’s url cannot have a username/password/port, then return.
        if (cannotHaveAUsernamePasswordPort(this._url)) {
          return;
        }

        // 2. If the given value is the empty string, then set context object’s url’s port to null.
        if (v === "") {
          this._url.port = null;
          // 3. Otherwise, basic URL parse the given value with context object’s url as url and port state as state override.
        } else {
          basicURLParse(String(v), {
            url: this._url,
            stateOverride: PORT
          });
        }
      }
    });
    // https://url.spec.whatwg.org/#dom-url-pathname
    Object.defineProperty(URL.prototype, "pathname", {
      enumerable: true,
      configurable: true,
      // The pathname attribute’s getter must run these steps:
      get: getPathname,
      // The pathname attribute’s setter must run these steps:
      set: function pathname(v) {
        // 1. If context object’s url’s cannot-be-a-base-URL flag is set, then return.
        if (this._url.cannotBeABaseURL) {
          return;
        }
        // 2. Empty context object’s url’s path.
        this._url.path = [];
        // 3. Basic URL parse the given value with context object’s url as url and path start state as state override.
        basicURLParse(v, {
          url: this._url,
          stateOverride: PATH_START
        });
      }
    });
    // https://url.spec.whatwg.org/#dom-url-search
    Object.defineProperty(URL.prototype, "search", {
      enumerable: true,
      configurable: true,
      // The search attribute’s getter must run these steps:
      get: getSearch,
      // The search attribute’s setter must run these steps:
      set: function search(v) {
        // 1. Let url be context object’s url.
        var url = this._url;
        // 2. If the given value is the empty string, set url’s query to null, empty context object’s query object’s list, and then return.
        if (v === "") {
          url.query = null;
          this._query._list = [];
          return;
        }
        // 3. Let input be the given value with a single leading U+003F (?) removed, if any.
        var input = v[0] === "?" ? v.substring(1) : v;
        // 4. Set url’s query to the empty string.
        url.query = "";
        // 5. Basic URL parse input with url as url and query state as state override.
        basicURLParse(input, {
          url: url,
          stateOverride: QUERY
        });
        // 6. Set context object’s query object’s list to the result of parsing input.
        this._query._list = parseUrlencoded(input);
      }
    });
    // https://url.spec.whatwg.org/#dom-url-searchparams
    Object.defineProperty(URL.prototype, "searchParams", {
      enumerable: true,
      configurable: true,
      // The searchParams attribute’s getter must return context object’s query object.
      get: function searchParams() {
        return this._query;
      }
    });
    // https://url.spec.whatwg.org/#dom-url-hash
    Object.defineProperty(URL.prototype, "hash", {
      enumerable: true,
      configurable: true,
      // The hash attribute’s getter must run these steps:
      get: getHash,
      // The hash attribute’s setter must run these steps:
      set: function hash(v) {
        // 1. If the given value is the empty string, then set context object’s url’s fragment to null and return.
        if (v === "") {
          this._url.fragment = null;
          return;
        }
        // 2. Let input be the given value with a single leading U+0023 (#) removed, if any.
        var input = v[0] === "#" ? v.substring(1) : v;
        // 3. Set context object’s url’s fragment to the empty string.
        this._url.fragment = "";
        // 4. Basic URL parse input with context object’s url as url and fragment state as state override.
        basicURLParse(input, {
          url: this._url,
          stateOverride: FRAGMENT
        });
      }
    });
  }
  // https://url.spec.whatwg.org/#set-the-username
  function setTheUsername(url, username) {
    // 1. Set url’s username to the empty string.
    url.username = "";
    // 2. For each code point in username, UTF-8 percent encode it using the userinfo percent-encode set, and append the result to url’s username.
    var decoded = username;
    for (var i = 0; i < decoded.length; ++i) {
      url.username += percentEncode(decoded[i], userinfoPercentEncodeSet);
    }
  }

  // https://url.spec.whatwg.org/#set-the-password
  function setThePassword(url, password) {
    // 1. Set url’s password to the empty string.
    url.password = "";
    // 2. For each code point in password, UTF-8 percent encode it using the userinfo percent-encode set, and append the result to url’s password.
    var decoded = password;
    for (var i = 0; i < decoded.length; ++i) {
      url.password += percentEncode(decoded[i], userinfoPercentEncodeSet);
    }
  }
  // https://url.spec.whatwg.org/#serialize-an-integer
  // To serialize an integer, represent it as the shortest possible decimal number.
  function serializeInteger(integer) {
    return String(integer);
  }

  // https://url.spec.whatwg.org/#concept-url-serializer
  // The URL serializer takes a URL url, an optional exclude fragment flag, and then runs these steps, returning an ASCII string:
  function serializeURL(url, excludeFragment) {
    // 1. Let output be url’s scheme and U+003A (:) concatenated.
    var output = url.scheme + ":";
    // 2. If url’s host is non-null:
    if (url.host !== null) {
      // 2.1. Append "//" to output.
      output = output + '//';

      // 2.2. If url includes credentials, then:
      if (includesCredentials(url)) {
        // 2.2.1. Append url’s username to output.
        output = output + url.username;
        // 2.2.2. If url’s password is not the empty string, then append U+003A (:), followed by url’s password, to output.
        if (url.password !== "") {
          output = output + ":" + url.password;
        }
        // 2.2.3. Append U+0040 (@) to output.
        output = output + "@";
      }

      // 2.3. Append url’s host, serialized, to output.
      output = output + serializeHost(url.host);

      // 2.4. If url’s port is non-null, append U+003A (:) followed by url’s port, serialized, to output.
      if (url.port !== null) {
        output += ":" + url.port;
      }
      // 3. Otherwise, if url’s host is null and url’s scheme is "file", append "//" to output.
    } else if (url.host === null && url.scheme === "file") {
      output = output + "//";
    }

    // 4. If url’s cannot-be-a-base-URL flag is set, append url’s path[0] to output.
    if (url.cannotBeABaseURL) {
      output = output + url.path[0];
      // 5. Otherwise, then for each string in url’s path, append U+002F (/) followed by the string to output.
    } else {
      for (var i = 0; i < url.path.length; i++) {
        var string = url.path[i];
        output = output + "/" + string;
      }
    }

    // 6. If url’s query is non-null, append U+003F (?), followed by url’s query, to output.
    if (url.query !== null) {
      output = output + "?" + url.query;
    }

    // 7. If the exclude fragment flag is unset and url’s fragment is non-null, append U+0023 (#), followed by url’s fragment, to output.
    if (!excludeFragment && url.fragment !== null) {
      output = output + "#" + url.fragment;
    }

    // 8. Return output.
    return output;
  }

  // https://url.spec.whatwg.org/#concept-ipv4-serializer
  // The IPv4 serializer takes an IPv4 address address and then runs these steps:
  function serializeIPv4(address) {
    // 1. Let output be the empty string.
    var output = "";
    // 2. Let n be the value of address.
    var n = address;
    // 3. For each i in the range 1 to 4, inclusive:
    for (var i = 1; i <= 4; ++i) {
      // 3.1. Prepend n % 256, serialized, to output.
      output = String(n % 256) + output;
      // 3.2. If i is not 4, then prepend U+002E (.) to output.
      if (i !== 4) {
        output = "." + output;
      }
      // 3.3. Set n to floor(n / 256).
      n = Math.floor(n / 256);
    }
    // 4. Return output.
    return output;
  }

  // https://html.spec.whatwg.org/multipage/origin.html#ascii-serialisation-of-an-origin
  function serializeURLOrigin(origin) {
    // 1. If origin is an opaque origin, then return "null".
    if (!isSpecial(origin)) {
      return "null";
    }
    // 2. Otherwise, let result be origin's scheme.
    var result = origin.scheme;
    // 3. Append "://" to result.
    result = result + "://";
    // 4. Append origin's host, serialized, to result.
    result = result + serializeHost(origin.host);
    // 5. If origin's port is non-null, append a U+003A COLON character (:), and origin's port, serialized, to result.
    if (origin.port !== null) {
      result = result + ":" + origin.port;
    }
    // 6. Return result.
    return result;
  }

  function findLongestZeroSequence(arr) {
    var maxIdx = null;
    var maxLen = 1; // only find elements > 1
    var currStart = null;
    var currLen = 0;

    for (var i = 0; i < arr.length; ++i) {
      if (arr[i] !== 0) {
        if (currLen > maxLen) {
          maxIdx = currStart;
          maxLen = currLen;
        }

        currStart = null;
        currLen = 0;
      } else {
        if (currStart === null) {
          currStart = i;
        }
        ++currLen;
      }
    }

    // if trailing zeros
    if (currLen > maxLen) {
      maxIdx = currStart;
      maxLen = currLen;
    }

    return {
      idx: maxIdx,
      len: maxLen
    };
  }

  // https://url.spec.whatwg.org/#concept-ipv6-serializer
  // The IPv6 serializer takes an IPv6 address address and then runs these steps:
  function serializeIPv6(address) {
    // 1. Let output be the empty string.
    var output = "";
    // 2. Let compress be an index to the first IPv6 piece in the first longest sequences of address’s IPv6 pieces that are 0.
    // 3. If there is no sequence of address’s IPv6 pieces that are 0 that is longer than 1, then set compress to null.
    var seqResult = findLongestZeroSequence(address);
    var compress = seqResult.idx;
    // 4. Let ignore0 be false.
    var ignore0 = false;
    // 5. For each pieceIndex in the range 0 to 7, inclusive:
    for (var pieceIndex = 0; pieceIndex <= 7; ++pieceIndex) {
      // 5.1. If ignore0 is true and address[pieceIndex] is 0, then continue.
      if (ignore0 && address[pieceIndex] === 0) {
        continue;
        // 5.2. Otherwise, if ignore0 is true, set ignore0 to false.
      } else if (ignore0) {
        ignore0 = false;
      }
      // 5.3. If compress is pieceIndex, then:
      if (compress === pieceIndex) {
        // 5.3.1. Let separator be "::" if pieceIndex is 0, and U+003A (:) otherwise.
        var separator = pieceIndex === 0 ? "::" : ":";
        // 5.3.2. Append separator to output.
        output += separator;
        // 5.3.3. Set ignore0 to true and continue.
        ignore0 = true;
        continue;
      }
      // 5.4. Append address[pieceIndex], represented as the shortest possible lowercase hexadecimal number, to output.
      output += address[pieceIndex].toString(16);
      // 5.5. If pieceIndex is not 7, then append U+003A (:) to output.
      if (pieceIndex !== 7) {
        output += ":";
      }
    }
    // 5.6. Return output.
    return output;
  }

  // https://url.spec.whatwg.org/#concept-host-serializer
  // The host serializer takes a host host and then runs these steps:
  function serializeHost(host) {
    // 1. If host is an IPv4 address, return the result of running the IPv4 serializer on host.
    if (typeof host === "number") {
      return serializeIPv4(host);
    }

    // 2. Otherwise, if host is an IPv6 address, return U+005B ([), followed by the result of running the IPv6 serializer on host, followed by U+005D (]).
    if (host instanceof Array) {
      return "[" + serializeIPv6(host) + "]";
    }
    // 3. Otherwise, host is a domain, opaque host, or empty host, return host.
    return host;
  }

  var doNotStripQMark = false;
  // https://url.spec.whatwg.org/#dom-urlsearchparams-urlsearchparams
  function URLSearchParams(init) {
    this._list = [];
    this._url = null;

    // 1. If init is a string and starts with U+003F (?), remove the first code point from init.
    if (!doNotStripQMark && typeof init === "string" && init[0] === "?") {
      init = init.slice(1);
    }
    doNotStripQMark = false;

    // 2. Return a new URLSearchParams object using init.
    // https://url.spec.whatwg.org/#concept-urlsearchparams-new
    // 1. Let query be a new URLSearchParams object.
    // 2. If init is a sequence, then for each pair in init: 
    if (Array.isArray(init)) {
      for (var i = 0; i < init.length; i++) {
        var pair = init[i];
        // 2.1 If pair does not contain exactly two items, then throw a TypeError. 
        if (pair.length !== 2) {
          throw new TypeError(
            "Failed to construct 'URLSearchParams': parameter 1 sequence's element does not " +
              "contain exactly two elements."
          );
        }
        // 2.2 Append a new name-value pair whose name is pair’s first item, and value is pair’s second item, to query’s list. 
        this._list.push([pair[0], pair[1]]);
      }
    // 3. Otherwise, if init is a record, then for each name → value in init, append a new name-value pair whose name is name and value is value, to query’s list. 
    } else if (
      typeof init === "object" &&
      Object.getPrototypeOf(init) === null
    ) {
      var keys = Object.keys(init);
      for (var j = 0; j < keys.length; j++) {
        var name = keys[j];
        var value = init[name];
        this._list.push([name, value]);
      }
    // 4. Otherwise, init is a string, then set query’s list to the result of parsing init. 
    } else {
      this._list = parseUrlencoded(String(init));
    }
    // 5. Return query.
  }

  function serializeUrlencodedByte(input) {
    var output = "";
    for (var i=0;i<input.length;i++) {
      var byte = input[i];
      if (byte === codePointFor(" ")) {
        output += "+";
      } else if (byte === codePointFor("*") ||
                 byte === codePointFor("-") ||
                 byte === codePointFor(".") ||
                 (byte >= codePointFor("0") && byte <= codePointFor("9")) ||
                 (byte >= codePointFor("A") && byte <= codePointFor("Z")) ||
                 byte === codePointFor("_") ||
                 (byte >= codePointFor("a") && byte <= codePointFor("z"))) {
        output += String.fromCodePoint(byte);
      } else {
        output += percentEncode(byte, C0ControlPercentEncodeSet);
      }
    }
    return output;
  }
  
  function serializeUrlencoded(tuples, encodingOverride) {
    var encoding = "utf-8";
    if (encodingOverride !== undefined) {
      encoding = encodingOverride;
    }
  
    var output = "";
    var entries = Array.from(tuples.entries());
    for (var j = 0; j<entries.length;j++) {
      var i = entries[j][0];
      var tuple = entries[j][1];
      // TODO: handle encoding override
      var name = serializeUrlencodedByte(tuple[0]);
      var value = tuple[1];
      if (tuple.length > 2 && tuple[2] !== undefined) {
        if (tuple[2] === "hidden" && name === "_charset_") {
          value = encoding;
        } else if (tuple[2] === "file") {
          // value is a File object
          value = value.name;
        }
      }
      value = serializeUrlencodedByte(value);
      if (i !== 0) {
        output += "&";
      }
      output += name + "=" + value;
    }
    return output;
  }

  URLSearchParams.prototype._updateSteps = function() {
    if (this._url !== null) {
      var query = serializeUrlencoded(this._list);
      if (query === "") {
        query = null;
      }
      this._url._url.query = query;
    }
  };

  URLSearchParams.prototype.append = function(name, value) {
    this._list.push([name, value]);
    this._updateSteps();
  };

  URLSearchParams.prototype["delete"] = function(name) {
    var i = 0;
    while (i < this._list.length) {
      if (this._list[i][0] === name) {
        this._list.splice(i, 1);
      } else {
        i++;
      }
    }
    this._updateSteps();
  };

  URLSearchParams.prototype.get = function(name) {
    for (var i = 0; i < this._list.length; i++) {
      var tuple = this._list[i];
      if (tuple[0] === name) {
        return tuple[1];
      }
    }
    return null;
  };

  URLSearchParams.prototype.getAll = function(name) {
    var output = [];
    for (var i = 0; i < this._list.length; i++) {
      var tuple = this._list[i];
      if (tuple[0] === name) {
        output.push(tuple[1]);
      }
    }
    return output;
  };

  URLSearchParams.prototype.has = function(name) {
    for (var i = 0; i < this._list.length; i++) {
      var tuple = this._list[i];
      if (tuple[0] === name) {
        return true;
      }
    }
    return false;
  };

  URLSearchParams.prototype.set = function(name, value) {
    var found = false;
    var i = 0;
    while (i < this._list.length) {
      if (this._list[i][0] === name) {
        if (found) {
          this._list.splice(i, 1);
        } else {
          found = true;
          this._list[i][1] = value;
          i++;
        }
      } else {
        i++;
      }
    }
    if (!found) {
      this._list.push([name, value]);
    }
    this._updateSteps();
  };

  URLSearchParams.prototype.sort = function() {
    this._list = this._list.sort(function(a, b) {
      var aa = a[0];
      var bb = b[0];
      return aa - bb;
    });
    this._updateSteps();
  };

  URLSearchParams.prototype[Symbol.iterator] = function() {
    return this._list[Symbol.iterator]();
  };

  URLSearchParams.prototype.toString = function() {
    return serializeUrlencoded(this._list);
  };

  global.URL = URL;
  global.URLSearchParams = URLSearchParams;
  if (NativeURL) {
    var nativeCreateObjectURL = NativeURL.createObjectURL;
    var nativeRevokeObjectURL = NativeURL.revokeObjectURL;
    // `URL.createObjectURL` method
    // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
    // eslint-disable-next-line no-unused-vars
    if (nativeCreateObjectURL) {
      Object.defineProperty(URLConstructor, 'createObjectURL', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function createObjectURL(blob) {
          return nativeCreateObjectURL.apply(NativeURL, arguments);
        }
      });
    }
    // `URL.revokeObjectURL` method
    // https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
    // eslint-disable-next-line no-unused-vars
    if (nativeRevokeObjectURL) {
      Object.defineProperty(URLConstructor, 'revokeObjectURL', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function revokeObjectURL(url) {
        return nativeRevokeObjectURL.apply(NativeURL, arguments);
        }
      });
    }
  }
})(self);
