// API-first selection by meeting date. Source copies and metadata are retained.
const fs = require('fs'), path = require('path');
function select(root, now = Date.now()) {
  const cutoff = now - 10 * 86400000, api = new Map(), ordinary = [], paths = [];
  const stats = {api_selected: 0, legacy_selected: 0, legacy_duplicates_excluded: 0,
    api_shadow_duplicates_excluded: 0, legacy_unknown_date: 0,
    api_outside_window: 0, api_date_basis: 'started_at', legacy_date_basis: 'meeting_date'};
  const identity = name => name.match(/(?:^krisp-|__krisp_)([a-f0-9]{32})(?=[_.-]|$)/i)?.[1].toLowerCase();
  function walk(dir) {
    if (!fs.existsSync(dir)) throw Error('Configured transcript root is unavailable');
    for (const entry of fs.readdirSync(dir, {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(file); continue; }
      if (!entry.isFile() || !/\.txt$/i.test(entry.name)) continue;
      if (/__krisp_[a-f0-9]{32}/i.test(entry.name)) {
        const sidecar = file.slice(0,-4)+'.json';
        if (!fs.existsSync(sidecar)) throw Error('API transcript is missing its metadata sidecar');
        const raw = fs.readFileSync(sidecar), data = JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));
        const id = identity(entry.name), date = Date.parse(data.started_at);
        if (!id || String(data.id).toLowerCase() !== id || !Number.isFinite(date) ||
            !/(?:Z|[+-]\d\d:\d\d)$/.test(data.started_at)) throw Error('API identity or meeting date is invalid');
        const text = fs.readFileSync(file), prior = api.get(id);
        if (prior) {
          if (!prior.raw.equals(raw) || !prior.text.equals(text)) throw Error('Conflicting API copies require review');
          stats.api_shadow_duplicates_excluded++;
        } else api.set(id, {file,date,raw,text});
      } else ordinary.push(file);
    }
  }
  walk(path.join(root,'Krisp-API')); walk(path.join(root,'Krisp'));
  for (const item of api.values()) {
    if (item.date >= cutoff && item.date <= now) { paths.push(item.file); stats.api_selected++; }
    else stats.api_outside_window++;
  }
  for (const file of ordinary) {
    const id = identity(path.basename(file));
    if (id && api.has(id)) { stats.legacy_duplicates_excluded++; continue; }
    const header = fs.readFileSync(file,'utf8').slice(0,4096);
    const explicit = header.match(/^(?:Started|Meeting[ _]?Date|Date):\s*(\d{4}-\d{2}-\d{2}(?:T[^\r\n ]+)?)/im)?.[1];
    const named = path.basename(file).match(/^(\d{4}-\d{2}-\d{2})(?=[_ .-])/ )?.[1];
    const date = Date.parse(explicit || named || '');
    if (!Number.isFinite(date)) { stats.legacy_unknown_date++; continue; }
    if (date >= cutoff && date <= now) { paths.push(file); stats.legacy_selected++; }
  }
  if (paths.some(file => /[\r\n]/.test(file))) throw Error('Transcript filename contains a newline');
  return {paths:paths.sort(),stats};
}
if (require.main === module) {
  const root = process.env.IAS_TRANSCRIPTS_ROOT || '/data/output/ias-linkedin-acceptance/transcripts';
  const result = select(root);
  if (process.argv.includes('--report')) console.log(JSON.stringify({...result.stats,selected_count:result.paths.length}));
  else if (result.paths.length) console.log(result.paths.join('\n'));
}
module.exports = {select};
