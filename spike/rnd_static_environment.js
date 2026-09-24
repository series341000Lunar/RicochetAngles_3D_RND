// Presentation-only static asset. No map data, gameplay writes or render loop.
export async function loadPlayableEnvironment(THREE,scene){
  const result={status:'LOADING',root:null,visualOnly:true,url:'../dcc00/workspace/playable-env/geometry.glb'};
  // DCC preview iframes keep their existing scenes and separate QA sources.
  if(window.parent!==window){result.status='SKIPPED_REVIEW_IFRAME';return result;}
  try{
    const response=await fetch(result.url+'?v='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const bytes=await response.arrayBuffer();
    const {GLTFLoader}=await import('./vendor/GLTFLoader.js');
    // Called only inside startup, after vehicle loads and before READY.
    // GLTF parsing allocates UUIDs asynchronously. Isolate the entire parse,
    // then restore the exact gameplay random function before START is enabled.
    const gameplayRandom=Math.random;let seed=0x454e56;
    let gltf;
    try{
      Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      gltf=await new GLTFLoader().parseAsync(bytes,'');
      gltf.scene.name='PLAYABLE_STATIC_ENV_VISUAL_ONLY';
      gltf.scene.scale.setScalar(14);
      gltf.scene.traverse(o=>{
        if(o.isMesh){
          // Ground overlays receive shadows; they must not shadow the legacy
          // ground a fraction of a unit below them (coplanar shadow acne).
          const flat=/GROUND|ROAD|road_shoulder|worn_track|soil_|south_earth|emplacement_soil/.test(o.name)||/^ENV_ART_bunker_apron(?:\.\d+)?$/.test(o.name);
          o.castShadow=!flat;o.receiveShadow=true;
        }
      });
      scene.add(gltf.scene);
    }finally{Math.random=gameplayRandom;}
    result.root=gltf.scene;result.status='READY';result.bytes=bytes.byteLength;
  }catch(error){
    result.status='MISSING';result.warning='Static ENV unavailable; existing playable stage retained: '+error.message;
    console.warn(result.warning);
  }
  return result;
}
