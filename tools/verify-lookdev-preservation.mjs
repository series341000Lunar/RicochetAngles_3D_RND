import fs from 'node:fs';
import path from 'node:path';
import {repo,sha256} from './audit-lookdev-assets.mjs';
const out=path.join(repo,'Docs/global-lookdev');
const baseline=JSON.parse(fs.readFileSync(path.join(out,'preservation-before.json'),'utf8'));
// One deliberate existing-document change: DCC direction only, allowed by brief.
const allowed=new Set([path.join(repo,'dcc00/README.md')]);
const changed=[],missing=[];
for(const entry of baseline){
  if(allowed.has(entry.file))continue;
  if(!fs.existsSync(entry.file)){missing.push(entry.file);continue;}
  if(sha256(fs.readFileSync(entry.file))!==entry.sha256)changed.push(entry.file);
}
const result={checked:baseline.length-allowed.size,changed,missing,pass:!changed.length&&!missing.length};
fs.writeFileSync(path.join(out,'preservation-after.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
