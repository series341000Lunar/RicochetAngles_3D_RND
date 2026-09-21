const fs=require('fs'),path=require('path'),Module=require('module');
const file=path.join(__dirname,process.argv[2]),root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'Docs/prewarm_v4c/regression'),{recursive:true});
let code=fs.readFileSync(file,'utf8').replaceAll('Docs/','Docs/prewarm_v4c/regression/');
code=code.replace(/await (p|page)\.goto\(([^;]+)\);/g,(all,p)=>all+'\nawait '+p+".waitForFunction(()=>window.rndStartup?.state==='READY',{}, {polling:100});await "+p+".locator('#startupStart').click();");
code=code.replaceAll('!m.slots.boss.light.visible','m.slots.boss.light.intensity===0').replaceAll('!playerLight.visible','playerLight.intensity===0').replaceAll('!bossLight.visible','bossLight.intensity===0');
const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(code,file);
