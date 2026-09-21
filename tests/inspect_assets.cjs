const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
const data=await p.evaluate(async()=>{
const THREE=await import('./vendor/three.module.js'),{GLTFLoader}=await import('./vendor/GLTFLoader.js');const out={};
for(const [id,url] of Object.entries({panzer:'Panzer3/export/Panzer3_RND_v02.glb',truck:'LV_Kubelwagen/export/LV_Kubelwagen_RND_v01.glb',pak:'75mm_PAK_40/export/75mm_PAK_40_RND_v01.glb',tiger2:'Panzer6B_Tiger2/export/Panzer6B_Tiger2_RND_v01.glb',tiger1:'Panzer6_Tiger1/export/Panzer6_Tiger1_RND_v02.glb'})){
const g=await new GLTFLoader().loadAsync('../'+url),box=new THREE.Box3().setFromObject(g.scene);
const nodes=[];g.scene.traverse(o=>{if(o.name)nodes.push({name:o.name,type:o.type,position:o.getWorldPosition(new THREE.Vector3()).toArray()});});
out[id]={url,min:box.min.toArray(),max:box.max.toArray(),nodes};}return out;
});
fs.writeFileSync(path.resolve(__dirname,'../Docs/R2_asset_inspection.json'),JSON.stringify(data,null,2));console.log(JSON.stringify(data));await b.close();})();
