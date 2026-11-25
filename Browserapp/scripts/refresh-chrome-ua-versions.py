#!/usr/bin/env python3
"""Refresh the bundled UA pool from the official Chrome Version History API."""

from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory
from urllib.parse import urlencode
from urllib.request import urlopen


SOURCE = 'https://developer.chrome.com/docs/web-platform/versionhistory/reference'
ENDPOINT = 'https://versionhistory.googleapis.com/v1/chrome/platforms/{platform}/channels/{channel}/versions'
OUTPUT = Path(__file__).resolve().parents[1] / 'automation/data/chrome-release-versions.json'
PLATFORMS = {
    'windows': 'win64',
    'macos': 'mac',
    'macos_arm': 'mac_arm64',
    'linux': 'linux',
    'android': 'android',
    'ios': 'ios',
}
CHANNELS = ('stable', 'beta', 'dev', 'canary')
EXTENDED_STABLE_PLATFORMS = {'win64', 'mac', 'mac_arm64'}
VERSION = re.compile(r'[1-9][0-9]*\.[0-9]+\.[0-9]+\.[0-9]+')


def channel_versions(request):
    os_name, platform, channel = request
    minimum = 'version>=100.0.0.0'
    query = {'filter': minimum, 'page_size': 1000, 'order_by': 'version desc'}
    endpoint = ENDPOINT.format(platform=platform, channel=channel)
    versions = set()
    while True:
        with urlopen(endpoint + '?' + urlencode(query), timeout=30) as response:
            page = json.load(response)
        for row in page['versions']:
            version = row['version']
            if not VERSION.fullmatch(version):
                raise ValueError(f'Unexpected Chrome version {version!r} from {endpoint}')
            versions.add(version)
        if not page.get('nextPageToken'):
            return os_name, versions
        # Advance by version because opaque page tokens from cached responses can expire.
        oldest = page['versions'][-1]['version']
        next_filter = f'{minimum},version<{oldest}'
        if next_filter == query['filter']:
            raise ValueError(f'Chrome version history stopped advancing for {endpoint}')
        query['filter'] = next_filter


def snapshot_text(versions, channels):
    info = {'source': SOURCE, 'endpoint': ENDPOINT, 'platforms': PLATFORMS, 'channels': channels}
    lines = [json.dumps(info, indent=2).removesuffix('\n}') + ',', '  "versions": {']
    for os_name, releases in versions.items():
        lines.append(f'    "{os_name}": {{')
        for major in sorted(releases, key=int):
            ordered = sorted(releases[major], key=lambda version: tuple(map(int, version.split('.'))), reverse=True)
            lines.append(f'      "{major}": {json.dumps(ordered)},')
        if releases:
            lines[-1] = lines[-1].removesuffix(',')
        lines.append('    },')
    lines[-1] = lines[-1].removesuffix(',')
    return '\n'.join([*lines, '  }', '}', ''])


def main():
    channels = {
        platform: (*CHANNELS, 'extended') if platform in EXTENDED_STABLE_PLATFORMS else CHANNELS
        for platform in PLATFORMS.values()
    }
    previous = json.loads(OUTPUT.read_text(encoding='utf-8'))['versions'] if OUTPUT.exists() else {}
    # Retain published versions from past snapshots so saved draws keep working.
    versions = {
        os_name: {major: set(releases) for major, releases in previous.get(os_name, {}).items()}
        for os_name in PLATFORMS
    }
    requests = [
        (os_name, platform, channel)
        for os_name, platform in PLATFORMS.items()
        for channel in channels[platform]
    ]
    with ThreadPoolExecutor(max_workers=8) as pool:
        for os_name, releases in pool.map(channel_versions, requests):
            for version in releases:
                major = version.split('.', 1)[0]
                versions[os_name].setdefault(major, set()).add(version)

    with TemporaryDirectory(dir=OUTPUT.parent) as directory:
        snapshot = Path(directory) / OUTPUT.name
        snapshot.write_text(snapshot_text(versions, channels), encoding='utf-8')
        snapshot.replace(OUTPUT)
    for os_name, majors in versions.items():
        print(f'{os_name}: {sum(map(len, majors.values()))} versions across {len(majors)} majors')


if __name__ == '__main__':
    main()
