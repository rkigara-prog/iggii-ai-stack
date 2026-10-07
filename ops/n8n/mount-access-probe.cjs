// Run as the regular container user after an approved recreation. Never print
// transcript contents or filenames. Only the isolated benign probe file is written.
const fs = require('fs'), path = require('path');
const {select} = require('/data/output/omc-krisp/select-transcripts-v0.2.2.cjs');
for (const root of ['/data/transcripts', '/data/output']) fs.accessSync(root, fs.constants.R_OK | fs.constants.X_OK);
const selected = select('/data/transcripts');
for (const file of selected.paths) { const fd = fs.openSync(file, 'r'); fs.closeSync(fd); }
const root = '/data/output/ias-linkedin-acceptance';
const file = path.join(root, 'mount-access-probe.json');
fs.writeFileSync(file, JSON.stringify({mountAccessProbe: true}), {mode: 0o600, flag: 'wx'});
console.log(JSON.stringify({uid: process.getuid(), gid: process.getgid(), groups: process.getgroups(),
  readableSelectedTranscripts: selected.paths.length, probeFile: file}));
