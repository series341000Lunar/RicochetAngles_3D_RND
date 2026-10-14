import {Vector2, Vector3, Raycaster, Plane} from '../spike/vendor/three.module.js';
const plane=new Plane(new Vector3(0,1,0),0), ray=new Raycaster();

export function syncCamera(camera,center,width,height,settings) {
  const angle=settings.elevation*Math.PI/180, yaw=(settings.yaw || 0)*Math.PI/180;
  camera.left=-width/settings.pixelsPerMeter/2; camera.right=-camera.left;
  camera.top=height/settings.pixelsPerMeter*Math.sin(angle)/2; camera.bottom=-camera.top;
  camera.position.set(center.x+settings.cameraDistance*Math.cos(angle)*Math.sin(yaw),
    settings.cameraDistance*Math.sin(angle),center.z+settings.cameraDistance*Math.cos(angle)*Math.cos(yaw));
  camera.up.set(0,0,-1);camera.lookAt(center.x,0,center.z);
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
}
export function groundFootprint(camera) {
  camera.updateMatrixWorld(true);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{
    ray.setFromCamera(new Vector2(x,y),camera);
    const denominator=ray.ray.direction.dot(plane.normal);
    if(Math.abs(denominator)<1e-10)throw Error('Camera does not face the ground');
    // An extreme proposed zoom can place an ortho ray origin below ground.
    // Use its line intersection to derive a valid minimum BEFORE displaying it.
    const distance=-plane.distanceToPoint(ray.ray.origin)/denominator;
    const point=ray.ray.at(distance,new Vector3());
    if(!Number.isFinite(point.x+point.z)) throw Error('Nonfinite ground projection');
    return {x:point.x,z:point.z};
  });
}
export function groundAt(camera,x,y) {
  ray.setFromCamera(new Vector2(x,y),camera);
  return ray.ray.intersectPlane(plane,new Vector3());
}
export function clampGroundView(camera,center,field) {
  let corners=groundFootprint(camera);
  const span=axis=>Math.max(...corners.map(p=>p[axis]))-Math.min(...corners.map(p=>p[axis]));
  const ratio=Math.max(span('x')/(field.maxX-field.minX),span('z')/(field.maxZ-field.minZ));
  const minZoom=camera.zoom*ratio;
  if(ratio>1){camera.zoom=minZoom*(1+1e-10);camera.updateProjectionMatrix();corners=groundFootprint(camera);}
  const clampAxis=(axis,min,max)=>{
    const offsets=corners.map(p=>p[axis]-center[axis]);
    const low=min-Math.min(...offsets),high=max-Math.max(...offsets);
    return Math.max(low,Math.min(high,center[axis]));
  };
  const x=clampAxis('x',field.minX,field.maxX),z=clampAxis('z',field.minZ,field.maxZ);
  camera.position.x+=x-center.x;camera.position.z+=z-center.z;
  center.x=x;center.z=z;camera.updateMatrixWorld(true);
  return {minZoom,corners:groundFootprint(camera)};
}

// Certify the chosen rectangle against actual ground triangles, not mesh AABBs.
// Sweep all triangle vertices and edge-intersection events: interval ordering
// is linear between events, so endpoints + one interior sample detect holes.
export function validateGroundRectangle(root,field) {
  root.updateMatrixWorld(true);
  const triangles=[];
  root.traverse(node=>{
    if(!node.isMesh || !/^ENV_GROUND/.test(node.name))return;
    const g=node.geometry,p=g.attributes.position,idx=g.index;
    for(let i=0;i<(idx?idx.count:p.count);i+=3){
      const tri=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(node.matrixWorld));
      if(Math.max(...tri.map(v=>v.x))<field.minX || Math.min(...tri.map(v=>v.x))>field.maxX ||
        Math.max(...tri.map(v=>v.z))<field.minZ || Math.min(...tri.map(v=>v.z))>field.maxZ)continue;
      triangles.push(tri);
    }
  });
  const eps=1e-6,events=[field.minZ,field.maxZ],edges=[];
  for(const tri of triangles)for(let i=0;i<3;i++){
    const a=tri[i],b=tri[(i+1)%3];
    if(a.z>=field.minZ && a.z<=field.maxZ)events.push(a.z);
    if(Math.abs(a.z-b.z)>eps){const slope=(b.x-a.x)/(b.z-a.z);
      edges.push({slope,offset:a.x-slope*a.z,min:Math.max(field.minZ,Math.min(a.z,b.z)),max:Math.min(field.maxZ,Math.max(a.z,b.z))});}
  }
  // Field boundary crossings also change which interval is responsible for coverage.
  for(const e of edges)for(const x of [field.minX,field.maxX]){
    const z=(x-e.offset)/e.slope;if(Number.isFinite(z)&&z>=e.min&&z<=e.max)events.push(z);
  }
  for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
    const a=edges[i],b=edges[j];if(Math.abs(a.slope-b.slope)<eps)continue;
    const z=(b.offset-a.offset)/(a.slope-b.slope);
    if(z>=Math.max(a.min,b.min)&&z<=Math.min(a.max,b.max))events.push(z);
  }
  const sorted=[...new Set(events)].sort((a,b)=>a-b),samples=[...sorted];
  for(let i=1;i<sorted.length;i++)if(sorted[i]-sorted[i-1]>eps)samples.push((sorted[i]+sorted[i-1])/2);
  for(const z of samples){
    const intervals=[];
    for(const tri of triangles){
      const hits=[];
      for(let i=0;i<3;i++){
        const a=tri[i],b=tri[(i+1)%3];
        if(z<Math.min(a.z,b.z)-eps||z>Math.max(a.z,b.z)+eps)continue;
        if(Math.abs(a.z-b.z)<eps){if(Math.abs(z-a.z)<eps)hits.push(a.x,b.x);}
        else hits.push(a.x+(z-a.z)*(b.x-a.x)/(b.z-a.z));
      }
      if(hits.length>=2)intervals.push([Math.min(...hits),Math.max(...hits)]);
    }
    intervals.sort((a,b)=>a[0]-b[0]);let reached=field.minX;
    for(const [min,max] of intervals){if(max<reached-eps)continue;if(min>reached+eps)break;reached=Math.max(reached,max);}
    if(reached<field.maxX-eps)return {covered:false,z,reached,triangles:triangles.length,samples:samples.length};
  }
  return {covered:triangles.length>0,triangles:triangles.length,samples:samples.length};
}
