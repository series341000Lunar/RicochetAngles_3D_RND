const fs=require('fs'),path=require('path'),Module=require('module');
const file=path.join(__dirname,process.argv[2]),root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'Docs/tone_v4a/regression'),{recursive:true});
let code=fs.readFileSync(file,'utf8').replaceAll('Docs/','Docs/tone_v4a/regression/');
const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(code,file);
