const fs=require('fs'),path=require('path'),Module=require('module');
const root=path.resolve(__dirname,'../..'),out=process.env.DCC00_TEST_OUTPUT||path.resolve(__dirname,'../test-output');
const name=process.argv[2];
if(!['test_g1_isolation.cjs','test_g1_interactions.cjs'].includes(name))throw Error('Choose an existing G1 regression');
const file=path.join(root,'tests',name);let code=fs.readFileSync(file,'utf8');
fs.mkdirSync(out,{recursive:true});
for(const output of ['G1_isolation.json','G1_interactions.json'])code=code.replace(`path.join(root,'Docs/${output}')`,JSON.stringify(path.join(out,output)));
const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(code,file);
