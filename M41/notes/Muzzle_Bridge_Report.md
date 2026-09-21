# Tilted Camera Muzzle / Projectile Visual Bridge R&D

작성일: 2026-09-20
상태: 구현 및 자동 브라우저 검증 완료. 최종 카메라 각도는 OPEN.
90° = gameplay reference / 75° = current compromise candidate / 60° = visual reference.

## 1. 수정·추가 파일

- [현재 GLB Spike](../../spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html)
- [수정 전 HTML 백업](../../spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.before_muzzle.html)
- [MUZZLE 포함 Blender v02](../source/M41_RND_v02_muzzle.blend)
- [MUZZLE 포함 GLB v02](../export/M41_RND_v02_muzzle.glb)
- 루트 README에 조작/새 보고서 안내 추가
- notes: add_muzzle.py, patch_muzzle.py, test_muzzle.cjs, test_muzzle_regression.cjs 및 검증 JSON
- preview: A/B/C/D 발사 비교 및 75° 확대 캡처

기존 v01 Blender / GLB 및 MODEL 원본은 보존했다. 모든 변경은 ThreeJSDEV 안에만 있다.

## 2. MUZZLE 작성

GLB-authored MUZZLE node를 사용한다. Runtime-generated fallback anchor는 사용하지 않는다.

    M41_ROOT
    └─ HULL
       ├─ TRACK_L
       ├─ TRACK_R
       └─ TURRET_PIVOT
          └─ TURRET
             └─ GUN
                └─ MUZZLE

GUN geometry의 전방 +X 최댓값에 있는 포구 전면 vertices 40개를 확인했다.
그 전면의 Y/Z 범위 중점을 중심선으로 사용했다.

- GUN-local Blender 위치: (2.855, 약 0, 0) m
- Blender world: (3.870, 약 0, 2.268) m
- GLB world neutral: (3.870, 2.268, 약 0) m
- MUZZLE local orientation: identity, +X forward
- Blender 저장 → GLB export → fresh import 후 GUN parent 및 world position 일치 확인
- 새 GLB 크기: 866,420 bytes
- Geometry: 기존 5 meshes / 17,078 triangles / 3 materials / 0 textures 유지
- Skeleton, animation, skin 추가 없음

렌더러는 실제 Player 인스턴스의 MUZZLE.getWorldPosition을 사용한다.
행렬을 갱신한 뒤 조회하므로 hull/turret 회전을 반영한다.
Stress clone에도 빈 노드는 포함되지만 FX/발사 로직은 등록하지 않는다.

## 3. 발사 이벤트와 포구 FX

기존 fireShell 본문은 그대로 두고, 원래 함수를 호출한 뒤 결과를 관찰하는 얇은 wrapper를 추가했다.
Player + 활성 3D + GLB 로딩 완료인 경우에만 발사 shell과 생성된 muzzle particles의 참조를 렌더러에 전달한다.

기존 Canvas particles의 생성/업데이트는 그대로 유지한다.
WeakSet으로 해당 player muzzle particles만 기록하고 3D drawEffects에서만 그리기를 생략한다.
2D 비교/fallback에서는 기존 표현이 다시 보인다. Boss muzzle와 impact particles는 건드리지 않는다.

- Flash: MUZZLE에서 작은 sphere, 55ms fade
- Smoke: 같은 위치에서 시작하는 반투명 sphere, 240ms fade/약간의 팽창·전진·상승
- 발사 시점의 world origin을 보존한다. 발사 후 포탑을 돌려도 이미 방출된 연기를 끌고 다니지 않는다.
- 재사용 메시 총 2개. Particle engine, bloom, 조명 추가 없음.

## 4. Visual Bridge

기본 duration = 0.075초. 패널 Bridge 75ms 체크박스로 ON/OFF 비교한다.
시간은 기존 game.time을 읽기만 하며, shell에 presentation 속성을 쓰지 않는다.

별도 renderer-side Map:

    gameplay shell object
      → start world position, born time, initial ricochet count, bridge flag

T=0: visual shell = 발사 당시 실제 GLB MUZZLE.
0<T<75ms: frozen start와 현재 기존 shell visual target 사이를 선형 보간.
T>=75ms: 기존 렌더 위치 (shell.x, 8, shell.y)와 정확히 일치.
기존 shell renderer의 height=8도 유지한다. Impact Canvas 위치는 기존 gameplay hit 위치 그대로다.

충돌로 shell이 사라지면 75ms를 기다리지 않는다.
판정 좌표로 terminal snap한 뒤 즉시 hide/recycle하고 bridge state를 제거한다.
첫 render 이전에 충돌한 탄도 뒤늦게 포구에서 다시 보이지 않는다.
Ricochet count가 바뀌면 보간을 즉시 중단하고 기존 reflected shell 위치를 사용한다.

게임 재시작 시 game 객체 identity 변경으로 renderer-side bridge/FX를 비운다.
Stress clones는 기존 R 정책대로 유지한다.

## 5. Screen delta

동일 pose 조건: 1280×720, DPR 1, hull +30°, turret world -30°, spread 0, shake 0.
초록 = 실제 GLB MUZZLE projection, 빨강 = 기존 nominal gameplay muzzle.
Debug 체크박스를 켰을 때만 점/연결선/CSS pixel 수치를 표시한다.

| Camera | Muzzle screen delta |
|---:|---:|
| 90° | 11.94 px |
| 75° | 18.27 px |
| 60° | 27.11 px |

90°의 차이도 0이 아니다. GLB의 길이/피벗과 Legacy nominal muzzle distance가 다르기 때문이다.
이 수치는 해당 pose의 표본이며 고정 오프셋이나 collision 수정값이 아니다.
실제 발사 산포는 별도이며 live debug 빨간 점은 현재 turret heading 기준 nominal muzzle이다.
CSS resize 시 표시되는 pixel 값은 실제 Canvas CSS 크기에 맞춰 환산한다.

## 6. 시각 비교

- [A. 90° fire](../preview/A_90_fire.png)
- [B. 75° Bridge OFF](../preview/B_75_bridge_off.png)
- [C. 75° Bridge ON](../preview/C_75_bridge_on.png)
- [D. 60° reference](../preview/D_60_reference.png)
- [75° OFF 확대](../preview/75_detail_OFF.png)
- [75° ON 확대](../preview/75_detail_ON.png)

동일 발사 시점과 pose로 실제 Chrome/WebGL을 캡처했다.
75° OFF에서 초기 탄은 포구와 떨어진 기존 위치에 보이며,
ON에서는 처음 위치가 포구와 일치하고 이후 짧은 구간에서 기존 궤적으로 이동한다.
25ms 확대 비교에서도 ON의 간격이 더 작다.
Flash/smoke는 두 비교 모두 GLB MUZZLE origin을 사용하므로 Bridge 자체의 차이만 비교한다.
검증용 단순 sphere FX이며 최종 미술 품질 승인이나 75° 카메라 확정은 아니다.

## 7. Gameplay 보존 및 회귀 검증

게임 simulation/fire 함수 본문은 수정 전과 동일하다.
추가된 것은 post-call observer 및 렌더링 분기 두 곳이다.
따라서 HTML 전체가 byte-identical하다는 의미는 아니다.

PASS:
- shell.x/y/prevX/prevY/vx/vy/traveled 및 전체 game JSON: 렌더 전후 동일
- 같은 seed/input의 수정 전/후 180프레임, 30프레임마다 전체 game snapshot 6개 모두 일치
- 비영 hull/turret 각도 3개 조합에서 MUZZLE 방향이 turret world angle과 일치
- 0ms visual/flash/smoke 위치 = MUZZLE origin
- 16ms / 37.5ms 보간 표본; 75ms / 100ms visual = 기존 target 정확히 일치
- 실제 updateShells 10ms 충돌: 장애물 HP 4→3, shell/bridge 제거, hit 좌표 유지
- 실제 resolveArmorHit 도탄: ricochet count 1, 즉시 기존 reflected 위치에 표시
- 보스 weakpoint/engine 관통 시나리오: HP 0 / won
- R: player HP 5 / boss HP 10, 이어서 P 입력 80→81대
- Stress dummy 20개 확인: muzzle FX 0개, R 후 bridge/FX만 초기화
- 기존 Shadow toggle 및 45/60/75/80/90° 전환
- 실제 마우스 발사/지속 reload, 키보드 입력과 projectile update 정상 실행
- Browser pageerror 0건

자동 입력/통제된 시나리오 검증이다. 사람이 보스를 처음부터 끝까지 공략한 완주와는 구분한다.
기존 본게임·Unity·collision authority에 대한 변경은 없다.

## 8. 비용과 성능

Chrome 153 headless / RTX 5090 / DPR 1 / 1280×720 / 75° / Shadow ON.
짧은 약 1.9초 표본이며 장기/저사양 보증은 아니다.

| Stress tanks | FPS | Draw calls | Scene meshes |
|---:|---:|---:|---:|
| 0 | 60 | 48 | 36 |
| 80 | 60 | 849 | 436 |

동일 정지 장면에서 idle 41 calls → firing 44 calls:
shell mesh 1 draw + flash/smoke 2 draws.
기존 대비 포구 FX 자체의 최대 추가 비용은 2 draw calls / 2 reusable meshes.
FX가 꺼진 순간에는 이 두 메시를 렌더하지 않는다.
보간 자체는 기존 shell mesh의 transform 계산이며 추가 draw call이 없다.
스트레스 MUZZLE Empty는 draw call을 추가하지 않는다.
표본 간 calls/meshes 차이는 탄, pool, 그림자 패스와 가시성의 영향을 받는다.

## 9. 미해결 / 다음 판단

- 75°는 CURRENT LEAD CANDIDATE, 기본 카메라는 90°를 유지했다. FINAL CAMERA = OPEN.
- 초기 보간은 짧은 시각 속도/높이 변화를 만든다. 충돌이 매우 가까우면 terminal snap이 눈에 띌 수 있으나 판정은 항상 우선한다.
- 궤적·impact 전체에 대한 높이 정합 보정이 아니다. 기존 tilted-view overlay 시차는 남아 있다.
- 고품질 포연/섬광, recoil, Boss anchor, projectile physics 변경은 범위 밖이다.
- Bridge ON/OFF는 다음 발사부터 비교하는 것이 가장 명확하다. 진행 중 OFF는 즉시 기존 궤적으로 복귀한다.
- 저사양·장시간 FPS와 사용자 최종 시각 승인은 미검증.

## 10. 검증 데이터

- [MUZZLE source/reimport](muzzle_asset_validation.json)
- [코드 보존](muzzle_code_validation.json)
- [Delta / bridge / deterministic comparison](muzzle_browser_validation.json)
- [Collision / stress / performance](muzzle_regression.json)
