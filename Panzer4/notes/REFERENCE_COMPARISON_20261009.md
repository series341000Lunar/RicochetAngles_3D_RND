# Panzer4 — 기존 GLB 대조 결과

2026-10-09 KST. **현재 Panzer4 기본형·증가장갑형의 자산 구조 및 독립 Browser/GLTFLoader 검증: PASS.**
Max→Blender 제작 경로는 기존 판정대로 PASS WITH CONDITIONS이며, 그 조건은 변환 단계의 evaluated FBX/정확한 Max matrix·normal sidecar입니다. 최종 GLB는 일반 GLTFLoader로 바로 로드되며 runtime hierarchy recovery나 sidecar가 필요하지 않습니다.

## 실제 대조 파일
- Panzer4: 01_RND/ThreeJSDEV/Panzer4/export/Panzer4_BASE.glb 및 Panzer4_SCHURZEN.glb.
- M4A3E8: 01_RND/ThreeJSDEV/M4A3E8/export/M4A3E8_RND_v01.glb.
- Tiger2 Boss: 00_Asset/GLB_Export/Panzer6B_Tiger2_Stage1Boss/export/Panzer6B_Tiger2_Stage1Boss_RND_v01.glb.
- SOURCE/Master 상태는 각 차량의 기존 권한을 보존했습니다. 비교 파일은 수정하지 않았습니다.
- notes와 파일 크기가 다를 때 실제 읽은 GLB와 이번 hash/count를 우선했습니다. 현재 Boss는 3,679,008bytes입니다.

## 크기 / 복잡도

| 모델 | bytes | GLB nodes | GLB meshes | triangles | primitives | asset main-pass calls | 길이/폭/높이 m |
|---|---:|---:|---:|---:|---:|---:|---|
| Panzer4 BASE | 1233168 | 8 | 5 | 33652 | 11 | 11 | 5.304/2.920/2.565 |
| Panzer4 SCHURZEN | 2197592 | 13 | 10 | 46444 | 16 | 16 | 5.304/3.140/2.565 |
| M4A3E8 | 7846864 | 8 | 5 | 170452 | 12 | 12 | 7.224/3.465/3.943 |
| Tiger2 Stage1 Boss | 3679008 | 29 | 21 | 117192 | 50 | 50 | 9.947/5.930/4.280 |

GLB meshes와 GPU render calls는 별개입니다. 다중 재질 GLB node는 GLTFLoader에서 Group과 material별 Mesh 자식으로 표현됩니다. 실제 Panzer4 HULL은 Group이지만 이름/parent/rotation은 올바릅니다. asset calls는 이번 renderer.info.render.calls에서 ground 1개를 제외한 값이며 shadow/depth 전체 GPU 비용이나 성능 보장을 의미하지 않습니다.

## 구조 / 기능
M4A3E8과 Panzer4는 동일한 기본 기능 연결을 갖습니다: ROOT→HULL, HULL→TRACK_L/R 및 TURRET_PIVOT, TURRET_PIVOT→TURRET→GUN→MUZZLE. ROOT 이름은 차량별로 보존했습니다. Boss도 이 기본 연결과 방향별 추가 부품을 유지합니다.

Panzer4 증가장갑형은 SCHURZEN_HULL_L/R이 HULL, SCHURZEN_TURRET_L/R/REAR가 TURRET 아래에 있고, 장갑을 제외한 핵심 모델은 기본형과 일치합니다. Boss의 ADDON_SIDE_L/R 및 ADDON_REAR 등과 같은 독립 추가부품 원칙을 충족합니다. Boss 고유의 door/weakpoint/Core 의미를 Panzer4에 부여하지 않았습니다.

실제 Three.js r160 GLTFLoader에서 네 파일을 모두 로드했습니다. meter/+X forward/+Y up, 양의 transform determinant, MUZZLE local +X forward, 누락/중복 이름, animation/skin/camera/texture/external buffer를 대조했습니다. 구조와 world bounds가 binary 검사 결과와 일치합니다.

Hull 양방향 회전, turret 독립 양방향 회전, gun pitch diagnostic, combined pose와 neutral reset이 모두 PASS입니다. Panzer4 포구 끝 X 오차는 2.38418579e-7m이며 원본 GLB→loader 포구 world position 오차 0m. 이번 Browser 검사의 gun pitch는 자산 진단이며 gameplay elevation 승인이나 animation이 아닙니다.

5개 쉬르첸 노드 각각 visibility OFF 및 scene.attach 기반 parent detach가 PASS입니다. 다른 노드 world matrix 변화 0, neutral 복원 오차 0입니다. 실제 L/R 제거 이미지를 저장했으며 L은 좌측 camera, R은 우측 camera로 intact와 대조했습니다. 이를 실제 게임 hit/HP/debris 구현으로 확대하지 않습니다.

## 형상 / 재질 / 노멀 / 렌더
동일 meter scale=1, 동일 orthographic span 19.2×12m, 동일 camera target, hemisphere/directional light, ACESFilmic, SRGB, PCFSoftShadow에서 top/side/quarter를 각각 확인했습니다. Panzer4의 상대적으로 작은 크기는 Max source를 보존한 결과이며 M4/Boss 크기로 정규화하지 않았습니다. 4개 roadwheel와 닫힌 연속 belt가 유지되며 기본형/증가장갑형 사이 geometry 누락·방향 반전은 관찰되지 않았습니다.

모든 파일은 texture 없는 3개 PBR 재질입니다. Panzer4의 main armor linear RGB 약 0.181/0.181/0.162, roughness 0.65; M4 armor 약 0.32/0.34/0.33, roughness 0.78; Boss armor 약 0.36/0.39/0.34, roughness 0.82. 색/roughness는 차량별로 다르며 source-derived provisional material을 임의로 통일하지 않았습니다.

Panzer4 두 파일의 nonfinite position/normal, zero normal, negative determinant 및 area×2<1e-12 퇴화 삼각형은 0입니다. 기존 Max→final normal 비교 최대 0.06182004° PASS를 유지합니다. 참고 파일의 작은/퇴화 면 카운트는 별도 JSON에 기록했으며 이 작업에서 수정하지 않았습니다.

처음 공통 renderer의 기본 shadow bias=0에서 여러 차량에 줄무늬 shadow acne가 보였습니다. 공통 shadow bias=-0.0003 / normalBias=0.015로 재렌더하여 해소했습니다. GLB geometry/normal은 변경하지 않았습니다. 최초 이미지와 결과는 *_shadow_default.png 및 browser_results_shadow_default.json으로 보존했습니다. 이 값은 본 비교 harness 설정이며 production renderer 변경/승인이 아닙니다.

실제 renderer: ANGLE NVIDIA GeForce RTX 5090 / D3D11 / WebGL2. 소프트웨어/Headless 렌더가 아닙니다. 성능 benchmark, 모든 hardware, 대량 clone lifecycle, 실제 production Player/hit event는 NOT RUN입니다. 시각 확인은 agent technical inspection이며 최종 사용자 Art 승인과 구별합니다.

## 보존 / 산출물
원본 지시문, Panzer4 GLB/BLEND/Max source, M4 source/GLB, Tiger2 Boss source/GLB 등 10개 보호 파일 SHA-256 불변 PASS. 기존 game/R&D consumer/registry는 수정하지 않았습니다.

- GLB_BINARY_COMPARISON.json — actual files/hashes/counts/positions/material values.
- browser_results.json — 실제 GLTFLoader/renderer/motion/detach 결과.
- COMPARISON_VERDICT.json — 판정 및 보존.
- screenshots/ — 실제 Browser WebGL 검증 이미지.
- viewer.html / app.js / server.py — 이 audit 내부의 독립 비교 harness.

## 결론
현재 Panzer4 GLB는 기존 차량들과 동일한 자산 규약을 충족하고, 단순 궤도 및 좌우 분리 쉬르첸도 정상적으로 사용할 수 있는 구조입니다. 파일을 고칠 필요가 있는 자산 결함은 이번 대조에서 발견하지 않았습니다. 기존 변환 과정의 조건과 production/gameplay/Art 승인 경계는 유지합니다.

증거의 실제 저장 경로: \\192.168.87.201\Projects\RicochetAngles\00_Asset\GLB_Export\Panzer4\validation\reference_comparison_20261009_v01
