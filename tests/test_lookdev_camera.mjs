import test from 'node:test';
import assert from 'node:assert/strict';
import {OrthographicCamera,Group,Mesh,PlaneGeometry,MeshBasicMaterial} from '../spike/vendor/three.module.js';
import {BASELINE} from '../lookdev/baseline.mjs';
import {syncCamera,clampGroundView,validateGroundRectangle} from '../lookdev/camera-boundary.mjs';
const field={minX:640,maxX:10240/14,minZ:0,maxZ:1440/14};

test('full ground footprint survives pan, frustum, rotation, viewport and zoom extremes',()=>{
  let cases=0;
  for(const elevation of [45,75,90])for(const yaw of [0,37,110])for(const [width,height] of [[1280,720],[320,1600],[4000,300],[1,1]])
    for(const zoom of [0.0001,0.2,1,8,1000])for(const [x,z] of [[-10000,-10000],[20000,20000],[680,50]]){
      const camera=new OrthographicCamera(-1,1,1,-1,.1,700),center={x,z};camera.zoom=zoom;
      syncCamera(camera,center,width,height,{...BASELINE,elevation,yaw});
      const result=clampGroundView(camera,center,field);
      assert.ok(Number.isFinite(result.minZoom));assert.ok(camera.zoom+1e-8>=result.minZoom);
      for(const p of result.corners){
        assert.ok(p.x>=field.minX-1e-5&&p.x<=field.maxX+1e-5,JSON.stringify({width,height,elevation,yaw,zoom,p}));
        assert.ok(p.z>=field.minZ-1e-5&&p.z<=field.maxZ+1e-5,JSON.stringify({width,height,elevation,yaw,zoom,p}));
      }
      // Reapplying after a resize/zoom clamp is stable, without projection drift.
      const again=clampGroundView(camera,center,field);
      assert.ok(Math.abs(again.minZoom-result.minZoom)<1e-6);cases++;
    }
  assert.equal(cases,540);
});
function rectangle(root,x,z,w,h){
  const mesh=new Mesh(new PlaneGeometry(w,h),new MeshBasicMaterial());mesh.name='ENV_GROUND_test';
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,0,z);root.add(mesh);
}
test('actual ground union accepts a covered rectangle and rejects AABB holes and thin gaps',()=>{
  const f={minX:0,maxX:10,minZ:0,maxZ:10},full=new Group();rectangle(full,5,5,10,10);
  assert.equal(validateGroundRectangle(full,f).covered,true);
  const ring=new Group();rectangle(ring,5,1,10,2);rectangle(ring,5,9,10,2);rectangle(ring,1,5,2,6);rectangle(ring,9,5,2,6);
  assert.equal(validateGroundRectangle(ring,f).covered,false);
  const gap=new Group();rectangle(gap,2.495,5,4.99,10);rectangle(gap,7.505,5,4.99,10);
  assert.equal(validateGroundRectangle(gap,f).covered,false);
  rectangle(gap,5,5,.02,10);assert.equal(validateGroundRectangle(gap,f).covered,true);
});
