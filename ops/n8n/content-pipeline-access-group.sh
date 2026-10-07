#!/bin/bash
# Unraid rebuilds /etc/group at boot. Restore only this private editorial group.
set -euo pipefail
name=contentpipeline
gid=1800
for account in rigarashi leigh; do id "$account" >/dev/null; done
if getent group "$name" >/dev/null; then
    [ "$(getent group "$name" | cut -d: -f3)" = "$gid" ]
else
    ! getent group "$gid" >/dev/null
    groupadd -g "$gid" "$name"
fi
for account in rigarashi leigh; do usermod -a -G "$name" "$account"; done
[ "$(getent group "$name" | cut -d: -f4)" = 'rigarashi,leigh' ] ||
[ "$(getent group "$name" | cut -d: -f4)" = 'leigh,rigarashi' ]
