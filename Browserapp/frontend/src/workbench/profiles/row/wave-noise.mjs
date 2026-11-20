var at = 1 / 3;
var $ = 1 / 6;
var ot = (e2) => Math.floor(e2) | 0;
var st = new Float64Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
export function createWaveNoise(e2 = Math.random) {
  let t2 = lt(e2), n2 = new Float64Array(t2).map((e3) => st[e3 % 12 * 3]), r2 = new Float64Array(t2).map((e3) => st[e3 % 12 * 3 + 1]), i2 = new Float64Array(t2).map((e3) => st[e3 % 12 * 3 + 2]);
  return function(e3, a2, o2) {
    let s2, c2, l2, u2, d2 = (e3 + a2 + o2) * at, f2 = ot(e3 + d2), p2 = ot(a2 + d2), m2 = ot(o2 + d2), h2 = (f2 + p2 + m2) * $, g2 = f2 - h2, _2 = p2 - h2, v2 = m2 - h2, y2 = e3 - g2, b2 = a2 - _2, x2 = o2 - v2, S2, C2, w2, T2, E2, D2;
    y2 >= b2 ? b2 >= x2 ? (S2 = 1, C2 = 0, w2 = 0, T2 = 1, E2 = 1, D2 = 0) : y2 >= x2 ? (S2 = 1, C2 = 0, w2 = 0, T2 = 1, E2 = 0, D2 = 1) : (S2 = 0, C2 = 0, w2 = 1, T2 = 1, E2 = 0, D2 = 1) : b2 < x2 ? (S2 = 0, C2 = 0, w2 = 1, T2 = 0, E2 = 1, D2 = 1) : y2 < x2 ? (S2 = 0, C2 = 1, w2 = 0, T2 = 0, E2 = 1, D2 = 1) : (S2 = 0, C2 = 1, w2 = 0, T2 = 1, E2 = 1, D2 = 0);
    let O2 = y2 - S2 + $, k2 = b2 - C2 + $, A2 = x2 - w2 + $, j2 = y2 - T2 + 2 * $, M2 = b2 - E2 + 2 * $, N2 = x2 - D2 + 2 * $, P2 = y2 - 1 + 3 * $, F2 = b2 - 1 + 3 * $, I2 = x2 - 1 + 3 * $, L2 = f2 & 255, R2 = p2 & 255, z2 = m2 & 255, B2 = 0.6 - y2 * y2 - b2 * b2 - x2 * x2;
    if (B2 < 0) s2 = 0;
    else {
      let e4 = L2 + t2[R2 + t2[z2]];
      B2 *= B2, s2 = B2 * B2 * (n2[e4] * y2 + r2[e4] * b2 + i2[e4] * x2);
    }
    let V2 = 0.6 - O2 * O2 - k2 * k2 - A2 * A2;
    if (V2 < 0) c2 = 0;
    else {
      let e4 = L2 + S2 + t2[R2 + C2 + t2[z2 + w2]];
      V2 *= V2, c2 = V2 * V2 * (n2[e4] * O2 + r2[e4] * k2 + i2[e4] * A2);
    }
    let H2 = 0.6 - j2 * j2 - M2 * M2 - N2 * N2;
    if (H2 < 0) l2 = 0;
    else {
      let e4 = L2 + T2 + t2[R2 + E2 + t2[z2 + D2]];
      H2 *= H2, l2 = H2 * H2 * (n2[e4] * j2 + r2[e4] * M2 + i2[e4] * N2);
    }
    let U2 = 0.6 - P2 * P2 - F2 * F2 - I2 * I2;
    if (U2 < 0) u2 = 0;
    else {
      let e4 = L2 + 1 + t2[R2 + 1 + t2[z2 + 1]];
      U2 *= U2, u2 = U2 * U2 * (n2[e4] * P2 + r2[e4] * F2 + i2[e4] * I2);
    }
    return 32 * (s2 + c2 + l2 + u2);
  };
}
function lt(e2) {
  let t2 = new Uint8Array(512);
  for (let e3 = 0; e3 < 256; e3++) t2[e3] = e3;
  for (let n2 = 0; n2 < 255; n2++) {
    let r2 = n2 + ~~(e2() * (256 - n2)), i2 = t2[n2];
    t2[n2] = t2[r2], t2[r2] = i2;
  }
  for (let e3 = 256; e3 < 512; e3++) t2[e3] = t2[e3 - 256];
  return t2;
}
