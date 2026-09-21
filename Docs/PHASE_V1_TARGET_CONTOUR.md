# Phase V1 — Gameplay-Owned Target Contour

구현 및 검증: PASS. Phase V2 Grayscale / Fresnel: 미착수.

기존 배치와 URL을 그대로 사용합니다. 새로고침 후 적 차체에 조준점을 올리면 노란 외곽선이 표시됩니다. Shift는 필요 없습니다.

## 선택 authority

rnd_gameplay.js의 updateTargetContourSelection()이 game.targetContourTargetId를 결정합니다.
살아 있는 Boss / Panzer III / Kübelwagen / Pak 40만 대상으로 합니다.
플레이어, 장애물, stress 복제 모델, 파괴/제거된 적은 제외합니다.

기존 2D 차체 rectangle, Boss의 190×112 hull 및 좌우 track rectangle을 사용합니다.
겹침은 중심 거리 순으로 하나만 선택합니다. 3D raycast/mesh bounds로 선택하지 않습니다.
camera tilt, Boss visual scale, GLB의 긴 포신이 target-validity 범위를 바꾸지 않습니다.
따라서 3D 모델의 돌출부만 가리킬 때는 선택되지 않을 수 있습니다.

Q targeting / 전투 종료 / pointer의 canvas 이탈 / UI 진입에서는 해제합니다.
Bullet Time과 Shift Focus 중에는 동작합니다. 재시작 시 ID를 초기화합니다.

## 표현

rnd_target_contour.js가 선택 ID를 읽고 대응 GLB의 모든 mesh를 단일 마스크로 렌더합니다.
합쳐진 silhouette 경계 바깥에 약 2.5 logical px의 노란 선을 합성합니다.
내부 polygon wireframe, grayscale, Fresnel, target material 변경은 없습니다.
차체·포탑·포신의 현재 world transform을 읽으며 원본 geometry/material을 수정하지 않습니다.

마스크는 선택된 target 자체의 전체 silhouette입니다.
다른 모델에 가려진 부분을 잘라내는 scene-depth occlusion은 이 V1에 포함하지 않습니다.
이는 target 강조이며 명중 가능성/LOS/관통 가능성을 보증하는 표시가 아닙니다.
Canvas HUD/기존 weakpoint 표시는 그 위에 유지됩니다.

2D comparison에서는 3D 외곽선이 보이지 않습니다. 기존 Canvas 표시를 유지합니다.
렌더러는 game 상태를 쓰지 않습니다. 별도 mask와 화면 합성에 필요한 최소 두 pass만 추가했으며 범용 후처리 프레임워크는 도입하지 않았습니다.

## 검증

- V1 선택/해제/파괴/제거/restart/Focus/BT/실제 mouse/UI 진입: 17 checks PASS.
- R1 gameplay: 23 checks PASS.
- R2 multi-asset / renderer state isolation / 180-frame deterministic: 32 checks PASS.
- 정상/각 script 1초 지연 startup 및 selector: 각 7 checks PASS.
- 네 적의 캡처에서 실제 노란 contour pixel 확인.
- 위 브라우저 검사 pageerror 0.
- 보스/Pak 캡처 시각 확인: 전체 모델 경계를 따라 노란 선 표시.
- 별도 FPS 성능 측정은 이번 pass에서 수행하지 않음.

증거: contour_v1_validation.json, contour_v1_pixel_validation.json,
R1_final_regression.json, R2_validation.json, polish_startup_validation.json.

## 캡처

- [Boss 75°](contour_v1/Boss_75.png)
- [Boss 90°](contour_v1/Boss_90.png)
- [Panzer III](contour_v1/panzer_75.png)
- [Kübelwagen](contour_v1/truck_75.png)
- [Pak 40](contour_v1/pak_75.png)

## 수정 파일

- spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html — renderer 연결
- spike/rnd_gameplay.js — gameplay-owned target ID
- spike/rnd_target_contour.js — 노란 silhouette 표현
- tests/test_contour_v1.cjs — 검증

변경 전 HTML과 gameplay는 .before_contour 파일로 보존했습니다.
발사/충돌/armor/weakpoint/GLB/정식 HTML·Unity repository는 수정하지 않았습니다.
V1 결과 검수 후 V2 진행 여부를 결정합니다.
