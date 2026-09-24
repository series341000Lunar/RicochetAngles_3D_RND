# Playable ENV 회수 — 실행·편집·검토 안내
상태: **TECHNICAL RECOVERY PASS / USER VISUAL REVIEW REQUIRED**

이번 Current Stage는 실제 게임인 Multi-Asset R&D입니다. ENV01 review는 기존 QA 용도로 그대로 보존되어 있습니다.

## A. 실행
프로젝트 루트의 **Launch_MultiAsset_RND.bat**를 실행하고 **START**를 누르십시오.
서버가 이미 켜져 있으면 [실제 playable 화면](http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html)을 여십시오.
이번 검수는 8766의 DCC testbed/ENV review에서 하지 않습니다.

W/S 이동, A/D 차체 회전, 마우스 조준·클릭 발사, Shift Focus, Q 지정 포격, R 재시작을 기존 그대로 사용할 수 있습니다. 후진 관성 중에는 기존 규칙에 따라 조향 방향이 반전됩니다.

## B. Blender 편집 위치
- 파일: **dcc00/workspace/playable-env/authoring.blend**
- 편집 컬렉션: **PLAYABLE_ENV_STATIC**
- 예: ENV_WALL_01, ENV_BUNKER_ROOF, ENV_ROAD_01 및 ENV_ART_ 디테일.
- REFERENCE_ONLY_NOT_EXPORTED의 Player/Boss/차량 가이드는 편집 참고용이며 export에 포함되지 않습니다.
- 원래 dcc00/workspace/env01/authoring.blend와 geometry.glb는 수정하지 않았습니다.

## C. GLB 반영
두 가지 방법 중 하나를 사용하십시오.

**같은 Blender 세션에서**
1. 위 playable 파생본을 열고 mesh를 편집합니다.
2. Scripting 작업공간의 Text Editor에서 텍스트 선택 메뉴로 **Export Playable ENV**를 선택합니다.
3. Text Editor 안에서 **Run Script / Alt+P**를 실행합니다.
4. 이 텍스트는 기존 정적 GLB exporter를 호출해 playable-env/geometry.glb를 내보내고 현재 .blend를 저장합니다. 전역 Preferences나 keymap은 변경하지 않습니다.
5. 브라우저 페이지를 새로고침하고 **START**를 다시 누릅니다.

**저장된 파일을 배치로 내보내기**
1. Blender에서 저장한 뒤 파일을 닫습니다.
2. 루트의 **Export_Playable_ENV.bat**를 실행합니다.
3. 계속 편집하려면 .blend를 다시 여십시오. 배치 export가 갱신한 GLB revision을 읽기 위해 필요합니다.
4. playable 페이지를 새로고침하고 START를 누릅니다.

ENV01 QA용 export 버튼으로 이 파생본을 내보내지 마십시오. 목적 경로가 다릅니다. 기존 stale protection은 유지됩니다. 브라우저 새로고침은 현재 플레이를 초기화하며, 플레이 중 live reload 기능을 새로 만든 것은 아닙니다.

배치 export는 실제 실행 검증했습니다. native Text 항목은 저장·재로드 확인했고, GUI에서 사람이 Alt+P로 반복 작업하는 사용감은 사용자 검토 대상입니다.

## D. 검토 화면
우측 하단 기존 패널의 시점 선택:
- **75° 주력**: 실제 전투 중 차량 대비 벽·벙커 크기, 조준 가림, 소품 간격과 가독성을 보십시오.
- **90° Reference**: 중앙 도로와 차량·기존 장애물·새 시각 메시의 위치 관계를 보십시오.

[75° 실제 gameplay](../dcc00/test-output/playable-env-recovery-20260925/playable-75.png)
[90° 공간 기준](../dcc00/test-output/playable-env-recovery-20260925/playable-90.png)

## E. 제한
- Legacy world는 **1280×3600**, map/spawn/obstacle 구조는 기존 hardcoded 코드 그대로입니다.
- 새 환경은 대략 X20–1260, Y1100–2500의 제한된 시각 아트입니다. 전체 Stage 완성 작업이 아닙니다.
- 새 벽·벙커·돌 등에는 새 충돌이 없습니다. 차량/포탄이 새 시각 메시를 통과할 수 있고, 실제 충돌·피해는 기존 gameplay 장애물만 결정합니다.
- 2D Canvas fallback은 기존 표시를 유지합니다. 정적 ENV GLB는 Three.js 시각 레이어입니다.
- GLB가 없거나 손상되면 기존 게임으로 계속 실행되며 console에 경고가 남습니다.
- 원본·파생 .blend/GLB·스크린샷·백업은 로컬 NAS에 남고 Git에는 포함하지 않습니다.
- H5E development는 HOLD, DCC-MAP PASS는 유지됩니다. H5E map은 playable 입력으로 사용하지 않았습니다.

## F. 사용자 판단
환경 크기, 도로 폭, 벽 높이, 벙커 크기, 차량 대비 비례, 소품 간격, 밀도, 75° 가독성과 아트 방향을 검토해 주십시오.
기술 검증 PASS가 최종 아트 승인을 의미하지 않습니다. 이 검토 결과에 따라 같은 playable Stage의 시각 파생본만 추가 조정합니다.
