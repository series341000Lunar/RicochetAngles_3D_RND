# RicochetAngles — 대전차포-LIKE 오브젝트의 GLB 파생 자산 제작

대상 오브젝트: <AssetName>
원본 MODEL 폴더: Z:\RicochetAngles\00_Asset\MODEL\<AssetName>
작업 루트: Z:\RicochetAngles\01_RND\ThreeJSDEV

## 목적과 기준
기존 Blender 원본을 기반으로 Three.js용 정적 GLB 파생 자산을 제작하고 검증하십시오.
적용되는 AGENTS.md와 실제 파일을 먼저 확인하고, 원본 선택 이유를 기록하십시오.
M41/source/M41_RND_v02_muzzle.blend 및 M41/export/M41_RND_v02_muzzle.glb는 단위·축·export 기준으로만 참고하십시오.
대전차포는 아래 6-node 구조를 사용합니다. M41의 궤도 구조·외형·비율·크기를 적용하지 마십시오.
기존 원본이 없으면 임의로 새 모델을 만들지 말고 보고하십시오.
실질적인 모순이나 주요 부품 분류의 모호함은 해당 변경 전에 사용자에게 판단을 요청하십시오.

## 원본 보호와 저장
원본과 기존 산출물을 수정하거나 덮어쓰지 마십시오. 새 revision으로 저장하십시오.
ThreeJSDEV/<AssetName>/source/ : 파생 Blender
ThreeJSDEV/<AssetName>/export/ : 오브젝트당 GLB 하나
ThreeJSDEV/<AssetName>/preview/ : 실제 형상 검증 이미지
ThreeJSDEV/<AssetName>/notes/ : 원본 경로·선택 이유·변경·검증 기록
원본의 SHA-256을 작업 전후 비교하십시오. 다른 Blender 작업 및 저장되지 않은 변경을 보호하십시오.

## 형상과 부품 통합
원본의 실루엣·비율·크기·바퀴 개수·지지대 배치·neutral pose를 유지하십시오.
방패·포 본체·포신·포구 제동기·차륜·스페이드의 특징을 단순 박스로 대체하지 마십시오.
탑다운과 사선 가독성을 우선하며 작은 볼트·손잡이는 필요에 따라 생략할 수 있습니다.
이미 충분히 단순하면 추가 단순화를 강제하지 마십시오.
HULL, TURRET, GUN은 각각 하나의 mesh로 정리합니다. 재질별 primitive 분할은 허용합니다.

## Hierarchy
<AssetName>_ROOT
└─ HULL
   └─ TURRET_PIVOT
      └─ TURRET
         └─ GUN
            └─ MUZZLE

- HULL: 차대·차축·모든 차륜·지지대·스페이드 등 지면에 고정되는 부분.
- TURRET: 포방패·포 본체·포미부·포가·고정 주퇴 하우징·조준 장치 등 좌우 조준 시 함께 회전하는 부분.
- GUN: 포신·포신 부착 칼라·포구 제동기·포구 내부 등 포신과 함께 상하 회전하는 부분.
- 포방패와 고정 하우징은 TURRET에 포함합니다.
- TRACK_L/R, 별도 wheel 노드, skeleton, armature는 만들지 않습니다.
- 이 구조는 게임용 역할 구분입니다. 실물 기구상 불가능한 좌우·상하 회전 및 그에 따른 부품 관통을 허용합니다. 이를 해결하려고 원본 디자인을 바꾸지 마십시오.

## Origin과 방향
기존에 사용자가 채택한 ROOT·회전축을 유지하십시오.
ROOT가 없으면 차축 중앙의 지면 투영점 또는 실제 지지 접점의 중심을 후보로 선정하고 근거를 기록하십시오. 후보를 승인된 원점이라고 표현하지 마십시오.
TURRET_PIVOT은 기존 게임용 좌우 회전 중심 또는 포가 중심을 사용합니다. 실제 turret-ring은 요구하지 않습니다.
GUN origin은 기존 상하 조준축 또는 gun trunnion 기준으로 설정합니다.
MUZZLE은 GUN child Empty/Node이며 실제 포구 끝 중심선에 위치하고 local +X가 발사 방향을 향하도록 합니다.
기존 pivot을 변경해야 하면 영향과 이유를 제시하고 사용자 판단을 받으십시오.

## 단위·축·재질
최종 GLB는 meter, +X forward, +Y up입니다.
Blender 원본의 단위와 크기를 먼저 확인하고 geometry와 pivot에 동일한 축 변환을 적용하십시오.
원본 크기와 상대 비율을 유지하고 M41 크기 또는 게임 표시 배율로 정규화하지 마십시오.
Negative scale과 불필요한 transform을 정리하십시오.
가능하면 텍스처 없이 1~3개 단순 base-color material을 사용합니다.
Normal/displacement/AO/baked-lighting texture나 복잡한 PBR 세트를 추가하지 마십시오.
재질은 임시 검토용이며 정식 Art Direction을 확정하지 않습니다.

## Export 및 검증
GLB를 새 빈 scene에 재임포트하고 다음을 검증하십시오.
- 6-node hierarchy, 이름, HULL/TURRET/GUN의 3-mesh 구성
- ROOT/TURRET/GUN/MUZZLE의 위치와 부모 관계
- meter 크기, +X 전방/+Y 상방, 양의 scale
- 차륜과 스페이드가 HULL에 포함되며 누락되지 않았는지
- 정상 재질, 누락 텍스처 없음, 불필요한 animation/skin/armature 없음
- MUZZLE이 실제 포구 끝에 있고 local +X가 전방인지
- TURRET_PIVOT 좌우 시험 회전: HULL 고정, TURRET/GUN/MUZZLE 추종
- GUN 상하 시험 회전: HULL/TURRET 고정, MUZZLE 추종
- 시험 후 저장 자산은 neutral pose
- 저장한 Blender 재열기 및 원본 해시 보존
탑다운·측면·사선 실제 이미지를 남기고 확인하십시오.
기술 검증과 시각 검증을 별도로 보고하며 사용자 승인을 추정하지 마십시오.
물리적 관통 허용과 별개로 잘못된 부모 연결·축·포구 위치는 수정하십시오.

## 범위 제외
HTML/Unity/runtime repository 수정, Spike 탑재, loader/renderer adapter,
Visual Bridge, muzzle FX, recoil, stress test, collider/physics/damage,
게임 표시 배율 결정, animation/rig 제작, 범용 framework 설계는 수행하지 않습니다.

## 완료 보고
1. 원본 파일과 선택 이유
2. 통합·단순화 및 원본 대비 변경 범위
3. Blender/GLB/검증 이미지/기록 경로
4. GLB bytes
5. node/mesh/triangle/material/texture 수
6. hierarchy·단위·축·pivot·MUZZLE·시험 회전 결과
7. 재임포트 및 시각 검증 결과
8. 남은 문제와 미검증 항목
GLB 제작 완료를 HTML 탑재 완료나 게임 적용 승인으로 표현하지 마십시오.
