# RicochetAngles Three.js R&D — G2/G3 Tiger II Boss 인계문

이 문서는 새 Codex 스레드의 첫 메시지로 그대로 전달할 수 있다. 새 작업의 구현 승인은 이 문서 자체로 주어지지 않는다.

## 작업 위치와 권한

- R&D 저장소: `Z:\RicochetAngles\01_RND\ThreeJSDEV` = `\\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV` (동일한 NAS 트리).
- Git: `series341000Lunar/RicochetAngles_3D_RND`, 브랜치 `dcc-00-semantic-authoring`. G2/G3 전달 커밋은 이 문서와 함께 올라간 최신 커밋을 `git log -1 --oneline`으로 확인한다.
- 먼저 프로젝트 루트 `AGENTS.md`와 이 저장소 `AGENTS.md`, 현재 작업 트리 상태를 읽는다. 다른 제품 저장소의 권한으로 취급하지 않는다.
- 정식 HTML Edition과 Unity는 이번 G2/G3에서 수정하지 않았다. GLB/BLEND 소스, V5 Bloom도 수정하지 않았다.

## 완료된 작업

### G2 — Tiger II Boss Spatial Contract Sync

Tiger II GLB를 3D 공간 참조로 측정하고 `TIGER_SPATIAL`을 R&D 기본 프리셋으로 설정했다. 기준은 Tiger II / Uniform ×2 / 28 gameplay units per GLB metre / 90° top-down authoring이다. 75°는 Three.js 표현 확인용이다. 2D HULL, TRACK_L/R, TURRET, ENGINE 판정 영역은 `spike/rnd_tiger_spatial.js`가 제공한다. CORE는 후방 내부 참조이며 active weakpoint나 damage mechanic이 아니다. 포탄·장갑·약점·궤도·차량 충돌의 권한은 계속 2D gameplay이다. 측정값, 이전 프리셋 비교, 판정 결과는 `Docs/G2_TIGER_BOSS_SPATIAL_SYNC_20260924.md`와 `Docs/g2_spatial/validation.json`에 있다.

### G3 — Canvas 2D Fallback Visual Sync

`spike/rnd_tiger_canvas.js`가 G2 측정 footprint와 현재 Boss transform을 읽어 차체, 궤도, 포탑, 긴 주포, 후방 엔진 덱을 Canvas에 그린다. 고정 정규화 다각형은 오직 외형에 사용하며 hit test에 연결하지 않는다. `G3 Canvas visual`로 이전 G2 사각형 외형과 비교할 수 있다. `Canvas visual outline`, G2 proxy, 3D 실측 visual reference를 함께 볼 수 있다. 상세 내용은 `Docs/THREEJS_GAMEPLAY_PHASE_G3_2D_FALLBACK_SYNC_20260924.md`, 검증은 `Docs/g3_canvas/validation.json`에 있다.

G3 적용 조건은 **Boss spatial preset = TIGER_SPATIAL**, **G3 Canvas visual = checked**, **2D 비교 모드**이다. 사용자가 `TIGER_REMAP`에서 G3 체크박스가 켜졌는데도 옛 외형을 본 사례가 있었다. 이후 화면 상태 문구가 실제 적용 여부와 필요한 프리셋을 표시하도록 수정했고, G2/G3 스크립트 URL에 버전을 붙여 브라우저 캐시 혼합을 줄였다. 3D 모드의 Tiger II GLB 형상은 G3에서 변경되지 않는다.

## 실행과 확인

1. `Launch_MultiAsset_RND.bat` 실행. 기존 탭이 오래되었으면 새 탭을 사용하거나 `Ctrl+F5`로 새로고침한다.
2. **Boss spatial preset → TIGER_SPATIAL**, **G3 Canvas visual 체크**, **2D 비교**를 선택한다.
3. 90°에서 Three ↔ Canvas 크기·중심·궤도·포탑 pivot·포신·ENGINE 위치를 확인한다. 75°는 Three.js presentation 확인용이다.
4. `node tests/test_g2_spatial.cjs`와 `node tests/test_g3_canvas.cjs`로 자동 검증한다. 로컬 `127.0.0.1:8765` 서버, Chrome, 저장소 테스트 파일의 Playwright 런타임 경로가 필요하다.
5. 현재 기록된 G3 자동 검증은 23/23 PASS, page error 0, G2 이전 HTML/G3 OFF/G3 ON의 240프레임 gameplay trace 동일이다. 전면·측면·후면·양쪽 궤도 피격, ENGINE HP 10→9, 차량 충돌 반경 105, Three/Canvas 전환, Focus, Bullet Time, Boss 발사, 재시작을 검사했다. 수동 플레이 감각과 최종 아트 판단은 **UNVERIFIED**다.

생성된 G2/G3 PNG 비교 화면은 NAS 작업 트리 `Docs/g2_spatial/`, `Docs/g3_canvas/`에 보존한다. 저장소 관례에 따라 PNG는 Git 추적 대상에서 제외하고 보고서·검증 JSON·재생성 테스트를 추적한다. GLB와 원본 전 백업도 로컬에 보존하며 Git에는 넣지 않는다.

## 다음 스레드의 판단 경계

G3 이후 Boss spatial alignment의 형상 작업을 임의로 늘리지 않는다. 사용자가 다음 중 방향을 검토·선택해야 한다.

1. 현재 temporary Tiger II Boss 유지
2. Original Core Boss 제작으로 전환
3. 이 spatial contract 방식을 정식 HTML Edition의 Hybrid integration 후보로 승격

선택 전에는 읽기·비교·문제 재현과 기술 설명만 진행한다. R&D 자동 PASS를 본편 승격이나 사람의 시각 승인으로 표현하지 않는다. 다른 저장소나 원본 3D 소스를 수정하려면 해당 범위의 명시적 요청과 계약을 다시 확인한다.