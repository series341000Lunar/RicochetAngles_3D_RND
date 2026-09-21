# Three.js Multi-Asset R&D — Stabilization / Presentation Polish
2026-09-20 · 현재 baseline 갱신

**기술 검증 PASS · 75° / Tiger II Uniform 2.0 R&D baseline 적용 완료**

이번 pass는 사용자가 유효하다고 판단한 3D multi-asset 방향을 유지하면서 보스 발사 표현과 실행 안정성을 정리했습니다. 정식 HTML / Unity / main repository 통합은 이번 범위가 아닙니다.

실행: http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html  
배치: ../Launch_MultiAsset_RND.bat  
기존 탭은 새로고침하거나 배치를 다시 실행하십시오.

## 1. 현재 baseline summary

| 항목 | 현재 기준 |
|---|---|
| 주력 R&D 시점 | **75°** |
| Reference / fallback | 90° |
| Diagnostic | 45°; 50~85° 비교 selector 유지 |
| Boss | **Tiger II / Uniform / 2.0** |
| Low/Wide | 선택 가능한 비교안, 기본값 아님 |
| Q | 6 HE / unlimited R&D / 3D vertical presentation 유효 |
| 판정 authority | 기존 2D gameplay |
| 추가 polish | Boss 실제 MUZZLE의 포연 3개 + 초기 visual shell fade |
| 보존 | M41, Panzer III, Kübelwagen, Pak 40, Bullet Time, Focus/X-ray, stress, shadow, 2D 비교 |

R&D UI의 초기 선택값과 실제 renderer 설정이 일치합니다.
Boss smoke / fade 체크를 끄면 같은 구조에서 효과 없는 비교를 할 수 있습니다.
기존 gameplay/GLB mismatch debug도 유지합니다.

[75° baseline](polish_20260920/01_75_baseline.png)

## 2. 75°를 주력 시점으로 보는 이유

사용자의 이번 결정에 따라 75°를 주력으로 고정했습니다.
실제 자산의 높이와 측면을 읽을 수 있고, 2D gameplay 바닥 좌표를 사용하는 조작·표시와 함께 관찰하기에 적합했던 기존 결과를 이어갑니다.
이번 작업에서 방향 자체의 타당성을 다시 심사하지 않았습니다.
카메라 ground-plane compensation은 기존 방식 그대로입니다.

## 3. 90° / 75° / 45° 비교

- **75°:** 현재 기준 화면. 포구·포연·낙하 포탄의 높이 표현을 중심으로 검수합니다.
- **90°:** ground projection, hitbox, 2D reconstruction 비교 및 fallback.
- **45°:** 높이 parallax와 overlay mismatch를 크게 드러내는 diagnostic. 주력 후보로 취급하지 않습니다.

[75°](polish_20260920/01_75_baseline.png) /
[90° reference](polish_20260920/02_90_reference.png) /
[45° diagnostic](polish_20260920/03_45_diagnostic.png)

같은 seeded pose에서 카메라만 바꾼 정지 캡처입니다.
기존 45~90° 5° 간격 selector를 모두 유지했습니다.

## 4. Tiger II Uniform 2.0 기본값

사용자가 지정한 큰 Boss의 현재 baseline을 UI와 renderer에 적용했습니다.
Boss는 새로운 gameplay actor가 아니라 기존 Legacy Boss의 시각 표현입니다.

HP, hull collision, weakpoint, armor, penetration, ricochet,
88-unit gameplay muzzle distance, projectile speed 및 발사 timing은 변경하지 않았습니다.
Uniform 1.0 / 1.5 / 2.0 비교와 Tiger I 선택도 유지합니다.

[현재 Tiger II](polish_20260920/13_TigerII.png)

## 5. Low/Wide는 비교안

Uniform이 기본값입니다. Low/Wide는 vehicle-local X/Y/Z = 1.7 / 1.2 / 1.9의 비교용 runtime transform입니다.
Uniform scale 값과 곱하지 않으며 GLB에 bake하지 않습니다.
Low/Wide를 현재 표준 디자인이나 최종 Core Boss로 선언하지 않습니다.

## 6. Boss muzzle seam

Tiger II를 2배로 표시하면 실제 GLB MUZZLE과 기존 gameplay 발사점이 떨어집니다.
비교 fixture의 Boss heading π에서:

- actual GLB muzzle X = 776.02, height = 73.96 legacy units
- gameplay shell initial X = 867.00
- 기존 75ms ease-out bridge가 두 표현을 연결
- 초기 shell이 밝게 보이면 포신 중간에서 나오는 듯한 불연속이 드러남

이는 gameplay origin을 옮길 사유로 취급하지 않았습니다.
수정 전후 shell의 gameplay 좌표와 visual bridge 좌표는 동일합니다.
예: 30ms에 gameplay X=849.00 / visual X=833.24로 양쪽 모두 같습니다.

[수정 전 발사](polish_20260920/04_Boss_before.png) /
[수정 후 발사](polish_20260920/05_Boss_after.png)

## 7. Smoke / shell fade 처리

### 고정된 세 개의 포연

MUZZLE_SMOKE_GROUP을 실제 GLB MUZZLE world position에 생성합니다.
세 low-poly sphere는 반투명, 확대, 포구 축 방향의 작은 전진과 상승, fade-out을 수행합니다.
공유 sphere geometry와 세 고정 mesh를 재사용하며 범용 particle framework는 추가하지 않았습니다.

- Boss flash: **25ms**
- Boss smoke: **240ms**
- 초기 visual shell fade: **75ms**
- 모두 기존 bridge와 같은 **simulation clock** 사용
- GLB·gameplay entity에는 효과 상태를 기록하지 않음
- restart 시 이전 game의 포연 숨김
- 보스 사망 시 포연 숨김
- 연속 발사 시 고정 group 재사용

### Boss 전용 opacity

| 발사 후 sim time | visual shell opacity |
|---:|---:|
| 0ms | 12% |
| 15ms | 37% |
| 30ms | 59% |
| 60ms | 92% |
| 75ms 이후 | 100% |

계산: 0.12 + 0.88 × (1 − (1 − clamp(age / 0.075))^1.5)

opacity만 바뀝니다. gameplay shell을 늦추거나 숨긴 동안 충돌을 보류하지 않습니다.
도탄/bridge 종료 시 opaque 재질로 돌아가며, 충돌로 shell이 제거되면 visual도 제거됩니다.
재질은 mesh별로 분리하여 Pak/Panzer/M41 포탄이나 pool 재사용에 opacity가 누출되지 않도록 했습니다.
기존 cubic interpolation과 duration 0.075는 그대로입니다.

[30ms 전](polish_20260920/06_before_30ms_closeup.png) /
[30ms 후](polish_20260920/06_after_30ms_closeup.png) /
[75ms 후](polish_20260920/06_after_75ms_closeup.png)

**시각 관찰:** 75°/2배/heading π 근접 캡처에서 초기 shell의 대비가 줄고 포연이 포구 주변의 연결 구간을 덮는 것을 확인했습니다.
수학적 위치 차이는 유지됩니다. 75ms 부근의 작은 밝은 탄이나 debug 상태에서는 seam을 여전히 볼 수 있습니다.
모든 heading과 장시간 정상 플레이의 최종 시각 승인을 의미하지 않습니다.

Gameplay/GLB bounds debug에는 actual/gameplay muzzle, 현재 camera angle,
Boss scale/shape, bridge active 상태, shell opacity, smoke 상태를 함께 표시합니다.
[debug](polish_20260920/14_Boss_debug_bridge.png)

## 8. Q vertical shell

현재 유효한 6 HE / targeting / confirm / cancel / unlimited 구조를 유지했습니다.
75°에서 작은 포탄을 읽기 쉽게 ConeGeometry의 radius 3.5→4.5,
height 18→22 legacy units만 조정했습니다.

X/Z=gameplay marker, Y=260 × remaining/total 그대로입니다.
marker가 사라질 때 visual을 제거하며, 별도 impact timer / ballistic physics / collider / raycast / damage authority는 없습니다.

- 0.25 sim seconds: Y=130, gameplay impact 0회
- 0.50 sim seconds: 실제 HE 6회, renderer Q shell 0개
- 2D 비교 모드에서도 동일한 gameplay 피해 처리
- Bullet Time은 기존 marker 시간과 함께 낙하를 늦춤

[Targeting](polish_20260920/07_Q_targeting.png) /
[Descending](polish_20260920/08_Q_descending.png) /
[Impact](polish_20260920/09_Q_impact.png)

## 9. Multi-asset 및 안정화 결과

기존 자산/행동을 유지했습니다.

- M41: player, 조준/발사/MUZZLE/bridge/smoke 유지.
- [Panzer III](polish_20260920/10_PanzerIII.png): 이동·조준·주포·HP·관통·사망 제거 PASS.
- [Kübelwagen](polish_20260920/11_Kubelwagen.png): waypoint 주행·피해·사망 제거 PASS.
- [Pak 40](polish_20260920/12_Pak40.png): HULL 고정·조준·경고·발사·재장전 PASS.
- [Tiger II](polish_20260920/13_TigerII.png): 기존 Boss trigger→engine→HP 경로 PASS.

패널을 압축하고 상세 asset loading 문구를 접어서 기본 1280×720 화면의 Pak 40을 가리지 않도록 했습니다.
FPS/draw calls/triangles/DPR/stress 및 비교 조작은 유지합니다.

배치 실행에서 발생했던 초기화 race fix도 보존했습니다.
rnd_gameplay.js와 rnd_actors.js 각각 1초 지연 조건에서 정상 시작하고 game time이 진행되는 것을 재검증했습니다.
검증 브라우저는 실제 Chrome입니다. 사용자 Firefox 프로필에서의 직접 재검수는 별도입니다.

### 회귀 결과

| 검증 | 결과 |
|---|---|
| Polish / default / smoke / fade / Q / 수정 전후 결정성 | 25 checks PASS |
| R1 게임플레이 회귀 | 23 checks PASS |
| R2 자산/역할/180-frame render isolation | 32 checks PASS |
| Boss 약점·세 actor 피해/제거 등 edge cases | 15 checks PASS |
| 실제 키보드·마우스 / restart / shadow / 2D / stress / resize | 19 checks PASS |
| 정상 및 지연 startup / camera·scale·shape·polish selector | 각 7 checks PASS |
| pageerror | 모든 위 실행 0 |
| 수정 전후 420프레임 game serialization | 완전히 동일 |
| renderer 전후 gameplay serialization | 동일 |

근거:
[polish](polish_validation.json), [startup](polish_startup_validation.json),
[R1](R1_final_regression.json), [R2](R2_validation.json),
[edge cases](final_regression.json), [live browser](live_browser_validation.json).

실제 RAF 성능 표본: RTX 5090 / Chrome headless ANGLE D3D11 / 1280×720 / DPR 1에서
추가 M41 0·25·100대 및 100대 shadow OFF 모두 최근 표본 60 FPS였습니다.
포연은 고정 mesh 3개를 추가합니다. 표본은 지속적인 다중 포연의 최악 부하를 측정한 것이 아니며,
저사양·모바일·장시간 성능 보장으로 해석하지 않습니다.

### 파일과 source protection

수정 runtime은 spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html입니다.
수정 전 HTML은 같은 폴더의 .before_polish.html로 보존했습니다.

rnd_gameplay.js, rnd_actors.js, HTML 첫 classic gameplay script,
기존 M41 Spike, GLB exports 및 reference snapshot의 보존 검사를 수행했습니다.
[polish_source_preservation.json](polish_source_preservation.json)

Reference source는 계속 **675a9594d26d90c7a787ae100dc92f782b38f245**입니다.
MainlineReference/20260920_675a959의 stale manifest를 수정하지 않았습니다.
[R0 출처 기록](R0_reference_provenance.json)

초기 R0–R3 상세 보고서는
[before_polish report](THREEJS_MULTI_ASSET_GAME_LANGUAGE_RND_20260920.before_polish.md)에 보존했습니다.
그 문서의 이전 기본값/후보 상태는 역사적 기록이며 현재 기본값은 본 문서를 따릅니다.
기존 회귀 결과의 이전 사본은 pre_polish_validation/에 있습니다.

## 10. Remaining issues

1. Boss의 gameplay/GLB muzzle 위치 차이는 그대로입니다. 이번 변경은 노출 완화이며 판정 변경이 아닙니다.
2. sphere 포연의 각진 placeholder 인상은 남습니다.
3. Bullet Time 0.1에서는 75ms fade/bridge가 약 750ms real-time,
   240ms smoke가 약 2.4초 real-time으로 늘어납니다. 시계 정책은 이번에 변경하지 않았습니다.
4. Boss 약점/Focus overlay는 2D authority를 그대로 표시하여 GLB와 정합이 다릅니다.
5. 작은 창, debug 전체 표시, 여러 overlay의 동시 가독성은 후속 검수 대상입니다.
6. 모든 heading·플레이 상황에서 seam 제거를 보장하지 않습니다. 정상 플레이의 체감 검수는 사용자에게 남깁니다.
7. 정식 본편·Unity 통합, production threat probability parity, 장시간/저사양 검증은 이번 범위가 아닙니다.

## 11. 다음 권장 단계

**B. 75° 기준 HUD / overlay readability 검토**를 먼저 권장합니다.
이미 유효한 3D 표현을 유지하면서 Boss 약점, Focus, Q 표식이 겹치는 상황을 정리하는 단계입니다.

현재 자료는 A의 본편 Hybrid feasibility discussion에도 사용할 수 있습니다.
C의 smoke flipbook 교체와 D의 향후 original Core Boss 디자인 판단은 별도 과제로 남깁니다.
이번 작업은 해당 방향을 확정하거나 구현하지 않았습니다.

**현재 R&D 방향과 기본값은 유지. 정식 통합과 후속 디자인 판단은 별도.**

## 포연 후속 조정 — 사용자 peak 크기 레퍼런스

첨부 표시를 기준으로 보스와 M41 포연을 확대했습니다. 회색은 유지합니다.
75도 / Boss 2배 기준 최대 외곽 지름은 약 168 logical px, M41은 약 68 logical px입니다.
60ms에 peak 도달, 72ms까지 opacity 1 유지, 이후 smoothstep으로 240ms까지 투명해집니다.
시간은 simulation clock 기준입니다. 발사·충돌·브리지 위치와 수명은 유지합니다.
25개 polish 회귀 PASS. [최대 크기 캡처](polish_20260920/06_after_60ms_closeup.png)

## Phase V1 — Gameplay-Owned Target Contour

유효한 적에 조준점을 올리면 GLB 전체 실루엣에 노란 외곽선을 표시합니다. 선택은 2D gameplay가 소유합니다.
[구현 범위·판정 규칙·검증·캡처](PHASE_V1_TARGET_CONTOUR.md). V2 Grayscale / Fresnel은 미착수입니다.
