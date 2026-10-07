// Stage a small real-meeting sample privately. Never print filenames or content.
const fs = require('fs'), path = require('path');
const {select} = require('/data/output/omc-krisp/select-transcripts-v0.2.2.cjs');
const root = process.argv[2] || '/data/output/ias-linkedin-real-privacy';
const matches = (text, pattern) => (text.match(pattern) || []).length;
const selected = select('/data/transcripts');
const records = selected.paths.map(file => {
  const text = fs.readFileSync(file, 'utf8');
  const technical = matches(text, /\b(security|cybersecurity|governance|identity|access|network|segmentation|infrastructure|cloud|architecture|server|backup|resilience|recovery|risk|automation|observability|logging|firewall|data|software|AI|technology|compliance|assessment)\b/gi);
  const engagement = matches(text, /\b(client|customer|contract|proposal|budget|pricing|invoice|project|engagement|deadline|audit|incident|procurement)\b|\$\s*\d/gi);
  const personal = matches(text, /\b(family|daughter|son|wife|husband|parent|medical|illness|diagnosis|hospital|religion|religious|church|grief|salary|compensation|performance|staffing|hiring|employee|termination|career)\b/gi);
  const admin = matches(text, /\b(schedule|calendar|appointment|availability|planning|follow.up|meeting|administrative|timesheet|billing)\b/gi);
  return {file, text, technical, engagement, personal, admin, density: technical / Math.max(1, text.length / 1000)};
});
if (records.length < 4) throw Error('Fewer than four readable recent meetings');
const chosen = [];
function choose(stratum, score) {
  const next = records.filter(record => !chosen.some(item => item.record.file === record.file))
    .sort((a, b) => score(b) - score(a) || a.file.localeCompare(b.file))[0];
  chosen.push({stratum, record: next});
}
choose('technical-dense', record => record.density);
choose('mixed-technical-engagement', record => Math.min(record.technical, record.engagement) / Math.max(1, record.text.length / 1000));
choose('people-personal', record => record.personal / Math.max(1, record.text.length / 1000));
choose('administrative-lower-technical', record => (record.admin + record.engagement) / Math.max(1, record.technical));
const manifest = [];
for (let index = 0; index < chosen.length; index++) {
  const {stratum, record} = chosen[index];
  const id = (index + 1).toString(16).padStart(32, '0');
  const label = 'S' + String(index + 1).padStart(2, '0');
  const destination = path.join(root, 'transcripts', 'Krisp-API', label);
  let startedAt = new Date(fs.statSync(record.file).mtimeMs).toISOString();
  const metadataPath = record.file.slice(0, -4) + '.json';
  if (fs.existsSync(metadataPath)) startedAt = JSON.parse(fs.readFileSync(metadataPath)).started_at;
  fs.writeFileSync(destination + '.json', JSON.stringify({id, started_at: startedAt}), {mode: 0o600});
  fs.writeFileSync(destination + '.txt', record.text, {mode: 0o600});
  manifest.push({label, stratum, sourceFile: record.file, stagedFile: destination + '.txt',
    characters: record.text.length, technicalMatches: record.technical,
    engagementMatches: record.engagement, personalMatches: record.personal,
    administrativeMatches: record.admin});
}
fs.writeFileSync(path.join(root, 'sample-manifest.private.json'), JSON.stringify(manifest, null, 2), {mode: 0o600});
console.log(JSON.stringify({availableRecentMeetings: records.length, sampledMeetings: manifest.length,
  strata: manifest.map(item => item.stratum), minimumCharacters: Math.min(...manifest.map(item => item.characters)),
  maximumCharacters: Math.max(...manifest.map(item => item.characters))}));
