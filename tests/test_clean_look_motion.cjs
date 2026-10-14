const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const out=path.resolve(__dirname,'../Docs/clean-lookdev');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const options={viewport:{width:1600,height:960},deviceScaleFactor:1};let page,videoUnavailable=null;
 try{page=await browser.newPage({...options,recordVideo:{dir:path.join(out,'motion'),size:{width:1280,height:768}}});}
 catch(e){videoUnavailable=e.message;page=await browser.newPage(options);}
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:8765/lookdev/?look=clean-outline');await page.waitForFunction(()=>lookdev.status==='READY',null,{timeout:90000});
 // Keep input away from the inspector and record actual pan / wheel paths.
 await page.mouse.click(1000,700);await page.waitForTimeout(300);
 for(const key of ['d','w','a','s']){await page.keyboard.down(key);await page.waitForTimeout(650);await page.keyboard.up(key);}
 await page.screenshot({path:path.join(out,'motion-pan.png')});
 await page.mouse.wheel(0,-180);await page.waitForTimeout(500);await page.screenshot({path:path.join(out,'motion-zoom-in.png')});
 await page.mouse.wheel(0,180);await page.waitForTimeout(500);
 await page.mouse.move(1000,500);await page.mouse.down();await page.mouse.move(1160,570,{steps:30});await page.mouse.up();
 await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'motion-drag.png')});
 const state=await page.evaluate(()=>({mode:lookdev.lookMode,zoom:lookdev.camera.zoom,frames:lookdev.frames,effects:lookdev.cleanLook.metrics(),
  field:lookdev.manifest.field,footprint:lookdev.footprint()}));
 const video=page.video();await page.close();let videoPath=null;
 if(video){const source=await video.path();videoPath=path.join(out,'C-motion.webm');fs.copyFileSync(source,videoPath);}
 await browser.close();
 const f=state.field,inside=state.footprint.every(p=>p.x>=f.minX-1e-5&&p.x<=f.maxX+1e-5&&p.z>=f.minZ-1e-5&&p.z<=f.maxZ+1e-5);
 const result={pass:!errors.length&&inside&&state.mode==='CLEAN_OUTLINE',errors,state,videoPath,videoUnavailable};
 fs.writeFileSync(path.join(out,'motion-validation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
