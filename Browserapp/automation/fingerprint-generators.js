'use strict';

const { noiseDelta } = require('./fingerprint/noise-policy');
const { normalizeBatterySnapshot } = require('../shared/profile-values');

/**
 * Seed-derived fingerprint generators and persona data tables.
 *
 * Extracted verbatim from automation/fingerprint.js so the 9.5k-line
 * document-start monolith keeps one seam with pure, table-driven logic:
 * every value here is a deterministic function of the profile seed, so
 * buildFingerprint, buildInjectionScript and the worker variant all draw
 * from the same derivation. No CDP, no DOM, no filesystem beyond the
 * host WebGL limit probe re-exported from device-personas.
 */

const crypto = require('crypto');
const {  getHostWebglLimits } = require('./device-personas');

function hashSeed(input) {
  return crypto.createHash('sha256').update(String(input || '')).digest();
}

function u32(buf, offset = 0) {
  return buf.readUInt32BE(offset % (buf.length - 3));
}

function mulberry32(a) {
  return function next() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// WebGL vendor/renderer presets + optional GPUAdapterInfo
const WEBGL_PRESETS = {
  windows: [
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ada' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ada' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ada' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ampere' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ampere' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ampere' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'turing' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'turing' } },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'intel', architecture: 'alchemist' } },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'intel', architecture: 'gen12' } },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'intel', architecture: 'gen12' } },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'intel', architecture: 'gen9' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'amd', architecture: 'rdna-3' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'amd', architecture: 'rdna-2' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'amd', architecture: 'rdna-2' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 580 Series Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'amd', architecture: 'gcn-4' } },
    // Expanded modern GPU presets (appended so legacy profiles maintain bit-exact stability)
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ada' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ada' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ada' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ampere' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'ampere' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'nvidia', architecture: 'turing' } },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) Arc(TM) A750 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'intel', architecture: 'alchemist' } },
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'intel', architecture: 'gen9' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 7600 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'amd', architecture: 'rdna-3' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'amd', architecture: 'rdna-2' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon 780M Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'amd', architecture: 'rdna-3' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon 680M Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)', gpu: { vendor: 'amd', architecture: 'rdna-2' } },
  ],
  // Chrome switched macOS to the ANGLE Metal backend in 111, so a current build always reports
  // "ANGLE (..., ANGLE Metal Renderer: <gpu>, Unspecified Version)" - verified against a real
  // Chrome 152 on macOS here. The former "OpenGL 4.1" strings are what pre-111 builds emitted
  // and cannot come from a browser this UA claims to be. Each preset keeps the GPU it named.
  //
  // The pool is split by CPU architecture: an x86 Chrome build (Intel Mac) can never report an
  // Apple M-series GPU and an arm64 build never reports Intel/AMD - that cross-check is exactly
  // what detectors run (W2: INTEL_MAC_WITH_APPLE_SILICON_GPU).
  macos_intel: [
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, ANGLE Metal Renderer: Intel(R) Iris(TM) Plus Graphics 640, Unspecified Version)', gpu: { vendor: 'intel', architecture: 'gen9' } },
    // MacBook Pro 16" (2019) dGPU - RDNA1.
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, ANGLE Metal Renderer: AMD Radeon Pro 5500M, Unspecified Version)', gpu: { vendor: 'amd', architecture: 'rdna-1' } },
    // iMac Pro (2017) - Vega.
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, ANGLE Metal Renderer: AMD Radeon Pro Vega 56, Unspecified Version)', gpu: { vendor: 'amd', architecture: 'vega' } },
  ],
  macos_apple: [
    { vendor: 'Google Inc. (Apple)', renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)', gpu: { vendor: 'apple', architecture: 'common-3' } },
    { vendor: 'Google Inc. (Apple)', renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)', gpu: { vendor: 'apple', architecture: 'common-3' } },
    { vendor: 'Google Inc. (Apple)', renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)', gpu: { vendor: 'apple', architecture: 'common-3' } },
  ],
  // Legacy merged view kept for external consumers; webglPresetsForOs resolves by architecture.
  get macos() { return [...this.macos_intel, ...this.macos_apple]; },
  linux: [
    { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL 4.6)', gpu: { vendor: 'intel', architecture: 'gen9' } },
    { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 580 Series (RADV POLARIS10), OpenGL 4.6)', gpu: { vendor: 'amd', architecture: 'gcn-4' } },
    { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER/PCIe/SSE2, OpenGL 4.6)', gpu: { vendor: 'nvidia', architecture: 'turing' } },
  ],
  android: [
    { vendor: 'Google Inc. (Qualcomm)', renderer: 'ANGLE (Qualcomm, Adreno (TM) 740, OpenGL ES 3.2)', gpu: { vendor: 'qualcomm', architecture: 'adreno-700' } },
    { vendor: 'Google Inc. (Qualcomm)', renderer: 'ANGLE (Qualcomm, Adreno (TM) 730, OpenGL ES 3.2)', gpu: { vendor: 'qualcomm', architecture: 'adreno-700' } },
    { vendor: 'Google Inc. (ARM)', renderer: 'ANGLE (ARM, Mali-G715-Immortalis MC11, OpenGL ES 3.2)', gpu: { vendor: 'arm', architecture: 'valhall' } },
    { vendor: 'Google Inc. (ARM)', renderer: 'ANGLE (ARM, Mali-G710, OpenGL ES 3.2)', gpu: { vendor: 'arm', architecture: 'valhall' } },
    { vendor: 'Google Inc. (Samsung Electronics)', renderer: 'ANGLE (Samsung Electronics, Samsung Xclipse 920, OpenGL ES 3.2)', gpu: { vendor: 'samsung', architecture: 'rdna-2' } },
  ],
  ios: [
    { vendor: 'Apple Inc.', renderer: 'Apple GPU', gpu: { vendor: 'apple', architecture: 'common-3' } },
  ],
};

const MEDIA_DEVICE_POOLS_BY_OS = Object.freeze({
  windows: Object.freeze([
    { input: 'Microphone Array (2- Realtek High Definition Audio)', output: 'Speaker/Headphone (2- Realtek High Definition Audio)', video: 'Integrated Camera' },
    { input: 'Microphone Array (Realtek High Definition Audio)', output: 'Speaker/Headphone (Realtek High Definition Audio)', video: 'Integrated Camera' },
    { input: 'Microphone Array (Realtek(R) Audio)', output: 'Speaker (Realtek(R) Audio)', video: 'Integrated Camera' },
    { input: 'Microphone Array (Conexant SmartAudio HD)', output: 'Speaker (Conexant SmartAudio HD)', video: 'Integrated Camera' },
    { input: 'Microphone Array (2- Conexant SmartAudio HD)', output: 'Speaker (2- Conexant SmartAudio HD)', video: 'Integrated Camera' },
    { input: 'Microphone Array (Synaptics Audio)', output: 'Speaker (Synaptics Audio)', video: 'Integrated Camera' },
  ]),
  macos: Object.freeze([
    { input: 'Built-in Microphone', output: 'MacBook Pro Speakers', video: 'FaceTime HD Camera' },
    { input: 'Built-in Microphone', output: 'MacBook Air Speakers', video: 'FaceTime HD Camera' },
    { input: 'Built-in Microphone', output: 'Internal Speakers', video: 'FaceTime HD Camera' },
    { input: 'MacBook Pro Microphone', output: 'MacBook Pro Speakers', video: 'FaceTime HD Camera (Built-in)' },
  ]),
  // Desktop-class Macs (iMac / Studio / mini): no built-in mic on the mini/Studio (they
  // ship none), iMac has one; speakers exist on iMac only. Display-attached cameras are
  // the norm. A desktop persona drawing "MacBook Pro Speakers" is the audit's mismatch.
  macos_desktop: Object.freeze([
    { input: 'MacBook Pro Microphone', output: 'MacBook Pro Speakers', video: 'FaceTime HD Camera (Built-in)' },
    { input: 'Microphone (Display Audio)', output: 'Speakers (Display Audio)', video: 'FaceTime HD Camera (Studio Display)' },
    { input: 'iMac Microphone', output: 'iMac Speakers', video: 'FaceTime HD Camera' },
  ]),
  android: Object.freeze([
    { input: 'Built-in Audio', output: 'Built-in Speaker', video: 'Back Camera' },
    { input: 'Built-in Microphone', output: 'Speaker', video: 'Front Camera' },
    { input: 'Phone Microphone', output: 'Phone Speaker', video: 'Back Camera' },
    { input: 'Internal Audio Input', output: 'Internal Audio Output', video: 'Rear Camera' },
  ]),
  linux: Object.freeze([
    { input: 'Built-in Audio Analog Stereo', output: 'Built-in Audio Analog Stereo', video: 'Integrated Camera' },
    { input: 'PulseAudio Internal Microphone', output: 'PulseAudio Internal Speaker', video: 'USB 2.0 Camera' },
  ]),
});

const MEDIA_DEVICE_TEMPLATES = MEDIA_DEVICE_POOLS_BY_OS.windows;

const WINDOWS_SPEECH_VOICES = [
  { name: "Microsoft David - English (United States)", lang: "en-US" },
  { name: "Microsoft Zira - English (United States)", lang: "en-US" },
  { name: "Microsoft Mark - English (United States)", lang: "en-US" },
  { name: "Microsoft George - English (United Kingdom)", lang: "en-GB" },
  { name: "Microsoft Susan - English (United Kingdom)", lang: "en-GB" },
  { name: "Microsoft Catherine - English (Australia)", lang: "en-AU" },
  { name: "Microsoft James - English (Australia)", lang: "en-AU" },
  { name: "Microsoft Linda - English (Canada)", lang: "en-CA" },
  { name: "Microsoft Richard - English (Canada)", lang: "en-CA" },
  { name: "Microsoft Sean - English (Ireland)", lang: "en-IE" },
  { name: "Microsoft Heera - English (India)", lang: "en-IN" },
  { name: "Microsoft Ravi - English (India)", lang: "en-IN" },
  { name: "Microsoft Huihui - Chinese (Simplified, PRC)", lang: "zh-CN" },
  { name: "Microsoft Yaoyao - Chinese (Simplified, PRC)", lang: "zh-CN" },
  { name: "Microsoft Kangkang - Chinese (Simplified, PRC)", lang: "zh-CN" },
  { name: "Microsoft Hanhan - Chinese (Traditional, Taiwan)", lang: "zh-TW" },
  { name: "Microsoft Tracy - Chinese (Traditional, Hong Kong S.A.R.)", lang: "zh-HK" },
  { name: "Microsoft Haruka - Japanese", lang: "ja-JP" },
  { name: "Microsoft Ichiro - Japanese", lang: "ja-JP" },
  { name: "Microsoft Heami - Korean", lang: "ko-KR" },
  { name: "Microsoft Hortense - French", lang: "fr-FR" },
  { name: "Microsoft Paul - French", lang: "fr-FR" },
  { name: "Microsoft Julie - French (Canada)", lang: "fr-CA" },
  { name: "Microsoft Hedda - German", lang: "de-DE" },
  { name: "Microsoft Stefan - German", lang: "de-DE" },
  { name: "Microsoft Helena - Spanish", lang: "es-ES" },
  { name: "Microsoft Laura - Spanish", lang: "es-ES" },
  { name: "Microsoft Sabina - Spanish (Mexico)", lang: "es-MX" },
  { name: "Microsoft Raul - Spanish (Mexico)", lang: "es-MX" },
  { name: "Microsoft Cosimo - Italian", lang: "it-IT" },
  { name: "Microsoft Elsa - Italian", lang: "it-IT" },
  { name: "Microsoft Maria - Portuguese (Brazil)", lang: "pt-BR" },
  { name: "Microsoft Daniel - Portuguese (Brazil)", lang: "pt-BR" },
  { name: "Microsoft Helia - Portuguese (Portugal)", lang: "pt-PT" },
  { name: "Microsoft Irina - Russian", lang: "ru-RU" },
  { name: "Microsoft Pavel - Russian", lang: "ru-RU" },
  { name: "Microsoft Frank - Dutch", lang: "nl-NL" },
  { name: "Microsoft Paulina - Polish", lang: "pl-PL" },
  { name: "Microsoft Bengt - Swedish", lang: "sv-SE" },
  { name: "Microsoft Heidi - Finnish", lang: "fi-FI" },
  { name: "Microsoft Jon - Norwegian", lang: "nb-NO" },
  { name: "Microsoft Tolga - Turkish", lang: "tr-TR" },
  { name: "Microsoft Kalpana - Hindi", lang: "hi-IN" },
  { name: "Microsoft Pattara - Thai", lang: "th-TH" },
  { name: "Microsoft Andika - Indonesian", lang: "id-ID" },
  { name: "Microsoft Hoda - Arabic (Egypt)", lang: "ar-EG" },
  { name: "Microsoft Naayf - Arabic (Saudi Arabia)", lang: "ar-SA" },
  { name: "Microsoft Asaf - Hebrew", lang: "he-IL" },
  { name: "Microsoft Stefanos - Greek", lang: "el-GR" },
  { name: "Microsoft Filip - Czech", lang: "cs-CZ" },
  { name: "Microsoft Szabolcs - Hungarian", lang: "hu-HU" },
  { name: "Microsoft An - Vietnamese", lang: "vi-VN" },
];

const MACOS_SPEECH_VOICES = [
  { name: "Alex", lang: "en-US" }, { name: "Samantha", lang: "en-US" }, { name: "Victoria", lang: "en-US" },
  { name: "Fred", lang: "en-US" }, { name: "Junior", lang: "en-US" }, { name: "Kathy", lang: "en-US" },
  { name: "Daniel", lang: "en-GB" }, { name: "Kate", lang: "en-GB" }, { name: "Oliver", lang: "en-GB" },
  { name: "Serena", lang: "en-GB" }, { name: "Moira", lang: "en-IE" }, { name: "Fiona", lang: "en-GB" },
  { name: "Karen", lang: "en-AU" }, { name: "Lee", lang: "en-AU" }, { name: "Tessa", lang: "en-ZA" },
  { name: "Ting-Ting", lang: "zh-CN" }, { name: "Sin-ji", lang: "zh-HK" }, { name: "Mei-Jia", lang: "zh-TW" },
  { name: "Kyoko", lang: "ja-JP" }, { name: "Otoya", lang: "ja-JP" },
  { name: "Yuna", lang: "ko-KR" },
  { name: "Thomas", lang: "fr-FR" }, { name: "Amelie", lang: "fr-CA" }, { name: "Audrey", lang: "fr-FR" },
  { name: "Anna", lang: "de-DE" }, { name: "Helena", lang: "de-DE" }, { name: "Markus", lang: "de-DE" },
  { name: "Monica", lang: "es-ES" }, { name: "Paulina", lang: "es-MX" }, { name: "Jorge", lang: "es-ES" },
  { name: "Alice", lang: "it-IT" }, { name: "Luca", lang: "it-IT" },
  { name: "Luciana", lang: "pt-BR" }, { name: "Joana", lang: "pt-PT" },
  { name: "Milena", lang: "ru-RU" }, { name: "Yuri", lang: "ru-RU" },
  { name: "Xander", lang: "nl-NL" }, { name: "Ellen", lang: "nl-BE" },
  { name: "Alva", lang: "sv-SE" }, { name: "Oskar", lang: "sv-SE" },
  { name: "Satu", lang: "fi-FI" },
  { name: "Nora", lang: "nb-NO" },
  { name: "Zosia", lang: "pl-PL" },
  { name: "Zuzana", lang: "cs-CZ" },
  { name: "Lekha", lang: "hi-IN" },
  { name: "Kanya", lang: "th-TH" },
  { name: "Damayanti", lang: "id-ID" },
  { name: "Melina", lang: "el-GR" },
  { name: "Carmit", lang: "he-IL" },
  { name: "Maged", lang: "ar-SA" },
  { name: "Tarik", lang: "ar-SA" },
];

const ANDROID_SPEECH_VOICES = [
  { name: "English (United States)", lang: "en-US" },
  { name: "English (United Kingdom)", lang: "en-GB" },
  { name: "English (Australia)", lang: "en-AU" },
  { name: "English (India)", lang: "en-IN" },
  { name: "English (Nigeria)", lang: "en-NG" },
  { name: "Chinese (China)", lang: "zh-CN" },
  { name: "Chinese (Taiwan)", lang: "zh-TW" },
  { name: "Chinese (Hong Kong)", lang: "zh-HK" },
  { name: "Japanese (Japan)", lang: "ja-JP" },
  { name: "Korean (South Korea)", lang: "ko-KR" },
  { name: "French (France)", lang: "fr-FR" },
  { name: "French (Canada)", lang: "fr-CA" },
  { name: "German (Germany)", lang: "de-DE" },
  { name: "Spanish (Spain)", lang: "es-ES" },
  { name: "Spanish (United States)", lang: "es-US" },
  { name: "Italian (Italy)", lang: "it-IT" },
  { name: "Portuguese (Brazil)", lang: "pt-BR" },
  { name: "Portuguese (Portugal)", lang: "pt-PT" },
  { name: "Russian (Russia)", lang: "ru-RU" },
  { name: "Dutch (Netherlands)", lang: "nl-NL" },
  { name: "Polish (Poland)", lang: "pl-PL" },
  { name: "Swedish (Sweden)", lang: "sv-SE" },
  { name: "Finnish (Finland)", lang: "fi-FI" },
  { name: "Norwegian Bokmål (Norway)", lang: "nb-NO" },
  { name: "Danish (Denmark)", lang: "da-DK" },
  { name: "Czech (Czechia)", lang: "cs-CZ" },
  { name: "Hungarian (Hungary)", lang: "hu-HU" },
  { name: "Turkish (Turkey)", lang: "tr-TR" },
  { name: "Greek (Greece)", lang: "el-GR" },
  { name: "Hebrew (Israel)", lang: "he-IL" },
  { name: "Hindi (India)", lang: "hi-IN" },
  { name: "Indonesian (Indonesia)", lang: "id-ID" },
  { name: "Thai (Thailand)", lang: "th-TH" },
  { name: "Vietnamese (Vietnam)", lang: "vi-VN" },
  { name: "Arabic (Saudi Arabia)", lang: "ar-SA" },
  { name: "Ukrainian (Ukraine)", lang: "uk-UA" },
];

const GOOGLE_SPEECH_VOICES = [
  { name: "Google US English", lang: "en-US" }, { name: "Google UK English Female", lang: "en-GB" },
  { name: "Google UK English Male", lang: "en-GB" },
  { name: "Google 普通话（中国大陆）", lang: "zh-CN" }, { name: "Google 粤語（香港）", lang: "zh-HK" },
  { name: "Google 國語（臺灣）", lang: "zh-TW" },
  { name: "Google 日本語", lang: "ja-JP" },
  { name: "Google 한국의", lang: "ko-KR" },
  { name: "Google français", lang: "fr-FR" },
  { name: "Google Deutsch", lang: "de-DE" },
  { name: "Google español", lang: "es-ES" }, { name: "Google español de Estados Unidos", lang: "es-US" },
  { name: "Google italiano", lang: "it-IT" },
  { name: "Google português do Brasil", lang: "pt-BR" },
  { name: "Google русский", lang: "ru-RU" },
  { name: "Google Nederlands", lang: "nl-NL" },
  { name: "Google svenska", lang: "sv-SE" },
  { name: "Google suomi", lang: "fi-FI" },
  { name: "Google norsk bokmål", lang: "nb-NO" },
  { name: "Google polski", lang: "pl-PL" },
  { name: "Google čeština", lang: "cs-CZ" },
  { name: "Google हिन्दी", lang: "hi-IN" },
  { name: "Google ไทย", lang: "th-TH" },
  { name: "Google Bahasa Indonesia", lang: "id-ID" },
  { name: "Google ελληνικά", lang: "el-GR" },
  { name: "Google עברית", lang: "he-IL" },
  { name: "Google العربية", lang: "ar-SA" },
];

const SPEECH_VOICE_POOL = [
  ...WINDOWS_SPEECH_VOICES,
  ...MACOS_SPEECH_VOICES,
  ...ANDROID_SPEECH_VOICES,
  ...GOOGLE_SPEECH_VOICES,
];

const DEVICE_NAME_PREFIXES = [
  'DESKTOP', 'LAPTOP', 'PC', 'WIN', 'MAC', 'HOME', 'WORK', 'OFFICE', 'STUDIO', 'DEV',
];
const DEVICE_NAME_SUFFIXES = [
  'Alpha', 'Nova', 'Orbit', 'Pulse', 'Ridge', 'Summit', 'Vertex', 'Atlas', 'Cedar', 'Delta',
  'Echo', 'Flint', 'Grove', 'Harbor', 'Ivory', 'Jade', 'Kepler', 'Lumen', 'Maple', 'Nimbus',
];


/** High-risk hosts where canvas/webgl noise stays tighter for session consistency. */
const DEFAULT_STABILITY_HOSTS = [
  'amazon.com', 'amazon.co.jp', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.es', 'amazon.it',
  'amazonaws.com', 'smile.amazon.com',
  'shopee.com', 'shopee.sg', 'shopee.co.id', 'shopee.tw', 'shopee.vn', 'shopee.co.th', 'shopee.ph', 'shopee.com.my', 'shopee.com.br',
  'lazada.com', 'lazada.sg', 'lazada.co.id', 'lazada.com.my', 'lazada.vn', 'lazada.co.th', 'lazada.ph',
  'tiktok.com', 'tiktokv.com', 'bytedance.com',
  'ebay.com', 'ebay.co.uk', 'ebay.de',
  'paypal.com', 'stripe.com', 'checkout.stripe.com',
  'binance.com', 'coinbase.com', 'okx.com', 'bybit.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com',
  'google.com', 'accounts.google.com', 'gmail.com',
  'microsoft.com', 'login.live.com', 'account.microsoft.com',
  'apple.com', 'icloud.com',
  'browserleaks.com', 'browserleaks.org', 'creepjs.com', 'amiunique.org', 'coveryourtracks.eff.org',
  'fingerprintjs.com', 'fingerprint.com', 'pixelscan.net', 'sannysoft.com', 'bot.sannysoft.com',
  'iphey.com', 'whoer.net', 'whatismybrowser.com', 'deviceinfo.me',
];

/** Hosts that should keep normal noise even when parent domains match. */
const DEFAULT_STABILITY_SKIP_HOSTS = [
  'sephora.com', 'whatsapp.com', 'web.whatsapp.com', 'dhgate.com', 'cdn.', 'static.',
];

function normalizeHost(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^\*\./, '')
    .replace(/^\.+/, '');
}

function hostMatchesPattern(host, pattern) {
  const h = normalizeHost(host);
  const p = normalizeHost(pattern);
  if (!h || !p) return false;
  if (p.endsWith('.')) return h === p.slice(0, -1) || h.endsWith('.' + p.slice(0, -1)) || h.startsWith(p);
  if (h === p) return true;
  return h.endsWith('.' + p);
}

function listIncludesHost(list, host) {
  if (!Array.isArray(list) || !list.length) return false;
  const h = normalizeHost(host);
  if (!h) return false;
  return list.some((item) => hostMatchesPattern(h, item));
}

/**
 * Resolve site-aware canvas/webgl stability.
 * mode: off | auto | force
 *
 * Stable hosts reuse sparse deterministic +/-1 perturbations. Normal mode
 * retains the original -1/0/+1 distribution. Neither mode disables noise.
 * skipHosts selects normal mode; off/auto/force control host selection.
 */
function resolveStabilityPolicy(privacy = {}, options = {}) {
  const fpIn = (privacy.fingerprint && typeof privacy.fingerprint === 'object' ? privacy.fingerprint : null) || (options.fingerprint && typeof options.fingerprint === 'object' ? options.fingerprint : {});
  const modeRaw = String(options.mode || fpIn.stabilityMode || privacy.stabilityMode || 'auto').toLowerCase();
  const mode = ['off', 'auto', 'force'].includes(modeRaw) ? modeRaw : 'auto';
  const customHosts = Array.isArray(fpIn.stabilityHosts)
    ? fpIn.stabilityHosts
    : (Array.isArray(privacy.stabilityHosts) ? privacy.stabilityHosts : null);
  const customSkip = Array.isArray(fpIn.stabilitySkipHosts)
    ? fpIn.stabilitySkipHosts
    : (Array.isArray(privacy.stabilitySkipHosts) ? privacy.stabilitySkipHosts : null);
  const hosts = (customHosts && customHosts.length ? customHosts : DEFAULT_STABILITY_HOSTS)
    .map(normalizeHost).filter(Boolean).slice(0, 800);
  const skipHosts = (customSkip && customSkip.length ? customSkip : DEFAULT_STABILITY_SKIP_HOSTS)
    .map(normalizeHost).filter(Boolean).slice(0, 200);
  const hamming = Math.min(64, Math.max(1, Number(fpIn.stabilityHamming ?? privacy.stabilityHamming) || 12));
  const maxWidth = Math.min(4096, Math.max(64, Number(fpIn.stabilityMaxWidth ?? privacy.stabilityMaxWidth) || 600));
  const maxHeight = Math.min(4096, Math.max(64, Number(fpIn.stabilityMaxHeight ?? privacy.stabilityMaxHeight) || 600));
  const square = Math.min(64, Math.max(2, Number(fpIn.stabilitySquare ?? privacy.stabilitySquare) || 8));
  const host = normalizeHost(options.host || options.hostname || '');
  const skipped = host ? listIncludesHost(skipHosts, host) : false;
  const matched = host ? listIncludesHost(hosts, host) : false;
  let active = false;
  if (mode === 'force') active = !skipped;
  else if (mode === 'auto') active = matched && !skipped;
  // Stable mode uses sparse nonzero samples; normal mode keeps the legacy distribution.
  const noiseAmplitude = active ? 1 : 3;
  const sampleStepDivisor = active ? 128 : 64;
  return {
    mode,
    active,
    matched,
    skipped,
    host: host || null,
    hosts,
    skipHosts,
    hamming,
    maxWidth,
    maxHeight,
    square,
    noiseAmplitude,
    sampleStepDivisor,
  };
}

function matchStabilityHost(host, privacy = {}) {
  return resolveStabilityPolicy(privacy, { host }).active;
}

/** Sample R-channel block origins for canvas consistency checks. */
function sampleCanvasBlocks(data, width, height, options = {}) {
  const maxWidth = Math.min(4096, Math.max(1, Number(options.maxWidth) || 600));
  const maxHeight = Math.min(4096, Math.max(1, Number(options.maxHeight) || 600));
  const square = Math.min(64, Math.max(2, Number(options.square) || 8));
  const w = Math.max(0, Number(width) || 0);
  const h = Math.max(0, Number(height) || 0);
  const limitW = w > 0 ? Math.min(w, maxWidth) : 0;
  const limitH = h > 0 ? Math.min(h, maxHeight) : 0;
  const samples = [];
  if (!data || !limitW || !limitH) return samples;
  const len = data.length;
  for (let y = 0; y < limitH; y += square) {
    for (let x = 0; x < limitW; x += square) {
      const px = ((y * w) + x) * 4;
      if (px >= len) continue;
      samples.push(data[px] & 0xff);
    }
  }
  return samples;
}

/** Bit-level Hamming distance between equal-length byte arrays / number arrays. */
function hammingDistance(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const n = Math.min(a.length, b.length);
  let dist = 0;
  for (let i = 0; i < n; i += 1) {
    let x = (a[i] ^ b[i]) & 0xff;
    // popcount
    x = x - ((x >>> 1) & 0x55);
    x = (x & 0x33) + ((x >>> 2) & 0x33);
    dist += (((x + (x >>> 4)) & 0x0f) * 0x01) & 0xff;
  }
  dist += Math.abs((a.length || 0) - (b.length || 0)) * 8;
  return dist;
}

/**
 * Apply deterministic block noise and optionally lock deltas for session consistency.
 * When lockMap is provided and key exists, reuses prior deltas so repeated reads stay within hamming threshold.
 */
function applyStableCanvasNoise(imageData, mark, options = {}) {
  const data = imageData && imageData.data;
  if (!data) return imageData;
  const width = imageData.width || 0;
  const height = imageData.height || 0;
  const maxWidth = Math.min(4096, Math.max(1, Number(options.maxWidth) || 600));
  const maxHeight = Math.min(4096, Math.max(1, Number(options.maxHeight) || 600));
  const square = Math.min(64, Math.max(2, Number(options.square) || 8));
  const amp = Math.max(1, Number(options.noiseAmplitude) || 1);
  const seedNum = Number(options.seedNum) || 1;
  const noise = typeof options.noise === 'function'
    ? options.noise
    : ((n) => {
      let x = Math.sin((n + 1) * seedNum) * 10000;
      return x - Math.floor(x);
    });
  const limitW = width > 0 ? Math.min(width, maxWidth) : width;
  const limitH = height > 0 ? Math.min(height, maxHeight) : height;
  const lockMap = options.lockMap || null;
  const lockKey = options.lockKey || `${width}x${height}:${mark}:${square}:${amp}`;
  let locked = lockMap && lockMap.get ? lockMap.get(lockKey) : null;
  if (!locked) {
    locked = [];
    for (let y = 0; y < (limitH || height); y += square) {
      for (let x = 0; x < (limitW || width); x += square) {
        const px = ((y * width) + x) * 4;
        if (px + 3 >= data.length) continue;
        if (data[px + 3] === 0) continue;
        const delta = noiseDelta(noise(px + mark), amp);
        locked.push({ px, delta });
      }
    }
    if (lockMap && lockMap.set) lockMap.set(lockKey, locked);
  }
  for (const item of locked) {
    const px = item.px;
    if (px + 3 >= data.length) continue;
    if (data[px + 3] === 0) continue;
    data[px] = Math.max(0, Math.min(255, data[px] + item.delta));
  }
  return imageData;
}

/** True when two sample vectors are within the configured Hamming threshold. */
function withinHammingThreshold(a, b, threshold = 12) {
  const limit = Math.min(64, Math.max(0, Number(threshold) || 12));
  return hammingDistance(a, b) <= limit;
}



/** Deterministic battery snapshot derived from seed. */
function createBatteryFromSeed(seedInput, override = null, options = {}) {
  if (override && typeof override === 'object' && !Array.isArray(override)) {
    return normalizeBatterySnapshot(override);
  }
  // Desktop towers without a battery answer getBattery with the AC-power shape: charging,
  // full, zero charging time, Infinity discharge. Giving every desktop persona a laptop-style
  // partial-level draw is a mismatch on its own axis (the battery axis was never audited).
  if (options && options.acPowered) {
    return {
      charging: true,
      chargingTime: 0,
      dischargingTime: null,
      level: 1,
    };
  }
  const seed = hashSeed(String(seedInput || 'battery'));
  const levelRaw = 55 + (u32(seed, 0) % 40); // 0.55 - 0.94
  const charging = (u32(seed, 4) % 5) !== 0; // mostly charging on desktop
  const level = levelRaw / 100;
  if (charging) {
    return {
      charging: true,
      chargingTime: 600 + (u32(seed, 8) % 5400),
      dischargingTime: null,
      level,
    };
  }
  return {
    charging: false,
    chargingTime: null,
    dischargingTime: 1800 + (u32(seed, 12) % 14400),
    level,
  };
}

/** Seed-stable mic/camera/speaker labels for mediaDevices spoof. */
function createMediaDevicesFromSeed(seedInput, options = {}) {
  const raw = String(seedInput || 'default');
  let acc = 0;
  for (let i = 0; i < raw.length; i += 1) acc += raw.charCodeAt(i);
  const osKey = String(options.os || '').toLowerCase();
  const desktopClass = options.laptop === false;
  const pool = (osKey.startsWith('macos') || osKey === 'darwin')
    ? (desktopClass ? MEDIA_DEVICE_POOLS_BY_OS.macos_desktop : MEDIA_DEVICE_POOLS_BY_OS.macos)
    : (osKey === 'android'
      ? MEDIA_DEVICE_POOLS_BY_OS.android
      : (osKey === 'linux'
        ? MEDIA_DEVICE_POOLS_BY_OS.linux
        : MEDIA_DEVICE_TEMPLATES));
  const tpl = pool[acc % pool.length] || pool[0];
  // Chrome hands out 64-character lowercase hex identifiers, salted per origin, and never brands
  // them with a product prefix. Derive each identifier from the whole profile seed so two
  // profiles cannot share one: the previous running-sum derivation only depended on the first two
  // characters, so env-001/env-002/env-003 all published the same audio-input deviceId and could
  // be linked across environments.
  const digestHex = (salt) => crypto.createHash('sha256').update(raw + '|' + salt).digest('hex');
  const audioInputId = digestHex('audioinput');
  const videoInputId = digestHex('videoinput');
  const audioOutputId = digestHex('audiooutput');
  const groupId = digestHex('group');
  const usbTag = digestHex('usb').slice(0, 4) + ':' + digestHex('usb').slice(4, 8);
  const emptyLabels = options.emptyLabels === true;
  const labelOverride = options.labels && typeof options.labels === 'object' ? options.labels : null;
  const inputLabel = emptyLabels ? '' : String(labelOverride?.audioinput || labelOverride?.input || tpl.input);
  const defaultVideo = pool === MEDIA_DEVICE_POOLS_BY_OS.macos
    ? (tpl.video || 'FaceTime HD Camera')
    : (pool === MEDIA_DEVICE_POOLS_BY_OS.android
      ? (tpl.video || 'Back Camera')
      : (tpl.video ? `${tpl.video} (${usbTag})` : `Integrated Camera (${usbTag})`));
  const videoLabel = emptyLabels ? '' : String(labelOverride?.videoinput || labelOverride?.video || defaultVideo);
  const outputLabel = emptyLabels ? '' : String(labelOverride?.audiooutput || labelOverride?.output || tpl.output);
  const devices = [
    { kind: 'audioinput', label: inputLabel, deviceId: audioInputId, groupId },
    { kind: 'videoinput', label: videoLabel, deviceId: videoInputId, groupId },
    { kind: 'audiooutput', label: outputLabel, deviceId: audioOutputId, groupId },
  ];
  if (Array.isArray(options.extra) && options.extra.length) {
    for (const item of options.extra.slice(0, 8)) {
      if (item && item.kind) devices.push({
        kind: String(item.kind),
        label: String(item.label || ''),
        deviceId: String(item.deviceId || digestHex('extra' + devices.length)),
        groupId: String(item.groupId || groupId),
      });
    }
  }
  return devices;
}

/** Pick a stable default speech voice matching the primary language. */
/**
 * Voices a given platform can actually ship. Apple voices are the bare given names
 * (Alex, Samantha, Otoya); Windows uses the "Microsoft X - Language" form; the Google
 * voices are bundled by Chrome itself and appear everywhere. Without an OS the full table
 * is returned, which keeps previously generated profiles byte-identical.
 */
function speechVoicePoolForOs(os) {
  const family = String(os || "").toLowerCase().trim();
  const isAndroid = family.includes("android");
  const isIos = !isAndroid && (family.includes("ios") || family.includes("iphone") || family.includes("ipad"));
  const isMac = !isAndroid && !isIos && (family.includes("mac") || family.includes("darwin"));
  const isLinux = !isAndroid && !isIos && !isMac && (family.includes("linux") || family.includes("x11") || family.includes("unix") || family.includes("ubuntu"));
  const isWindows = !isAndroid && !isIos && !isMac && !isLinux && family.includes("win");

  if (isAndroid) {
    return ANDROID_SPEECH_VOICES;
  }
  if (isIos) {
    return MACOS_SPEECH_VOICES;
  }
  if (isWindows) {
    return [...WINDOWS_SPEECH_VOICES, ...GOOGLE_SPEECH_VOICES];
  }
  if (isLinux) {
    return GOOGLE_SPEECH_VOICES;
  }
  if (isMac) {
    return [...MACOS_SPEECH_VOICES, ...GOOGLE_SPEECH_VOICES];
  }
  return [...WINDOWS_SPEECH_VOICES, ...GOOGLE_SPEECH_VOICES];
}

function createSpeechVoicesFromSeed(seedInput, languages = ['en-US'], mode = 'noise', options = {}) {
  if (mode === 'blocked') return [];
  if (mode === 'real') return null;
  // speechSynthesis.getVoices() is a strong OS signal: Samantha and Alex only exist on
  // macOS, the "Microsoft X - Language" voices only on Windows, and a stock Linux Chrome
  // reports just the bundled Google ones. Selecting purely by language mixes those
  // families, so a profile claiming Windows can answer with Apple voices. When an OS is
  // supplied the table is narrowed to what that platform can actually ship.
  const pool = speechVoicePoolForOs(options.os);
  const langs = (Array.isArray(languages) ? languages : [languages])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  const primary = langs[0] || 'en-US';
  const primaryLang = primary.split('-')[0].toLowerCase();
  const langSet = new Set(langs.map((item) => item.toLowerCase()));
  const langPrefixSet = new Set(langs.map((item) => item.split('-')[0].toLowerCase()));
  const seed = hashSeed(String(seedInput || primary));
  // 18-32 voices, closer to full system tables — but never more than the platform has.
  const count = Math.min(pool.length, 18 + (u32(seed, 4) % 15));
  const scored = pool.map((base, index) => {
    let score = 0;
    const lang = String(base.lang || '').toLowerCase();
    const prefix = lang.split('-')[0];
    if (lang === primary.toLowerCase()) score += 100;
    else if (langSet.has(lang)) score += 80;
    else if (prefix === primaryLang) score += 60;
    else if (langPrefixSet.has(prefix)) score += 40;
    else if (prefix === 'en') score += 10;
    score += (u32(seed, 8 + (index % 24)) % 7);
    return { base, score, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const picked = [];
  const used = new Set();
  for (const item of scored) {
    if (picked.length >= count) break;
    const base = item.base;
    const key = `${base.name}|${base.lang}`;
    if (used.has(key)) continue;
    used.add(key);
    picked.push({
      name: base.name,
      lang: base.lang,
      default: false,
      localService: !/^Google\s/i.test(base.name),
      // Chrome reports the voice name itself as the URI - verified against a real Chrome, where
      // every macOS voice exposes voiceURI === name. The previous scheme emitted a
      // product-branded URI for persona-less profiles, which any page could read straight out of
      // speechSynthesis.getVoices() and use to identify the browser, so the plain name is now
      // always used.
      voiceURI: base.name,
    });
  }
  let def = picked.find((v) => v.lang === primary)
    || picked.find((v) => v.lang.toLowerCase().startsWith(primaryLang))
    || picked[0];
  if (def) {
    def.default = true;
    if (def.localService == null) def.localService = true;
  }
  return picked;
}

/** Seeded host-style device name for machine / product surfaces. */
function createDeviceNameFromSeed(seedInput, options = {}) {
  const mode = String(options.mode || 'noise');
  const custom = String(options.custom || '').trim().slice(0, 120);
  if (mode === 'real') return null;
  if (mode === 'custom' && custom) return custom;
  const seed = hashSeed(String(seedInput || 'device'));
  const prefix = DEVICE_NAME_PREFIXES[u32(seed, 0) % DEVICE_NAME_PREFIXES.length];
  const suffix = DEVICE_NAME_SUFFIXES[u32(seed, 4) % DEVICE_NAME_SUFFIXES.length];
  const num = 1000 + (u32(seed, 8) % 9000);
  if ((u32(seed, 12) % 3) === 0) return `${suffix}-${num}`;
  return `${prefix}-${suffix}${String(num).slice(0, 3)}`;
}

/** Deterministic private IPv4 used as the local ICE candidate surface. */
function createLocalIpFromSeed(seedInput) {
  const seed = hashSeed(String(seedInput || 'local-ip'));
  const classPick = u32(seed, 0) % 3;
  if (classPick === 0) {
    return `10.${u32(seed, 4) % 256}.${u32(seed, 8) % 256}.${1 + (u32(seed, 12) % 254)}`;
  }
  if (classPick === 1) {
    return `192.168.${u32(seed, 4) % 256}.${1 + (u32(seed, 8) % 254)}`;
  }
  return `172.${16 + (u32(seed, 4) % 16)}.${u32(seed, 8) % 256}.${1 + (u32(seed, 12) % 254)}`;
}

/**
 * Deterministic mDNS hostname for the host candidate. Chrome ≥74 hides local ICE host
 * candidates behind an mDNS <uuid4>.local name by default; exposing a raw RFC1918 IPv4 as
 * the host candidate is a one-read tell that the candidates were synthesized or the mDNS
 * privacy feature was disabled. The hostname is a UUIDv4 shape derived from the same
 * profile identity so it stays stable per profile.
 */
function createLocalMdnsFromSeed(seedInput) {
  const seed = hashSeed(String(seedInput || 'local-mdns'));
  const hex = seed.toString('hex'); // 64 hex chars
  const p = (index, count) => hex.slice(index * 2, index * 2 + count * 2);
  return `${p(0, 4)}-${p(4, 2)}-4${hex.slice(10, 13)}-${((parseInt(hex.slice(13, 14), 16) & 0x3) | 0x8).toString(16)}${hex.slice(14, 17)}-${p(8, 6)}.local`;
}

function formatGeopositionValue(geo) {
  if (!geo || typeof geo !== 'object') return null;
  const lat = Number(geo.latitude);
  const lon = Number(geo.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const accuracy = Number.isFinite(Number(geo.accuracy)) ? Number(geo.accuracy) : 1000;
  return `${lat},${lon},${accuracy}`;
}

/** Audio noise mark: sum(charCode) % 2000 - 1000 */
function audioMarkFromSeed(seedInput) {
  const s = String(seedInput || '');
  let n = 0;
  for (let i = 0; i < s.length; i += 1) n += s.charCodeAt(i);
  return (n % 2000) - 1000 || 1;
}

/** ClientRect noise mark: hash % 20000 - 10000 */
function clientRectMarkFromSeed(seedBufOrStr) {
  if (Buffer.isBuffer(seedBufOrStr)) {
    const v = (u32(seedBufOrStr, 40) % 20000) - 10000;
    return v === 0 ? 1 : v;
  }
  const s = String(seedBufOrStr || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  const v = (Math.abs(h) % 20000) - 10000;
  return v === 0 ? 1 : v;
}

/** WebGL fingerprint payload: vendor/renderer + optional GPUAdapterInfo. */
function buildWebglFpPayload(webgl = {}) {
  const payload = {
    UNMASKED_VENDOR_WEBGL: webgl.vendor || '',
    UNMASKED_RENDERER_WEBGL: webgl.renderer || '',
    SUPPORTED_EXTENSIONS: Array.isArray(webgl.extensions) ? webgl.extensions : [],
  };
  if (webgl.gpu && (webgl.gpu.vendor || webgl.gpu.architecture)) {
    payload.GPUAdapterInfo = {
      vendor: String(webgl.gpu.vendor || ''),
      architecture: String(webgl.gpu.architecture || ''),
    };
  }
  return payload;
}

function desktopOs(os) {
  return ['windows', 'macos', 'macos_arm', 'linux'].includes(os) ? os : null;
}

// The legacy (non-persona) pools are split by CPU architecture exactly like the persona
// pools: a mixed pool draws "Apple M2" renderers under an x86 Client Hints architecture
// (and Iris under arm), a machine that never shipped. Detectors score that pair directly.
const LEGACY_MACOS_WEBGL_PRESETS = Object.freeze([
  { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, ANGLE Metal Renderer: Intel(R) Iris(TM) Plus Graphics 640, Unspecified Version)', gpu: { vendor: 'intel', architecture: 'gen9' } },
  { vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel, ANGLE Metal Renderer: Intel(R) Iris(TM) Plus Graphics 655, Unspecified Version)', gpu: { vendor: 'intel', architecture: 'gen9' } },
]);
const LEGACY_MACOS_ARM_WEBGL_PRESETS = Object.freeze([
  { vendor: 'Google Inc. (Apple)', renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)', gpu: { vendor: 'apple', architecture: 'common-3' } },
  { vendor: 'Google Inc. (Apple)', renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)', gpu: { vendor: 'apple', architecture: 'common-3' } },
  { vendor: 'Google Inc. (Apple)', renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)', gpu: { vendor: 'apple', architecture: 'common-3' } },
]);

function webglPresetsForOs(os, options = {}) {
  let list = WEBGL_PRESETS.windows;
  // "macos" is the x86 Chrome build (Intel Mac); "macos_arm" is the Apple Silicon build.
  // Mixing the two pools is a contradiction detectors score directly.
  if (options.legacy && (os === 'macos' || os === 'macos_arm')) list = os === 'macos_arm' ? LEGACY_MACOS_ARM_WEBGL_PRESETS : LEGACY_MACOS_WEBGL_PRESETS;
  else if (os === 'macos') list = WEBGL_PRESETS.macos_intel;
  else if (os === 'macos_arm') list = WEBGL_PRESETS.macos_apple;
  else if (os === 'linux') list = WEBGL_PRESETS.linux;
  else if (os === 'android') list = WEBGL_PRESETS.android;
  else if (os === 'ios') list = WEBGL_PRESETS.ios;
  if (options.legacy && (!os || os === 'windows')) return list.slice(0, 16);
  return list;
}

// WebGL reports a handful of hardware limits straight from the driver. A page that reads the
// spoofed adapter name and then compares it against those limits can tell the two apart - a
// persona claiming one GPU while MAX_TEXTURE_SIZE still describes the host GPU is exactly the
// kind of cross check a detector runs. Each entry below is the value a page sees for that GPU
// class under a current desktop driver; `texture` doubles as the viewport/cube/renderbuffer size
// because those limits are equal on every desktop driver in the table.
const WEBGL_GPU_LIMITS = {
  // vendor: architecture -> limits
  nvidia: {
    ada: { texture: 32768, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 192 },
    ampere: { texture: 32768, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 192 },
    turing: { texture: 32768, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 192 },
  },
  amd: {
    'rdna-3': { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 128 },
    'rdna-2': { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 128 },
    'rdna-1': { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 128 },
    'gcn-4': { texture: 16384, vertexUniform: 4096, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 128 },
    'gcn-3': { texture: 16384, vertexUniform: 4096, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 128 },
    vega: { texture: 16384, vertexUniform: 4096, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 128 },
  },
  intel: {
    alchemist: { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
    gen12: { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
    gen11: { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
    gen9: { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
    gen7: { texture: 8192, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
  },
  apple: {
    'common-3': { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 511, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 12, maxFragmentUniformBlocks: 12, maxCombinedTextureImageUnits: 80 },
    'common-4': { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 511, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 12, maxFragmentUniformBlocks: 12, maxCombinedTextureImageUnits: 80 },
  },
  qualcomm: {
    'adreno-700': { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 64, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
  },
  arm: {
    valhall: { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 64, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
  },
  samsung: {
    'rdna-2': { texture: 16384, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 256, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 128 },
  },
  imagination: {
    rogue: { texture: 8192, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 64, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
    powervr: { texture: 8192, vertexUniform: 1024, varying: 32, pointSize: 1024, uniformBufferOffsetAlignment: 64, maxUniformBlockSize: 65536, maxVertexUniformBlocks: 14, maxFragmentUniformBlocks: 14, maxCombinedTextureImageUnits: 96 },
  },
};

const HOST_WEBGL2_DEFAULTS = Object.freeze({
  macos: Object.freeze({
    maxUniformBlockSize: 65536,
    maxVertexUniformBlocks: 12,
    maxFragmentUniformBlocks: 12,
    maxCombinedTextureImageUnits: 80,
    uniformBufferOffsetAlignment: 256,
  }),
  linux: Object.freeze({
    maxUniformBlockSize: 65536,
    maxVertexUniformBlocks: 14,
    maxFragmentUniformBlocks: 14,
    maxCombinedTextureImageUnits: 96,
    uniformBufferOffsetAlignment: 256,
  }),
  windows: Object.freeze({
    maxUniformBlockSize: 65536,
    maxVertexUniformBlocks: 14,
    maxFragmentUniformBlocks: 14,
    maxCombinedTextureImageUnits: 192,
    uniformBufferOffsetAlignment: 256,
  }),
});

/** WebGL parameter ids that a coerced adapter identity has to answer for. */
const WEBGL_PARAM_IDS = Object.freeze({
  MAX_TEXTURE_SIZE: 0x0d33,
  MAX_VIEWPORT_DIMS: 0x0d3a,
  ALIASED_POINT_SIZE_RANGE: 0x846d,
  MAX_CUBE_MAP_TEXTURE_SIZE: 0x851c,
  MAX_RENDERBUFFER_SIZE: 0x84e8,
  MAX_VERTEX_UNIFORM_VECTORS: 0x8dfb,
  MAX_VARYING_VECTORS: 0x8dfc,
  MAX_UNIFORM_BLOCK_SIZE: 0x8a30,
  UNIFORM_BUFFER_OFFSET_ALIGNMENT: 0x8a34,
  MAX_VERTEX_UNIFORM_BLOCKS: 0x8a2b,
  MAX_FRAGMENT_UNIFORM_BLOCKS: 0x8a2d,
  MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8b4d,
});

/**
 * Normalizes GPU architecture keys so variants like "gen-9", "gen-12lp", "gen12"
 * map consistently to the canonical entries in WEBGL_GPU_LIMITS.
 */
function normalizeGpuArchitecture(vendor, arch) {
  const v = String(vendor || "").toLowerCase().trim();
  const raw = String(arch || "").toLowerCase().trim();
  if (!raw) return "";

  if (v === "intel") {
    const m = raw.match(/^gen-?(\d+)(?:-?lp)?$/);
    if (m) {
      const canonical = "gen" + m[1];
      if (WEBGL_GPU_LIMITS.intel && Object.prototype.hasOwnProperty.call(WEBGL_GPU_LIMITS.intel, canonical)) {
        return canonical;
      }
      return canonical;
    }
    if (raw === "alchemist" || raw === "battlemage") {
      return raw;
    }
  } else if (v === "amd") {
    const mRdna = raw.match(/^rdna-?([123])$/);
    if (mRdna) return "rdna-" + mRdna[1];
    const mGcn = raw.match(/^gcn-?([34])$/);
    if (mGcn) return "gcn-" + mGcn[1];
    if (raw === "vega") return "vega";
  } else if (v === "apple") {
    if (raw.startsWith("apple-m") || /^m[1-4]/.test(raw)) {
      return "common-3";
    }
  } else if (v === "nvidia") {
    if (raw.includes("ada") || raw.includes("40")) return "ada";
    if (raw.includes("ampere") || raw.includes("30")) return "ampere";
    if (raw.includes("turing") || raw.includes("20") || raw.includes("16")) return "turing";
  } else if (v === "qualcomm") {
    if (raw.includes("700") || raw.includes("730") || raw.includes("740") || raw.includes("adreno")) return "adreno-700";
  } else if (v === "arm") {
    if (raw.includes("valhall") || raw.includes("g710") || raw.includes("mali")) return "valhall";
  } else if (v === "samsung") {
    return "rdna-2";
  } else if (v === "imagination" || v.includes("powervr")) {
    return "rogue";
  }
  return raw;
}

/**
 * Per-persona overrides for the driver-reported WebGL limits.
 *
 * Returns null when nothing should be coerced (no GPU identity, or real mode), otherwise a
 * plain object keyed by the numeric parameter id. Values are pulled from the class table so
 * two profiles with the same GPU always agree, and `MAX_VIEWPORT_DIMS` is derived from the
 * renderbuffer size rather than being carried separately.
 */
function webglParameterOverrides(gpu, options = {}) {
  if (!gpu || typeof gpu !== "object") return null;
  let vendor = String(gpu.vendor || gpu.family || "").toLowerCase().trim();
  if (vendor.includes("imagination") || vendor.includes("powervr")) vendor = "imagination";
  else if (vendor.includes("qualcomm") || vendor.includes("adreno")) vendor = "qualcomm";
  else if (vendor.includes("arm") || vendor.includes("mali")) vendor = "arm";
  else if (vendor.includes("apple")) vendor = "apple";
  else if (vendor.includes("nvidia")) vendor = "nvidia";
  else if (vendor.includes("amd")) vendor = "amd";
  else if (vendor.includes("intel")) vendor = "intel";
  else if (vendor.includes("samsung")) vendor = "samsung";
  const arch = String(gpu.architecture || gpu.family || "").toLowerCase().trim();
  const family = WEBGL_GPU_LIMITS[vendor];
  if (!family) return null;
  const normArch = normalizeGpuArchitecture(vendor, arch);
  // Look up normalized architecture first, then raw architecture, then fall back
  // to the vendor's most conservative entry so an unknown architecture still has to
  // agree with itself rather than leaving host limits in place.
  const entry = family[normArch]
    || family[arch]
    || Object.values(family)[Object.keys(family).length - 1];
  if (!entry) return null;
  const overrides = {};
  let textureLimit = entry.texture;
  let renderbufferLimit = entry.texture;
  let pointSizeLimit = entry.pointSize || (vendor === 'apple' ? 511 : 1024);
  let uniformBufferOffsetAlignment = entry.uniformBufferOffsetAlignment || 256;
  let maxUniformBlockSize = entry.maxUniformBlockSize || 65536;
  let maxVertexUniformBlocks = entry.maxVertexUniformBlocks || (vendor === 'apple' ? 12 : 14);
  let maxFragmentUniformBlocks = entry.maxFragmentUniformBlocks || (vendor === 'apple' ? 12 : 14);
  let maxCombinedTextureImageUnits = entry.maxCombinedTextureImageUnits || (vendor === 'nvidia' ? 192 : (vendor === 'amd' ? 128 : (vendor === 'apple' ? 80 : 96)));

  const shouldReconcile = options.reconcileHost ?? options.clampToHost;
  if (shouldReconcile) {
    const hostLimits = options.hostLimits || getHostWebglLimits(options.hostPlatform || process.platform);
    if (hostLimits) {
      if (Number.isFinite(hostLimits.maxTextureSize) && hostLimits.maxTextureSize > 0) {
        textureLimit = Math.min(textureLimit, hostLimits.maxTextureSize);
        renderbufferLimit = Math.min(renderbufferLimit, hostLimits.maxRenderbufferSize || hostLimits.maxTextureSize);
      }
      if (Array.isArray(hostLimits.aliasedPointSizeRange) && Number.isFinite(hostLimits.aliasedPointSizeRange[1])) {
        pointSizeLimit = Math.min(pointSizeLimit, hostLimits.aliasedPointSizeRange[1]);
      }
      const p = String(options.hostPlatform || process.platform).toLowerCase().trim();
      const hostWebgl2 = HOST_WEBGL2_DEFAULTS[p === 'darwin' || p === 'macos' ? 'macos' : (p === 'linux' ? 'linux' : 'windows')];
      if (hostWebgl2) {
        maxUniformBlockSize = Math.min(maxUniformBlockSize, hostWebgl2.maxUniformBlockSize);
        maxVertexUniformBlocks = Math.min(maxVertexUniformBlocks, hostWebgl2.maxVertexUniformBlocks);
        maxFragmentUniformBlocks = Math.min(maxFragmentUniformBlocks, hostWebgl2.maxFragmentUniformBlocks);
        maxCombinedTextureImageUnits = Math.min(maxCombinedTextureImageUnits, hostWebgl2.maxCombinedTextureImageUnits);
        uniformBufferOffsetAlignment = Math.max(uniformBufferOffsetAlignment, hostWebgl2.uniformBufferOffsetAlignment);
      }
    }
    if (options.hostLimits && typeof options.hostLimits === 'object') {
      if (Number.isFinite(options.hostLimits.maxUniformBlockSize)) {
        maxUniformBlockSize = Math.min(maxUniformBlockSize, options.hostLimits.maxUniformBlockSize);
      }
      if (Number.isFinite(options.hostLimits.maxVertexUniformBlocks)) {
        maxVertexUniformBlocks = Math.min(maxVertexUniformBlocks, options.hostLimits.maxVertexUniformBlocks);
      }
      if (Number.isFinite(options.hostLimits.maxFragmentUniformBlocks)) {
        maxFragmentUniformBlocks = Math.min(maxFragmentUniformBlocks, options.hostLimits.maxFragmentUniformBlocks);
      }
      if (Number.isFinite(options.hostLimits.maxCombinedTextureImageUnits)) {
        maxCombinedTextureImageUnits = Math.min(maxCombinedTextureImageUnits, options.hostLimits.maxCombinedTextureImageUnits);
      }
      if (Number.isFinite(options.hostLimits.uniformBufferOffsetAlignment)) {
        uniformBufferOffsetAlignment = Math.max(uniformBufferOffsetAlignment, options.hostLimits.uniformBufferOffsetAlignment);
      }
    }
  }
  overrides[WEBGL_PARAM_IDS.MAX_TEXTURE_SIZE] = textureLimit;
  overrides[WEBGL_PARAM_IDS.MAX_CUBE_MAP_TEXTURE_SIZE] = textureLimit;
  overrides[WEBGL_PARAM_IDS.MAX_RENDERBUFFER_SIZE] = renderbufferLimit;
  overrides[WEBGL_PARAM_IDS.MAX_VERTEX_UNIFORM_VECTORS] = entry.vertexUniform;
  overrides[WEBGL_PARAM_IDS.MAX_VARYING_VECTORS] = entry.varying;
  overrides[WEBGL_PARAM_IDS.ALIASED_POINT_SIZE_RANGE] = pointSizeLimit;
  overrides[WEBGL_PARAM_IDS.UNIFORM_BUFFER_OFFSET_ALIGNMENT] = uniformBufferOffsetAlignment;
  overrides[WEBGL_PARAM_IDS.MAX_UNIFORM_BLOCK_SIZE] = maxUniformBlockSize;
  overrides[WEBGL_PARAM_IDS.MAX_VERTEX_UNIFORM_BLOCKS] = maxVertexUniformBlocks;
  overrides[WEBGL_PARAM_IDS.MAX_FRAGMENT_UNIFORM_BLOCKS] = maxFragmentUniformBlocks;
  overrides[WEBGL_PARAM_IDS.MAX_COMBINED_TEXTURE_IMAGE_UNITS] = maxCombinedTextureImageUnits;
  return overrides;
}


/**
 * Check if a WebGL extension belongs to another GPU vendor and should be filtered.
 */
function isDisallowedVendorExtension(name, targetVendor, metaMode = 'noise') {
  if (!targetVendor || metaMode === 'real') return false;
  const lower = String(name || '').toLowerCase();
  const v = String(targetVendor || '').toLowerCase();
  if (lower.startsWith('nv_') && v !== 'nvidia') return true;
  if (lower.startsWith('amd_') && v !== 'amd') return true;
  if (lower.startsWith('intel_') && v !== 'intel') return true;
  if (lower.startsWith('qcom_') && v !== 'qualcomm') return true;
  return false;
}

function expectedClientHintPlatform(os) {
  if (os === 'macos' || os === 'macos_arm') return 'macOS';
  if (os === 'linux') return 'Linux';
  return 'Windows';
}

module.exports = {
  hashSeed,
  u32,
  mulberry32,
  WEBGL_PRESETS,
  LEGACY_MACOS_WEBGL_PRESETS,
  webglPresetsForOs,
  WEBGL_GPU_LIMITS,
  HOST_WEBGL2_DEFAULTS,
  WEBGL_PARAM_IDS,
  normalizeGpuArchitecture,
  webglParameterOverrides,
  isDisallowedVendorExtension,
  expectedClientHintPlatform,
  buildWebglFpPayload,
  desktopOs,
  MEDIA_DEVICE_POOLS_BY_OS,
  MEDIA_DEVICE_TEMPLATES,
  WINDOWS_SPEECH_VOICES,
  MACOS_SPEECH_VOICES,
  ANDROID_SPEECH_VOICES,
  GOOGLE_SPEECH_VOICES,
  SPEECH_VOICE_POOL,
  speechVoicePoolForOs,
  DEVICE_NAME_PREFIXES,
  DEVICE_NAME_SUFFIXES,
  DEFAULT_STABILITY_HOSTS,
  DEFAULT_STABILITY_SKIP_HOSTS,
  normalizeHost,
  hostMatchesPattern,
  listIncludesHost,
  resolveStabilityPolicy,
  matchStabilityHost,
  sampleCanvasBlocks,
  hammingDistance,
  applyStableCanvasNoise,
  withinHammingThreshold,
  createBatteryFromSeed,
  createMediaDevicesFromSeed,
  createSpeechVoicesFromSeed,
  createDeviceNameFromSeed,
  createLocalIpFromSeed,
  createLocalMdnsFromSeed,
  LEGACY_MACOS_ARM_WEBGL_PRESETS,
  formatGeopositionValue,
  audioMarkFromSeed,
  clientRectMarkFromSeed,
};
