// Shared DCC-MAP-01 spatial reference conversion. No gameplay binding.
export function appendMapReferences(THREE,data,group,entries,target){
  for(const collection of ['objects','markers','annotations']){
   for(const record of data[collection]){
    const g=record.geometry,root=new THREE.Group(),points=[];
    root.name=record.id;root.userData={collection,record:structuredClone(record)};
    if(g.points){
     for(const p of g.points)points.push(new THREE.Vector3(p.x,2,p.y));
     if(g.closed||g.type==='POLYGON')points.push(points[0].clone());
    }else{
     root.position.set(g.x,0,g.y);root.rotation.y=-(record.rotationDegrees||0)*Math.PI/180;
     if(g.type==='RECT'){
      for(const [x,y]of[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]])
       points.push(new THREE.Vector3(x*g.width/2,2,y*g.height/2));
     }else if(g.type==='CIRCLE'){
      for(let i=0;i<=48;i++)points.push(new THREE.Vector3(Math.cos(i*Math.PI/24)*g.radius,2,Math.sin(i*Math.PI/24)*g.radius));
     }else throw Error('Unsupported canonical geometry');
    }
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),
     new THREE.LineBasicMaterial({color:record.id===target?0xffd34d:collection==='objects'?0x89b1bd:collection==='markers'?0x60dfae:0xeacbfe})));
    root.visible=record.visible!==false;group.add(root);entries.push({collection,record,root});
   }
  }
}
