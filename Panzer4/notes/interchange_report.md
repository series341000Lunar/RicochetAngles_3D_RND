# Panzer4 — Max to Blender 전달 실증

판정: **PASS WITH CONDITIONS**. 3ds Max 2026 / FBX / Blender 5.2.1 LTS로 실제 실행했습니다. 원본 Panzer4 64개 파일과 Tiger2 비교 파일은 변경하지 않았습니다.

## Source
- 원본: 00_Asset/MODEL/Panzer4/Panzer4_v004.max.
- 작업 Master: master/Panzer4_MASTER.max — 원본과 byte-identical.
- 원본 SHA-256: 1806fe05539dd3eaffb68b7f727a41cc1ff82e36c90ff9c199476986d18e327f.
- 추가 단순 궤도 Master: simple_track/master/Panzer4_SIMPLE_TRACK_MASTER.max.
- Master 상태: SOURCE CANDIDATE; Production/Canonical 승인을 새로 부여하지 않았습니다.

## 전달 경로 / 필요한 보정
원본 native FBX는 geometry vertex/bounds/triangle 수를 보존했지만 일부 면의 재삼각화로 triangle correspondence와 normal이 달라졌습니다. 최초 raw 전달은 FAIL이며 validation/A_to_B_validation.json에 negative evidence를 보존했습니다.

별도 Max Batch에서 evaluated world-space snapshotAsMesh를 FBX로 전달하여 원본 삼각형을 보존했습니다. 원본 파일의 authoring stack을 collapse하거나 저장하지 않았습니다. 9개 VRay submaterial/face ID는 Master에 유지하고 Blender에서 3개 PBR 재질로 매핑했습니다.

raw FBX는 helper 5개를 전달했으나 mesh origin과 MUZZLE parent/object offset에 차이가 있었습니다. helper 누락과는 구별합니다. 기능 피벗/부모 관계 및 MUZZLE의 정확한 Max world/local matrix를 source sidecar로 복원했습니다. 반올림 보고 좌표를 입력으로 쓰지 않았습니다.

Blender consolidation custom-normal encoding에서 TURRET 일부 corner가 0.1°를 초과했습니다. 변환용 TURRET과 분리 장갑만 corner별 vertex로 분리하여 형상/면/material을 보존했습니다. 최종 normal 오차 최대 0.06182004°. 허용오차를 확대하지 않았습니다.

evaluated FBX geometry 및 보정 후 최종 GLB 검증을 통과해 USD 대체 전달은 NOT RUN입니다. input hashes/source matrices/face correspondence로 deterministic 경로를 검증했습니다. 상세 궤도 원본의 두 번째 실제 Max FBX export부터 Blender/GLB를 재실행했고 validation/FULL_PIPELINE_REPEAT_VALIDATION.json PASS입니다. 다른 차량의 호환성으로 확대하지 않습니다.

## 단순 궤도
사용자 요청에 따라 원래 TrackPath를 0.51m 폭 / 0.08m 두께로 sweep했습니다. 좌우 각각 component 1의 closed continuous belt이며 boundary/nonmanifold edge 0, 416 quad / 832 triangle입니다. 기존 한쪽 링크 메시 3,828 triangle에서 줄였습니다. 각 측면 roadwheel 4개 및 returnroller 4개는 보존했습니다.

원본 127 geometry 중 TRACK_L/R만 변경했고 나머지 125 mesh 전체 기록 및 기능 anchor 8개가 동일합니다. 상세 궤도 원본/이전 GLB는 보존했습니다. 증거: simple_track/validation/VARIANT_SCOPE_AND_TOPOLOGY.json.

## 기준 / 환경
- Geometry/world position/bounds: 1e-5m.
- Functional anchor: 0.001m / direction 0.1°.
- Corner normal: 0.1°.
- Max +X forward / +Y left / +Z up → GLB +X forward / +Y up (left -Z).
- Scene meters, scale 1. 14 units/m 미적용.
- 원본 UV channel 1이 모든 127 mesh에서 0이며 새 UV/bake/texture를 제작하지 않았습니다.
- 실제 Blender OpenGL viewport로 reimport top/side/quarter와 좌우 제거 상태를 확인했습니다. Browser/Three.js 실행은 이번 Bridge 검증에 포함하지 않았습니다.

## 참고 문서
[Autodesk Max Batch](https://help.autodesk.com/cloudhelp/2026/ENU/3DSMax-Batch/files/GUID-48A78515-C24B-4E46-AC5F-884FBCF40D59.htm).
[Autodesk evaluated mesh normals](https://help.autodesk.com/cloudhelp/2022/ENU/MAXScript-Help/files/3ds-Max-Objects-and-Interfaces/Editable-Meshes-Splines-Patches/Editable_Mesh-and-TriMesh/GUID-EF78FA1A-A382-4BED-BA10-7C856A7551A5.html).

본 경로는 **Max FBX → Blender GLB Bridge**입니다. Autodesk built-in GLB / Khronos plugin direct GLB와 구별하며 기존 M41 direct-export 증거를 변경하지 않았습니다.
