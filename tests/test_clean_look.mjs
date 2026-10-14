import test from 'node:test';
import assert from 'node:assert/strict';
import {BoxGeometry,Mesh,Group,MeshStandardMaterial,Vector2} from '../spike/vendor/three.module.js';
import {outlineGeometry,outlinePartOf,makeOutlineMaterial,createCleanLook} from '../lookdev/clean-look.mjs';
test('smooth outline normals are separate, finite and welded across a hard-edged box',()=>{
  const source=new BoxGeometry(),original=Array.from(source.attributes.normal.array),g=outlineGeometry(source);
  assert.notEqual(g.attributes.position,source.attributes.position);assert.notEqual(g.index,source.index);
  assert.deepEqual(Array.from(source.attributes.normal.array),original);
  assert.equal(g.attributes.position.count,8);
  for(let i=0;i<source.index.count;i++)for(const axis of ['getX','getY','getZ'])
    assert.equal(g.attributes.position[axis](g.index.getX(i)),source.attributes.position[axis](source.index.getX(i)));
  const normals=g.attributes.outlineNormal.array;assert.ok([...normals].every(Number.isFinite));
  const p=g.attributes.position,seen=new Map();
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].join(','),n=[...normals.slice(i*3,i*3+3)];
    if(seen.has(key))assert.deepEqual(n,seen.get(key));else seen.set(key,n);
    assert.ok(Math.abs(Math.hypot(...n)-1)<1e-6);
  }
  source.dispose();g.dispose();
});
test('semantic primitive expansion is included while small descendants and ground are excluded',()=>{
  const hull=new Group();hull.name='HULL';const primitive=new Mesh();primitive.name='HULL_mesh_1';hull.add(primitive);
  assert.equal(outlinePartOf(primitive),'HULL');
  const energy=new Mesh();energy.name='SIDE_ENERGY_L';hull.add(energy);assert.equal(outlinePartOf(energy),null);
  const authored=new Set(['HULL','SIDE_ENERGY_L']);
  const exportedPrimitive=new Mesh();exportedPrimitive.name='Panzer3_Hull_Solid';hull.add(exportedPrimitive);
  assert.equal(outlinePartOf(exportedPrimitive,false,authored),'HULL');assert.equal(outlinePartOf(energy,false,authored),null);
  const ground=new Mesh();ground.name='ENV_GROUND_ENC_BLUFF_DIRT';assert.equal(outlinePartOf(ground,true),null);
  const cover=new Group();cover.name='ENC_Infantry_Cover_Position_001';const part=new Mesh();part.name=cover.name+'_mesh_1';cover.add(part);
  assert.equal(outlinePartOf(part,true),cover.name);
  const unnamed=new Mesh();unnamed.name='Mesh071_1';cover.add(unnamed);assert.equal(outlinePartOf(unnamed,true),cover.name);
});
test('black hull has depth/alpha/shadow separation and exact material reset / bounded lifetime',()=>{
  const root=new Group(),mesh=new Mesh(new BoxGeometry(),new MeshStandardMaterial({color:0x78904f,roughness:.5}));mesh.name='HULL';root.add(mesh);
  const record={root,label:'vehicle',lookdevWreck:false},look=createCleanLook(null,[record]),color=mesh.material.color.clone();
  const material=makeOutlineMaterial(new Vector2(1280,720),1.15);assert.equal(material.depthTest,true);assert.equal(material.depthWrite,false);
  assert.equal(material.transparent,false);assert.equal(material.side,1);
  look.setMode('CLEAN_OUTLINE');assert.ok(look.metrics().visibleOutlineMeshes>0);record.lookdevWreck=true;look.apply();assert.ok(!mesh.material.color.equals(color));
  look.setMode('MAINLINE_REFERENCE');assert.equal(look.originalsRestored(),true);assert.equal(record.lookdevWreck,false);
  for(let i=0;i<50;i++)look.setMode(i%2?'CLEAN_OUTLINE':'MAINLINE_REFERENCE');assert.equal(look.metrics().outlineMeshes,1);
  look.dispose();assert.equal(mesh.children.length,0);assert.equal(mesh.material.color.equals(color),true);look.dispose();
  mesh.geometry.dispose();mesh.material.dispose();material.dispose();
});
