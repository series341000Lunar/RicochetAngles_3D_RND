const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage();
await p.goto('http://127.0.0.1:8765/lookdev/?look=clean-outline');await p.waitForFunction(()=>lookdev.status==='READY',null,{timeout:90000});
console.log(JSON.stringify(await p.evaluate(()=>{
 const result={env:[],player:[]};
 for(const [key,root] of [['env',lookdev.environment.root],['player',lookdev.assets.find(a=>a.label.includes('M4A3E8')).root]])root.traverse(n=>{
  if(n.isMesh&&!n.userData.lookdevOutline&&(key==='player'||/Infantry|Cover_Position/.test(n.name)||/Infantry|Cover_Position/.test(n.parent?.name)))
   result[key].push({name:n.name,parent:n.parent?.name,morph:n.morphTargetInfluences,skinned:n.isSkinnedMesh,normal:!!n.geometry.attributes.normal,
    materials:(Array.isArray(n.material)?n.material:[n.material]).map(m=>({name:m.name,opacity:m.opacity,transparent:m.transparent})),outlineChildren:n.children.filter(n=>n.userData.lookdevOutline).length});
 });return result;
}),null,2));await b.close();})().catch(e=>{console.error(e);process.exit(1)});
