# Global LookDev 통합 결과 — 2026-10-14

독립 Stage 1 Global LookDev 환경 구현 및 기술 검증 완료.
최종 미술 스타일 및 사용자 시각 승인은 **USER VISUAL REVIEW REQUIRED**.

실행: `Launch_Global_LookDev.bat` 또는 <http://127.0.0.1:8765/lookdev/>.
기존 8765 local server, Three r160 / 0.160.1, GLTFLoader와 license를 재사용한다.
원본 M41 / Multi-Asset R&D / DCC 진입점은 보존했다. 구현은 별도 `lookdev/`에 있다.

## 1. Mainline과 구조 차이

Mainline reference는 현재 로컬 `main`, 관찰 HEAD
`6791fdb60ca83f88ff744505e0d058b3f387bdd8`의 실제 코드다.
AGENTS §§3.2, 10, 25.40–25.42의 Unified World 계약을 확인했다.
과거 ENV-01의 detached/tile/Canvas 계약을 정상 RW-02 기준으로 사용하지 않았다.
상세 항목별 분류는 [사전 비교표](GLOBAL_LOOKDEV_COMPARISON_20261014.md)에 있다.

Mainline은 classic-script byte transport로 file://을 지원하며 H5E gameplay
RAF에서 ENV + actor scene을 함께 렌더한다. 기존 ThreeJSDEV는 ES modules,
relative HTTP GLB fetch, pixel-unit scene과 gameplay/model R&D를 갖는다.
새 LookDev는 HTTP 방식을 유지하되 ENV metres와 공통 world/depth/shadow를 사용한다.
한 페이지 안에서 WebGLRenderer 1개, context 1개, 단일 RAF chain을 사용한다.
Mainline의 gameplay RAF나 게임 상태/AI/무기/진행/UI를 가져오지 않았다.

## 2. 선별 재사용한 렌더 설정과 코드

Mainline 파일을 통째로 복사하거나 기존 R&D를 교체하지 않았다.

| Reference | 재사용 / 조정 내용 |
|---|---|
| `src/hybrid-environment.js` tuning / attach | Hemisphere sky `cbdcf0`, ground `82734e`, intensity .85; sun `ffefd4`, intensity 2.3, offset (-70,100,80)m |
| 같은 파일 camera sync | 75° Orthographic, up (0,0,-1), sin(elevation) ground metric, 300m distance, far700, 14px/m; camera 자유 이동과 전체 footprint clamp만 추가 |
| 같은 파일 shadow sync | PCFSoft2048, span±105m, near .1/far400, bias-.001, normalBias .2m, camera 주변 texel-snapped light center |
| `src/unified-world.js` prepare | alpha + antialias, DPR1, SRGB output, NoToneMapping, exposure1, clear87908b |
| 같은 파일 opaque actor shadow policy | opaque / opacity≥1 / non-wireframe / unifiedNoShadow 검사, cast+receive. UI에서는 ENV+actor 그림자를 함께 비교 |
| `src/hybrid-player.js` descriptors | runtime visualScale / 14를 metre wrapper에 적용; accepted VS125 포함, authored node hierarchy와 pivot 보존 |

기존 `spike/vendor`의 Three / Loader / BufferGeometryUtils / LICENSE는 Mainline
vendored 모듈과 같은 provenance/hash를 갖는다. UUID patch 외 렌더 알고리즘
변경이 없으며 신규 외부 라이브러리나 CDN을 추가하지 않았다.
GLB PBR material과 normals를 유지한다. 게임의 damage tint, readiness, turret
mechanical state와 Boss adapter는 이식하지 않아 모델은 authored rest pose다.
Color grade, toon, bloom과 custom shader는 이 새 baseline에 추가하지 않았다.

`Mainline 기준 복귀`가 baseline의 lighting/shadow/output/tone/camera angle을
복원한다. 비교 중 camera position/zoom은 유지하며 `필드 중심`이 초기 위치로 복귀한다.

## 3. Stage 1 환경

공급 원본 `00_Asset/ENV/Stage1/glb/Stage1_StaticWorld_RND_v01.glb`는 1,757,008bytes,
SHA-256 `8eb88f8312e183e14c476b9c60248e70107d44b7016715875cc04738ec0ddee2`다.
Mainline 원본과 byte-identical. validation reproduction도 같은 hash다.

실제 scene/node/world transform/accessor bounds를 조사했다. ENV hierarchy727 nodes,
전체 시각 bounds X[-80,1320], Y[-.820918,15.452694], Z[-51,154]m.
ENV root의 origin / quaternion / scale1을 보존했고 crop/recenter/edit를 하지 않았다.

대표 필드는 current canonical `ENC_01` X8960–10240px, world height1440px에서
가져온 X[640,731.428571], Z[0,102.857143]m, 약91.43×102.86m다.
ENC gameplay는 없다. 원본 terrain, structures, concrete/dragon's teeth와
여러 actor가 같은 scene에서 depth/shadow를 공유한다.
실제 ground triangle union의 해당 rectangle coverage를 sweep 검증했다:
366 intersecting triangles / 191 critical slices, **covered=true**.
장식물을 포함한 전체 mesh AABB를 실제 지면으로 오인하지 않는다.

## 4. 추가 GLB 자산

공급 폴더의 GLB **44개**(ENV 포함)를 조사했고 header/scene/bounds/normal 검사 오류0개.
backup/validation source는 역할을 기록하고, 고유 비교 모델 **30개**를 통합했다.
같은 바이트의 중복 사본은 aliases로 기록한다. 기본 visible roster14개;
나머지는 checkbox/Inspect/Solo로 표시한다. 별도 scene/asset editor는 없다.

| Family | 탑재한 모델 / 비교 버전 |
|---|---|
| AT | Pak40 v01, Pak43 v01, Traverse v02 |
| Light vehicles | Halftrack v01, Kübelwagen v01 |
| US tanks | M41 v01 / v02_muzzle, M4A3E2 v01, M4A3E8 v01 |
| Panzer III | v01 / v02 |
| Panzer IV | bridge original / v002 / v003, Schürzen base / armored, simple-track v003 |
| Tiger | Tiger I v01 / v02, Tiger II v01, Stage1 Boss v01 |
| Landing craft | SHIP_LCT v01 |
| Coastal battery | original SHARED / N / S; P6B1 N / S; P6B2 SHARED / N / S |

30개 모델의 상세 목록·runtime URL·scale·role은
[ASSET_INDEX](global-lookdev/ASSET_INDEX.md), 원본 경로와 full hash/aliases는
`lookdev/manifest.json`에 있다. 각 hierarchy/local/world transform/material/normal은
`global-lookdev/asset-audit.json`, 실제 GLTFLoader load/runtime bounds/material/flags는
`global-lookdev/browser-validation.json`에 기록했다.

14개가 Mainline 내 실제 파일과 hash가 일치한다. 그중12개는 current descriptor의
scale/groundOffset을 재사용했다. M41과 Panzer IV armored는 Mainline 파일과의
존재·바이트 일치이며 active runtime binding의 승인을 추정하지 않는다.
나머지는 source scale1 + measured minimum-Y grounding을 적용한 비교용 wrapper다.
자유로운 test placement/yaw만 추가하고 source hierarchy/pivot/geometry는 보존했다.
Coastal battery는 authored rest component를 개별 비교하며 실제 Boss 배치나
mechanical state를 재구성하지 않았다. Coupler 일부가 지면 아래에 있는 authored rest
transform도 검증된 Mainline groundOffset0을 따르는 경우 자동 보정하지 않는다.

원본 NAS absolute path는 provenance metadata에만 쓴다. 브라우저는
`lookdev/assets/<sha-prefix>.glb` relative URL로 exact-byte derivative를 읽는다.
ENV +30개 모델은 약34.55MB다. 사본은 GLB ignore 방침에 따라 local-only로 유지한다.
source를 수정하지 않으며 기존 derivative의 bytes가 다르면 overwrite를 거부한다.

## 5. Camera boundary

Drag, WASD/방향키, wheel/slider Zoom을 추가했다. 기존 페이지의 camera/control은 변경하지 않았다.
75° 기본, 90° projection reference, 45° diagnostic을 제공한다.
NDC 네 모서리를 ground plane에 투영하고 offset 전체가 field 안에 들어오는
중심 좌표 구간으로 clamp한다. zoom-out으로 수용할 수 없으면 aspect/frustum/rotation에
따라 유효 minZoom을 먼저 계산한다. resize에도 같은 처리를 실행한다.

540 cases (45/75/90°, yaw0/37/110°, four viewport shapes, zoom .0001–1000,
near/far outside positions) PASS. AABB가 놓칠 수 있는 rectangle 내부 hole/thin gap의
negative control도 PASS. 실제 Chrome UI 입력, 네 종류의 resize와 zoom .0001/100,
세 elevation의24조합에서도 모든 corner의 field containment가 PASS다.

## 6. 기존 기능·DCC·원본 보호

기존 M41/Multi-Asset runtime과 Blender bridge 구현은 변경하지 않았다.
기존 G2/G3 Chrome regression을 새 출력 경로에서 실행해 모두 PASS.
기존 geometry/proxy/weakpoint/collision, gameplay trace, Focus/BulletTime/Boss/restart,
Three/Canvas toggle을 유지했다. Blender bridge Contract/HTTP fixture 검사13/13 PASS.
README에 향후 방향 PRIMARY DCC = Autodesk 3ds Max / Blender KEEP만 추기했다.
3ds Max importer/exporter/MCP 연결, DCC UI 변경은 수행하지 않았다.

Mainline src/assets/maps/docs/index/AGENTS, 기존 R&D source/launch/tests, 공급 GLB를
포함한2,645 files를 before/after SHA-256로 검증했다: changed0 / missing0.
승인된 DCC README 추기는 제외하고 별도로 diff를 확인했다. 증거는
`global-lookdev/preservation-before.json`과`preservation-after.json`이다.
기존 untracked `Panzer4/` / `Stage1_CostalBattery/`를 보존했다.
최초 G2 baseline 실행이 timestamp를 갱신한 JSON은 새 증거 폴더에 저장하고 과거 JSON을
원래 내용으로 복원했다. 이후에는 기존 보고 경로를 덮어쓰지 않는 regression runner를 사용했다.
Mainline 및 공급 source에는 쓰기를 수행하지 않았다.
Commit / push / Mainline 역이식은 수행하지 않았다.

## 7. 변경 파일

| Files | 내용 |
|---|---|
| `.gitignore`, `README.md`, `dcc00/README.md` | local-only images, 실행 안내, 향후 DCC 방향 |
| `Launch_Global_LookDev.bat/.ps1` | 기존 server를 재사용하는 새 실행 경로 |
| `lookdev/index.html`, `lookdev/lookdev.css`, `lookdev/lookdev.mjs` | 독립 표시·조작, loading/preparation, resource lifecycle |
| `lookdev/baseline.mjs`, `lookdev/camera-boundary.mjs`, `lookdev/manifest.json` | dated baseline, full footprint/ground union, source URL 대응 |
| `tools/audit-lookdev-assets.mjs`, `tools/prepare-lookdev.mjs`, `tools/verify-lookdev-preservation.mjs` | GLB inventory, 비파괴 asset injection, hash preservation |
| `tests/test_lookdev_camera.mjs`, `tests/test_lookdev_browser.cjs`, `tests/run_lookdev_regression.cjs` | boundary/runtime/기존 regression |
| `Docs/GLOBAL_LOOKDEV_COMPARISON_20261014.md`, 이 report, `Docs/global-lookdev/` | comparison, asset index, JSON evidence, local screenshots |

`lookdev/assets/*.glb`와 PNG captures는 ignored/local-only 생성물이다.
기존 gameplay/render/DCC 구현 파일에 diff가 없다. 기존 동작을 새 LookDev로 교체하지 않았다.

## 8. 실행한 검증·남은 문제

| Gate | Result |
|---|---|
| `node --test tests/test_lookdev_camera.mjs` | PASS 2 tests / 540 projection cases + hole controls |
| `node tests/test_lookdev_browser.cjs` | PASS 47 checks; normal load page/console errors0 |
| Runtime ENV +30 models | PASS parse + exact hash + real shader/draw preparation31 resources |
| Baseline renderer / actual lights | PASS r160, DPR1, alpha/antialias, SRGB/None/exposure1, .85/2.3 colors, shadow2048 |
| Pan / zoom / resize / extremes | PASS actual UI + full ground footprint |
| Shadow / multiple GLBs | PASS settings/opaque flags/common scene; captured actor+ENV shadow images |
| Missing ENV / context loss | PASS labelled DEGRADED diagnostic floor / safe FAILED with reload |
| Return from another R&D page / dispose | PASS resume/reload RAF; owned geometry resources reach0 after disposal |
| `node tests/run_lookdev_regression.cjs g2` | PASS 19 existing checks |
| 같은 runner `g3` | PASS 23 existing checks |
| bundled Python `-B dcc00/tests/test_contract.py` | PASS 13 tests, including temporary HTTP conflict/preservation boundaries |
| `node tools/verify-lookdev-preservation.mjs` | PASS 2645 files / changed0 / missing0 |
| JS syntax + `git diff --check` | PASS |
| Final art approval / full Mainline pixel identity | USER VISUAL REVIEW REQUIRED / UNVERIFIED |
| Hardware performance acceptance / all legacy optional experiments | NOT RUN; scope regressions and source preservation only |

Camera movement rendered without console errors. Sun direction is constant with a
following texel-snapped region; there is no new culling/shadow framework.
Screenshots were inspected for visible models/ground/shadows; one model crossing
the original anti-tank obstacle was moved to a clear test bay. Automated settings
or screenshots do not substitute for the user's visual/shadow-quality acceptance.
This baseline excludes complete Mainline gameplay-state / Canvas cue composition,
so it does not claim pixel-for-pixel identity with a playing Mainline screen.
No hardware FPS improvement or performance target is claimed.

Local screens: [baseline-final](global-lookdev/baseline-final.png),
[actor shadow](global-lookdev/actor-shadow.png).

Initial server approval review timed out; its permitted single retry succeeded.
Sandbox localhost restrictions on browser/DCC tests were resolved by approved
execution; no verification gate remains blocked by that restriction.

## 9. 다음 Global LookDev 조정 파라미터

UI: Hemisphere/Sun intensity, Tone Mapping, exposure (None에서는 영향 없음),
shadow ON/OFF, bias/normalBias, map1024/2048/4096, camera75/90/45°, zoom,
model visibility/selection/Solo. Baseline reset으로 같은 reference에 복귀할 수 있다.
`lookdev/baseline.mjs`의 dated 설정에는 sun direction/colors/span도 명시했다.
후속 material/shading, shadow quality, color grading/postprocessing, user art
approval, Mainline으로 승인된 결과를 역이식하는 작업은 별도 과업이다.
