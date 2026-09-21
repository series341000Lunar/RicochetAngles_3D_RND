# DCC-00 — Blender Semantic Authoring Feasibility

**기술 검증 PASS / 사용자 UX Gate PENDING.** 이 도구는 R&D authoring frontend이며
HTML gameplay, H5E, Unity, 장기 spatial source of truth의 권한을 갖지 않습니다.

## 시작

저장소 루트의 `Launch_DCC00_Authoring.bat`를 실행합니다. 설치된 최신 Blender 5.2.x LTS
세션과 브라우저 Editor/Testbed를 엽니다. 같은 Blender 인스턴스 안에
**RicochetAngles Authoring Editor** native floating window가 기본 편집 화면으로 열립니다. 기존 Blender 창과 사용자 preferences는
수정하지 않습니다. Add-on은 이 실행에서 소스로 등록되므로 설치·JSON 편집이
필요하지 않습니다. Blender를 다시 열 때에도 이 launcher를 사용하십시오.

- Editor: http://127.0.0.1:8766/dcc00/html/editor.html
- Testbed: http://127.0.0.1:8766/dcc00/html/testbed.html
- 기존 R&D: 8765 그대로 유지
- Blender 없이 서버만: `Launch_DCC00_Authoring.ps1 -NoBrowser`
- source activation: `blender --factory-startup --python dcc00/blender_addon/open_authoring.py`

PRIMARY DEVELOPMENT / TEST TARGET은 **Blender 5.2.x LTS**입니다. Launcher는
Blender Foundation 설치 경로의 실행파일 버전을 비교해 가장 높은 5.2.x를 선택합니다.
현재 확인·검증한 실행파일은 **5.2.1 LTS**이며, 5.2.2는 확인된 설치 경로에 없었습니다.
4.5.1 결과는 historical evidence이며 현재 구현의 제약 조건으로 사용하지 않습니다.
설치나 환경 변경을 자동 수행하지 않습니다. 새 clone에는 모델이 없으므로 registry의
경로로 local asset을 별도 공급하거나 MISSING_ASSET proxy를 사용하십시오.

## 사용자 체험 — 10단계

1. `Launch_DCC00_Authoring.bat` 실행. 8766 서버와 Blender 전용 세션이 열립니다.
2. 전용 창의 **Actor Browser → Inspector → Validation**을 사용합니다. 창을 닫았으면
   **N → RICOCHETANGLES R&D → Open RA Authoring Editor** 또는
   **F3 → Open RicochetAngles Authoring Editor**로 재호출합니다. 이미 열려 있으면
   중복 창을 만들지 않고 기존 창 안내를 표시합니다.
3. **Reload Workspace**로 공유 JSON을 읽습니다. 이 action은 현재 DCC 편집을
   교체하므로 unsaved edits가 있다면 먼저 저장합니다. 다른 scene 객체는 보존합니다.
4. **Class → LightTank → Create Actor**. 3D Cursor 위치에 실제 M41 preview가
   나타납니다. Anchor를 선택한 채 **G**로 이동하거나 Inspector Position을 바꿉니다.
5. Inspector의 **Profile / Facing / Home radius / Enabled**를 수정합니다.
   **Preview asset → Bind Selected Asset**으로 교체하고 Stable ID가 유지되는지 봅니다.
6. 같은 Create 메뉴로 **Trigger / Checkpoint / Decoration**을 배치합니다.
   Tier A/B 삭제는 **Delete Semantic Actor**, Decoration은 일반 **X/Delete**가 가능합니다.
7. PresentationActor를 선택하고 **Add Presentation Path**를 누릅니다. 생성된 Curve를
   **Tab**으로 편집합니다. Actor의 Start/Duration/Loop를 바꾸고 Timeline에서 **Space**로
   재생합니다. 기존 path를 사용하려면 actor와 DCC curve를 함께 선택해 **Bind Selected Curve**.
8. **Validate → Save Authoring JSON → Save Review .blend**. HTML Editor에서 Reload한 뒤
   Actor 선택, 위치/속성 변경, Save workspace를 사용합니다.
9. Three.js Testbed에서 **Reload authoring data**. **Play presentation / Seconds**로
   이동을 보고 **Look along world Y**로 기존 세로 공간을 살펴봅니다.
10. Blender **Reload Workspace**로 HTML 변경을 받고 다시 두 저장을 수행합니다.
    Blender를 종료한 뒤 같은 launcher로 재실행하여 ID·속성·preview를 확인합니다.

## 작은 데이터 계약

`ra-dcc00-authoring-v0`: world, actors, decorations, paths, tombstones.
World는 기존 testbed의 **1280 × 3600**, **14 testbed units = 1 meter**입니다.
JSON XYZ는 x=가로, y=화면 아래 방향, z=높이. Blender 위치는 `(x/14, -y/14, z/14)`.
Facing/yaw는 도 단위, Blender Z 회전은 부호를 반전합니다. `.blend` 부동소수점 변환은
0.001 testbed unit 이내 허용 오차로 검증합니다.

| Class | Tier | 편집 항목 / preview |
|---|---|---|
| LightTank | A | Asset, SCOUT/GUARD, facing, homeRadius, enabled / M41 GLB |
| Trigger | A | sizeX/Y, enabled, eventRef 문자열 / wire box |
| Checkpoint | A | checkpointId, enabled / marker |
| PresentationActor | B | Asset, path, start/duration/loop/enabled / Kübelwagen GLB |
| Decoration | C | Asset, transform / crate proxy 또는 local GLB |

A/B는 UUID 기반 stable `ra_id`, C는 ID를 생성하지 않습니다. 오브젝트 이름은 ID가
아닙니다. Duplicate ID는 BLOCK이며 **Assign New ID to Duplicate**로 명시 해결합니다.
A/B가 수동 삭제되어 없어졌다면 source record를 보존하고 MISSING_FROM_SCENE로 저장을
차단합니다. Reload하여 복구한 다음 정식 삭제하십시오. 명시 삭제만 tombstone을 만듭니다.

Unknown top-level/actor/path/transform 필드는 원본에 merge하여 보존합니다.
`UNKNOWN_PRESERVED`는 오류가 아닌 INFO이며, 다른 문제가 없으면 Validate는 PASS / save allowed입니다.
Unknown class/schema, invalid numeric value, 비양수 size/duration, duplicate/missing ID,
유효하지 않은 path, 지원하지 않는 anchor 변환은 BLOCK입니다. Missing asset은 WARNING이고
proxy 및 semantic data 저장을 허용합니다. 새 scene을 seed로 조용히 덮어쓰는 parse recovery는 없습니다.

## 저장과 제한

- `fixtures/seed.authoring.json`: tracked immutable starting fixture.
- `workspace/testbed.authoring.json`: local working document, ignored; 없을 때만 seed로 초기화.
- `workspace/dcc00.review.blend`: 사용자 review 저장본, ignored.
- `test-output/`: 격리된 automated validation 결과, ignored.
- Shared server는 loopback + Host/Origin 검증, 단일 workspace PUT, revision/If-Match 충돌
  검사, 크기 제한과 atomic replace를 사용합니다. 동시 편집은 conflict 후 Reload로 해결합니다.
- Save Authoring JSON과 Save Review .blend는 별도입니다. .blend만 저장하면 HTML은 바뀌지 않습니다.
- Path는 native Blender **단일 POLY curve**이며 정규화된 구간 길이로 보간합니다.
  Timeline frame/FPS를 초로 변환하여 preview 자식만 움직입니다. 시작 전 첫 점, 종료 후
  마지막 점에 머물고 Loop는 시작점으로 돌아갑니다. 비연속 loop의 순간 이동은 의도된 작은 slice입니다.
- XYZ/yaw와 unit-scale, unparented anchor만 지원합니다. Tilt/scale/parent를 silently 버리지 않고
  저장을 차단합니다. Preview mesh 편집은 semantic JSON에 포함되지 않습니다.
- Unknown curve-point extensions는 topology가 유지될 때 보존됩니다. POLY topology 변경 시
  per-point unknown 데이터가 있다면 source 보존을 위해 저장을 차단합니다.
- Three.js는 원본 iframe의 scene/camera/renderer/GLTFLoader를 재사용합니다. gameplay는 READY에
  정지시킨 상태로 환경을 보여주며 DCC actor는 충돌·공격·Q·Focus·Boss logic에 연결되지 않습니다.
- Browser camera는 기존 75° projection을 유지하며 세로 pan만 제공합니다. Static decoration
  대량 편집, automatic live sync, 전체 historical regression suite는 이번 범위가 아닙니다.

## 검증 재현

현재 기준 검증은 설치된 Python 3 / Blender 5.2.1 LTS / Node / Chrome 및 Playwright를 사용했습니다.
추가 package 설치는 없습니다. 명령은 repository root 기준입니다.

```powershell
python dcc00/tests/test_contract.py
python dcc00/tests/integration_server.py  # 별도 터미널, 18766 / test-output만 사용
blender --background --factory-startup --python-exit-code 1 --python dcc00/tests/blender_roundtrip.py -- create
node dcc00/tests/browser_roundtrip.cjs
blender --background dcc00/test-output/roundtrip.blend --python-exit-code 1 --python dcc00/tests/blender_roundtrip.py -- reopen
node dcc00/tests/run_existing_g1.cjs test_g1_isolation.cjs
node dcc00/tests/run_existing_g1.cjs test_g1_interactions.cjs
```

G1은 기존 launcher로 8765를 먼저 기동합니다. 테스트 출력만 `test-output/`으로
redirect하며 원래 테스트/Docs를 덮어쓰지 않습니다. 전체 왕복 검증은 fresh isolated
fixture에서 시작합니다. 재실행 시 기존 test-output 보존이 필요하면 다른 곳에 보관한 뒤
fixture를 seed로 재설정하십시오. 실제 `workspace/`는 검증 코드에서 건드리지 않습니다.

## 사용자 UX Gate — PENDING / USER REVIEW REQUIRED

A. Blender가 Stage2 HTML Map Editor보다 실제 공간 배치에 더 자연스러운가?
B. Inspector의 게임 의미와 속성을 이해하고 편집하기 쉬운가?
C. 실제 모델/proxy 즉시 preview가 제작에 유용한가?
D. Blender + HTML의 Save → Reload 역할 분담이 혼란스럽지 않은가?
E. Curve + start/duration/loop가 presentation authoring에 실용적인가?

다섯 질문에 대한 사용자 판단 전에는 long-term spatial source of truth로 승격하지 않으며
main에 merge하지 않습니다. H5E는 이 사용자 Gate 이후 별도 승인된 feasibility 과제입니다.


## UX correction: native authoring window (2026-09-22)

전용 창은 Blender의 `screen.area_dupli`와 native Properties editor를 사용합니다.
Actor Browser에는 Tier A/B class, object name, semantic ID, 마지막 validation 결과가
표시됩니다. 선택은 main 3D View와 공유되며, Inspector는 같은 Object PropertyGroups를
직접 편집합니다. Validation은 선택 actor와 workspace 전체를 구분합니다.
Blender native Scene 설정도 같은 Properties 영역에 남아 있으며 필요하면 접을 수 있습니다.
창 크기는 native window border로 조절할 수 있습니다.

N-panel은 quick access/status입니다. **Fallback Editing**을 펼치면 기존 Add Actor,
class Inspector, validation, reload 및 review 저장 경로가 유지됩니다. 전용 창을 닫아도
main session이나 scene은 닫히지 않습니다. Window 메뉴와 3D View의 View 메뉴에도
같은 호출 항목이 있고 사용자 Preferences/permanent keymap은 바꾸지 않습니다.

검증은 `dcc00/test-output/ux52/`에서 수행하여 기존 4.5 결과 및 실제 workspace를 보존했습니다.
재현 시 모든 runner에 `DCC00_TEST_OUTPUT` 환경변수로 새 검증 폴더를 지정합니다.
GUI lifecycle/F3 검증은 **별도 테스트 Blender**에서 다음처럼 실행합니다.

```powershell
$env:DCC00_TEST_OUTPUT = "$PWD/dcc00/test-output/ux52"
# isolated integration server / round-trip tests 먼저 실행 (18766)
blender --factory-startup --enable-event-simulate --python dcc00/tests/native_window.py
```

이 테스트는 실제 F3 키/문자/Enter 이벤트를 해당 테스트 창으로만 보내며 마지막에
그 테스트 Blender만 종료합니다. 사용자 scene에 대한 테스트 실행 용도가 아닙니다.
Schema/identity/delete/timing/HTML/Three.js semantics에는 migration이 없습니다.
**USER UX GATE = PENDING**, long-term spatial authority로 승격하지 않습니다.
