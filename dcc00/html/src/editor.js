const $=s=>document.querySelector(s),canvas=$('#overview'),ctx=canvas.getContext('2d');
const classes=await (await fetch('/dcc00/registry/classes.json')).json();
let doc,revision,selected=0,dirty=false,dragging=false;
function status(text){$('#status').textContent=text;}
function edited(){dirty=true;status('Unsaved edits · Save workspace, then Reload Blender / testbed');draw();}
async function reload(){
 try{const response=await fetch('/api/workspace');const data=await response.json();if(!response.ok)throw Error(data.error);doc=data.document;revision=data.revision;dirty=false;selected=Math.min(selected,doc.actors.length-1);render();validation(data.validation);status('Loaded shared workspace · '+revision.slice(0,10));}catch(e){status('BLOCK: '+e.message);}
}
function validation(issues=[]){const area=$('#validation');area.replaceChildren();if(!issues.length)area.textContent='PASS';for(const i of issues){const d=document.createElement('div');d.className='issue '+i.level;d.textContent=`${i.level} · ${i.code} · ${i.where}: ${i.message}`;area.append(d);}}
async function save(){
 try{const response=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json','If-Match':revision},body:JSON.stringify(doc)});const data=await response.json();validation(data.validation);if(!response.ok)throw Error(data.error||'Validation blocks saving');revision=data.revision;dirty=false;status('Saved · Reload Blender / Three.js testbed to receive edits');}catch(e){status('BLOCK: '+e.message);}
}
function field(parent,key,label,value,type,onChange,choices){
 const row=document.createElement('label');row.textContent=label;const input=document.createElement(choices?'select':'input');input.id='field-'+key;
 if(choices){for(const c of choices){const option=document.createElement('option');option.value=c;option.textContent=c;input.append(option);}input.value=value;}
 else{input.type=type;if(type==='checkbox')input.checked=value;else input.value=type==='number'&&Number.isFinite(value)?Number(value.toFixed(4)):value;if(type==='number')input.step='any';}
 input.addEventListener('change',()=>{const v=type==='checkbox'?input.checked:type==='number'?input.valueAsNumber:input.value;if(type==='number'&&!Number.isFinite(v)){status('BLOCK: finite number required');return;}onChange(v);edited();});row.append(input);parent.append(row);
}
function render(){
 const list=$('#actors');list.replaceChildren();doc.actors.forEach((a,i)=>{const b=document.createElement('button');b.className='actor'+(selected===i?' active':'');b.textContent=a.class;const id=document.createElement('small');id.textContent=a.ra_id;b.append(id);b.onclick=()=>{selected=i;render();};list.append(b);});
 const form=$('#inspector');form.replaceChildren();const a=doc.actors[selected];$('#delete').disabled=!a;
 if(a){const identity=document.createElement('p');identity.textContent=`${a.class} · Tier ${classes[a.class]?.tier||'?'} · ${a.ra_id}`;form.append(identity);const h=document.createElement('h3');h.textContent='Position · testbed units';form.append(h);for(const key of ['x','y','z','yaw'])field(form,key,key.toUpperCase(),a.transform[key],'number',v=>a.transform[key]=v);
 for(const [key,spec] of Object.entries(classes[a.class]?.fields||{}))field(form,key,key,a[key],spec.type==='boolean'?'checkbox':spec.type==='number'?'number':'text',v=>a[key]=v,spec.choices);}
 draw();
}
function draw(){
 if(!doc)return;const sx=canvas.width/doc.world.width,sy=canvas.height/doc.world.height;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#43574a';ctx.lineWidth=1;
 for(let y=0;y<=doc.world.height;y+=180){ctx.beginPath();ctx.moveTo(0,y*sy);ctx.lineTo(canvas.width,y*sy);ctx.stroke();}for(let x=0;x<=doc.world.width;x+=160){ctx.beginPath();ctx.moveTo(x*sx,0);ctx.lineTo(x*sx,canvas.height);ctx.stroke();}
 ctx.fillStyle='#414b35';ctx.fillRect((doc.world.width/2-115)*sx,0,230*sx,canvas.height);
 for(const p of doc.paths){ctx.strokeStyle='#c7b775';ctx.beginPath();p.points.forEach((v,i)=>ctx[i?'lineTo':'moveTo'](v.x*sx,v.y*sy));ctx.stroke();}
 for(const a of doc.decorations){ctx.fillStyle='#879e66';ctx.fillRect(a.transform.x*sx-3,a.transform.y*sy-3,6,6);}
 doc.actors.forEach((a,i)=>{const x=a.transform.x*sx,y=a.transform.y*sy;ctx.strokeStyle=i===selected?'#fff2ab':'#82ddce';ctx.fillStyle=i===selected?'#fff2ab':'#82ddce';ctx.lineWidth=i===selected?3:1;if(a.class==='Trigger')ctx.strokeRect(x-a.sizeX*sx/2,y-a.sizeY*sy/2,a.sizeX*sx,a.sizeY*sy);else{ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();}ctx.font='24px sans-serif';ctx.fillText(a.ra_id.length>24?a.ra_id.slice(0,8):a.ra_id,x+11,y-8);});
}
function world(event){const r=canvas.getBoundingClientRect();return{x:(event.clientX-r.left)/r.width*doc.world.width,y:(event.clientY-r.top)/r.height*doc.world.height};}
canvas.onpointerdown=e=>{const p=world(e);let best=-1,d=65;doc.actors.forEach((a,i)=>{const n=Math.hypot(p.x-a.transform.x,p.y-a.transform.y);if(n<d){d=n;best=i;}});if(best>=0){selected=best;dragging=true;canvas.setPointerCapture(e.pointerId);render();}};
canvas.onpointermove=e=>{if(!dragging)return;Object.assign(doc.actors[selected].transform,world(e));edited();};canvas.onpointerup=()=>{dragging=false;render();};
$('#reload').onclick=()=>{if(!dirty||confirm('Discard unsaved HTML edits and reload workspace?'))reload();};$('#save').onclick=save;
$('#delete').onclick=()=>{const a=doc.actors[selected];if(a&&confirm(`Explicitly delete ${a.ra_id} and create a tombstone?`)){doc.actors.splice(selected,1);doc.tombstones.push({ra_id:a.ra_id,deleted:true});selected=0;edited();render();}};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
window.dccEditor={get document(){return doc;},reload,save};await reload();
