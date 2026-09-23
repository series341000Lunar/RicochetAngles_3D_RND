# Three.js / Canvas Alignment R&D — G3 Tiger II 2D Fallback Visual Sync

**범위:** `01_RND/ThreeJSDEV` Multi-Asset R&D의 Canvas 표현. **기술 결과:** G3 자동 검증 PASS 후보, 사람의 플레이·아트 승인 UNVERIFIED. **작성일:** 2026-09-24.

## 1. G2 baseline과 권한

Tiger II GLB는 공간 참조, G2의 `TIGER_SPATIAL` 2D proxy는 포탄·장갑·약점·차량 충돌 권한이다. G3는 Canvas 외형만 바꾼다. 실제 코드 `spike/rnd_tiger_spatial.js` 및 `Docs/g2_spatial/validation.json`을 다시 읽어 사용했다. Tiger II Uniform ×2, 28 gameplay units/m, 90° top-down authoring, 75° Three.js presentation 기준이다. GLB SHA-256은 `e0eeeb1988f66089ada78e221ba0e43296518f0ecfde5cabbbc901b048ad6c20`으로 이번 작업에서 재확인했다.

| G2 2D 판정 영역 | 중심 (local 2D) | 크기 (gameplay units) |
| --- | --- | --- |
| HULL | `(-2.28, 0)` | `161.88 × 76` |
| TRACK_L / TRACK_R | `(0, -38.58)` / `(0, +38.58)` | 각각 `161.14 × 20.39` |
| TURRET | 포탑 pivot 기준 `(5.04, 0)` | `129.36 × 75.19` |
| ENGINE | `(-63, 0)` | `32.2 × 43.4` |
| CORE | `(-44.8, 0)` | `22.4 × 28`, 내부 참조만 |

G3는 위 숫자를 복사한 별도 판정 테이블을 만들지 않았다. Canvas는 실행 중 G2의 `visualRects`, `rects`, `presentation`, G1/G2 약점 descriptor를 읽어 크기와 위치를 잡는다. 정규화된 **시각용 고정 다각형 점 배열**만 새로 둔다. 이 다각형은 hit test, damage, 3D raycast에 연결되지 않는다.

## 2. 기존 Canvas Boss 문제

[G2 Canvas 이전 화면](g3_canvas/00_G2_Canvas_before.png)은 판정 크기만 G2에 맞춰졌고, 차체·포탑은 사각형, 궤도는 단순 밴드, 포신은 두꺼운 막대로 남았다. 90° [Three 참조](g3_canvas/G3_A_90_Three.png)와 전환하면 같은 Boss의 길이·궤도·포탑 외형으로 읽히기 어려웠다. ENGINE 판정은 이미 뒤쪽으로 옮겨졌지만 후방 엔진 덱의 시각 구조가 약했다.

## 3. 새 Canvas silhouette 방식과 90° 참조

`spike/rnd_tiger_canvas.js`의 정규화된 `HULL`, `DECK`, `GLACIS`, `TURRET` 점 배열을 Canvas 2D path로 그린다. 매 프레임 GLB를 읽거나 새 이미지를 디코딩하거나 mesh를 투영하지 않는다. 정규화 점에 현재 G2 실측 visual footprint를 곱하므로 외곽 크기의 근거가 하나다. 75° 화면을 거꾸로 추정하지 않았으며 Canvas는 계속 정수직 top-down이다. 손으로 조정한 모서리 각도와 색은 presentation 값이다.

## 4. Hull

실측 HULL visual AABB `161.88 × 100.03` 안에 전후 폭이 다른 12점 윤곽을 넣었다. 전면 경사부, 측면 스커트, 후방 덱 seam을 그려 generic rectangle 인상을 줄였다. Canvas HULL 다각형의 길이는 G2 visual 길이와 같고 몸체 높이는 약 `86` units다. 양쪽 track 외곽까지 합한 너비는 약 `97.6` units로 3D HULL visual AABB 약 `100.0` units에 가깝다. Projectile HULL `161.88 × 76`은 그대로이며 다각형의 경사 모서리로 포탄을 판정하지 않는다.

## 5. Tracks

좌우 궤도 중심과 밴드 크기는 G2 `TRACK_L/R`에서 직접 읽는다. 시각 밴드는 차체 스커트 바로 바깥에서 구분된다. 기존 `±70` Legacy 배치를 새 Canvas에 쓰지 않는다. 파괴 상태의 색, 균열, 복구 타이머 표시는 G3 실루엣 위에 남겼다. 궤도 HP/복구 규칙은 그대로다.

## 6. Turret

Canvas의 이동 기준은 `tigerSpatial.transform(boss, 'turret')`이다. 이 G2 변환은 차체가 소유한 포탑 pivot(`-3.31` units)과 실제 포탑 회전을 결합한다. 포탑 윤곽은 G2 `129.36 × 75.19`를 감싸는 정규화 12점 다각형이다. 4개의 독립 차체·포탑 각도에서 실제 Canvas transform을 읽어 G2 pose와 0.001 unit 이내로 일치하는지 검사했다. 기존 generic 원형 포탑과 offset은 G3 ON에서 사용하지 않는다.

## 7. Gun

G2의 measured `gun` visual rect에서 포신 시작·끝을 읽어 긴 포신과 muzzle brake를 그렸다. 길이 `113.26` units의 외형만 표현한다. `fireShell`, gameplay muzzle, 75 ms visual bridge의 권한이나 값은 바꾸지 않았다.

## 8. Engine / Core

후방 덱은 G2 ENGINE 영역을 덮고, 엔진 그릴과 seam을 가진다. Canvas ENGINE 라벨은 `tigerSpatial.presentation.engine`을 2D로 투영한 **표시 기준점**을 사용한다. 실제 피격 rect는 계속 G2 중심 `(-63,0)` / `32.2 × 43.4`다. 두 좌표는 분리되며, 90° [ENGINE/CORE 화면](g3_canvas/G3_G_Engine_Core.png)에서 라벨과 rect가 모두 덱 안에 있다. CORE는 내부 rear-center 표시이며 기본 전투 약점이나 데미지 기믹이 아니다.

## 9. Weakpoints와 상태 표시

GUN PORT, VISION SLIT, CUPOLA용 turret fitting은 G1/G2 descriptor 좌표를 직접 사용한다. 기존 active weakpoint marker, 약점 전환, engine-exposed 표시, rage tint, damage flash, 파괴된 track 표시는 유지한다. [약점 debug 화면](g3_canvas/G3_H_weakpoints.png)은 겹치는 텍스트 대신 위치 번호 1–5와 범례를 사용한다. Canvas의 기존 Focus와 target 선택 경로는 변경하지 않았다. Three.js Yellow Contour는 Canvas에 복제하지 않았다. 이전 Canvas에 별도 Boss recoil 연출은 없으므로 새 recoil 상태를 만들지 않았다.

## 10. Three / Canvas 비교와 사용법

R&D 패널 **G2/G3 Boss spatial · Canvas compare**의 `2D 비교` / `3D 복귀`로 같은 gameplay state를 즉시 전환한다. `G3 Canvas visual`을 끄면 G2 사각형 외형으로 돌아가고 켜면 새 외형을 사용한다. `Canvas visual outline`은 노란색, G2 gameplay proxy는 청록색, 3D 측정 visual AABB는 흰색 점선으로 동시에 볼 수 있다. 비교 권장 설정은 Tiger II / Uniform / Scale 2 / 90°다.

- [G3_A_90_Three.png](g3_canvas/G3_A_90_Three.png) ↔ [G3_B_90_Canvas.png](g3_canvas/G3_B_90_Canvas.png): 같은 fixture와 고정 카메라로 촬영했다. 차체 중심, track 바깥 폭, turret 위치, gun 방향과 끝이 가깝게 정렬된다.
- [G3_C_90_overlay.png](g3_canvas/G3_C_90_overlay.png): 실제 Canvas 외형 + 노란 다각형 윤곽 + 청록 G2 판정 + 흰 3D 측정 참조.
- [front](g3_canvas/G3_D_Canvas_front.png) / [side](g3_canvas/G3_E_Canvas_side.png) / [rear](g3_canvas/G3_F_Canvas_rear.png): 방향별 Canvas 및 판정 overlay.
- [ENGINE / CORE](g3_canvas/G3_G_Engine_Core.png), [weakpoints](g3_canvas/G3_H_weakpoints.png), [75° Three presentation](g3_canvas/G3_I_75_Three.png).

캡처에는 두 브라우저 canvas에 동일한 CSS 확대만 적용했다. 게임 좌표·실제 renderer scale·판정은 바꾸지 않았다. Canvas 자체는 75° tilt로 변형하지 않는다. Tiger I, Scale 1/1.5, LowWide처럼 다른 visual 비교 설정에서도 G3 Canvas는 Tiger II ×2 정수직 형태로 남으며 기존 `VISUAL NONCANONICAL` 경고를 따른다.

## 11. Gameplay regression

[validation.json](g3_canvas/validation.json): **23/23 자동 검사 PASS**, page error 0. G3 ON, G3 OFF, G2 이전 HTML로 각각 240프레임을 실행한 전체 `game` JSON trace SHA-256이 동일했다: `5576cfd04ec1a7273ad2f92a92a1f1ba153c22d7f3dd0eb7bd7dc92b00966075`. 세 실행 모두 Three ↔ Canvas 4회 전환, Focus ready, Bullet Time, Boss 발사, R 재시작을 거쳤고 렌더 직전·직후 `game`은 같았다. 90°에서 ENGINE 및 GUN PORT/VISION SLIT/CUPOLA의 Three와 Canvas 좌표가 0.001 unit 이내로 일치했다. 75° Three projection도 정상이다.

G2와 같은 샘플 결과: 전면 차체 장갑 `155`, 측면 오른쪽 궤도 `42`, 후면 차체 `70`, 좌우 궤도 module `42`. 기존 2D ENGINE 피격으로 HP `10 → 9`; 차량 충돌 반경 `105`; CORE active weakpoint 없음. `rnd_gameplay.js`, G2 proxy, Boss HP/armor/state/AI, GLB, V5 Bloom 파일은 G3에서 수정하지 않았다.

## 12. Performance

정규화 배열과 Canvas primitives만 사용한다. 새 파일 다운로드, runtime geometry extraction, readback은 없다. 이 환경의 headless Chrome에서 offscreen 500×300 Canvas에 차체와 포탑 1,000회를 그리는 독립 측정은 약 **16.8 ms 합계, 0.0168 ms/Boss**였다. 이는 장치나 실제 전체 프레임 FPS 보증이 아니라 G3 그리기 코드만의 샘플이다.

## 13. Known limitations / product integration

Canvas 윤곽은 slope·스커트·장비를 단순화했으므로 GLB 픽셀 실루엣과 완전히 같지 않다. 75° Three에서는 높이 parallax 때문에 top-down Canvas와 일대일 픽셀 정렬이 목표가 아니다. 수동 플레이의 순간 전환 감각, art direction, 실제 GPU 성능은 **UNVERIFIED**다. 본편 Hybrid integration은 이번 R&D 결과만으로 승인되지 않는다.

G3 이후 Boss geometry를 계속 늘리는 결정은 보류한다. 다음 제품 판단은 사용자가 temporary Tiger II 유지, Original Core Boss 제작, 이 공간 계약의 본편 승격 중 선택한 뒤 별도 범위에서 진행한다.

## 14. Rollback / 작업 경계

편집 전 HTML 백업은 `spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_g3_canvas.html` (SHA-256 `16db8bd4fb0d71f3457eb2c88deec6ae7c244fdf5314b34db8c2f725e503b5b9`). G2 작업 트리의 기존 수정 파일은 그대로 보존했다. 이 보고서 범위에서 mainline HTML, Unity, GLB/BLEND, V5 Bloom은 수정하지 않았다. Git 전달 상태는 현재 저장소의 `git log`와 `git status`를 확인한다.