#!/usr/bin/env bash
# Fetch the NSS certutil binary for the Firefox worker-MITM trust installer.
#
# The Firefox engine imports its per-profile MITM CA into the profile's NSS
# store; that needs certutil. Distros ship it as libnss3-tools. This script
# downloads and extracts it into kernels/certutil so findCertutil() locates it
# without root. macOS/Windows users should install nss-tools and put certutil
# on PATH (the installer falls back to PATH automatically).
set -euo pipefail
cd "$(dirname "$0")/.."

if command -v certutil >/dev/null 2>&1; then
  echo "certutil already on PATH; nothing to do" >&2
  exit 0
fi
if [ -x kernels/certutil ]; then
  echo "kernels/certutil already present" >&2
  exit 0
fi

case "$(uname -s)/$(uname -m)" in
  Linux/x86_64)
    tmp=$(mktemp -d)
    apt-get download libnss3-tools >&2
    dpkg-deb -x libnss3-tools_*_amd64.deb "$tmp"
    install -m 755 "$tmp/usr/bin/certutil" kernels/certutil
    rm -rf "$tmp" libnss3-tools_*_amd64.deb
    ;;
  *)
    echo "No automatic certutil fetch for $(uname -s)/$(uname -m); install nss-tools and retry" >&2
    exit 1
    ;;
esac
echo "kernels/certutil installed" >&2
