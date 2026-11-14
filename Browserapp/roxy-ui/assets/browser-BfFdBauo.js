import {t as e} from "./rolldown-runtime-BCiCTKAo.js";
var t = e(((e2, t2) => {
  t2.exports = function() {
    return typeof Promise == "function" && Promise.prototype && Promise.prototype.then;
  };
}));
var n = e(((e2) => {
  var t2, n2 = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706];
  e2.getSymbolSize = function(e3) {
    if (!e3) throw Error('"version" cannot be null or undefined');
    if (e3 < 1 || e3 > 40) throw Error('"version" should be in range from 1 to 40');
    return e3 * 4 + 17;
  }, e2.getSymbolTotalCodewords = function(e3) {
    return n2[e3];
  }, e2.getBCHDigit = function(e3) {
    let t3 = 0;
    for (; e3 !== 0; ) t3++, e3 >>>= 1;
    return t3;
  }, e2.setToSJISFunction = function(e3) {
    if (typeof e3 != "function") throw Error('"toSJISFunc" is not a valid function.');
    t2 = e3;
  }, e2.isKanjiModeEnabled = function() {
    return t2 !== void 0;
  }, e2.toSJIS = function(e3) {
    return t2(e3);
  };
}));
var r = e(((e2) => {
  e2.L = { bit: 1 }, e2.M = { bit: 0 }, e2.Q = { bit: 3 }, e2.H = { bit: 2 };
  function t2(t3) {
    if (typeof t3 != "string") throw Error("Param is not a string");
    switch (t3.toLowerCase()) {
      case "l":
      case "low":
        return e2.L;
      case "m":
      case "medium":
        return e2.M;
      case "q":
      case "quartile":
        return e2.Q;
      case "h":
      case "high":
        return e2.H;
      default:
        throw Error("Unknown EC Level: " + t3);
    }
  }
  e2.isValid = function(e3) {
    return e3 && e3.bit !== void 0 && e3.bit >= 0 && e3.bit < 4;
  }, e2.from = function(n2, r2) {
    if (e2.isValid(n2)) return n2;
    try {
      return t2(n2);
    } catch {
      return r2;
    }
  };
}));
var i = e(((e2, t2) => {
  function n2() {
    this.buffer = [], this.length = 0;
  }
  n2.prototype = { get: function(e3) {
    let t3 = Math.floor(e3 / 8);
    return (this.buffer[t3] >>> 7 - e3 % 8 & 1) == 1;
  }, put: function(e3, t3) {
    for (let n3 = 0; n3 < t3; n3++) this.putBit((e3 >>> t3 - n3 - 1 & 1) == 1);
  }, getLengthInBits: function() {
    return this.length;
  }, putBit: function(e3) {
    let t3 = Math.floor(this.length / 8);
    this.buffer.length <= t3 && this.buffer.push(0), e3 && (this.buffer[t3] |= 128 >>> this.length % 8), this.length++;
  } }, t2.exports = n2;
}));
var a = e(((e2, t2) => {
  function n2(e3) {
    if (!e3 || e3 < 1) throw Error("BitMatrix size must be defined and greater than 0");
    this.size = e3, this.data = new Uint8Array(e3 * e3), this.reservedBit = new Uint8Array(e3 * e3);
  }
  n2.prototype.set = function(e3, t3, n3, r2) {
    let i2 = e3 * this.size + t3;
    this.data[i2] = n3, r2 && (this.reservedBit[i2] = !0);
  }, n2.prototype.get = function(e3, t3) {
    return this.data[e3 * this.size + t3];
  }, n2.prototype.xor = function(e3, t3, n3) {
    this.data[e3 * this.size + t3] ^= n3;
  }, n2.prototype.isReserved = function(e3, t3) {
    return this.reservedBit[e3 * this.size + t3];
  }, t2.exports = n2;
}));
var o = e(((e2) => {
  var t2 = n().getSymbolSize;
  e2.getRowColCoords = function(e3) {
    if (e3 === 1) return [];
    let n2 = Math.floor(e3 / 7) + 2, r2 = t2(e3), i2 = r2 === 145 ? 26 : Math.ceil((r2 - 13) / (2 * n2 - 2)) * 2, a2 = [r2 - 7];
    for (let e4 = 1; e4 < n2 - 1; e4++) a2[e4] = a2[e4 - 1] - i2;
    return a2.push(6), a2.reverse();
  }, e2.getPositions = function(t3) {
    let n2 = [], r2 = e2.getRowColCoords(t3), i2 = r2.length;
    for (let e3 = 0; e3 < i2; e3++) for (let t4 = 0; t4 < i2; t4++) e3 === 0 && t4 === 0 || e3 === 0 && t4 === i2 - 1 || e3 === i2 - 1 && t4 === 0 || n2.push([r2[e3], r2[t4]]);
    return n2;
  };
}));
var s = e(((e2) => {
  var t2 = n().getSymbolSize, r2 = 7;
  e2.getPositions = function(e3) {
    let n2 = t2(e3);
    return [[0, 0], [n2 - r2, 0], [0, n2 - r2]];
  };
}));
var c = e(((e2) => {
  e2.Patterns = { PATTERN000: 0, PATTERN001: 1, PATTERN010: 2, PATTERN011: 3, PATTERN100: 4, PATTERN101: 5, PATTERN110: 6, PATTERN111: 7 };
  var t2 = { N1: 3, N2: 3, N3: 40, N4: 10 };
  e2.isValid = function(e3) {
    return e3 != null && e3 !== "" && !isNaN(e3) && e3 >= 0 && e3 <= 7;
  }, e2.from = function(t3) {
    return e2.isValid(t3) ? parseInt(t3, 10) : void 0;
  }, e2.getPenaltyN1 = function(e3) {
    let n3 = e3.size, r2 = 0, i2 = 0, a2 = 0, o2 = null, s2 = null;
    for (let c2 = 0; c2 < n3; c2++) {
      i2 = a2 = 0, o2 = s2 = null;
      for (let l2 = 0; l2 < n3; l2++) {
        let n4 = e3.get(c2, l2);
        n4 === o2 ? i2++ : (i2 >= 5 && (r2 += t2.N1 + (i2 - 5)), o2 = n4, i2 = 1), n4 = e3.get(l2, c2), n4 === s2 ? a2++ : (a2 >= 5 && (r2 += t2.N1 + (a2 - 5)), s2 = n4, a2 = 1);
      }
      i2 >= 5 && (r2 += t2.N1 + (i2 - 5)), a2 >= 5 && (r2 += t2.N1 + (a2 - 5));
    }
    return r2;
  }, e2.getPenaltyN2 = function(e3) {
    let n3 = e3.size, r2 = 0;
    for (let t3 = 0; t3 < n3 - 1; t3++) for (let i2 = 0; i2 < n3 - 1; i2++) {
      let n4 = e3.get(t3, i2) + e3.get(t3, i2 + 1) + e3.get(t3 + 1, i2) + e3.get(t3 + 1, i2 + 1);
      (n4 === 4 || n4 === 0) && r2++;
    }
    return r2 * t2.N2;
  }, e2.getPenaltyN3 = function(e3) {
    let n3 = e3.size, r2 = 0, i2 = 0, a2 = 0;
    for (let t3 = 0; t3 < n3; t3++) {
      i2 = a2 = 0;
      for (let o2 = 0; o2 < n3; o2++) i2 = i2 << 1 & 2047 | e3.get(t3, o2), o2 >= 10 && (i2 === 1488 || i2 === 93) && r2++, a2 = a2 << 1 & 2047 | e3.get(o2, t3), o2 >= 10 && (a2 === 1488 || a2 === 93) && r2++;
    }
    return r2 * t2.N3;
  }, e2.getPenaltyN4 = function(e3) {
    let n3 = 0, r2 = e3.data.length;
    for (let t3 = 0; t3 < r2; t3++) n3 += e3.data[t3];
    return Math.abs(Math.ceil(n3 * 100 / r2 / 5) - 10) * t2.N4;
  };
  function n2(t3, n3, r2) {
    switch (t3) {
      case e2.Patterns.PATTERN000:
        return (n3 + r2) % 2 == 0;
      case e2.Patterns.PATTERN001:
        return n3 % 2 == 0;
      case e2.Patterns.PATTERN010:
        return r2 % 3 == 0;
      case e2.Patterns.PATTERN011:
        return (n3 + r2) % 3 == 0;
      case e2.Patterns.PATTERN100:
        return (Math.floor(n3 / 2) + Math.floor(r2 / 3)) % 2 == 0;
      case e2.Patterns.PATTERN101:
        return n3 * r2 % 2 + n3 * r2 % 3 == 0;
      case e2.Patterns.PATTERN110:
        return (n3 * r2 % 2 + n3 * r2 % 3) % 2 == 0;
      case e2.Patterns.PATTERN111:
        return (n3 * r2 % 3 + (n3 + r2) % 2) % 2 == 0;
      default:
        throw Error("bad maskPattern:" + t3);
    }
  }
  e2.applyMask = function(e3, t3) {
    let r2 = t3.size;
    for (let i2 = 0; i2 < r2; i2++) for (let a2 = 0; a2 < r2; a2++) t3.isReserved(a2, i2) || t3.xor(a2, i2, n2(e3, a2, i2));
  }, e2.getBestMask = function(t3, n3) {
    let r2 = Object.keys(e2.Patterns).length, i2 = 0, a2 = 1 / 0;
    for (let o2 = 0; o2 < r2; o2++) {
      n3(o2), e2.applyMask(o2, t3);
      let r3 = e2.getPenaltyN1(t3) + e2.getPenaltyN2(t3) + e2.getPenaltyN3(t3) + e2.getPenaltyN4(t3);
      e2.applyMask(o2, t3), r3 < a2 && (a2 = r3, i2 = o2);
    }
    return i2;
  };
}));
var l = e(((e2) => {
  var t2 = r(), n2 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2, 2, 4, 1, 2, 4, 4, 2, 4, 4, 4, 2, 4, 6, 5, 2, 4, 6, 6, 2, 5, 8, 8, 4, 5, 8, 8, 4, 5, 8, 11, 4, 8, 10, 11, 4, 9, 12, 16, 4, 9, 16, 16, 6, 10, 12, 18, 6, 10, 17, 16, 6, 11, 16, 19, 6, 13, 18, 21, 7, 14, 21, 25, 8, 16, 20, 25, 8, 17, 23, 25, 9, 17, 23, 34, 9, 18, 25, 30, 10, 20, 27, 32, 12, 21, 29, 35, 12, 23, 34, 37, 12, 25, 34, 40, 13, 26, 35, 42, 14, 28, 38, 45, 15, 29, 40, 48, 16, 31, 43, 51, 17, 33, 45, 54, 18, 35, 48, 57, 19, 37, 51, 60, 19, 38, 53, 63, 20, 40, 56, 66, 21, 43, 59, 70, 22, 45, 62, 74, 24, 47, 65, 77, 25, 49, 68, 81], i2 = [7, 10, 13, 17, 10, 16, 22, 28, 15, 26, 36, 44, 20, 36, 52, 64, 26, 48, 72, 88, 36, 64, 96, 112, 40, 72, 108, 130, 48, 88, 132, 156, 60, 110, 160, 192, 72, 130, 192, 224, 80, 150, 224, 264, 96, 176, 260, 308, 104, 198, 288, 352, 120, 216, 320, 384, 132, 240, 360, 432, 144, 280, 408, 480, 168, 308, 448, 532, 180, 338, 504, 588, 196, 364, 546, 650, 224, 416, 600, 700, 224, 442, 644, 750, 252, 476, 690, 816, 270, 504, 750, 900, 300, 560, 810, 960, 312, 588, 870, 1050, 336, 644, 952, 1110, 360, 700, 1020, 1200, 390, 728, 1050, 1260, 420, 784, 1140, 1350, 450, 812, 1200, 1440, 480, 868, 1290, 1530, 510, 924, 1350, 1620, 540, 980, 1440, 1710, 570, 1036, 1530, 1800, 570, 1064, 1590, 1890, 600, 1120, 1680, 1980, 630, 1204, 1770, 2100, 660, 1260, 1860, 2220, 720, 1316, 1950, 2310, 750, 1372, 2040, 2430];
  e2.getBlocksCount = function(e3, r2) {
    switch (r2) {
      case t2.L:
        return n2[(e3 - 1) * 4 + 0];
      case t2.M:
        return n2[(e3 - 1) * 4 + 1];
      case t2.Q:
        return n2[(e3 - 1) * 4 + 2];
      case t2.H:
        return n2[(e3 - 1) * 4 + 3];
      default:
        return;
    }
  }, e2.getTotalCodewordsCount = function(e3, n3) {
    switch (n3) {
      case t2.L:
        return i2[(e3 - 1) * 4 + 0];
      case t2.M:
        return i2[(e3 - 1) * 4 + 1];
      case t2.Q:
        return i2[(e3 - 1) * 4 + 2];
      case t2.H:
        return i2[(e3 - 1) * 4 + 3];
      default:
        return;
    }
  };
}));
var u = e(((e2) => {
  var t2 = new Uint8Array(512), n2 = new Uint8Array(256);
  (function() {
    let e3 = 1;
    for (let r2 = 0; r2 < 255; r2++) t2[r2] = e3, n2[e3] = r2, e3 <<= 1, e3 & 256 && (e3 ^= 285);
    for (let e4 = 255; e4 < 512; e4++) t2[e4] = t2[e4 - 255];
  })(), e2.log = function(e3) {
    if (e3 < 1) throw Error("log(" + e3 + ")");
    return n2[e3];
  }, e2.exp = function(e3) {
    return t2[e3];
  }, e2.mul = function(e3, r2) {
    return e3 === 0 || r2 === 0 ? 0 : t2[n2[e3] + n2[r2]];
  };
}));
var d = e(((e2) => {
  var t2 = u();
  e2.mul = function(e3, n2) {
    let r2 = new Uint8Array(e3.length + n2.length - 1);
    for (let i2 = 0; i2 < e3.length; i2++) for (let a2 = 0; a2 < n2.length; a2++) r2[i2 + a2] ^= t2.mul(e3[i2], n2[a2]);
    return r2;
  }, e2.mod = function(e3, n2) {
    let r2 = new Uint8Array(e3);
    for (; r2.length - n2.length >= 0; ) {
      let e4 = r2[0];
      for (let i3 = 0; i3 < n2.length; i3++) r2[i3] ^= t2.mul(n2[i3], e4);
      let i2 = 0;
      for (; i2 < r2.length && r2[i2] === 0; ) i2++;
      r2 = r2.slice(i2);
    }
    return r2;
  }, e2.generateECPolynomial = function(n2) {
    let r2 = new Uint8Array([1]);
    for (let i2 = 0; i2 < n2; i2++) r2 = e2.mul(r2, new Uint8Array([1, t2.exp(i2)]));
    return r2;
  };
}));
var f = e(((e2, t2) => {
  var n2 = d();
  function r2(e3) {
    this.genPoly = void 0, this.degree = e3, this.degree && this.initialize(this.degree);
  }
  r2.prototype.initialize = function(e3) {
    this.degree = e3, this.genPoly = n2.generateECPolynomial(this.degree);
  }, r2.prototype.encode = function(e3) {
    if (!this.genPoly) throw Error("Encoder not initialized");
    let t3 = new Uint8Array(e3.length + this.degree);
    t3.set(e3);
    let r3 = n2.mod(t3, this.genPoly), i2 = this.degree - r3.length;
    if (i2 > 0) {
      let e4 = new Uint8Array(this.degree);
      return e4.set(r3, i2), e4;
    }
    return r3;
  }, t2.exports = r2;
}));
var p = e(((e2) => {
  e2.isValid = function(e3) {
    return !isNaN(e3) && e3 >= 1 && e3 <= 40;
  };
}));
var m = e(((e2) => {
  var t2 = "[0-9]+", n2 = "[A-Z $%*+\\-./:]+", r2 = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
  r2 = r2.replace(/u/g, "\\u");
  var i2 = "(?:(?![A-Z0-9 $%*+\\-./:]|" + r2 + `)(?:.|[\r
]))+`;
  e2.KANJI = new RegExp(r2, "g"), e2.BYTE_KANJI = RegExp("[^A-Z0-9 $%*+\\-./:]+", "g"), e2.BYTE = new RegExp(i2, "g"), e2.NUMERIC = new RegExp(t2, "g"), e2.ALPHANUMERIC = new RegExp(n2, "g");
  var a2 = RegExp("^" + r2 + "$"), o2 = RegExp("^[0-9]+$"), s2 = RegExp("^[A-Z0-9 $%*+\\-./:]+$");
  e2.testKanji = function(e3) {
    return a2.test(e3);
  }, e2.testNumeric = function(e3) {
    return o2.test(e3);
  }, e2.testAlphanumeric = function(e3) {
    return s2.test(e3);
  };
}));
var h = e(((e2) => {
  var t2 = p(), n2 = m();
  e2.NUMERIC = { id: "Numeric", bit: 1, ccBits: [10, 12, 14] }, e2.ALPHANUMERIC = { id: "Alphanumeric", bit: 2, ccBits: [9, 11, 13] }, e2.BYTE = { id: "Byte", bit: 4, ccBits: [8, 16, 16] }, e2.KANJI = { id: "Kanji", bit: 8, ccBits: [8, 10, 12] }, e2.MIXED = { bit: -1 }, e2.getCharCountIndicator = function(e3, n3) {
    if (!e3.ccBits) throw Error("Invalid mode: " + e3);
    if (!t2.isValid(n3)) throw Error("Invalid version: " + n3);
    return n3 >= 1 && n3 < 10 ? e3.ccBits[0] : n3 < 27 ? e3.ccBits[1] : e3.ccBits[2];
  }, e2.getBestModeForData = function(t3) {
    return n2.testNumeric(t3) ? e2.NUMERIC : n2.testAlphanumeric(t3) ? e2.ALPHANUMERIC : n2.testKanji(t3) ? e2.KANJI : e2.BYTE;
  }, e2.toString = function(e3) {
    if (e3 && e3.id) return e3.id;
    throw Error("Invalid mode");
  }, e2.isValid = function(e3) {
    return e3 && e3.bit && e3.ccBits;
  };
  function r2(t3) {
    if (typeof t3 != "string") throw Error("Param is not a string");
    switch (t3.toLowerCase()) {
      case "numeric":
        return e2.NUMERIC;
      case "alphanumeric":
        return e2.ALPHANUMERIC;
      case "kanji":
        return e2.KANJI;
      case "byte":
        return e2.BYTE;
      default:
        throw Error("Unknown mode: " + t3);
    }
  }
  e2.from = function(t3, n3) {
    if (e2.isValid(t3)) return t3;
    try {
      return r2(t3);
    } catch {
      return n3;
    }
  };
}));
var g = e(((e2) => {
  var t2 = n(), i2 = l(), a2 = r(), o2 = h(), s2 = p(), c2 = 7973, u2 = t2.getBCHDigit(c2);
  function d2(t3, n2, r2) {
    for (let i3 = 1; i3 <= 40; i3++) if (n2 <= e2.getCapacity(i3, r2, t3)) return i3;
  }
  function f2(e3, t3) {
    return o2.getCharCountIndicator(e3, t3) + 4;
  }
  function m2(e3, t3) {
    let n2 = 0;
    return e3.forEach(function(e4) {
      let r2 = f2(e4.mode, t3);
      n2 += r2 + e4.getBitsLength();
    }), n2;
  }
  function g2(t3, n2) {
    for (let r2 = 1; r2 <= 40; r2++) if (m2(t3, r2) <= e2.getCapacity(r2, n2, o2.MIXED)) return r2;
  }
  e2.from = function(e3, t3) {
    return s2.isValid(e3) ? parseInt(e3, 10) : t3;
  }, e2.getCapacity = function(e3, n2, r2) {
    if (!s2.isValid(e3)) throw Error("Invalid QR Code version");
    r2 === void 0 && (r2 = o2.BYTE);
    let a3 = (t2.getSymbolTotalCodewords(e3) - i2.getTotalCodewordsCount(e3, n2)) * 8;
    if (r2 === o2.MIXED) return a3;
    let c3 = a3 - f2(r2, e3);
    switch (r2) {
      case o2.NUMERIC:
        return Math.floor(c3 / 10 * 3);
      case o2.ALPHANUMERIC:
        return Math.floor(c3 / 11 * 2);
      case o2.KANJI:
        return Math.floor(c3 / 13);
      case o2.BYTE:
      default:
        return Math.floor(c3 / 8);
    }
  }, e2.getBestVersionForData = function(e3, t3) {
    let n2, r2 = a2.from(t3, a2.M);
    if (Array.isArray(e3)) {
      if (e3.length > 1) return g2(e3, r2);
      if (e3.length === 0) return 1;
      n2 = e3[0];
    } else n2 = e3;
    return d2(n2.mode, n2.getLength(), r2);
  }, e2.getEncodedBits = function(e3) {
    if (!s2.isValid(e3) || e3 < 7) throw Error("Invalid QR Code version");
    let n2 = e3 << 12;
    for (; t2.getBCHDigit(n2) - u2 >= 0; ) n2 ^= c2 << t2.getBCHDigit(n2) - u2;
    return e3 << 12 | n2;
  };
}));
var _ = e(((e2) => {
  var t2 = n(), r2 = 1335, i2 = 21522, a2 = t2.getBCHDigit(r2);
  e2.getEncodedBits = function(e3, n2) {
    let o2 = e3.bit << 3 | n2, s2 = o2 << 10;
    for (; t2.getBCHDigit(s2) - a2 >= 0; ) s2 ^= r2 << t2.getBCHDigit(s2) - a2;
    return (o2 << 10 | s2) ^ i2;
  };
}));
var v = e(((e2, t2) => {
  var n2 = h();
  function r2(e3) {
    this.mode = n2.NUMERIC, this.data = e3.toString();
  }
  r2.getBitsLength = function(e3) {
    return 10 * Math.floor(e3 / 3) + (e3 % 3 ? e3 % 3 * 3 + 1 : 0);
  }, r2.prototype.getLength = function() {
    return this.data.length;
  }, r2.prototype.getBitsLength = function() {
    return r2.getBitsLength(this.data.length);
  }, r2.prototype.write = function(e3) {
    let t3, n3, r3;
    for (t3 = 0; t3 + 3 <= this.data.length; t3 += 3) n3 = this.data.substr(t3, 3), r3 = parseInt(n3, 10), e3.put(r3, 10);
    let i2 = this.data.length - t3;
    i2 > 0 && (n3 = this.data.substr(t3), r3 = parseInt(n3, 10), e3.put(r3, i2 * 3 + 1));
  }, t2.exports = r2;
}));
var y = e(((e2, t2) => {
  var n2 = h(), r2 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:".split("");
  function i2(e3) {
    this.mode = n2.ALPHANUMERIC, this.data = e3;
  }
  i2.getBitsLength = function(e3) {
    return 11 * Math.floor(e3 / 2) + e3 % 2 * 6;
  }, i2.prototype.getLength = function() {
    return this.data.length;
  }, i2.prototype.getBitsLength = function() {
    return i2.getBitsLength(this.data.length);
  }, i2.prototype.write = function(e3) {
    let t3 = 0;
    for (; t3 + 2 <= this.data.length; t3 += 2) {
      let n3 = r2.indexOf(this.data[t3]) * 45;
      n3 += r2.indexOf(this.data[t3 + 1]), e3.put(n3, 11);
    }
    this.data.length % 2 && e3.put(r2.indexOf(this.data[t3]), 6);
  }, t2.exports = i2;
}));
var b = e(((e2, t2) => {
  var n2 = h();
  function r2(e3) {
    this.mode = n2.BYTE, this.data = typeof e3 == "string" ? new TextEncoder().encode(e3) : new Uint8Array(e3);
  }
  r2.getBitsLength = function(e3) {
    return e3 * 8;
  }, r2.prototype.getLength = function() {
    return this.data.length;
  }, r2.prototype.getBitsLength = function() {
    return r2.getBitsLength(this.data.length);
  }, r2.prototype.write = function(e3) {
    for (let t3 = 0, n3 = this.data.length; t3 < n3; t3++) e3.put(this.data[t3], 8);
  }, t2.exports = r2;
}));
var x = e(((e2, t2) => {
  var r2 = h(), i2 = n();
  function a2(e3) {
    this.mode = r2.KANJI, this.data = e3;
  }
  a2.getBitsLength = function(e3) {
    return e3 * 13;
  }, a2.prototype.getLength = function() {
    return this.data.length;
  }, a2.prototype.getBitsLength = function() {
    return a2.getBitsLength(this.data.length);
  }, a2.prototype.write = function(e3) {
    let t3 = 0;
    for (; t3 < this.data.length; t3++) {
      let n2 = i2.toSJIS(this.data[t3]);
      if (n2 >= 33088 && n2 <= 40956) n2 -= 33088;
      else if (n2 >= 57408 && n2 <= 60351) n2 -= 49472;
      else throw Error("Invalid SJIS character: " + this.data[t3] + `
Make sure your charset is UTF-8`);
      n2 = (n2 >>> 8 & 255) * 192 + (n2 & 255), e3.put(n2, 13);
    }
  }, t2.exports = a2;
}));
var S = e(((e2, t2) => {
  var n2 = { single_source_shortest_paths: function(e3, t3, r2) {
    var i2 = {}, a2 = {};
    a2[t3] = 0;
    var o2 = n2.PriorityQueue.make();
    o2.push(t3, 0);
    for (var s2, c2, l2, u2, d2, f2, p2, m2, h2; !o2.empty(); ) for (l2 in s2 = o2.pop(), c2 = s2.value, u2 = s2.cost, d2 = e3[c2] || {}, d2) d2.hasOwnProperty(l2) && (f2 = d2[l2], p2 = u2 + f2, m2 = a2[l2], h2 = a2[l2] === void 0, (h2 || m2 > p2) && (a2[l2] = p2, o2.push(l2, p2), i2[l2] = c2));
    if (r2 !== void 0 && a2[r2] === void 0) {
      var g2 = ["Could not find a path from ", t3, " to ", r2, "."].join("");
      throw Error(g2);
    }
    return i2;
  }, extract_shortest_path_from_predecessor_list: function(e3, t3) {
    for (var n3 = [], r2 = t3; r2; ) n3.push(r2), e3[r2], r2 = e3[r2];
    return n3.reverse(), n3;
  }, find_path: function(e3, t3, r2) {
    var i2 = n2.single_source_shortest_paths(e3, t3, r2);
    return n2.extract_shortest_path_from_predecessor_list(i2, r2);
  }, PriorityQueue: { make: function(e3) {
    var t3 = n2.PriorityQueue, r2 = {}, i2;
    for (i2 in e3 ||= {}, t3) t3.hasOwnProperty(i2) && (r2[i2] = t3[i2]);
    return r2.queue = [], r2.sorter = e3.sorter || t3.default_sorter, r2;
  }, default_sorter: function(e3, t3) {
    return e3.cost - t3.cost;
  }, push: function(e3, t3) {
    var n3 = { value: e3, cost: t3 };
    this.queue.push(n3), this.queue.sort(this.sorter);
  }, pop: function() {
    return this.queue.shift();
  }, empty: function() {
    return this.queue.length === 0;
  } } };
  t2 !== void 0 && (t2.exports = n2);
}));
var C = e(((e2) => {
  var t2 = h(), r2 = v(), i2 = y(), a2 = b(), o2 = x(), s2 = m(), c2 = n(), l2 = S();
  function u2(e3) {
    return unescape(encodeURIComponent(e3)).length;
  }
  function d2(e3, t3, n2) {
    let r3 = [], i3;
    for (; (i3 = e3.exec(n2)) !== null; ) r3.push({ data: i3[0], index: i3.index, mode: t3, length: i3[0].length });
    return r3;
  }
  function f2(e3) {
    let n2 = d2(s2.NUMERIC, t2.NUMERIC, e3), r3 = d2(s2.ALPHANUMERIC, t2.ALPHANUMERIC, e3), i3, a3;
    return c2.isKanjiModeEnabled() ? (i3 = d2(s2.BYTE, t2.BYTE, e3), a3 = d2(s2.KANJI, t2.KANJI, e3)) : (i3 = d2(s2.BYTE_KANJI, t2.BYTE, e3), a3 = []), n2.concat(r3, i3, a3).sort(function(e4, t3) {
      return e4.index - t3.index;
    }).map(function(e4) {
      return { data: e4.data, mode: e4.mode, length: e4.length };
    });
  }
  function p2(e3, n2) {
    switch (n2) {
      case t2.NUMERIC:
        return r2.getBitsLength(e3);
      case t2.ALPHANUMERIC:
        return i2.getBitsLength(e3);
      case t2.KANJI:
        return o2.getBitsLength(e3);
      case t2.BYTE:
        return a2.getBitsLength(e3);
    }
  }
  function g2(e3) {
    return e3.reduce(function(e4, t3) {
      let n2 = e4.length - 1 >= 0 ? e4[e4.length - 1] : null;
      return n2 && n2.mode === t3.mode ? (e4[e4.length - 1].data += t3.data, e4) : (e4.push(t3), e4);
    }, []);
  }
  function _2(e3) {
    let n2 = [];
    for (let r3 = 0; r3 < e3.length; r3++) {
      let i3 = e3[r3];
      switch (i3.mode) {
        case t2.NUMERIC:
          n2.push([i3, { data: i3.data, mode: t2.ALPHANUMERIC, length: i3.length }, { data: i3.data, mode: t2.BYTE, length: i3.length }]);
          break;
        case t2.ALPHANUMERIC:
          n2.push([i3, { data: i3.data, mode: t2.BYTE, length: i3.length }]);
          break;
        case t2.KANJI:
          n2.push([i3, { data: i3.data, mode: t2.BYTE, length: u2(i3.data) }]);
          break;
        case t2.BYTE:
          n2.push([{ data: i3.data, mode: t2.BYTE, length: u2(i3.data) }]);
      }
    }
    return n2;
  }
  function C2(e3, n2) {
    let r3 = {}, i3 = { start: {} }, a3 = ["start"];
    for (let o3 = 0; o3 < e3.length; o3++) {
      let s3 = e3[o3], c3 = [];
      for (let e4 = 0; e4 < s3.length; e4++) {
        let l3 = s3[e4], u3 = "" + o3 + e4;
        c3.push(u3), r3[u3] = { node: l3, lastCount: 0 }, i3[u3] = {};
        for (let e5 = 0; e5 < a3.length; e5++) {
          let o4 = a3[e5];
          r3[o4] && r3[o4].node.mode === l3.mode ? (i3[o4][u3] = p2(r3[o4].lastCount + l3.length, l3.mode) - p2(r3[o4].lastCount, l3.mode), r3[o4].lastCount += l3.length) : (r3[o4] && (r3[o4].lastCount = l3.length), i3[o4][u3] = p2(l3.length, l3.mode) + 4 + t2.getCharCountIndicator(l3.mode, n2));
        }
      }
      a3 = c3;
    }
    for (let e4 = 0; e4 < a3.length; e4++) i3[a3[e4]].end = 0;
    return { map: i3, table: r3 };
  }
  function w2(e3, n2) {
    let s3, l3 = t2.getBestModeForData(e3);
    if (s3 = t2.from(n2, l3), s3 !== t2.BYTE && s3.bit < l3.bit) throw Error('"' + e3 + '" cannot be encoded with mode ' + t2.toString(s3) + `.
 Suggested mode is: ` + t2.toString(l3));
    switch (s3 === t2.KANJI && !c2.isKanjiModeEnabled() && (s3 = t2.BYTE), s3) {
      case t2.NUMERIC:
        return new r2(e3);
      case t2.ALPHANUMERIC:
        return new i2(e3);
      case t2.KANJI:
        return new o2(e3);
      case t2.BYTE:
        return new a2(e3);
    }
  }
  e2.fromArray = function(e3) {
    return e3.reduce(function(e4, t3) {
      return typeof t3 == "string" ? e4.push(w2(t3, null)) : t3.data && e4.push(w2(t3.data, t3.mode)), e4;
    }, []);
  }, e2.fromString = function(t3, n2) {
    let r3 = C2(_2(f2(t3, c2.isKanjiModeEnabled())), n2), i3 = l2.find_path(r3.map, "start", "end"), a3 = [];
    for (let e3 = 1; e3 < i3.length - 1; e3++) a3.push(r3.table[i3[e3]].node);
    return e2.fromArray(g2(a3));
  }, e2.rawSplit = function(t3) {
    return e2.fromArray(f2(t3, c2.isKanjiModeEnabled()));
  };
}));
var w = e(((e2) => {
  var t2 = n(), u2 = r(), d2 = i(), p2 = a(), m2 = o(), v2 = s(), y2 = c(), b2 = l(), x2 = f(), S2 = g(), w2 = _(), T2 = h(), E2 = C();
  function D2(e3, t3) {
    let n2 = e3.size, r2 = v2.getPositions(t3);
    for (let t4 = 0; t4 < r2.length; t4++) {
      let i2 = r2[t4][0], a2 = r2[t4][1];
      for (let t5 = -1; t5 <= 7; t5++) if (!(i2 + t5 <= -1 || n2 <= i2 + t5)) for (let r3 = -1; r3 <= 7; r3++) a2 + r3 <= -1 || n2 <= a2 + r3 || (t5 >= 0 && t5 <= 6 && (r3 === 0 || r3 === 6) || r3 >= 0 && r3 <= 6 && (t5 === 0 || t5 === 6) || t5 >= 2 && t5 <= 4 && r3 >= 2 && r3 <= 4 ? e3.set(i2 + t5, a2 + r3, !0, !0) : e3.set(i2 + t5, a2 + r3, !1, !0));
    }
  }
  function O2(e3) {
    let t3 = e3.size;
    for (let n2 = 8; n2 < t3 - 8; n2++) {
      let t4 = n2 % 2 == 0;
      e3.set(n2, 6, t4, !0), e3.set(6, n2, t4, !0);
    }
  }
  function k(e3, t3) {
    let n2 = m2.getPositions(t3);
    for (let t4 = 0; t4 < n2.length; t4++) {
      let r2 = n2[t4][0], i2 = n2[t4][1];
      for (let t5 = -2; t5 <= 2; t5++) for (let n3 = -2; n3 <= 2; n3++) t5 === -2 || t5 === 2 || n3 === -2 || n3 === 2 || t5 === 0 && n3 === 0 ? e3.set(r2 + t5, i2 + n3, !0, !0) : e3.set(r2 + t5, i2 + n3, !1, !0);
    }
  }
  function A(e3, t3) {
    let n2 = e3.size, r2 = S2.getEncodedBits(t3), i2, a2, o2;
    for (let t4 = 0; t4 < 18; t4++) i2 = Math.floor(t4 / 3), a2 = t4 % 3 + n2 - 8 - 3, o2 = (r2 >> t4 & 1) == 1, e3.set(i2, a2, o2, !0), e3.set(a2, i2, o2, !0);
  }
  function j(e3, t3, n2) {
    let r2 = e3.size, i2 = w2.getEncodedBits(t3, n2), a2, o2;
    for (a2 = 0; a2 < 15; a2++) o2 = (i2 >> a2 & 1) == 1, a2 < 6 ? e3.set(a2, 8, o2, !0) : a2 < 8 ? e3.set(a2 + 1, 8, o2, !0) : e3.set(r2 - 15 + a2, 8, o2, !0), a2 < 8 ? e3.set(8, r2 - a2 - 1, o2, !0) : a2 < 9 ? e3.set(8, 15 - a2 - 1 + 1, o2, !0) : e3.set(8, 15 - a2 - 1, o2, !0);
    e3.set(r2 - 8, 8, 1, !0);
  }
  function M(e3, t3) {
    let n2 = e3.size, r2 = -1, i2 = n2 - 1, a2 = 7, o2 = 0;
    for (let s2 = n2 - 1; s2 > 0; s2 -= 2) for (s2 === 6 && s2--; ; ) {
      for (let n3 = 0; n3 < 2; n3++) if (!e3.isReserved(i2, s2 - n3)) {
        let r3 = !1;
        o2 < t3.length && (r3 = (t3[o2] >>> a2 & 1) == 1), e3.set(i2, s2 - n3, r3), a2--, a2 === -1 && (o2++, a2 = 7);
      }
      if (i2 += r2, i2 < 0 || n2 <= i2) {
        i2 -= r2, r2 = -r2;
        break;
      }
    }
  }
  function N(e3, n2, r2) {
    let i2 = new d2();
    r2.forEach(function(t3) {
      i2.put(t3.mode.bit, 4), i2.put(t3.getLength(), T2.getCharCountIndicator(t3.mode, e3)), t3.write(i2);
    });
    let a2 = (t2.getSymbolTotalCodewords(e3) - b2.getTotalCodewordsCount(e3, n2)) * 8;
    for (i2.getLengthInBits() + 4 <= a2 && i2.put(0, 4); i2.getLengthInBits() % 8 != 0; ) i2.putBit(0);
    let o2 = (a2 - i2.getLengthInBits()) / 8;
    for (let e4 = 0; e4 < o2; e4++) i2.put(e4 % 2 ? 17 : 236, 8);
    return P(i2, e3, n2);
  }
  function P(e3, n2, r2) {
    let i2 = t2.getSymbolTotalCodewords(n2), a2 = i2 - b2.getTotalCodewordsCount(n2, r2), o2 = b2.getBlocksCount(n2, r2), s2 = o2 - i2 % o2, c2 = Math.floor(i2 / o2), l2 = Math.floor(a2 / o2), u3 = l2 + 1, d3 = c2 - l2, f2 = new x2(d3), p3 = 0, m3 = Array(o2), h2 = Array(o2), g2 = 0, _2 = new Uint8Array(e3.buffer);
    for (let e4 = 0; e4 < o2; e4++) {
      let t3 = e4 < s2 ? l2 : u3;
      m3[e4] = _2.slice(p3, p3 + t3), h2[e4] = f2.encode(m3[e4]), p3 += t3, g2 = Math.max(g2, t3);
    }
    let v3 = new Uint8Array(i2), y3 = 0, S3, C2;
    for (S3 = 0; S3 < g2; S3++) for (C2 = 0; C2 < o2; C2++) S3 < m3[C2].length && (v3[y3++] = m3[C2][S3]);
    for (S3 = 0; S3 < d3; S3++) for (C2 = 0; C2 < o2; C2++) v3[y3++] = h2[C2][S3];
    return v3;
  }
  function F(e3, n2, r2, i2) {
    let a2;
    if (Array.isArray(e3)) a2 = E2.fromArray(e3);
    else if (typeof e3 == "string") {
      let t3 = n2;
      if (!t3) {
        let n3 = E2.rawSplit(e3);
        t3 = S2.getBestVersionForData(n3, r2);
      }
      a2 = E2.fromString(e3, t3 || 40);
    } else throw Error("Invalid data");
    let o2 = S2.getBestVersionForData(a2, r2);
    if (!o2) throw Error("The amount of data is too big to be stored in a QR Code");
    if (!n2) n2 = o2;
    else if (n2 < o2) throw Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: ` + o2 + `.
`);
    let s2 = N(n2, r2, a2), c2 = new p2(t2.getSymbolSize(n2));
    return D2(c2, n2), O2(c2), k(c2, n2), j(c2, r2, 0), n2 >= 7 && A(c2, n2), M(c2, s2), isNaN(i2) && (i2 = y2.getBestMask(c2, j.bind(null, c2, r2))), y2.applyMask(i2, c2), j(c2, r2, i2), { modules: c2, version: n2, errorCorrectionLevel: r2, maskPattern: i2, segments: a2 };
  }
  e2.create = function(e3, n2) {
    if (e3 === void 0 || e3 === "") throw Error("No input text");
    let r2 = u2.M, i2, a2;
    return n2 !== void 0 && (r2 = u2.from(n2.errorCorrectionLevel, u2.M), i2 = S2.from(n2.version), a2 = y2.from(n2.maskPattern), n2.toSJISFunc && t2.setToSJISFunction(n2.toSJISFunc)), F(e3, i2, r2, a2);
  };
}));
var T = e(((e2) => {
  function t2(e3) {
    if (typeof e3 == "number" && (e3 = e3.toString()), typeof e3 != "string") throw Error("Color should be defined as hex string");
    let t3 = e3.slice().replace("#", "").split("");
    if (t3.length < 3 || t3.length === 5 || t3.length > 8) throw Error("Invalid hex color: " + e3);
    (t3.length === 3 || t3.length === 4) && (t3 = Array.prototype.concat.apply([], t3.map(function(e4) {
      return [e4, e4];
    }))), t3.length === 6 && t3.push("F", "F");
    let n2 = parseInt(t3.join(""), 16);
    return { r: n2 >> 24 & 255, g: n2 >> 16 & 255, b: n2 >> 8 & 255, a: n2 & 255, hex: "#" + t3.slice(0, 6).join("") };
  }
  e2.getOptions = function(e3) {
    e3 ||= {}, e3.color || (e3.color = {});
    let n2 = e3.margin === void 0 || e3.margin === null || e3.margin < 0 ? 4 : e3.margin, r2 = e3.width && e3.width >= 21 ? e3.width : void 0, i2 = e3.scale || 4;
    return { width: r2, scale: r2 ? 4 : i2, margin: n2, color: { dark: t2(e3.color.dark || "#000000ff"), light: t2(e3.color.light || "#ffffffff") }, type: e3.type, rendererOpts: e3.rendererOpts || {} };
  }, e2.getScale = function(e3, t3) {
    return t3.width && t3.width >= e3 + t3.margin * 2 ? t3.width / (e3 + t3.margin * 2) : t3.scale;
  }, e2.getImageWidth = function(t3, n2) {
    let r2 = e2.getScale(t3, n2);
    return Math.floor((t3 + n2.margin * 2) * r2);
  }, e2.qrToImageData = function(t3, n2, r2) {
    let i2 = n2.modules.size, a2 = n2.modules.data, o2 = e2.getScale(i2, r2), s2 = Math.floor((i2 + r2.margin * 2) * o2), c2 = r2.margin * o2, l2 = [r2.color.light, r2.color.dark];
    for (let e3 = 0; e3 < s2; e3++) for (let n3 = 0; n3 < s2; n3++) {
      let u2 = (e3 * s2 + n3) * 4, d2 = r2.color.light;
      if (e3 >= c2 && n3 >= c2 && e3 < s2 - c2 && n3 < s2 - c2) {
        let t4 = Math.floor((e3 - c2) / o2), r3 = Math.floor((n3 - c2) / o2);
        d2 = l2[+!!a2[t4 * i2 + r3]];
      }
      t3[u2++] = d2.r, t3[u2++] = d2.g, t3[u2++] = d2.b, t3[u2] = d2.a;
    }
  };
}));
var E = e(((e2) => {
  var t2 = T();
  function n2(e3, t3, n3) {
    e3.clearRect(0, 0, t3.width, t3.height), t3.style ||= {}, t3.height = n3, t3.width = n3, t3.style.height = n3 + "px", t3.style.width = n3 + "px";
  }
  function r2() {
    try {
      return document.createElement("canvas");
    } catch {
      throw Error("You need to specify a canvas element");
    }
  }
  e2.render = function(e3, i2, a2) {
    let o2 = a2, s2 = i2;
    o2 !== void 0 || i2 && i2.getContext || (o2 = i2, i2 = void 0), i2 || (s2 = r2()), o2 = t2.getOptions(o2);
    let c2 = t2.getImageWidth(e3.modules.size, o2), l2 = s2.getContext("2d"), u2 = l2.createImageData(c2, c2);
    return t2.qrToImageData(u2.data, e3, o2), n2(l2, s2, c2), l2.putImageData(u2, 0, 0), s2;
  }, e2.renderToDataURL = function(t3, n3, r3) {
    let i2 = r3;
    i2 !== void 0 || n3 && n3.getContext || (i2 = n3, n3 = void 0), i2 ||= {};
    let a2 = e2.render(t3, n3, i2), o2 = i2.type || "image/png", s2 = i2.rendererOpts || {};
    return a2.toDataURL(o2, s2.quality);
  };
}));
var D = e(((e2) => {
  var t2 = T();
  function n2(e3, t3) {
    let n3 = e3.a / 255, r3 = t3 + '="' + e3.hex + '"';
    return n3 < 1 ? r3 + " " + t3 + '-opacity="' + n3.toFixed(2).slice(1) + '"' : r3;
  }
  function r2(e3, t3, n3) {
    let r3 = e3 + t3;
    return n3 !== void 0 && (r3 += " " + n3), r3;
  }
  function i2(e3, t3, n3) {
    let i3 = "", a2 = 0, o2 = !1, s2 = 0;
    for (let c2 = 0; c2 < e3.length; c2++) {
      let l2 = Math.floor(c2 % t3), u2 = Math.floor(c2 / t3);
      !l2 && !o2 && (o2 = !0), e3[c2] ? (s2++, c2 > 0 && l2 > 0 && e3[c2 - 1] || (i3 += o2 ? r2("M", l2 + n3, 0.5 + u2 + n3) : r2("m", a2, 0), a2 = 0, o2 = !1), l2 + 1 < t3 && e3[c2 + 1] || (i3 += r2("h", s2), s2 = 0)) : a2++;
    }
    return i3;
  }
  e2.render = function(e3, r3, a2) {
    let o2 = t2.getOptions(r3), s2 = e3.modules.size, c2 = e3.modules.data, l2 = s2 + o2.margin * 2, u2 = o2.color.light.a ? "<path " + n2(o2.color.light, "fill") + ' d="M0 0h' + l2 + "v" + l2 + 'H0z"/>' : "", d2 = "<path " + n2(o2.color.dark, "stroke") + ' d="' + i2(c2, s2, o2.margin) + '"/>', f2 = 'viewBox="0 0 ' + l2 + " " + l2 + '"', p2 = '<svg xmlns="http://www.w3.org/2000/svg" ' + (o2.width ? 'width="' + o2.width + '" height="' + o2.width + '" ' : "") + f2 + ' shape-rendering="crispEdges">' + u2 + d2 + `</svg>
`;
    return typeof a2 == "function" && a2(null, p2), p2;
  };
}));
var O = e(((e2) => {
  var n2 = t(), r2 = w(), i2 = E(), a2 = D();
  function o2(e3, t2, i3, a3, o3) {
    let s2 = [].slice.call(arguments, 1), c2 = s2.length, l2 = typeof s2[c2 - 1] == "function";
    if (!l2 && !n2()) throw Error("Callback required as last argument");
    if (l2) {
      if (c2 < 2) throw Error("Too few arguments provided");
      c2 === 2 ? (o3 = i3, i3 = t2, t2 = a3 = void 0) : c2 === 3 && (t2.getContext && o3 === void 0 ? (o3 = a3, a3 = void 0) : (o3 = a3, a3 = i3, i3 = t2, t2 = void 0));
    } else {
      if (c2 < 1) throw Error("Too few arguments provided");
      return c2 === 1 ? (i3 = t2, t2 = a3 = void 0) : c2 === 2 && !t2.getContext && (a3 = i3, i3 = t2, t2 = void 0), new Promise(function(n3, o4) {
        try {
          n3(e3(r2.create(i3, a3), t2, a3));
        } catch (e4) {
          o4(e4);
        }
      });
    }
    try {
      let n3 = r2.create(i3, a3);
      o3(null, e3(n3, t2, a3));
    } catch (e4) {
      o3(e4);
    }
  }
  e2.create = r2.create, e2.toCanvas = o2.bind(null, i2.render), e2.toDataURL = o2.bind(null, i2.renderToDataURL), e2.toString = o2.bind(null, function(e3, t2, n3) {
    return a2.render(e3, n3);
  });
}));
export {O as t};