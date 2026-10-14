# Clean low-poly battlefield / black outline / contour only — 2026-10-14

독립 ThreeJSDEV LookDev에 A/B/C/D 비교 후보를 구현했다. 사용자 추가 요청인 **D · Black outline contour only**는 내부 부품 경계를 그리지 않고 전체 실루엣만 검게 표시한다. 기존 C 부품별 hull 방식은 별도 비교로 유지한다. 기술 검증 PASS이며 최종 미술 승인은 USER VISUAL REVIEW REQUIRED다.

## 실행과 후보

`Launch_Global_LookDev.bat`는 C를 연다. A 버튼 또는 `Launch_Global_LookDev.ps1 -Reference`로 기존 기준 룩에 복귀한다. D 버튼 또는 [Contour-only 실행](http://127.0.0.1:8765/lookdev/?look=contour-only)으로 외곽선 전용 후보를 연다. [A/B/C/D 비교 갤러리](http://127.0.0.1:8765/Docs/clean-lookdev/comparison.html)는 동일 필드·카메라·DPR 1 캡처다.

| 후보 | 동작 |
| --- | --- |
| A · Mainline reference | 보존된 기준 렌더링과 원래 재질 |
| B · Clean low-poly | 저채도 월드, 밝고 무광인 대상, 조명·접지 조정 |
| C · Clean + black outline | B + 주요 부품의 검은 inverted hull |
| D · Black outline contour only | B + 전체 실루엣 마스크 외곽선; 내부 부품 경계 없음 |

D에는 전체 주요 대상 / 선택 모델 1대 범위가 있다. 선택 모델 방식은 게임의 Shift 조준 contour와 같은 마스크 원리다. 여기서는 LookDev 모델 선택 UI를 사용하며 기존 game mode의 Shift 동작은 변경하지 않았다. Width 슬라이더는 C/D의 픽셀 두께를 조절한다. Wreck는 선택 모델의 정적 재질 비교다.

## 기준 룩 대비 조정

| 항목 | A | B/C/D |
| --- | --- | --- |
| Hemisphere intensity | 0.85 | 1.15 |
| Sky / ground color | `cbdcf0` / `82734e` | `dbe3e5` / `888576` |
| Sun intensity / color | 2.3 / `ffefd4` | 2.05 / `fff4df` |
| Sun offset | (-70,100,80) | (-55,115,40) |
| Sun elevation | 약 43° | 약 59° |
| Shadow half-span / map | 105m / 2048² | 90m / 2048² |
| Shadow bias / normal bias | -0.001 / 0.2 | -0.0003 / 0.035 |
| Tone mapping / exposure | None / 1 | ACES / 1.05 |

Orthographic 75°, 14px/m, DPR 1, SRGB, PCFSoft, 카메라 경계 정책은 유지한다. 태양 중심은 shadow texel 단위로 정렬한다. 월드 saturation blend 0.48, 밝기 계수 1.12를 기본 후보로 삼았다. 원래 재질 33개의 선형 RGB saturation 평균은 0.38330 → 0.21176(약 45% 감소)다. 이 값은 화면 지각 채도와 동일한 측정은 아니다.

플레이어는 saturation 0.82 / 밝기 1.17, 보스 0.65 / 1.08, 일반 대상 0.72 / 1.02로 차등 조정한다. Environment roughness ≥0.85, actor ≥0.82, metalness ≤0.16으로 광택을 억제한다. Energy/weak/core/warning/signal 재질은 살아 있는 모델에서 보존한다. 기준 복귀 시 색·emissive·roughness·metalness를 정확히 복원한다.

## 외곽선 구현과 범위

**C:** 원본 position/index/normal은 그대로 두고 파생 geometry에 별도 smoothed outlineNormal을 만든다. black BackSide shader로 화면 공간에서 기본 1.15px 확장한다. 원본의 winding/normal을 직접 뒤집는 변경은 없다. depth test ON, depth write OFF, shadow cast/receive OFF이며 opaque world 이후 그려 지면에 덮이지 않게 했다. Hard-edge의 중복 위치에 있는 법선들을 합쳐 갈라지는 hull을 줄인다.

C는 HULL/TRACK/TURRET/GUN/WHEEL와 주요 ADDON/fortification 부품에 선택 적용한다. GLTF multi-material primitive의 직접 semantic parent도 인식하지만 HULL 아래의 모든 작은 장식을 무차별 포함하지 않는다. 작은 energy accent, 투명 재질, ground/rock/dragon's teeth는 제외한다. ENC 구조물은 실제 존재하는 `ENC_Infantry_Cover_Position_001/002` 두 개다. 기본 필드는 14개 actor + 구조물 2개를 표시한다. 전체 30개 actor용 파생 hull은 230개, 기본 표시 hull은 150개다.

**D:** `spike/rnd_target_contour.js`의 기존 V1 Shift target 기법을 명시적으로 선택해 별도 모듈로 적용했다. 선택 대상의 opaque geometry를 공유해 흰색 마스크에 그린 후, 3×3 이웃 sampling으로 마스크 바깥쪽만 검게 합성한다. 색은 검정, 기본 두께 1.15px, 마스크는 현재 viewport 크기와 선형 필터를 사용한다. C의 부품별 hull은 D에서 모두 숨긴다. 포탑·차체·궤도가 겹치는 내부 경계에는 새 선이 생기지 않는다. 원래 재질/조명에 있는 어두운 선은 남으며 실제로 뚫린 공간의 실루엣은 윤곽으로 읽힐 수 있다.

D 전체 범위는 표시된 actor와 위 구조물 2개다. 선택 범위는 표시된 선택 모델 1대다. 숨겨진 모델은 0 추가 calls다. 원본 geometry 복사 0, 공유 white mask/black composite 재질 2개, 작은 quad만 자체 geometry를 갖는다. 원본·R&D 모듈은 수정하지 않았다.

## Draw call 조사

Chrome headless, 브라우저 viewport 1600×960, 실제 world 1280×960, DPR 1, 기본 roster 14대, 동일 카메라·zoom 1, shadow ON. 각 후보 warm-up 후 40회 동기 render 제출을 측정했다. `contour-validation.json`이 비교 원본이다.

| 후보/범위 | 화면 색상 + 효과 calls | Shadow calls | 전체 프레임 calls | B 대비 추가 | 화면 + 효과 triangles |
| --- | ---: | ---: | ---: | ---: | ---: |
| A 기준 | 268 | 577 | 845 | — | 508,074 |
| B clean, outline 없음 | 268 | 501 | 769 | 0 | 508,074 |
| C 부품별 hull | 418 | 501 | 919 | 150 | 944,616 |
| D 전체 주요 대상 | 461 | 501 | 962 | 193 | 1,002,646 |
| D Panzer3 1대 | 279 | 501 | 780 | 11 | 514,896 |
| D 보스 1대 | 319 | 501 | 820 | 51 | 625,268 |

Three r160의 기본 `renderer.info`는 world render 중 shadow 이후 reset된다. LookDev HUD의 `color draws`는 화면/마스크/합성 합계다. 이번 조사는 `info.autoReset=false`로 별도 측정해 shadow까지 포함한 전체 프레임도 기록했다. A→B shadow 차이는 ground caster 제외와 sun/shadow 영역 조정 때문이며 외곽선 비용은 B 기준으로 비교해야 한다.

D 추가 비용은 **실제 마스크 draw calls + fullscreen composite 1**이다. 전체는 192+1, Panzer3는 10+1, 보스는 50+1이다. 전체 실루엣을 얻으려면 작은 부품을 포함해 모델을 다시 그리므로 C보다 전체 적용 calls가 43개 많다. 내부 선이 없다는 사실만으로 draw calls가 줄지는 않는다. 적 1대 조준 용도로는 기본 필드에 +11 또는 +51이다. 모델별 mesh 분할과 visibility/frustum에 따라 달라진다.

C의 공유 shader material은 6개, 전체 모델용 파생 geometry 저장량은 13,558,200 bytes다. D의 1280×960 mask RGBA+depth 저장 추정은 9,830,400 bytes(약 9.38MiB; 드라이버 내부 정렬 제외), shared effect materials 2개다. 비교 전환을 위해 C 캐시도 유지하므로 D 화면에서 C 파생 geometry 메모리가 자동 해제되지는 않는다. Toggle 반복은 누적 증가를 만들지 않는다.

CPU 제출 median/P95는 JSON에 기록했다. GPU 완료 시간을 기다리지 않는 측정이며 GPU frame time/FPS 승인 자료가 아니다. D는 9 texture samples를 쓰는 전체 화면 합성도 추가하므로 calls만으로 실제 GPU 비용을 판단할 수 없다. 구조상 전체 모델 마스크 재렌더가 주된 추가 비용이고, 이후 필요하면 대상 범위 축소나 의미 있는 mesh 병합을 별도 검토할 수 있다.

## 접지감, 시각 결과와 한계

새 SSAO 시스템 없이 directional light, PCFSoft shadow, 작은 normal bias와 matte material contrast로 접지감을 만든다. Ground는 그림자를 받으며 clean 후보에서는 자체 caster를 끈다. 그림자 길이가 줄고 암부의 부품 형태가 읽히며, 배경 채도가 낮아져 차량/AT/보스가 분리된다. C는 주요 부품 형태를 강조하고 D는 외부 실루엣을 더 단순하게 읽히게 한다. Pixel 비교로 실제 검은 외곽선의 존재를 확인했다. 단순 draw 증가만을 성공으로 취급하지 않았다.

D는 기존 Shift contour처럼 **대상만 마스크에 그린다**. 비대상 지형의 깊이로 마스크를 가리지 않으므로 지형 뒤 윤곽이 드러날 수 있다. 서로 겹친 선택 대상들은 합쳐진 실루엣이 된다. Skinned/morph/투명 모델은 현재 후보 대상에서 제외한다. 표준 alpha-cutout 지원, 개별 대상 경계/비대상 depth occlusion은 후속 필요에 따라 다룰 사항이다. 내부 선을 원치 않는 현재 요구에는 합쳐진 silhouette 방식이 부합한다.

정지 A/B/C/D, 단일 적/보스, C wreck, 실제 키보드·마우스 이동/zoom 캡처를 남겼다. 작은 viewport와 극단 zoom에서도 경계·렌더 오류가 없었다. Fine mesh detail과 비스듬한 silhouette의 완전한 미술 품질, 실제 사용자 GPU의 동작감은 사용자 검토가 필요하다. 영상 인코더가 없어 WEBM 녹화는 NOT RUN이며 실제 조작 trace와 PNG로 대체했다. 장기 rough outline/hatching/posterize는 구현하지 않았다. 향후에는 C outline shader나 D composite의 스타일을 확장할 수 있다.

## 검증과 보호

- Unit/camera: 5 PASS, 540 camera/viewport/zoom 조합과 ground hole 검증.
- Clean A/B/C browser: 27 PASS, 원본 geometry/material 복원, 실제 로딩·visibility·solo·resize·shadow·cache·dispose.
- D contour browser: 24 PASS, 내부 hull OFF, 동일 B palette, 범위별 비용, renderer 상태 보존, 경계·pan-return·키보드/wheel·bounded cache·dispose.
- 기존 LookDev browser regression: 47 PASS, missing ENV fail-soft, context failure, navigation return 포함.
- Raster black outline 검증 PASS; C 실제 이동 trace PASS. 최종 사용자 art review는 별도다.
- 초기 원본/Mainline/reference/기존 R&D 2,645개 파일 preservation hash PASS. 최종 검사는 WARN: 2,643개 unchanged, missing 0, DCC 작업 파일 `dcc00/workspace/playable-env/authoring.blend`와 `geometry.glb` 2개의 해시가 초기 기준과 달라졌다. 이 LookDev 작업은 두 파일을 수정하지 않았다. 범위 밖 변경은 그대로 보존하며 원인/작성 주체를 단정하지 않는다. `Docs/clean-lookdev/preservation-after.json`에 전후 hash/mtime을 남겼다. Mainline/원본 GLB/기존 R&D 코드 변경은 발견되지 않았다.
- 보호 파일 baseline/camera-boundary/manifest/vendor hash PASS. `git diff --check`와 JS syntax check PASS.

원본 GLB나 Mainline/gameplay/DCC authority를 수정하지 않았다. SHA 기준 시작 HEAD는 `fdebae8e753d272ea28af5d2f666bcc184f8e83d`다. 로컬 구현과 근거만 작성했으며 commit/push는 수행하지 않았다.

## 변경 파일과 근거

구현: `lookdev/clean-look.mjs`, `lookdev/contour-only.mjs`, `lookdev/lookdev.mjs`, `lookdev/index.html`, `lookdev/lookdev.css`.
실행/안내: `Launch_Global_LookDev.ps1`, `README.md`, `.gitignore`(새 PNG 등 visual evidence ignored).
검증: `tests/test_clean_look.mjs`, `tests/test_clean_look_browser.cjs`, `tests/test_contour_only_browser.cjs`, `tests/test_clean_look_motion.cjs`, `tests/verify_clean_look_pixels.py`, `tests/run_clean_reference_regression.cjs`, `tests/inspect_clean_look.cjs`.
근거: `Docs/clean-lookdev/validation.json`, `contour-validation.json`, `pixel-validation.json`, `motion-validation.json`, `protected-before.json`, `protected-after.json`, `preservation-after.json`, `reference-regression/browser-validation.json`, 비교 갤러리와 PNG. 기존 `Docs/global-lookdev` 캡처와 이전 preservation evidence는 보존했다.

![A reference](clean-lookdev/A-mainline-reference-world.png)
![B clean](clean-lookdev/B-clean-low-poly-world.png)
![C hull outline](clean-lookdev/C-clean-black-outline-world.png)
![D contour only](clean-lookdev/D-contour-only-all-world.png)
