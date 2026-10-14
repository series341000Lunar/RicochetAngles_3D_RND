// Read-only GLB inspection: accessor bounds transformed through the real hierarchy.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Matrix4, Quaternion, Vector3, Box3} from '../spike/vendor/three.module.js';

export const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const assetRoot = '\\\\192.168.87.201\\Projects\\RicochetAngles\\00_Asset';
export const mainline = 'C:\\Users\\LunarGagarin\\Documents\\Topdown Tank';
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function filesUnder(dir, extension) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory()
    ? filesUnder(path.join(dir, e.name), extension)
    : e.name.endsWith(extension) ? [path.join(dir, e.name)] : []).sort();
}
export function inspectGlb(file) {
  const bytes = fs.readFileSync(file);
  if (bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length)
    throw Error('Invalid GLB v2 header: ' + file);
  if (bytes.readUInt32LE(16) !== 0x4e4f534a) throw Error('Missing GLB JSON: ' + file);
  const data = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8').trim());
  const nodes = [], bounds = new Box3(), ground = [], problems = [];
  function visit(index, parent, parentName = null) {
    const n = data.nodes[index], local = n.matrix ? new Matrix4().fromArray(n.matrix) : new Matrix4().compose(
      new Vector3().fromArray(n.translation || [0,0,0]),
      new Quaternion().fromArray(n.rotation || [0,0,0,1]),
      new Vector3().fromArray(n.scale || [1,1,1]));
    const matrix = new Matrix4().multiplyMatrices(parent, local), box = new Box3();
    const name = n.name || ('node_' + index), primitives = data.meshes?.[n.mesh]?.primitives || [];
    for (const p of primitives) {
      const a = data.accessors[p.attributes.POSITION];
      if (!a.min || !a.max) { problems.push(name + ': no POSITION bounds'); continue; }
      box.union(new Box3(new Vector3().fromArray(a.min), new Vector3().fromArray(a.max)).applyMatrix4(matrix));
      if (p.attributes.NORMAL === undefined) problems.push(name + ': missing NORMAL');
    }
    bounds.union(box);
    const record = {index, name, parent: parentName, children: n.children || [], mesh: n.mesh ?? null,
      localMatrix: local.elements, worldMatrix: matrix.elements,
      bounds: box.isEmpty() ? null : {min: box.min.toArray(), max: box.max.toArray()},
      primitives: primitives.map(p => ({material: p.material ?? null, normal: p.attributes.NORMAL !== undefined,
        vertices: data.accessors[p.attributes.POSITION].count, mode: p.mode ?? 4}))};
    nodes.push(record);
    if (record.bounds && /GROUND/i.test(name)) ground.push(record);
    for (const child of n.children || []) visit(child, matrix, name);
  }
  for (const index of data.scenes[data.scene || 0].nodes || []) visit(index, new Matrix4());
  const size = bounds.getSize(new Vector3());
  const materials = (data.materials || []).map((m,index) => ({index, ...m}));
  if ((data.buffers || []).some(b => b.uri && !b.uri.startsWith('data:'))) problems.push('External buffer');
  if ((data.images || []).some(i => i.uri && !i.uri.startsWith('data:'))) problems.push('External image');
  return {file, bytes:bytes.length, sha256:sha256(bytes), scene:data.scene || 0, generator:data.asset.generator,
    roots:data.scenes[data.scene || 0].nodes, bounds:{min:bounds.min.toArray(),max:bounds.max.toArray(),size:size.toArray()},
    nodes, ground, materials, animations:(data.animations || []).map(a=>({name:a.name,channels:a.channels.length})),
    textures:(data.textures || []).length, extensions:data.extensionsUsed || [], problems};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = [...filesUnder(path.join(assetRoot,'ENV/Stage1/glb'),'.glb'), ...filesUnder(path.join(assetRoot,'GLB_Export'),'.glb')];
  const inventory = files.map(file => {try{return inspectGlb(file);}catch(e){return {file,error:e.message};}});
  const out = path.join(repo,'Docs/global-lookdev'); fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'asset-audit.json'), JSON.stringify(inventory,null,2)+'\n');
  console.log(JSON.stringify(inventory.map(a=>({file:a.file.replace(assetRoot,''),sha:a.sha256?.slice(0,12),
    bounds:a.bounds,nodes:a.nodes?.length,ground:a.ground?.map(g=>({name:g.name,bounds:g.bounds})),problems:a.problems,error:a.error})),null,2));
}
