#!/bin/bash
# Apply on Unraid as root. Never changes share users, OMC identities or transcript ACLs.
set -euo pipefail
base=/mnt/user/Shared/ContentPipeline/output
current=$base/ias-linkedin
archive=$base/Archive/ias-linkedin
[ "$(getent group contentpipeline | cut -d: -f3)" = 1800 ]
[ "$(id -u rigarashi)" = 1000 ] && [ "$(id -u leigh)" = 1001 ]
[ -d "$current" ] && [ ! -L "$current" ]
mkdir -p "$archive" "$current/Reviews"
for directory in "$current" "$archive"; do
    chown 1000:1800 "$directory"
    setfacl -b "$directory"
    setfacl -k "$directory"
    chmod 2750 "$directory"
    setfacl -m u:leigh:r-x,g::r-x,m::r-x,o::--- "$directory"
    setfacl -d -m u::rwx,u:leigh:r-x,g::r-x,m::r-x,o::--- "$directory"
done
# Only known production helpers/markers/artifacts and this guide. No recursive cleanup.
find "$current" -maxdepth 1 -type f \( -name '*-model-eval-*.md' -o -name '*-model-eval-*.json' -o -name 'theme-list-model-eval-qwen35-*.txt' -o -name 'content-access.cjs' -o -name '*-artifact.cjs' -o -name 'privacy-policy.cjs' -o -name 'select-transcripts.cjs' -o -name '*-status.json' -o -name 'CURRENT.md' -o -name 'START-HERE.md' \) -print0 |
while IFS= read -r -d '' file; do
    # The pipeline service and Robert share UID 1000; do not change this identity.
    chown 1000:1800 "$file"
    setfacl -b "$file"
    chmod 640 "$file"
    setfacl -m u:leigh:r--,g::r--,m::r--,o::--- "$file"
done
reviews=$current/Reviews
[ ! -L "$reviews" ]
chown 1000:1800 "$reviews"
setfacl -b "$reviews"
setfacl -k "$reviews"
chmod 2770 "$reviews"
setfacl -m u:leigh:rwx,g::rwx,m::rwx,o::--- "$reviews"
setfacl -d -m u::rwx,u:rigarashi:rwx,u:leigh:rwx,g::rwx,m::rwx,o::--- "$reviews"
echo 'Production and archive access restricted to Robert, Leigh and the pipeline service.'
