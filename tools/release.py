#!/usr/bin/env python3
"""Verify runtime changes, synchronize files and produce both distribution ZIPs."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import zipfile

EXCLUDED = {'.release-state.json', '.DS_Store', '.git', 'node_modules', '__pycache__', '.env'}

def inventory(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in root.rglob('*') if p.is_file() and not any(x in EXCLUDED or x.startswith('.env.') for x in p.relative_to(root).parts)}

def release(source, runtime, publish=False):
    if source.resolve() == runtime.resolve() or source.is_symlink() or runtime.is_symlink():
        raise RuntimeError('Source and runtime must be separate ordinary folders.')
    state = source / '.release-state.json'
    desired, actual = inventory(source), inventory(runtime)
    if state.exists():
        baseline = json.loads(state.read_text())
    elif actual == desired or not actual:
        baseline = actual
    else:
        raise RuntimeError('No baseline: compare source and runtime before initializing.')
    conflicts = [name for name in set(actual) | set(baseline)
                 if actual.get(name) != baseline.get(name) and actual.get(name) != desired.get(name)]
    if conflicts:
        raise RuntimeError('Runtime has independent changes; nothing written: ' + ', '.join(sorted(conflicts)))
    changed = [name for name in desired if desired[name] != actual.get(name)]
    removed = sorted(set(actual) - set(desired))
    print(f'{len(changed)} changed/new files; {len(removed)} removed files')
    if not publish:
        return
    # Keep a complete backup outside the extension and archives for recovery.
    backup = Path(tempfile.mkdtemp(prefix='MrSohnWordCheck-backup-', dir=source.parent))
    if runtime.exists():
        shutil.copytree(runtime, backup / 'runtime')
    try:
        runtime.mkdir(parents=True, exist_ok=True)
        for name in changed:
            destination = runtime / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            staging = destination.with_name(destination.name + '.release-tmp')
            shutil.copy2(source / name, staging)
            staging.replace(destination)
        for name in removed:
            (runtime / name).unlink()
        if inventory(runtime) != desired:
            raise RuntimeError('Runtime verification failed.')
        for root_name in ['MrSohnWordCheck', 'gemini-proofreader']:
            destination = source.parent / (root_name + '.zip')
            staging = destination.with_suffix('.zip.tmp')
            with zipfile.ZipFile(staging, 'w', zipfile.ZIP_DEFLATED) as archive:
                for name in sorted(desired):
                    archive.write(source / name, root_name + '/' + name)
            with zipfile.ZipFile(staging) as archive:
                packed = {name.removeprefix(root_name + '/'): hashlib.sha256(archive.read(name)).hexdigest() for name in archive.namelist()}
                if packed != desired:
                    raise RuntimeError('ZIP verification failed.')
            staging.replace(destination)
        temp_state = state.with_suffix('.tmp')
        temp_state.write_text(json.dumps(desired, ensure_ascii=False, indent=2) + '\n')
        temp_state.replace(state)
    except Exception:
        print(f'Release failed. Recovery backup: {backup}')
        raise
    print(f'Runtime and both ZIPs verified. Backup: {backup}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true', help='Write runtime and ZIPs (default: read-only check)')
    args = parser.parse_args()
    source = Path(__file__).resolve().parents[1]
    release(source, source.parent / 'gemini-proofreader', args.publish)
