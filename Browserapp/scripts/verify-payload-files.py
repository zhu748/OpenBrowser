"""Compare the finished Linux tarball or a read-only mounted .app with staging.

Never extract a member, execute code from an archive, or use an archive name
to choose a file on the host. The staged tree supplies every lookup path.
"""
import gzip
import os
from pathlib import Path
import stat
import sys
import tarfile


def tree(root):
    if not stat.S_ISDIR(root.lstat().st_mode):
        raise ValueError(f"not a real payload directory: {root}")
    # The selected root itself must be real, but its system temp-directory
    # ancestor may have an alias (e.g. /var -> /private/var on macOS).
    root = root.resolve(strict=True)
    entries = {}
    pending = [root]
    while pending:
        item = pending.pop()
        name = item.relative_to(root.parent).as_posix()
        info = item.lstat()
        entries[name] = (item, info)
        if stat.S_ISDIR(info.st_mode):
            pending.extend(item.iterdir())
        elif stat.S_ISLNK(info.st_mode):
            link = Path(os.readlink(item))
            if link.is_absolute() or not item.resolve(strict=True).is_relative_to(root):
                raise ValueError(f"out-of-tree payload link: {name}")
        elif not stat.S_ISREG(info.st_mode):
            raise ValueError(f"not a regular payload entry: {name}")
    return entries


def compare_bytes(left, right, name):
    while True:
        data = left.read(1024 * 1024)
        if data != right.read(len(data) or 1):
            raise ValueError(f"payload bytes differ: {name}")
        if not data:
            return


def verify_tar(stage, artifact):
    expected = tree(stage)
    with gzip.open(artifact, "rb") as compressed:
        with tarfile.open(fileobj=compressed, mode="r|") as archive:
            for member in archive:
                # Reject extra, duplicate, absolute and traversing names before
                # opening anything. A hard link is not a regular file here.
                if member.name not in expected:
                    raise ValueError(f"unexpected archive member: {member.name!r}")
                item, info = expected.pop(member.name)
                if stat.S_IMODE(info.st_mode) != member.mode:
                    raise ValueError(f"mode differs: {member.name}")
                if member.isdir() and stat.S_ISDIR(info.st_mode):
                    continue
                if member.issym() and stat.S_ISLNK(info.st_mode) and member.linkname == os.readlink(item):
                    continue
                regular = member.type in (tarfile.REGTYPE, tarfile.AREGTYPE)
                if regular and stat.S_ISREG(info.st_mode) and member.size == info.st_size:
                    with archive.extractfile(member) as contents, item.open("rb") as source:
                        compare_bytes(contents, source, member.name)
                    continue
                raise ValueError(f"type, target or size differs: {member.name}")
        # tar stops at the end-of-archive marker; validate the gzip trailer too.
        while compressed.read(1024 * 1024):
            pass
    if expected:
        raise ValueError(f"missing archive member: {next(iter(expected))}")


def verify_bundle(stage, mounted):
    expected, actual = tree(stage), tree(mounted)
    if expected.keys() != actual.keys():
        raise ValueError(f"bundle member mismatch: {next(iter(expected.keys() ^ actual.keys()))}")
    for name, (source, info) in expected.items():
        copy, observed = actual[name]
        if info.st_mode != observed.st_mode:
            raise ValueError(f"bundle type or mode differs: {name}")
        if stat.S_ISREG(info.st_mode):
            with source.open("rb") as left, copy.open("rb") as right:
                compare_bytes(left, right, name)
        elif stat.S_ISLNK(info.st_mode) and os.readlink(source) != os.readlink(copy):
            raise ValueError(f"bundle link differs: {name}")


if __name__ == "__main__":
    mode, stage_path, result_path = sys.argv[1:]
    {"tar": verify_tar, "bundle": verify_bundle}[mode](Path(stage_path).absolute(), Path(result_path).absolute())
