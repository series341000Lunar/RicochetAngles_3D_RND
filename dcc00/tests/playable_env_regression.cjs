// Reuse repository regression bodies; redirect generated evidence only.
const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'dcc00/test-output/playable-env-recovery-20260925');
const name=process.argv[2];
if(!['test_g1_interactions.cjs','test_g2_spatial.cjs','test_g3_canvas.cjs'].includes(name))throw Error('Unknown regression');
const file=path.join(root,'tests',name);let code=fs.readFileSync(file,'utf8');
code=code.replace("path.join(root,'Docs/G1_interactions.json')",JSON.stringify(path.join(out,'G1_interactions.json')));
code=code.replace("out=path.join(root,'Docs/g2_spatial')","out="+JSON.stringify(path.join(out,'g2_spatial')));
code=code.replace("out=path.join(root,'Docs/g3_canvas')","out="+JSON.stringify(path.join(out,'g3_canvas')));
const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(code,file);
