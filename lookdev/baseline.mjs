// Selective adaptation, reference Mainline 6791fdb (2026-10-14).
// src/hybrid-environment.js: tuning + attach/sync; src/unified-world.js: prepare.
// Local vendor is byte-identical to Mainline's r160 modules (see provenance.json).
export const BASELINE = Object.freeze({
  name:'CURRENT MAINLINE VISUAL REFERENCE', pixelsPerMeter:14,
  elevation:75, yaw:0, cameraDistance:300, cameraFar:700,
  clearColor:0x87908b, hemisphereSky:0xcbdcf0, hemisphereGround:0x82734e,
  ambientIntensity:0.85, sunColor:0xffefd4, sunIntensity:2.3,
  sunX:-70, sunY:100, sunZ:80,
  shadowHalfSpan:105, shadowMapSize:2048, shadowNear:0.1, shadowFar:400,
  shadowBias:-0.001, shadowNormalBias:0.2, shadows:true, exposure:1,
  tone:'None', pixelRatio:1
});

// src/unified-world.js / applyUnifiedWorldActorShadows: opaque solids only.
export function applyActorShadows(root, enabled=true) {
  root.traverse(node=>{
    if (!node.isMesh) return;
    const materials=Array.isArray(node.material)?node.material:[node.material];
    const opaque=materials.length>0 && materials.every(m=>m && !m.transparent && m.opacity>=1 && !m.wireframe) && !node.userData.unifiedNoShadow;
    node.castShadow=enabled && opaque; node.receiveShadow=opaque;
  });
}
