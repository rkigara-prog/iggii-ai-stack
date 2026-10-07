// Preserve the deployed v0.2.2 API-first/date/dedup rules, with an explicit
// isolated input root for migration acceptance. No transcript content is logged.
const fs = require('fs'), path = require('path');
function select(root, now = Date.now()) {
  const cutoff = now - 10 * 86400000;
  const api = path.join(root, 'Krisp-API'), legacy = path.join(root, 'Krisp');
  const known = new Set(), paths = [];
  const stats = {api_selected: 0, legacy_selected: 0, legacy_duplicates_excluded: 0,
    api_outside_window: 0, api_date_basis: 'started_at', legacy_date_basis: 'mtime'};
  for (const name of fs.readdirSync(api).sort()) {
    if (!name.endsWith('.json')) continue;
    const file = path.join(api, name), data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const text = file.slice(0, -5) + '.txt';
    if (!fs.existsSync(text)) continue;
    if (!/^[a-f0-9]{32}$/i.test(data.id || '') || !Number.isFinite(Date.parse(data.started_at)))
      throw Error('API identity or meeting date is invalid');
    const id = data.id.toLowerCase();
    if (known.has(id)) throw Error('Multiple API files have the same meeting ID');
    known.add(id);
    const date = Date.parse(data.started_at);
    if (date >= cutoff && date <= now) { paths.push(text); stats.api_selected++; }
    else stats.api_outside_window++;
  }
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(file); continue; }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.txt')) continue;
      const match = entry.name.match(/(?:^krisp-|__krisp_)([a-f0-9]{32})(?=[_.-]|$)/i);
      if (match && known.has(match[1].toLowerCase())) { stats.legacy_duplicates_excluded++; continue; }
      if (fs.statSync(file).mtimeMs >= cutoff) { paths.push(file); stats.legacy_selected++; }
    }
  }
  walk(legacy);
  if (paths.some(file => /[\r\n]/.test(file))) throw Error('Transcript filename contains a newline');
  return {paths: paths.sort(), stats};
}
if (require.main === module) {
  const root = process.env.IAS_TRANSCRIPTS_ROOT || '/data/output/ias-linkedin-acceptance/transcripts';
  const result = select(root);
  if (process.argv.includes('--report')) console.log(JSON.stringify({...result.stats, selected_count: result.paths.length}));
  else if (result.paths.length) console.log(result.paths.join('\n'));
}
module.exports = {select};
