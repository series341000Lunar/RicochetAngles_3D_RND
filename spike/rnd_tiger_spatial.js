// G2 fixed Tiger II x2 spatial authoring snapshot. All hit tests remain 2D.
(function(){
  const unitsPerMeter=28;
  const source={asset:'Panzer6B_Tiger2/export/Panzer6B_Tiger2_RND_v01.glb',sha256:'e0eeeb1988f66089ada78e221ba0e43296518f0ecfde5cabbbc901b048ad6c20'};
  // Node-local X/Z bounds measured from the GLB. +X is forward, +Z is gameplay +Y.
  const measured={
    hull:{minX:-2.9721157550811768,maxX:2.809216022491455,minZ:-1.7862221002578735,maxZ:1.7862221002578735},
    leftTrack:{minX:-2.877537965774536,maxX:2.877537965774536,minZ:-1.7419356107711792,maxZ:-1.0136685371398926},
    rightTrack:{minX:-2.877537965774536,maxX:2.877537965774536,minZ:1.0136685371398926,maxZ:1.7419356107711792},
    turret:{minX:-2.1301255226135254,maxX:2.4898853302001953,minZ:-1.3427562713623047,maxZ:1.3427562713623047},
    // GUN mesh bounds plus the GUN node translation in TURRET-local coordinates.
    gun:{minX:1.028430461883545+1.4368507862091064,maxX:5.073263168334961+1.4368507862091064,minZ:-.24603605270385742,maxZ:.24603630602359772}
  };
  function rectFromBounds(b){return {x:(b.minX+b.maxX)*unitsPerMeter/2,y:(b.minZ+b.maxZ)*unitsPerMeter/2,w:(b.maxX-b.minX)*unitsPerMeter,h:(b.maxZ-b.minZ)*unitsPerMeter};}
  const visualRects={
    hull:rectFromBounds(measured.hull),leftTrack:rectFromBounds(measured.leftTrack),rightTrack:rectFromBounds(measured.rightTrack),
    turret:rectFromBounds(measured.turret),gun:rectFromBounds(measured.gun)
  };
  const rects={
    // Armor rectangle stops inside the outer track bands; the union still follows the mesh silhouette.
    hull:{...visualRects.hull,h:76},leftTrack:visualRects.leftTrack,rightTrack:visualRects.rightTrack,
    turret:visualRects.turret,gun:visualRects.gun,
    // Hand-authored envelopes within the measured rear hull. ENGINE remains the existing damage gate.
    engine:{x:-2.25*unitsPerMeter,y:0,w:1.15*unitsPerMeter,h:1.55*unitsPerMeter},
    // CORE is an internal reference only: no active weakpoint, armor or damage handler is created.
    core:{x:-1.6*unitsPerMeter,y:0,w:.8*unitsPerMeter,h:1.0*unitsPerMeter}
  };
  const legacy={hull:{x:0,y:0,w:190,h:112},leftTrack:{x:0,y:-70,w:174,h:25},rightTrack:{x:0,y:70,w:174,h:25},turret:{x:0,y:0,w:76,h:64},engine:{x:-103,y:0,w:20,h:44}};
  const pivot={x:-.11809732019901276*unitsPerMeter,y:0};
  const presentation={
    engine:{ownerNode:'HULL',x:-2.3,y:2.01,z:0},
    core:{ownerNode:'HULL',x:-1.6,y:2.06,z:0}
  };
  function active(){return window.tigerWeakpoints?.preset==='TIGER_SPATIAL';}
  function localPoint(b,x,y,angle){const c=Math.cos(angle),s=Math.sin(angle);return {x:b.x+x*c-y*s,y:b.y+x*s+y*c};}
  function transform(b,name,mode='TIGER_SPATIAL'){
    const old=mode==='LEGACY',r=(old?legacy:mode==='VISUAL'?visualRects:rects)[name];if(!r)return null;
    if(name==='turret'||name==='gun'){
      if(old)return {x:b.x,y:b.y,angle:b.turretAngle,w:r.w,h:r.h};
      const p=localPoint(b,pivot.x,pivot.y,b.angle),q=localPoint(p,r.x,r.y,b.turretAngle);
      return {...q,angle:b.turretAngle,w:r.w,h:r.h};
    }
    const q=localPoint(b,r.x,r.y,b.angle);return {...q,angle:b.angle,w:r.w,h:r.h};
  }
  function contains(t,x,y){const c=Math.cos(t.angle),s=Math.sin(t.angle),dx=x-t.x,dy=y-t.y;return Math.abs(dx*c+dy*s)<=t.w/2&&Math.abs(-dx*s+dy*c)<=t.h/2;}
  function hitTestPoint(b,x,y){return ['hull','leftTrack','rightTrack'].some(name=>contains(transform(b,name),x,y));}
  window.tigerSpatial={unitsPerMeter,source,measured,visualRects,rects,legacy,pivot,presentation,active,transform,contains,hitTestPoint};
})();