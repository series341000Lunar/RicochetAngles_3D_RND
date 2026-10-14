# Panzer4 — 기본형 / 쉬르첸 분리형

최종: **PASS WITH CONDITIONS / USER VISUAL REVIEW REQUIRED**.
사용자 요청에 따라 Blender에서 HULL과 쉬르첸을 분리했습니다. 두 모델 모두 단순 연속 궤도를 사용합니다.

| 모델 | GLB | triangles | mesh nodes | nodes | bytes |
|---|---|---:|---:|---:|---:|
| 기본형 | [Panzer4_BASE.glb](../export/Panzer4_BASE.glb) | 33,652 | 5 | 8 | 1,233,168 |
| 증가장갑형 | [Panzer4_SCHURZEN.glb](../export/Panzer4_SCHURZEN.glb) | 46,444 | 10 | 13 | 2,197,592 |

Blender 편집 파일: ../source/Panzer4_BASE.blend 및 ../source/Panzer4_SCHURZEN.blend. 원본 Max / 상세 궤도 / 다른 차량은 보존했습니다.

## 노드 / 부모

| Mesh | Parent | 용도 |
|---|---|---|
| HULL | Panzer4_ROOT | 기본 차체 |
| TRACK_L / TRACK_R | HULL | 기존 running gear + 새 연속 벨트 |
| TURRET | TURRET_PIVOT | 기본 포탑 |
| GUN | TURRET | 포신 |
| SCHURZEN_HULL_L | HULL | 차체 좌측 장갑 |
| SCHURZEN_HULL_R | HULL | 차체 우측 장갑 |
| SCHURZEN_TURRET_L | TURRET | 포탑 좌측 장갑 |
| SCHURZEN_TURRET_R | TURRET | 포탑 우측 장갑 |
| SCHURZEN_TURRET_REAR | TURRET | 포탑 후면 장갑 |

TURRET_PIVOT은 HULL 아래, MUZZLE은 GUN 아래입니다. 기본형에는 SCHURZEN 5개 mesh가 없습니다. 같은 장갑에 속한 원래 plate/rail/bracket을 함께 묶고 기본형에서 해당 부품들을 모두 제외했습니다. 비장갑 부품은 동일합니다.

L/R은 차량 기준입니다. Max/Blender +Y=L, -Y=R이며 GLB 변환 후 L은 -Z입니다. 포탑 후면 장갑은 원래 중앙 부품이라 독립 REAR 노드로 보존했습니다. 각 장갑 pivot은 group bounds 중심이며 포탑 장갑은 turret motion을 따라갑니다.

Tiger2 reference를 read-only로 열어 추가부품이 HULL/TURRET 아래 방향별 그룹으로 나뉜 것을 확인했습니다. Tiger2 형상/게임 상태를 복제하지 않았습니다.

## 실제 검증
- A=Max → raw imported FBX B의 geometry/material/normal: PASS. raw helper/pivot offset은 sidecar 보정 필요.
- A → corrected Blender B → actual GLB reimport C: geometry/bounds/scale/orientation/face material/normal PASS.
- 최종 corner normal 오차 최대 0.06182004°, 기준 0.1°.
- world vertex 오차: 기본형 2.98023224e-8m, 증가장갑형 2.38418579e-7m.
- GLB binary names/parents/matrices 및 meters/+X-forward/+Y-up: PASS.
- 3 PBR 재질; textures/images/animations/skins/cameras/compression/instancing extension 없음.
- Hull ±회전, turret 독립 ±회전, gun pitch ±diagnostic, combined motion: PASS.
- MUZZLE position/forward/neutral reset: PASS.
- 5개 장갑 각각 hide 및 parent detach: PASS. 다른 노드/반대쪽 장갑 world matrix 변화 0.
- 증가장갑형에서 장갑을 제외하면 기본형의 5개 핵심 메시와 geometry/material/normal/bounds 일치: PASS.
- 실제 reimport viewport top/side/quarter 및 L/R damage diagnostic을 확인하고 neutral/intact로 복원했습니다.
- 상세 모델의 두 번째 full Max export/replay는 별도 PASS evidence입니다. 새 장갑 variants는 각각 fresh Blender conversion/export/reimport/motion/removal을 실행했습니다. 이 새 variant들을 두 번 full replay했다고 주장하지 않습니다.

## 피격 파손 연결 범위
이 GLB는 이름별 장갑 메시를 독립적으로 숨기거나 detach할 수 있는 자산입니다. GLB 자체에 hit event / damage HP / collision / fracture-debris simulation은 포함하지 않았습니다. 기존 HTML / renderer / gameplay / collision / Unity / production registry를 수정하지 않았습니다.

후속 renderer 작업에서는 피격 부위의 장갑 노드 visibility를 끄거나 world transform을 유지한 채 parent에서 분리할 수 있습니다. 공유 geometry/material의 dispose가 다른 clone을 손상시키지 않도록 runtime lifecycle에 연결해야 합니다. 이는 후속 연결 지침이며 실제 게임 피격 동작의 구현/검증을 의미하지 않습니다.

## 판정 / 증거
Max sidecar pivot/MUZZLE 복원, source face material/normal transfer, semantic consolidation이 필요하므로 PASS WITH CONDITIONS입니다. 3 PBR 재질은 요청된 단순 변환이며 VRay 최종 look의 동일성을 승인하지 않았습니다. 사용자 visual/canonical approval 및 HTML/Three.js/Unity integration은 별도입니다.

작업 증거:
- 00_Asset/GLB_Export/Panzer4/schurzen_variants/validation/FINAL_VARIANTS_VALIDATION.json.
- 각 variant FINAL_VALIDATION.json 및 motion_and_removal_validation.json.
- validation/original_preservation_final.json — Panzer4 64개 source file, original/detailed Master, Tiger2 reference 보존 PASS.
- notes/DELIVERY_MANIFEST.json — 전달 파일 hash/size/source identity.
