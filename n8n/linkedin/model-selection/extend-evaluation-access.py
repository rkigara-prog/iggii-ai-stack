"""Extend the already-approved render ACL lease; changes no additional permissions.

Requires interactive sudo. Schedules a new rollback before cancelling the old timer.
Only the known lease from this evaluation can be extended.
"""
import argparse,importlib.util,json,os,shutil,subprocess
from datetime import datetime,timezone
from pathlib import Path
OLD='20261007T195326Z'
BASE=Path('/var/lib/linkedin-model-eval-access')
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--hours',type=int,choices=[24],required=True);a=p.parse_args()
 if os.geteuid()!=0 or os.environ.get('SUDO_USER')!='rigarashi':raise RuntimeError('Run interactively with sudo as rigarashi')
 if BASE.is_symlink() or BASE.stat().st_uid!=0 or BASE.stat().st_mode&0o077:raise RuntimeError('Unsafe lease root')
 original=BASE/OLD
 for f in [original,original/'acls.json',original/'restore.py']:
  if f.is_symlink() or f.stat().st_uid!=0 or f.stat().st_mode&0o077:raise RuntimeError('Unsafe original lease')
 old_unit='linkedin-eval-access-'+OLD.lower()
 subprocess.run(['/usr/bin/systemctl','is-active','--quiet',old_unit+'.timer'],check=True)
 if subprocess.run(['/usr/bin/systemctl','is-active','--quiet',old_unit+'.service']).returncode==0:raise RuntimeError('Rollback already in progress')
 spec=importlib.util.spec_from_file_location('access',Path(__file__).with_name('prepare-evaluation-access.py'));access=importlib.util.module_from_spec(spec);spec.loader.exec_module(access)
 records=json.loads((original/'acls.json').read_text())
 if [x['path'] for x in records]!=access.DEVICES:raise RuntimeError('Unexpected device set')
 for r in records:
  if os.stat(r['path']).st_rdev!=r['rdev']:raise RuntimeError('Device identity changed')
  observed=access.get_acl(r['path']).replace('user:rigarashi:','user:1000:')
  if sorted(observed.strip().splitlines())!=sorted(r['granted'].strip().splitlines()):raise RuntimeError('Current ACL differs; do not overwrite another change')
 stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ');lease=BASE/stamp;lease.mkdir(mode=0o700)
 for name in ['acls.json','restore.py']:shutil.copyfile(original/name,lease/name);os.chmod(lease/name,0o600)
 unit='linkedin-eval-access-'+stamp.lower()
 subprocess.run(['/usr/bin/systemd-run','--unit='+unit,'--on-active=24h','/usr/bin/python3',str(lease/'restore.py')],check=True)
 subprocess.run(['/usr/bin/systemctl','is-active','--quiet',unit+'.timer'],check=True)
 # Rights are unchanged. Only replace the rollback schedule after the new one exists.
 subprocess.run(['/usr/bin/systemctl','stop',old_unit+'.timer'],check=True)
 record={'extendedAt':datetime.now(timezone.utc).isoformat(),'hours':24,'oldLease':OLD,'newLease':stamp,'devices':access.DEVICES,'newRights':False,'rollbackCommand':'sudo /usr/bin/python3 '+str(lease/'restore.py')}
 (lease/'extension.json').write_text(json.dumps(record,indent=2)+'\n');os.chmod(lease/'extension.json',0o600)
 output=Path('/home/rigarashi/.local/share/linkedin-model-selection-20261007/access-extension.private.json')
 fd=os.open(output,os.O_CREAT|os.O_EXCL|os.O_WRONLY|os.O_NOFOLLOW,0o600)
 with os.fdopen(fd,'w') as f:json.dump(record,f,indent=2)
 os.chown(output,1000,1000)
 print('Existing named-user GPU access extended for 24 hours; no service, socket, group or sudoers change.')
 print('Early rollback: '+record['rollbackCommand'])
if __name__=='__main__':main()
