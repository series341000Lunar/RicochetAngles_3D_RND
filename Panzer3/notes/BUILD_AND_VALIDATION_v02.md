# Panzer3 GLB 파생본 v02 — 제작 및 검증

- 기술 검증: PASS
- 시각 검증: PASS (agent의 실제 이미지 검사; 사용자 승인과 별도)
- 범위: GLB 및 Blender 파생 자산 제작/검증. HTML 및 게임 적용 없음.

## 원본 선택과 보호

- 원본: \\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\Panzer3\Panzer3_AusfN_v01.blend
- 선택 이유: 사용자 승인 기록이 있는 Panzer3 Ausf. N 원본. 파생 HTML/FBX 대신 승인된 원본 geometry와 pivot을 직접 사용.
- 원본 SHA-256: c50e1ca3c9029fdde7069f75bf5d77ba201a2791d6ba714397769fcdf64ebc6c
- 원본, M41 기준 blend/GLB, 기존 Panzer3 v01 blend/GLB의 전후 해시 동일: PASS.
- 적용 지시문: 프로젝트 AGENTS.md, MODEL/AGENTS.md. 01_RND/ThreeJSDEV 및 각 대상 하위에서 별도 AGENTS/override 발견되지 않음.
- M41_RND_v02_muzzle.blend와 GLB를 직접 조사. 구조, meter, axis, export 방식만 참고.

## 단순화

짧고 굵은 포신, 각진 포탑 뒤 어깨, 후방 수납함, 큐폴라, 한쪽 6개 보기륜 유지.
원본 geometry를 평가해 병합했으며 주요 형상을 단순 박스로 대체하지 않았다.
각 궤도는 wheel 형상과 continuous band를 포함한 static mesh 하나이다.
개별 track-link와 작은 볼트, 허브, 힌지, 손잡이, 서스펜션 등의 세부 형상을 생략했다.
포방패는 TURRET에 포함하고 포신/칼라/포구는 GUN에 포함했다.
3개 단순 base-color material: Armor_BaseColor, Mechanical_Dark, Gun_Accent.
무텍스처, metallic 0, roughness 0.82. 포구/시야 구멍과 타이어의 어두운 색을 유지한다.
5 mesh이며 색 분리에 따라 GLB primitive는 10개다. 이는 추가 object나 animation이 아니다.
구체적인 kept/omitted 원본 object 목록은 asset_validation_v02.json에 기록했다.

## 파일 및 통계

- Blender: \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer3\source\Panzer3_RND_v02.blend
- GLB: \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer3\export\Panzer3_RND_v02.glb
- GLB 크기: 340,192 bytes (332.22 KiB)
- Mesh: 5 / Triangle: 6,620 / Material: 3 / Texture: 0
- 길이 / 폭 / 높이: 4.640000 / 3.280000 / 2.920000 m
- 길이는 포신 포함, 높이는 원본 유지 부착물 포함. 게임 표시 배율이나 legacy units/m 적용 없음.
- 저장 source는 8 nodes만 포함. 검증 camera/light는 export/source에 포함하지 않음.

## 구조와 좌표

VEH_PANZER3_01 → HULL → TURRET_PIVOT → TURRET → GUN → MUZZLE.
TRACK_L / TRACK_R은 HULL의 직접 child이며 각각 하나의 mesh.
기존 승인된 VEH_PANZER3_01 원점 (0,0,0)을 보존. 궤도 최저점 +0.18 m는 단순화된 원본 band의 높이이며 임의 접지 이동을 하지 않았다.

원본 meter, -Y forward / +Z up. Geometry와 pivot 모두 Blender Z축 +90도 회전 bake.
Blender 파생본 +X forward / +Z up, GLB +X forward / +Y up.
GLB 차량 기준 왼쪽은 -Z, 오른쪽은 +Z이다. 기존 v01의 반대 label을 실제 위치로 교정했다.
노드 scale은 모두 +1이며 불필요한 회전/negative scale이 없다.

GLB world pivot (meter, X/Y/Z):

| Node | Position |
|---|---|
| VEH_PANZER3_01 | 0.000000, 0.000000, 0.000000 |
| TURRET_PIVOT | 0.120000, 1.870000, 0.000000 |
| GUN | 1.070000, 2.290000, 0.000000 |
| MUZZLE | 2.290500, 2.290000, 0.000000 |

Turret pivot은 원본 turret-ring center, GUN은 원본 trunnion pivot을 유지했다.
MUZZLE은 포구 lip의 가장 전방인 face vertex 중심이며, local +X 방향을 사용한다.
포구 끝 오차: 1.04308128e-07 m.
Panzer3 기존 nominal MUZZLE이 실제 lip보다 0.0295 m 전방이어서 이번 파생본에서 보정했다.

## 기술 검증

- 완전히 빈 새 scene으로 GLB 재임포트: PASS.
- 8개 node와 parent/part 이름, 5개 mesh: PASS.
- 최대 위치 왕복 오차 1.78813934e-07 m; dimension 오차 0.0.
- GLB binary header, JSON, index triangle count, 실제 node world 좌표의 +Y-up 변환 확인.
- 포탑 yaw 30도 / 포신 pitch -10도 시험: MUZZLE이 예측된 위치로 이동하고 HULL/track은 고정.
- 포신 pitch 시 TURRET 및 그 안의 포방패 고정: PASS.
- 중립 자세 복원 오차 0. 저장 blend 재열기 및 neutral pose 확인: PASS.
- texture/image/animation/skin/armature 0, texture dependency 없음, negative scale 없음.
- GLB와 source SHA-256 및 보호 파일 해시: JSON 참조.

## 시각 검증

실제 GLB 재임포트의 isometric OpenGL viewport, top/side Workbench 이미지를 열어 검사했다.
원본 geometry의 이미지와 비교하여 고유 형상, 비율, 포신/포방패, 휠 및 궤도 가독성을 확인했다.
누락된 주요 부품이나 새로 떨어진 구성요소는 관찰되지 않았다.
아래는 검증용 이미지이며 최종 Art Direction이 아니다.

- \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer3\preview\Panzer3_RND_v02_isometric.png
- \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer3\preview\Panzer3_RND_v02_top.png
- \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer3\preview\Panzer3_RND_v02_side.png

## 제한과 해결 기록

- 승인 Root 기준으로 Panzer3 궤도 band가 +0.18 m 위에 남아 있다. 향후 접지/게임 배치 방침은 별도 결정 사항이다.
- 전체 가동 범위의 물리 충돌/기계 간섭 검사는 수행하지 않았다.
- Three.js/HTML 실행, renderer adapter, 게임 표시 배율, physics, collider, FX, recoil, stress test, Unity: 미수행/범위 밖.
- MCP context와 source World 누락 문제를 해결했다. factory-settings reset은 MCP에서 제한되어 문서상 허용된 빈 scene 열기를 사용했다.
- 재임포트 quaternion mode 때문에 초기 회전 시험이 실패하여 Euler mode로 시험을 수행하고 neutral로 복원했다. 자산 export에는 animation이 없다.
- Panzer3 사선 이미지의 초기 가장자리 잘림은 다시 프레이밍하여 해결했다.
