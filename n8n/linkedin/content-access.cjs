// User shares do not reliably inherit GID through Unraid shfs. Set it explicitly.
const fs=require('fs'),path=require('path');
function readable(file,directory=false){
 const root=process.env.IAS_PRIVACY_ROOT||'/data/output/ias-linkedin-acceptance';
 if(path.resolve(root)==='/data/output/ias-linkedin')fs.chownSync(file,-1,1800);
 fs.chmodSync(file,directory?0o2750:0o640);
}
module.exports={readable};
