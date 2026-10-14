// Run the existing tests without overwriting historical report/preview paths.
const fs=require('fs'),path=require('path'),Module=require('module');
const name=process.argv[2];if(!['g2','g3'].includes(name))throw Error('Use g2 or g3');
const file=path.join(__dirname,name==='g2'?'test_g2_spatial.cjs':'test_g3_canvas.cjs');
const original=name==='g2'?'Docs/g2_spatial':'Docs/g3_canvas';
const source=fs.readFileSync(file,'utf8').replace("out=path.join(root,'"+original+"')","out=path.join(root,'Docs/global-lookdev/regression-"+name+"')");
if(source===fs.readFileSync(file,'utf8'))throw Error('Regression output redirection did not match');
const task=new Module(file,module);task.filename=file;task.paths=module.paths;task._compile(source,file);
