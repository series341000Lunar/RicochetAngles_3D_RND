# Three.js Visual R&D — Phase V3 Player / Boss Muzzle Illumination
Date: 2026-09-20
Status: TECHNICAL PASS / VISUAL REVIEW CANDIDATE / KEEP.
This V3 is muzzle illumination, not the previously deferred local X-ray idea.
Scope: ThreeJSDEV R&D only. No mainline HTML, Unity, source model or GLB edits.

## 1. V2B baseline
Recorded in [V3_baseline.json](V3_baseline.json); HTML, gameplay, actors, Focus and contour modules backed up as *.before_muzzle_v3.* before editing. V2B reports/screenshots retained.
Runtime changes: spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html and new spike/rnd_muzzle_light.js. Gameplay, actors, V2B Focus shader and V1 contour source remain byte-identical.
Defaults remain 75°, shadows ON, Tiger II uniform ×2, Focus ON, bounds OFF. New Muzzle Light checkbox defaults ON.

## 2. Implementation
Two reusable THREE.PointLight objects: one player, one boss. Same actor firing again restarts its existing pulse. No per-shot light allocation/disposal. No emissive assist, bloom, screen flash, exposure change or global grading.
Existing fireShell observer invokes the presentation after the original gameplay fire call. Boss illumination is restricted to tank === game.boss. Panzer/Pak/truck/stress clones do not trigger muzzle lights.

## 3. Actual GLB MUZZLE
Player uses M41_PLAYER_VISUAL → GUN → MUZZLE; boss uses the loaded roleVisuals boss root → GUN → MUZZLE.
Update the world matrix, then read node.getWorldPosition(). Forward is local +X transformed through node.matrixWorld, matching the existing muzzle bridge. Offset is 1.4 scene units for Player and 1.4 × bossScale for Boss, approximately 0.10 m and 0.20 m at ×2 with the 14 units/m renderer mapping.
The node and projectile origin are never modified. Light stays at the captured firing position for its short pulse.

## 4. Position / range / color
Color is linear RGB (1.0, 0.90, 0.74), pale warm white; decay = 2.
| Actor | Peak intensity | Cutoff range, scene units | Forward offset |
|---|---:|---:|---:|
| M41 | 18,000 | 115 | 1.4 |
| Tiger II ×2 | 160,000 | 270 | 2.8 |

Boss intensity = 40,000 × scale², range = 135 × scale, maintaining similar surface response as size changes. These are renderer scene-unit tuning values, not calibrated real-world lamp specifications.
castShadow = false on both lights. Existing directional shadows remain untouched.
Visible response is concentrated at the gun/front and nearby ground. Far actors in the captured pose do not flash. The cutoff includes the long boss muzzle-to-hull distance; the brightest ground area is much smaller than the cutoff.

## 5. Intensity curve
Duration 90 ms, initial hold 20 ms:
t = max(0, (ageMs - 20) / 70)
intensity = peak × (1 - t)²
At age >= 90 ms, intensity = 0 and visible = false.
At 25 ms approximately 86% remains; at 70 ms approximately 8%; at 90 ms fully off.

## 6. Clock
performance.now(), independent of game.time and simulation delta.
No gameplay timer or Bullet Time authority changes. Deterministic captures temporarily replace the clock in the test page only; production uses the browser monotonic clock.

## 7. Smoke relationship
Initial inspection showed the fully opaque initial smoke masking the flash. Added only a 0..20 ms real-time opacity ramp to existing Player/Boss smoke while Muzzle Light is enabled.
At 0 ms: peak light/flash, smoke opacity 0.
At 20 ms: smoke reaches its original opacity envelope; light still at peak.
At 60 ms simulation time: existing expansion peak.
At 90 ms real time: light off; smoke follows its existing simulation-time lifetime.
When Muzzle Light is OFF, original smoke opacity is used. Existing smoke geometry/size, 75 ms bridge, shell fade and gameplay timing remain unchanged. No firing/projectile delay.
Existing smoke/flash remain slow in Bullet Time; only the new light and smoke's short initial ramp use real time.

## 8. Player result
[Before](muzzle_v3/V3_A_Player_before_fire.png) / [light peak](muzzle_v3/V3_B_Player_muzzle_light.png) / [smoke after](muzzle_v3/V3_C_Player_smoke_after.png).
75°: front armor/barrel-adjacent faces brighten strongly with a small ground pool; rear body remains readable. Smoke follows instead of hiding the very first flash.
Fixture relocates Player to x=500 only to avoid the top-left HUD obscuring the capture; gameplay default spawn was not changed.

## 9. Boss ×2 result
[Before](muzzle_v3/V3_D_Boss_before_fire.png) / [light peak](muzzle_v3/V3_E_Boss_muzzle_light.png) / [smoke after](muzzle_v3/V3_F_Boss_smoke_after.png).
75°: long barrel's actual muzzle emits the pulse; mantlet and turret/hull front show a strong directional brightness increase. Smoke/bridge masking remains in place after the brief initial ramp.
Near-muzzle ground also brightens. This is real local lighting, not a screen-wide white overlay.

## 10. Focus / contour coexistence
[Focused boss firing](muzzle_v3/V3_I_Boss_focus_light.png).
Focus and yellow contour state remain independent and restore correctly. V2B shader unchanged.
KNOWN LIMITATION: V2B grayscale clamps interior luminance, so the vehicle-surface lighting response is compressed during Focus; the flash and ground pool remain obvious, but focused armor does not flare as strongly as normal PBR armor. No emissive workaround or shader rewrite was added.

## 11. Camera comparison
[90°](muzzle_v3/V3_G_Boss_90_light.png): front/top illumination remains readable.
[45°](muzzle_v3/V3_H_Boss_45_light.png): front/side illumination is prominent; some nearby front faces approach white. No screen-wide washout observed.
75° remains the visual lead. [Nine-frame comparison sheet](muzzle_v3/V3_comparison.png).

## 12. Bullet Time
Deterministic check advances 90 ms presentation time and only 9 ms simulation time: light fully OFF.
Independent native-clock check fires during Bullet Time, waits 120 ms wall time with simulation held, then renders: light OFF while Bullet Time state remains active.
No 0.5–1 s light hold. Existing slower smoke behavior is deliberately retained.

## 13. Lifecycle
PASS: fire→peak→off, repeat fire reuses/restarts the same object, Player/Boss death, reset, Canvas switch, Three return, only two pooled lights, no general-enemy light trigger, actual Player MUZZLE position, no light shadows.
Session reset uses the existing game object identity; stale references are dropped on the next presentation sync. Canvas toggle/failure explicitly clears lights.

## 14. Gameplay isolation
[Core V3 validation](muzzle_v3_validation.json) / [native clock and performance](muzzle_v3_live.json).
Light ON/OFF: 600 serialized gameplay frames identical, including fire, movement, Focus, Q and Bullet Time. Render-before/after serialization also identical.
Existing regression suites rerun into muzzle_v3/regression:
- Focus lifecycle 20 checks
- V1 contour 17 checks
- R1 23 checks (projectiles, collision, ricochet, Focus, Q, Bullet Time)
- R2 32 checks (actors, hits/death, scale isolation, deterministic render)
- Final combat regression 15 checks
All PASS. No gameplay, actor, Focus or contour source changes.

## 15. Performance
Chrome headless / ANGLE D3D11 / RTX 5090 / 1280×720 / DPR 1 / 75° / shadows ON.
Peak fixtures hold the captured presentation clock to sample sustained worst-case lighting, while native requestAnimationFrame timestamps measure cadence.

| Condition | FPS | Draw calls | Triangles | Active muzzle lights | Programs |
|---|---:|---:|---:|---:|---:|
| OFF idle | 60.0 | 116 | 190,346 | 0 | 12 |
| ON idle | 60.0 | 116 | 190,346 | 0 | 12 |
| Player peak | 60.0 | 119 | 190,586 | 1 | 13 |
| Boss peak | 60.0 | 121 | 190,746 | 1 | 13 |

The firing rows include existing flash/smoke/projectile meshes, explaining their extra draw calls/triangles; the PointLight itself adds no geometry or shadow pass.
Programs stable after each warm-up. The first light-count combination can compile a shader variant; variants are then reused. Two light objects stay allocated throughout.
These refresh-limited measurements do not establish GPU cost in milliseconds or minimum-spec performance.

## 16. Limitations
- Focus surface pulse is attenuated by V2B's luminance clamp; normal armor response is substantially stronger.
- No light shadows: nearby geometry does not occlude this secondary light.
- Bright ground color reflects the existing green ground material; the light itself is warm white.
- Existing smoke/flash simulation-time behavior is unchanged except the 20 ms opacity ramp.
- Captures show deterministic pose/age samples, not user approval of real-play feel.
- First-use shader compilation may occur for new light-count/material combinations.
- Firefox/manual play was not validated this phase.

## 17. Next-phase readiness
KEEP as a V3 visual review candidate. Review the flash→surface illumination→smoke sequence at 75°, especially the focused-boss limitation.
No V4 global grading/toon quantization or V5 bloom/glow was implemented. Player permanent outline remains a later main-product Visualization Option candidate.


## User retune — intensity ×3
Peak intensity only: Player 18,000 → 54,000; Boss base 40,000 × scale² → 120,000 × scale² (Tiger II ×2: 160,000 → 480,000). Cutoff ranges remain Player 115 / Boss ×2 270 scene units. Duration 90 ms, hold 20 ms, curve, color and smoke unchanged. Earlier screenshots/performance samples above describe the original intensity. Exact source comparison confirms only the peak-intensity expression changed.
