# Three.js Visual R&D — Phase V4C Startup Prewarm
Date: 2026-09-21
Status: TECHNICAL PASS / real-user first-shot acceptance pending.

## 1. Observed hitch
User reported a short first-shot pause. Fresh browser measurements reproduced expensive first render/use; repeat shots were much cheaper. Measurement is CPU wall time through render() + WebGL finish(), NOT presentation-to-presentation RAF frame intervals or GPU-only timer queries. Chrome headless / existing machine, 1280×720, 75°, Shadow ON, normal default postprocessing OFF.

## 2. Suspected causes
Lazy shell Mesh, boss fade Material, enemy flash Mesh/Material; visibility-dependent PointLight count; shader variants, GPU geometry upload and postprocess targets. Bridge Map allocations are small and remain renderer-owned; no generic profiler/framework introduced.

## 3. Identified evidence
Before V4C, player first shot raised program count 7→13, boss 7→12. Idle lights previously visible=false, therefore inactive lights were absent from the renderer light count. First shell/flash materials also first rendered on fire.
V4C keeps both pooled PointLights registered and visible with intensity zero when idle. Runtime fire changes only intensity/position/range, preserving ×3 peaks, durations and shadows policy.
Post warming initially missed the Toon-only final-screen shader variant. First activation added one program; adding that specific path removed the extra compile. Final tested first-use count remains 32.

## 4. Required assets
M41, Panzer III, Kübelwagen, Pak 40, Tiger II, Tiger I: all six GLBs awaited, parsed and required node validation complete before READY. Unused role templates also participate in GPU resource preparation. Accurate loaded count, no fake percentage animation.
Deliberate Panzer HTTP 404: LOADING FAILED shown, START disabled, game.time=0. No false READY / primitive fallback readiness.

## 5. GPU/shader preparation
Local vendor/three.module.js r160 contains official compile() and compileAsync() (compileAsync calls compile then polls readiness via setTimeout). Implementation uses compileAsync(scene, camera).
One startup preparation cycle includes hidden draws for actual geometry uploads, shadows, FX and essential post/Focus output paths, since compile alone does not upload all draw resources or execute composer passes. Both canvases remain visibility:hidden behind the opaque menu. There are multiple targeted draws within this one cycle; no gameplay frames/events run.
Major paths: normal world, transparent boss fade, each current target Focus in direct/post output, None/ACES/Cineon/Reinhard, Numeric 4 combined, Toon-only, Grade-only, contour. No full feature permutation sweep.
A startup-only WebGL finish waits for queued work before READY. Runtime render does not use this fence. Visual configuration and visibility are restored in finally.

## 6. Reusable resources
- 128 shell visual meshes, each with prepared boss fade material.
- 32 Q shell meshes; six Q markers verified mapped to six visuals.
- Player flash/smoke and existing boss smoke reused.
- Enemy flash slots prepared for current actor IDs and boss.
- Two permanent pooled PointLights.
No Mesh/Material/Geometry/PointLight allocation in fire/pool-acquisition paths. Pool exhaustion omits excess presentation only; gameplay shell arrays are unaffected. These bounded R&D capacities are not a universal particle system. Contour target-copy and Focus root-cache setup remain their existing presentation mechanisms.

## 7. Menu gate
LOADING → READY → PLAYING. START disabled until assets and preparation succeed. During LOADING/READY, RAF updates the clock but never calls rndStep or gameplay render. Keyboard and pointer gameplay input are blocked; keyboard navigation/activation of START remains possible. START clears held input and resets lastTime.
Menu-hide CSS was caught by screenshot/real mouse validation and corrected. Final READY and PLAYING captures show the actual states.
R resets gameplay only, prewarmRuns stays 1. No return-to-menu system added.

## 8. Player timing
Milliseconds: previous render → first-shot render → next render. Fire allocation time separate.

| Case | Previous | First shot | Next | Programs |
|---|---:|---:|---:|---|
| Original V4B | 193.5 | 179.9 | 3.0 | 7→13 |
| V4C ?prewarm=0 | 15.3 | 11.5 | 1.7 | 7→9 |
| V4C prepared | 14.5 | 1.5 | 0.8 | 32→32 |

Fire allocation: original .3ms; disabled .4ms; prepared .4ms. Second shot prepared .6ms.
The original baseline includes cold first-world cost; later runs can benefit from driver/browser cache. These single-run numbers are not controlled cross-device guarantees. The stable program count is stronger evidence that first-shot shader work moved to startup.

## 9. Boss timing
| Case | Previous | First shot | Next | Programs |
|---|---:|---:|---:|---|
| Original V4B | 55.5 | 25.6 | 1.7 | 7→12 |
| V4C ?prewarm=0 | 15.2 | 4.4 | 1.3 | 7→8 |
| V4C prepared | 14.0 | 1.5 | 1.0 | 32→32 |

Prepared second shot .7ms. Peak 480000 at scale 2, range 270; player 54000/range115; V3 90ms realtime envelope retained.

## 10. Other first-use FX and defaults
Final validation measured player 1.6ms, boss1.1, contour1.2, Focus1.0, Q1.2, Numeric4 1.2, Grade .9; all program count32.
Defaults: Tone=None, neutral Grade values; Color Grading OFF, Toon OFF independently. Numeric4 selected. Numeric3/5 and tone mapper alternatives retained. Bitmap download and primary UI removed; historic PNG/shader branch retained, no normal startup request.
Saturation/Shadow/Mid/Highlight remain user controls, as do Exposure/Contrast.

## 11. Isolation / regression
PASS:
- Game JSON identical before/after preparation (HP, AI, score, time, shell arrays, Q/Focus/Boss state).
- Instrumented gameplay Math.random calls during preparation: 0.
- Loading/Ready keyboard including R/Tab does not change game state.
- 600-frame deterministic gameplay trace equal across post off/on.
- Existing V1 real mouse contour, V2 Focus, V3 muzzle, R2 actors, final gameplay/Q and independent four-way toggles.
- Q actually creates six markers / six pooled vertical shell visuals.
- Restart no asset/prewarm rerun; camera75, Shadow ON.
- No normal-path pageerror / shader error.
V3 regression wrapper updates old visible=false assertions to intensity===0, reflecting the required permanent light registration. It does not loosen active intensity/duration/position tests.
rnd_gameplay.js and rnd_actors.js unchanged.

## 12. Remaining limits
Headless measurements do not certify subjective smoothness in the user's external browser or low-end hardware. Resize/new DPR, very large stress scenes, newly introduced assets/materials, or context loss may create new resources outside the warmed baseline. Target root recreation can still allocate cached presentation objects even when shader programs are reusable. The first ordinary post-START measurement in the timing test was ~14–15ms; no claim of zero startup scheduling cost.
Debug comparison URL parameter ?prewarm=0 skips GPU variant preparation but retains the asset gate/pools and baseline scene initialization. It is never the default.
Bounded pool overflow is presentation omission only. No performance framework or runtime repository changes.

## 13. V5 readiness
V4C technical reference is ready for user play inspection. Selective Bloom/Glow not implemented. Confirm first Player/Boss shots feel normal in the user's actual browser before advancing.

## Files and evidence
Runtime changes:
- spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html
- spike/rnd_startup.js (new)
- spike/rnd_muzzle_light.js
- spike/rnd_world_grade.js
- spike/rnd_toon_ramp.js

Pre-change copies: corresponding *.before_v4c.*.
- [READY](V4C_READY.png)
- [PLAYING](V4C_PLAYING.png)
- [Original baseline](V4C_before_timings.json)
- [Prewarm disabled](V4C_disabled_timings.json)
- [Prewarm enabled](V4C_after_timings.json)
- [Functional validation](V4C_validation.json)
- [RNG and failure isolation](V4C_isolation_failure.json)
- Existing regression results: prewarm_v4c/regression/
Tests: test_prewarm_timing.cjs, test_prewarm_v4c.cjs, test_prewarm_isolation.cjs, run_v4c_regression.cjs.
