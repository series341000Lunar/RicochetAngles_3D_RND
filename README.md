# RicochetAngles_3D_RND

RicochetAngles의 Three.js / Runtime 3D / DCC Authoring R&D repository.

Current scope:
- Three.js rendering experiments and multi-asset runtime validation
- Visual/game-language experiments
- Blender semantic authoring feasibility
- DCC bridge / semantic validation research

This repository is not HTML gameplay authority or Unity runtime authority.
HTML gameplay: `series341000Lunar/steel-angle-prototype`.
Unity runtime: `series341000Lunar/RicochetAngles_UNITY`.

Production models, Blender derivatives, generated screenshots, manual pre-Git
backups, and MainlineReference remain local-only. A fresh clone requires local
asset injection for the full visual testbed; it does not include production models.
Offline Three.js runtime and its license remain tracked under `spike/vendor/`.
See [repository baseline](Docs/GIT_BASELINE_20260921.md) and
[upstream reference policy](Docs/UPSTREAM_REFERENCE.md).

The original R&D history follows unchanged.

---

# Three.js M41 GLB R&D

정식 HTML / Unity Edition과 분리된 렌더 실험입니다.

## 실행

PowerShell에서 다음 명령을 실행하고 브라우저 주소를 여십시오.

    py -m http.server 8765 --bind 127.0.0.1 --directory "\\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV"

http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html

ES module / GLB fetch를 사용하므로 HTML 더블클릭(file://) 대신 로컬 HTTP로 실행합니다.
Three.js 0.160.1과 표준 GLTFLoader는 spike/vendor에 포함되어 실행 시 CDN 연결이 필요 없습니다.
서버가 이미 같은 포트에서 실행 중이면 기존 주소를 사용하십시오.

## 조작

- W/S: 이동, A/D: 차체 회전
- 마우스: 포탑 조준, 좌클릭 유지: 발사
- P: 렌더 전용 M41 한 대 추가 (키 반복 지원)
- R: 기존 게임 재시작, stress count 유지
- Clear stress: 렌더 전용 전차만 제거
- 그림자 / 45°~90° (5° 간격) / 2D 비교: 기존 Spike 옵션
- Tab: 기존 게임 디버그

## 파일

- [GLB Spike](spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html)
- [GLB](M41/export/M41_RND_v01.glb)
- [Blender 파생본](M41/source/M41_RND_v01.blend)
- [전체 결과 보고서 및 성능 표본](M41/notes/RND_Report.md)
- [원본 Primitive Spike](RicochetAngles_Legacy_ThreeJS_Spike.html)

원본 모델·Primitive Spike·게임 로직은 보존했습니다.
GLB는 5 meshes / 17,078 triangles / 3 materials / 0 textures입니다.
뷰포트의 스트레스 그리드 수용량을 넘으면 화면 아래로 이어지므로 표시 경고를 확인하십시오.

## 포구 / 탄 Visual Bridge R&D

현재 Spike는 MUZZLE 노드를 포함한 M41_RND_v02_muzzle.glb를 사용합니다.
Bridge 75ms: 초기 탄 시각 위치를 실제 포구에서 기존 궤적으로 연결합니다.
Muzzle debug: 초록 GLB 포구 / 빨강 nominal gameplay 포구 / CSS pixel 차이를 표시합니다.
45°~90° 목록과 기본 90°는 유지합니다. 75°는 후보이며 확정값이 아닙니다.

[포구 보정 보고서와 비교 캡처](M41/notes/Muzzle_Bridge_Report.md)


## Multi-Asset Game Language R&D — 2026-09-20
    
기존 M41 Spike를 보존한 별도 실험입니다.

실행: http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html

- SPACE: incoming threat가 있을 때 Bullet Time (3초 / cooldown 0)
- SHIFT hold: Focus charge 0.35초 / X-ray / 탄약 소모 없음
- Q: 6발 HE targeting, LMB 확인, Q/RMB/Esc 취소
- M41 player / Panzer III 일반 전차 / Kübelwagen 차량 / Pak 40 고정포 / Tiger II Boss
- Tiger I/II, uniform 1/1.5/2, 조건부 low/wide 비교
- low/wide는 1.7/1.2/1.9 고정 시각 배율이며 uniform 값과 곱하지 않습니다.
- Gameplay/GLB bounds: hitbox/visual/포구 차이 확인
- 기존 W/S/A/D/발사/R/P/카메라/그림자/2D 비교 유지
- 현재 R&D 기본값: **75° / Tiger II / Uniform 2.0**. 90°는 reference, 45°는 diagnostic입니다.
- Boss smoke / fade: 실제 포구의 포연 3개와 초기 탄 투명도 비교. gameplay 발사/충돌은 그대로입니다.

[결과·한계·검증 보고서](Docs/THREEJS_MULTI_ASSET_GAME_LANGUAGE_RND_20260920.md)
[비교 캡처](Docs/validation_20260920/)

현재 multi-asset 3D 방향과 위 R&D 기본값은 사용자 결정으로 유지합니다. 정식 본편/Unity 통합 및 향후 Core Boss 디자인은 별도 판단입니다.


## Visual Phase V2 — Focus Material (2026-09-20)
Shift + V1 gameplay-selected enemy: whole-target dark grayscale / Fresnel, yellow contour retained. Panel Focus Material toggles comparison. Default 75°, Tiger II uniform ×2. Technical PASS; user visual review pending. See [V2 report](Docs/THREEJS_VISUAL_PHASE_V2_FOCUS_FRESNEL_20260920.md). V3 is not implemented.


## Visual Phase V2B — Contrast Retune (2026-09-20)
Current Focus: interior 0.22, white Fresnel gain 1.25 / power 2.0. Green analysis box/fill follows Gameplay / GLB bounds (default OFF). Whole-target Focus, yellow contour and gameplay remain. [V2B report and screenshots](Docs/THREEJS_VISUAL_PHASE_V2B_FOCUS_RETUNE_20260920.md). Technical PASS; user visual review pending.


## Visual Phase V3 — Muzzle Illumination (2026-09-20)
Player/Boss-only pooled PointLights at actual GLB MUZZLE. Muzzle Light defaults ON; 90 ms real-time pulse, 20 ms smoke opacity ramp. V2B Focus and yellow contour retained. [V3 report / screenshots](Docs/THREEJS_VISUAL_PHASE_V3_MUZZLE_LIGHT_20260920.md). Technical PASS, visual review pending; Focus armor lighting is attenuated by its existing luminance clamp.


## Visual Phase V4A — Tone Mapping / Color Grade (2026-09-20)
Expand Post FX · Tone / Color Grade in the R&D panel. Compare None/ACES/Cineon/Reinhard, exposure, contrast, saturation, and advanced shadow/mid/highlight gains. Initial candidate: Cinematic A (ACES), not final art direction. Yellow contour and Canvas HUD stay outside grading. V3 muzzle intensity ×3 remains. [V4A report and comparisons](Docs/THREEJS_VISUAL_PHASE_V4A_TONEMAP_COLORGRADE_20260920.md). V4B/V5 not implemented.


## V4B Toon Ramp — 2026-09-21
Color Grading / Toon default OFF and are independently switchable. Enable either or both in the scrollable R&D panel to compare T_Lut_03, Numeric 3/4/5 and Strength. Existing Tone/Grade sliders remain. Artist ramp .4–.6 is the review candidate; no final preset approval. See [V4B report](Docs/THREEJS_VISUAL_PHASE_V4B_TOON_RAMP_20260921.md). V5 not started.


## V4C Startup Prewarm — 2026-09-21
LOADING → READY → START. Six GLBs and GPU/FX preparation finish before gameplay starts. R restarts gameplay without reloading. Default Tone=None, Color Grading/Toon independently OFF, Numeric 4 selected; bitmap is excluded from normal UI/loading. Debug ?prewarm=0 skips GPU warmup for comparison only. See [V4C report](Docs/THREEJS_VISUAL_PHASE_V4C_PREWARM_20260921.md).


## V5 Selective Bloom — 2026-09-21
After READY/START, enable Bloom in the scrollable Color Grading / Toon panel. Bloom defaults OFF and works independently. Only Player/Boss muzzle flash and Q vertical shell emit glow. Strength .60 / Radius .25 / Threshold .85 are review candidates. [Report and comparisons](Docs/THREEJS_VISUAL_PHASE_V5_SELECTIVE_BLOOM_20260921.md). V6 not started.


## G1 Tiger II Weakpoint Remap — 2026-09-21
G1 originally defaulted to TIGER_REMAP; G2 now defaults to TIGER_SPATIAL. Switch Boss spatial preset to TIGER_REMAP or LEGACY for the preserved comparisons. Use Debug OVERLAY at 90 degrees and 3D anchor labels at 75 degrees. Canonical gameplay offsets are fixed to Tiger II Uniform x2 (28 units/m); visual scale changes do not alter hit coordinates. Surface labels at 75 degrees remain vertically offset from ground-plane hit centers. No collision enlargement or Bloom changes. [G1 report, tests and A-H screenshots](Docs/THREEJS_GAMEPLAY_PHASE_G1_TIGER2_WEAKPOINT_REMAP_20260921.md). Technical PASS; user visual/play review pending. G2 calibration follows below.

## Tiger II Boss spatial sync — G2 (2026-09-24)

The Multi-Asset R&D page now defaults to `TIGER_SPATIAL` at Tiger II / Uniform ×2.
The G2 panel compares measured 90° visual bounds, old and new 2D projectile proxies,
weakpoint and ENGINE/CORE anchors, and the unchanged vehicle collision circle.
Use 75° for the play presentation check. The 2D game remains combat authority; CORE
is an internal reference only. Switch the preset to `LEGACY` or `TIGER_REMAP` to compare
prior behavior. Noncanonical visual options show a calibration warning.

[Spatial sync report and previews](Docs/G2_TIGER_BOSS_SPATIAL_SYNC_20260924.md) ·
[Validation JSON](Docs/g2_spatial/validation.json) ·
[Original HTML backup](spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_spatial_sync.html)

## G3 Tiger II Canvas fallback visual sync (2026-09-24)

The Multi-Asset R&D `2D 비교` mode now draws a Tiger II-like top-down Boss hull,
tracks, turret, long gun, and rear engine deck from the G2 visual bounds.
`G3 Canvas visual` toggles this presentation against the G2 primitive baseline.
To see G3 after `Launch_MultiAsset_RND.bat`, set **G1 Weakpoints → Boss spatial preset**
to `TIGER_SPATIAL`, leave **G2/G3 Boss spatial → G3 Canvas visual** checked,
then click **2D 비교**. The Three.js mode continues to display the existing Tiger II GLB.
The Canvas status now reports when another preset keeps G3 inactive. If an older tab
still shows the previous UI, reload it with Ctrl+F5 or use the new launcher tab.
The G2 projectile, armor, weakpoint, collision, and Boss gameplay state stay authoritative.
Use 90° for Three/Canvas alignment; 75° remains a Three.js presentation check.

[G3 report and A-I previews](Docs/THREEJS_GAMEPLAY_PHASE_G3_2D_FALLBACK_SYNC_20260924.md) ·
[G3 validation](Docs/g3_canvas/validation.json)
