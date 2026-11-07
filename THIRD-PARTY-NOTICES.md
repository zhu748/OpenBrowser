# Third-Party Notices and Redistribution Concerns

OpenBrowser is distributed under the MIT license (see `LICENSE`). This file
inventories third-party material that ships inside the repository and whose
original licensing does **not** automatically permit redistribution under MIT.
It exists so maintainers, packagers, and downstream users can make informed
decisions — and so the gaps below can be closed deliberately instead of
silently.

## 1. Platform font subsets (`Browserapp/assets/font-subsets/`)

The anti-fingerprinting engine seeds each persona with platform-typical font
metrics. It does this by shipping subsetted copies of real platform fonts:

| Platform | Families | Representative families | License situation |
| --- | --- | --- | --- |
| `windows/` | 60 | Arial, Bahnschrift, Calibri, Cambria, Candara, Comic Sans MS, Consolas, Constantia, Corbel, Courier New, Georgia, Impact, Lucida Console, Malgun Gothic, Marlett, Segoe-family glyphs, Times New Roman | **Proprietary Microsoft fonts.** Redistributing copies or subsets is not permitted by the font licenses, regardless of subsetting or format conversion (`.ttf`/`.otf` → `.woff2`). |
| `macos/` | 76 | American Typewriter, Andale Mono, Apple SD Gothic Neo, Arial (Apple-licensed build), Avenir Next, Arial Rounded MT Bold, Arial Unicode MS | **Proprietary Apple and Apple-licensed fonts.** Same restriction as above. |
| `linux/` | 24 | DejaVu Sans/Serif/Mono, Liberation families, FreeMono/FreeSans, Abyssinica SIL | Open-source (permissive / GPL-with-exception). Redistribution is generally compatible; keep the upstream license texts. |
| `android/` | 10 | Roboto, Noto Sans/Serif, Noto Color Emoji, Cutive Mono, Coming Soon, Carrois Gothic, Droid Sans | Apache 2.0 / SIL OFL. Redistribution is compatible; keep the upstream license texts. |

Total payload is ~19 MB (not the larger figure sometimes quoted for the
browser-kernel LFS objects, which is a separate concern — see §3).

**Why this matters.** `windows/` and `macos/` (~136 of 170 families) are
unauthorized redistributions under the MIT grant. Subsetting, renaming, or
converting format does not remove the underlying copyright. Shipping them in a
public repository or in released installers exposes every mirror and every
downstream packager to the same problem.

**Mitigation options**, in increasing order of effort:

1. **Disclosure (current state).** Keep the files but publish this notice, and
   restrict official release channels until resolved. This is the minimum
   honest baseline; it does not make redistribution lawful.
2. **User-supplied fonts.** Ship the engine without `windows/` and `macos/`
   payloads; on first run, offer to import the fonts locally installed on the
   user's machine (the user already has a license for their own platform) and
   build subsets on the fly. Cross-platform personas would need the user to
   supply the foreign platform's fonts themselves.
3. **Metric-compatible open replacements.** Replace proprietary families with
   open, metric-compatible substitutes (e.g. Carlito for Calibri, Caladea for
   Cambria, Liberation Serif/Sans/Mono for Times New Roman/Arial/Courier New,
   Gelasio for Georgia). This keeps layout metrics authentic but changes
   low-level table fingerprints — a product-level trade-off that needs a
   fingerprint-consistency review before adoption.
4. **Licensing.** Negotiate redistribution rights. Realistic only for a
   commercial entity; not available to a hobby fork.

Option 2 is the recommended long-term direction; option 1 is what this file
implements today.

## 2. Anonymous native helper sources (`Browserapp/native-*.cs`)

The Windows input-mirroring / hotkey / window-driver helpers
(`native-input-mirror.cs`, `native-sync-hotkeys.cs`, `native-profile-marker.cs`,
`native-omnibox-driver.cs`, `native-tab-shortcut-driver.cs`,
`native-extension-popup-driver.cs`, `native-upper-ui-jitter-driver.cs`, …)
carry **no copyright or license header**, and the repository history does not
record their provenance.

An earlier internal review flagged `native-input-mirror.cs` as "AGPL code
mixed into an MIT project". A re-audit found **no AGPL or GPL markers in the
file** and no other in-repo evidence for that claim, so it should be treated
as *unproven*, not as fact. What remains true is that sourceless, headerless
code cannot be relicensed confidently at all.

Recommended action: obtain the upstream provenance from the original author
and add an SPDX header to every `native-*.cs` file. Until then, these files
should be treated as "license unknown" for redistribution purposes.

## 3. Browser kernel distribution (`Browserapp/kernels/`, LFS)

Kernel binaries are Git-LFS objects (~24 MB of local pointer state; the real
objects are far larger) plus runtime downloads from `donutbrowser.com`
(see `docs/` update-trust notes). Chromium is BSD-licensed, but a
redistributed build must comply with the Chromium license and trademark
conditions, and the download channel must remain integrity-verified (the
SHA-256 manifest path added in the security hardening pass). Confirm the
kernel build's own licensing with its maintainers before distributing it
inside OpenBrowser artifacts.

---

Nothing in this file changes the MIT grant for OpenBrowser's original code;
it documents where that grant cannot reach.
