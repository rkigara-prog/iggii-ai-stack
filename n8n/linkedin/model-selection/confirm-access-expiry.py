"""Observe the existing rollback; never grant, revoke or extend permissions."""
import argparse
from datetime import datetime, timezone
import errno
import grp
import json
import os
from pathlib import Path
import stat
import struct
import subprocess

EXPIRY = datetime.fromisoformat('2026-10-08T20:51:03.634187+00:00')
UNIT = 'linkedin-eval-access-20261007t205103z'


def observe():
    now = datetime.now(timezone.utc)
    devices = []
    for path, rdev in [('/dev/dri/renderD128', 57984), ('/dev/dri/renderD129', 57985)]:
        record = {'path': path, 'matchesOriginalPermissions': False}
        try:
            info = os.stat(path)
            try:
                raw = os.getxattr(path, 'system.posix_acl_access')
                entries = [struct.unpack('<HHI', raw[i:i+8]) for i in range(4, len(raw), 8)]
            except OSError as error:
                if error.errno != errno.ENODATA:
                    raise
                entries = []
            record.update(ownerUid=info.st_uid, group=grp.getgrgid(info.st_gid).gr_name,
                          mode=oct(stat.S_IMODE(info.st_mode)), deviceIdentityUnchanged=info.st_rdev == rdev,
                          namedUserAclPresent=any(tag == 2 and uid == 1000 for tag, _, uid in entries),
                          effectiveUserReadWrite=os.access(path, os.R_OK | os.W_OK),
                          extendedAclPresent=bool(entries))
            record['matchesOriginalPermissions'] = (
                record['deviceIdentityUnchanged'] and info.st_uid == 0 and
                record['group'] == 'render' and record['mode'] == '0o660' and
                not entries and not record['effectiveUserReadWrite'])
        except OSError as error:
            record['error'] = type(error).__name__ + ':' + str(error.errno)
        devices.append(record)
    result = subprocess.run(
        ['systemctl', 'show', UNIT + '.service', '-p', 'Result', '-p', 'ExecMainStatus',
         '-p', 'ExecMainStartTimestamp', '-p', 'ExecMainExitTimestamp', '-p', 'ActiveState'],
        capture_output=True, text=True, timeout=15)
    service = dict(line.split('=', 1) for line in result.stdout.splitlines() if '=' in line)
    ran = bool(service.get('ExecMainStartTimestamp'))
    service_success = ran and service.get('Result') == 'success' and service.get('ExecMainStatus') == '0'
    restored = all(device['matchesOriginalPermissions'] for device in devices)
    status = 'pending_scheduled_expiry' if now < EXPIRY else 'confirmed' if restored else 'cleanup_not_confirmed'
    return {
        'checkedAt': now.isoformat(), 'scheduledExpiryUtc': EXPIRY.isoformat(),
        'status': status, 'cleanupConfirmed': status == 'confirmed',
        'originalDevicePermissionsRestored': restored,
        'rollbackServiceExecutionObserved': ran, 'rollbackServiceSuccessObserved': service_success,
        'serviceObservation': service, 'devices': devices,
        'permissionMutations': 0, 'modelCalls': 0,
        'mechanism': 'Existing root-owned systemd rollback; this observer only reads permissions',
        'limitation': 'A collected transient service may no longer expose execution status; device ACLs and effective access are checked directly.'
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = observe()
    payload = json.dumps(result, indent=2) + '\n'
    temporary = args.output.with_suffix('.tmp')
    temporary.write_text(payload)
    temporary.chmod(0o600)
    temporary.replace(args.output)
    print(json.dumps({'status': result['status'], 'checkedAt': result['checkedAt']}))
    return 0 if result['cleanupConfirmed'] else 2


if __name__ == '__main__':
    raise SystemExit(main())
