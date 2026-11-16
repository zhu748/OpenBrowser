'use strict';

// No Node dependencies: this factory is also serialized into document/worker
// realms. Inputs have already undergone the native constructor's URL coercion.
function inlineWorkerSourceTools(NativeURL, Encoder, Decoder, Bytes, decodeBase64, engine) {
  const encoder = new Encoder(), decoder = new Decoder();
  const fromCharCode = String.fromCharCode;
  const apply = Reflect.apply, encode = Encoder.prototype.encode, decode = Decoder.prototype.decode;
  const subarray = Bytes.prototype.subarray;
  const href = Object.getOwnPropertyDescriptor(NativeURL.prototype, 'href')?.get;
  const protocol = Object.getOwnPropertyDescriptor(NativeURL.prototype, 'protocol')?.get;
  const hex = value => value >= 48 && value <= 57 ? value - 48
    : value >= 65 && value <= 70 ? value - 55 : value >= 97 && value <= 102 ? value - 87 : -1;
  const resolve = input => {
    // Gecko's Worker URL parser rejects embedded scheme controls and a
    // capitalized Blob scheme that its URL constructor would normalize.
    const trimmed = input.replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, '');
    if (engine === 'firefox' && (!/^(blob|data):/i.test(trimmed)
      || /^blob:/i.test(trimmed) && !trimmed.startsWith('blob:'))) return null;
    try {
      const parsed = new NativeURL(input);
      const scheme = protocol ? apply(protocol, parsed, []) : parsed.protocol;
      return scheme === 'blob:' || scheme === 'data:' ? (href ? apply(href, parsed, []) : parsed.href) : null;
    } catch (_) { return null; }
  };
  const readData = url => {
    const comma = url.indexOf(',');
    if (comma < 0) return null;
    let mime = url.slice(5, comma).trim();
    const body = apply(encode, encoder, [url.slice(comma + 1).split('#')[0]]);
    let bytes = new Bytes(body.length), length = 0;
    for (let i = 0; i < body.length; i++) {
      if (body[i] === 37 && i + 2 < body.length) {
        const high = hex(body[i + 1]), low = hex(body[i + 2]);
        if (high >= 0 && low >= 0) { bytes[length++] = high * 16 + low; i += 2; continue; }
      }
      bytes[length++] = body[i];
    }
    bytes = apply(subarray, bytes, [0, length]);
    if (/; *base64$/i.test(mime)) {
      mime = mime.replace(/; *base64$/i, '');
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) binary += fromCharCode(...apply(subarray, bytes, [i, i + 8192]));
      try {
        const decoded = decodeBase64(binary);
        bytes = new Bytes(decoded.length);
        for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
      } catch (_) { return null; } // Invalid data stays subject to native load errors.
    }
    // Forgiving UTF-8 decoding matches worker script fetch. decodeURIComponent
    // rejects valid programs containing malformed bytes or literal percent signs.
    return { text: apply(decode, decoder, [bytes]), mime };
  };
  return { resolve, readData };
}

module.exports = { inlineWorkerSourceTools };
