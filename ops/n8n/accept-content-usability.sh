#!/bin/bash
# Focused production gate; run as root on Unraid after deploying the repair.
# It uses the installed Samba identities locally. No password/hash is printed.
set -euo pipefail
umask 077
output=/mnt/user/Shared/ContentPipeline/output
current=$output/ias-linkedin
private=$(mktemp -d /tmp/content-usability-gate.XXXXXX)
trap 'rm -f "$private/passdb" "$private/auth"' EXIT
cycle_date=${1:?Pass the date of the previously validated complete output set}
[[ "$cycle_date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]
files=("theme-list-model-eval-qwen35-$cycle_date.txt" "content-brief-model-eval-$cycle_date.md" "content-candidates-model-eval-$cycle_date.json" "linkedin-editorial-plan-model-eval-$cycle_date.md" "linkedin-editorial-plan-model-eval-$cycle_date.json")
for file in "${files[@]}"; do sha256sum "$current/$file"; done > "$private/sources-before"
# No recursive mutation: record transcripts and all pre-existing legacy outputs/archives.
find /mnt/user/Shared/Transcripts -type f -print0 | sort -z | xargs -0 sha256sum > "$private/transcripts-before"
find "$output" -maxdepth 1 -type f -print0 | sort -z | xargs -0 sha256sum > "$private/legacy-before"
find "$output/Archive" -maxdepth 1 -type f -print0 | sort -z | xargs -0 sha256sum > "$private/archives-before"
input=$(printf '{"candidateFile":"content-candidates-model-eval-%s.json","planFile":"linkedin-editorial-plan-model-eval-%s.json"}' "$cycle_date" "$cycle_date" | base64 -w0)
docker exec -e IAS_PRIVACY_ROOT=/data/output/ias-linkedin n8n node /data/output/ias-linkedin/archive-artifact.cjs snapshot-existing "$input" > "$private/archive-result"
for file in "${files[@]}"; do sha256sum "$current/$file"; done > "$private/sources-after"
cmp "$private/sources-before" "$private/sources-after"
sha256sum -c "$private/transcripts-before" > "$private/transcript-preservation.log"
sha256sum -c "$private/legacy-before" > "$private/legacy-preservation.log"
sha256sum -c "$private/archives-before" > "$private/archive-preservation.log"
archive_relative=$(docker exec n8n node -e 'const fs=require("fs"),p=require("path");const root="/data/output/ias-linkedin",s=JSON.parse(fs.readFileSync(root+"/current-status.json"));console.log(p.relative("/data/output",p.resolve(root,s.archive)));')
[[ "$archive_relative" =~ ^Archive/ias-linkedin/[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-f0-9]{64}$ ]]
for file in "${files[@]}"; do cmp "$current/$file" "$output/$archive_relative/$file"; done
for account in leigh rigarashi; do
    pdbedit -L -w -u "$account" > "$private/passdb"
    awk -F: -v name="$account" '$1==name {printf "username = %s\npassword = %s\ndomain = WORKGROUP\n", $1, $4}' "$private/passdb" > "$private/auth"
    test -s "$private/auth"
    commands="cd ContentPipeline/output/ias-linkedin; ls; get START-HERE.md $private/guide; get CURRENT.md $private/index;"
    for file in "${files[@]}"; do commands+=" get $file $private/current-$file;"; done
    commands+=" cd ../$archive_relative; ls; get manifest.json $private/manifest;"
    for file in "${files[@]}"; do commands+=" get $file $private/archived-$file;"; done
    smbclient //127.0.0.1/Shared --pw-nt-hash -A "$private/auth" -c "$commands" > "$private/smb-$account.log" 2>&1
    ! grep -Eq 'NT_STATUS|failed|Error' "$private/smb-$account.log"
    cmp "$private/guide" "$current/START-HERE.md"
    cmp "$private/index" "$current/CURRENT.md"
    for file in "${files[@]}"; do cmp "$private/current-$file" "$current/$file"; cmp "$private/archived-$file" "$current/$file"; done
    printf 'Acceptance review written by %s.\n' "$account" > "$private/review"
    smbclient //127.0.0.1/Shared --pw-nt-hash -A "$private/auth" -c "cd ContentPipeline/output/ias-linkedin/Reviews; put $private/review acceptance-$account.txt; get acceptance-$account.txt $private/review-return; del acceptance-$account.txt" > "$private/smb-write-$account.log" 2>&1
    ! grep -Eq 'NT_STATUS|failed|Error' "$private/smb-write-$account.log"
    cmp "$private/review" "$private/review-return"
done
# Actual open calls, not just access(2), verify the excluded service identity.
setpriv --reuid=1002 --regid=100 --init-groups sh -c 'if head -c 0 "$1" 2>/dev/null; then exit 1; fi' sh "$current/CURRENT.md"
setpriv --reuid=1001 --regid=100 --init-groups sh -c 'if printf x >> "$1" 2>/dev/null; then exit 1; fi' sh "$current/privacy-artifact.cjs" > /dev/null 2>&1
smbclient //127.0.0.1/Shared -N -c 'ls' > "$private/guest.log" 2>&1 && exit 1
printf '{"gate":"content-pipeline-usability","passed":true,"leighAuthenticatedSmbReadWrite":true,"robertAuthenticatedSmbReadWrite":true,"currentIndexDiscoverable":true,"archiveFilesVerified":5,"workingOutputBytesPreserved":true,"transcriptBytesPreserved":true,"legacyOutputBytesPreserved":true,"legacyArchiveBytesPreserved":true,"omcWorkerExcluded":true,"guestExcluded":true,"generatedFilesProtected":true}\n'
