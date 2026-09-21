// V4C startup gate: no simulation, events or random sampling during preparation.
window.rndStartup={state:'LOADING',prewarmRuns:0,metrics:[],error:null,
 setStatus(text){document.getElementById('startupStatus').textContent=text;},
 ready(){this.state='READY';this.setStatus('READY');document.getElementById('startupStart').disabled=false;},
 fail(error){this.error=String(error);this.setStatus('LOADING FAILED — '+error.message+' · 새로고침하여 다시 시도하십시오.');}
};
document.addEventListener('DOMContentLoaded',()=>{
 const gate=document.getElementById('startupGate');
 document.getElementById('startupStart').onclick=()=>{
  if(rndStartup.state!=='READY')return;
  input.keys={};input.fire=false;input.contourPointerInside=false;
  rndActions={space:false,q:false,cancel:false,confirm:false};
  lastTime=performance.now();rndStartup.state='PLAYING';gate.hidden=true;
  document.getElementById('world3d').style.visibility=rendererSpike.enabled?'visible':'hidden';
  document.getElementById('game').style.visibility='visible';
 };
});
for(const type of ['keydown','keyup','mousedown','mouseup','mousemove']){
 window.addEventListener(type,e=>{
  if(rndStartup.state==='PLAYING')return;
  if(type==='keydown'||type==='keyup'){
   e.stopImmediatePropagation();
   const nativeControl=e.key==='Tab'||(e.target.id==='startupStart'&&['Enter',' '].includes(e.key));
   if(!nativeControl&&e.cancelable)e.preventDefault();
   return;
  }
  if(e.target.closest?.('#startupGate'))return;
  e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();
 },true);
}
