const fs=require('fs'),path=require('path'),assert=require('assert');
const main=process.env.H5E_MAINLINE_ROOT||'C:/Users/LunarGagarin/Documents/Topdown Tank';
const core=require(path.join(main,'tools/h5e-map-editor-core.js'));
const root=path.resolve(__dirname,'..'),results={};
for(const name of ['no-edit','edited']){
 const doc=JSON.parse(fs.readFileSync(path.join(root,'workspace/dcc-map-01',name+'.json'),'utf8'));
 results[name]=core.validateMap(doc);
 if(!results[name].valid||results[name].errors?.length)throw Error(JSON.stringify(results[name]));
}
fs.writeFileSync(path.join(root,'test-output/dcc-map-01/mainline-parser.json'),JSON.stringify(results,null,2));
console.log('MAINLINE_EDITOR_VALIDATION',JSON.stringify(results));