// G1 fixed Tiger II ×2 authoring snapshot. Pure 2D gameplay data; never reads Three.js.
(function(){
const cfg={
  "preset": "TIGER_SPATIAL",
  "debug": "OFF",
  "labels3D": true,
  "canonicalScale": 28,
  "pivotLocal2D": {
    "x": -3.306724965572357,
    "y": 0
  },
  "descriptors": {
    "gunPort": {
      "ownerNode": "TURRET",
      "visualAnchorLocal3D": {
        "x": 2.4062328338623047,
        "y": 0.8915646331065865,
        "z": 0
      },
      "rootNeutralLocal3D": {
        "x": 2.288135513663292,
        "y": 2.9375007407420846,
        "z": 0
      },
      "gameplayAnchorLocal2D": {
        "x": 67.37451934814453,
        "y": 0
      },
      "neutralRootGameplay2D": {
        "x": 64.06779438257217,
        "y": 0
      },
      "hitMesh": "TURRET_Mesh",
      "triangle": 3876,
      "normal": [
        -0.01426774223812457,
        0.9986937181269651,
        -0.04906413053509345
      ],
      "id": "GUN_PORT",
      "anchor": "turret"
    },
    "visionSlit": {
      "ownerNode": "TURRET",
      "visualAnchorLocal3D": {
        "x": 0.6396937966346741,
        "y": 1.17033052444458,
        "z": -0.41334056854248047
      },
      "rootNeutralLocal3D": {
        "x": 0.5215964764356613,
        "y": 3.216266632080078,
        "z": -0.41334056854248047
      },
      "gameplayAnchorLocal2D": {
        "x": 17.911426305770874,
        "y": -11.573535919189453
      },
      "neutralRootGameplay2D": {
        "x": 14.604701340198517,
        "y": -11.573535919189453
      },
      "hitMesh": "TURRET_Mesh_1",
      "triangle": 1583,
      "normal": [
        0,
        1,
        0
      ],
      "id": "VISION_SLIT",
      "anchor": "turret"
    },
    "cupola": {
      "ownerNode": "TURRET",
      "visualAnchorLocal3D": {
        "x": -0.3050847351551056,
        "y": 1.5303442478179932,
        "z": -0.5215964913368225
      },
      "rootNeutralLocal3D": {
        "x": -0.42318205535411835,
        "y": 3.576280355453491,
        "z": -0.5215964913368225
      },
      "gameplayAnchorLocal2D": {
        "x": -8.542372584342957,
        "y": -14.60470175743103
      },
      "neutralRootGameplay2D": {
        "x": -11.849097549915314,
        "y": -14.60470175743103
      },
      "hitMesh": "TURRET_Mesh",
      "triangle": 983,
      "normal": [
        0,
        0.9999999999999999,
        0
      ],
      "id": "CUPOLA",
      "anchor": "turret"
    }
  },
  "hullBoundsLocal3D": {
    "minX": -2.9721157550811768,
    "maxX": 2.809216022491455,
    "minZ": -1.7862221002578735,
    "maxZ": 1.7862221002578735
  }
};
cfg.legacy=JSON.parse(JSON.stringify(WEAKPOINT_DEFS));
cfg.legacyTransform=getWeakpointTransform;
cfg.setPreset=function(name){if(!['LEGACY','TIGER_REMAP','TIGER_SPATIAL'].includes(name))throw Error('Unknown Boss preset');cfg.preset=name;};
cfg.remapTransform=function(boss,name){
 const a=cfg.descriptors[name].gameplayAnchorLocal2D,p=localToWorld(boss,cfg.pivotLocal2D.x,cfg.pivotLocal2D.y),c=Math.cos(boss.turretAngle),s=Math.sin(boss.turretAngle);
 return {x:p.x+a.x*c-a.y*s,y:p.y+a.x*s+a.y*c,angle:boss.turretAngle};
};
getWeakpointTransform=function(boss,def){
 if(cfg.preset==='TIGER_SPATIAL'&&def.name==='engine')return window.tigerSpatial.transform(boss,'engine');
 return cfg.preset!=='LEGACY'&&cfg.descriptors[def.name]?cfg.remapTransform(boss,def.name):cfg.legacyTransform(boss,def);
};
window.tigerWeakpoints=cfg;
})();
