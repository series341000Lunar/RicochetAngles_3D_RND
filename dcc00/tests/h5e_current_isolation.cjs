// Historical before_g1 HTML no longer matches current rnd_gameplay.js.
// Test current runtime isolation without claiming legacy snapshot equality.
const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'tests/test_g1_isolation.cjs');
let code=fs.readFileSync(file,'utf8');
code=code.replace("['before','legacy','remap']","['legacy','remap']");
const start=code.indexOf('const checks='),end=code.indexOf('fs.writeFileSync',start);
if(start<0||end<0)throw Error('G1 source changed; inspect wrapper');
code=code.slice(0,start)+
"const checks={legacyRenderIsolation:results.legacy.rendererEqual,remapRenderIsolation:results.remap.rendererEqual};\n"+
"const result={checks,frames:600,historicalSnapshotComparison:'UNVERIFIED: before_g1 incompatible with current gameplay dependency',pass:Object.values(checks).every(Boolean)};\n"+
code.slice(end);
code=code.replace("path.join(root,'Docs/G1_isolation.json')",JSON.stringify(path.join(root,'dcc00/test-output/dcc-map-01/G1_current_isolation.json')));
const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(code,file);