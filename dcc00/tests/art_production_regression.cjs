const fs=require('fs'),path=require('path'),Module=require('module');
const file=path.join(__dirname,'h5e_current_isolation.cjs');
const code=fs.readFileSync(file,'utf8').replace('dcc00/test-output/dcc-map-01/G1_current_isolation.json','dcc00/test-output/art-production-20260924/G1_current_isolation.json');
const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(code,file);
