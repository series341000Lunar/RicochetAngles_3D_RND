# RicochetAngles — Legacy Stage 1 Three.js Renderer Spike

## 판정

**시각화 레이어 구현 및 브라우저 기능 검증 완료. 실제 GPU의 60 FPS 성능 판정은 보류합니다.**

정식 HTML Edition/Unity Edition의 전환이나 변경이 아닙니다. 첨부된 Legacy 단일 HTML만 별도 결과물로 작성했습니다. 원본 파일은 보존했습니다.

## 1. 실행 파일과 사용법

`RicochetAngles_Legacy_ThreeJS_Spike.html`

- 다운로드한 HTML을 WebGL이 가능한 브라우저에서 여십시오.
- Three.js **0.160.1**을 고정 CDN URL에서 불러오므로 최초 로딩에 인터넷 연결이 필요합니다.
- W/S 이동, A/D 차체 회전, 마우스 조준, 좌클릭 발사, R 재시작, Tab 디버그는 원본과 같습니다.
- 우측 아래: **90° / 85° / 80°**, **그림자**, **2D 비교 / 3D 복귀**.
- 2D/3D 전환은 진행 중인 동일 게임 상태를 유지합니다.
- 로딩 실패 또는 WebGL 문맥 손실 시 Canvas 화면으로 돌아가며 상태 메시지를 표시합니다. 문맥 손실 후 복구는 새로고침을 사용하십시오.

## 2. 변경 사항

| 항목 | 처리 |
|---|---|
| 플레이어 | Box 차체·궤도, 8각 Cylinder 포탑, Box 포신·해치 |
| 적 | 원본에 존재하는 보스 1대, 차체·포탑 독립 회전 |
| 탄 | 기존 shell 상태의 위치·속도 방향을 읽는 작은 Sphere 기반 표현 |
| 장애물 | 원본 바위·전차 잔해를 primitive로 표현, 파괴 시 낮은 잔해로 표시 |
| 지면 | 월드 전체 크기의 Plane, 단순 도로·격자·경계 |
| 카메라 | Orthographic, 기본 90°, 원본 camera 위치·화면 흔들림 동기화 |
| 조명 | Hemisphere + Directional 1개, 월드 기준 방향 고정 |
| 그림자 | 1024² PCFSoftShadowMap, 수신 지면 및 전차/장애물 투사, OFF 가능 |
| Canvas | 약점·체력·점수·조준점·포격/주포 예고·연막·효과·승패 UI 유지 |
| 비교 | 원본 world drawing으로 즉시 전환 가능 |

좌표는 Game X → Three X, Game Y → Three Z, 높이 → Three Y입니다. 전방은 +X이며, 회전 부호를 반전하여 기존 angle/turretAngle과 맞춥니다. Hull 그룹과 TurretPivot은 TankRoot의 형제이므로 포탑에 차체 회전이 중복 적용되지 않습니다.

## 3. 기존 gameplay code의 변경 범위

**전투 및 업데이트 로직 변경 없음.**

게임 코드 시작부터 렌더링 구간 전까지는 `rendererSpike` 참조 선언 1개를 제외하면 원본과 텍스트가 일치합니다. 메인 프레임 업데이트 함수도 원본과 일치합니다. TUNING 값, 입력 이벤트, 이동, 발사, 충돌, 도탄/관통, HP, AI, 약점 순환, 승패, 재시작은 변경하지 않았습니다.

수정한 기존 함수는 **render()**입니다. 3D 사용 시 기존 drawGround/drawObstacles/drawTankBase/drawTurret/drawShells 호출만 건너뛰고 Three.js를 실행합니다. 그리기 함수 자체는 삭제하지 않아 2D 비교 및 실패 시 fallback에 사용합니다.

차체 방향 화살표, 장애물 HP, 보스 궤도 수리 시간은 원래 solid drawing에 섞여 있었으므로 `drawSpikeAnnotations()`에 시각 표시만 분리했습니다. CSS 레이어와 옵션 패널을 추가했습니다.

원본 SHA-256: `bf780b475ca148f1d3d3a2f70c44abb8a707c551f1c3d754af438cf86f86ec20`

## 4. 신규 Three.js 코드

HTML 하단의 독립 module script에 다음이 있습니다.

- Scene / OrthographicCamera / WebGLRenderer / 조명 / primitive 생성
- `syncPlayerVisual()`, `syncEnemyVisuals()`, `syncObstacleVisuals()`, `syncProjectileVisuals()`, `syncCamera()`
- 상태 객체를 키로 사용하는 시각 객체 대응표와 탄 mesh 재사용 풀
- 렌더러 통계, 그림자 옵션, 2D 비교, 실패 처리
- Three.js UUID 생성의 난수가 게임 난수 순서를 소비하지 않도록 동기 실행 범위에서 별도 시각 난수 사용 및 finally 복원

Three.js Raycast, mesh collision, physics engine, animation 기반 진행 판정은 없습니다. 렌더 어댑터는 게임 상태를 수정하지 않습니다.

## 5. 실제 실행 검증

### 환경과 방식

Chromium 153 headless + SwiftShader 소프트웨어 WebGL에서 실제 HTML을 실행했습니다. 로컬 파일 열기, 마우스/키보드 입력, 화면 캡처, WebGL 렌더링을 수행했습니다.

테스트 시 CDN 전송은 같은 고정 URL에서 내려받은 **실제 Three.js 0.160.1 모듈 바이트**로 응답했습니다. Three.js/WebGL을 가짜 구현으로 대체하지 않았습니다. 배포 파일에는 원래 CDN import가 유지되어 있습니다. 사용자 브라우저의 실제 CDN 통신 경로는 별도 확인 대상입니다.

| 검증 | 결과와 근거 |
|---|---|
| 이동 / 차체 회전 | 실제 W+D 입력으로 위치와 angle 변화 확인 |
| 독립 포탑 / 조준 | 마우스 이동으로 turretAngle 변화, Hull과 TurretPivot 각각 원본 각도 일치 |
| 발사 / 탄 이동 | 클릭 발사·reload·shell 생성 확인, 별도 시나리오에서 탄 적분과 실제 충돌 실행 |
| 충돌 / 장애물 | 탱크 겹침 해소 및 발사 탄의 장애물 HP 감소 확인 |
| Enemy AI | 동일 입력 재생 중 보스 주포 22회, 포격 이벤트 10회 확인 |
| HP / 관통 / 보스 진행 | 활성 약점 관통 → 엔진 노출 → 엔진 관통을 10회 반복, HP 10→0 및 폭주·승리 확인 |
| 패배 | 보스 탄의 실제 플레이어 충돌로 HP 5→0, lost 확인 |
| 도탄 | 원본 순수 계산 함수의 접선 입사 도탄 결과 확인. 모든 bank-shot 상황을 별도 전수 플레이한 것은 아님 |
| 재시작 | 키보드 R 및 scripted reset 후 playing / 플레이어 HP 5 / 보스 HP 10 확인 |
| 상태 보존 비교 | 동일 seed·입력·시간 간격으로 양쪽 7,200프레임 실행, 120프레임 간격의 60개 전체 상태 스냅샷 일치. 1,800프레임마다 재시작하여 4개 구간 비교 |
| Renderer read-only | render 전후 game 직렬화 동일, gameplay 난수 호출 추가 소비 0회 |
| Player / Enemy / Projectile | 기존 상태와 mesh X/Z 일치 |
| 카메라 / Canvas 정렬 | 90° 지면 기준 화면 좌표 오차 약 4.6×10⁻¹³ logical pixel, 카메라 추종·흔들림 동기화 확인 |
| 85° / 80° 지면 정렬 | 지면 투영 보정 후 약 1.7×10⁻¹³ logical pixel 오차. 높이 시차는 남음 |
| 화면 크기 변경 | 960×800에서 두 Canvas 사각형 동일, 화면 중앙 입력이 기존 640×360으로 매핑 |
| 조명 | 탱크 회전 후 DirectionalLight의 월드 방향 동일 |
| 그림자 | 실제 shadow map 생성, 투사 그림자 캡처 확인, ON/OFF 실행 |
| 중복 렌더 | 3D 실행 중 교체 대상 Legacy world drawing 호출 0회 |
| 실패 대응 | CDN 요청 차단 시 Legacy Canvas playing 유지 및 실패 메시지 확인 |
| 실행 오류 | 일반 실행 테스트 pageerror 0건 |

승패 검증은 브라우저 안에서 사격 위치를 통제하는 테스트 시나리오로 수행했습니다. 사람이 정상 조작만으로 처음부터 보스를 공략한 완주 테스트와는 구분합니다. 원본에는 다중 스테이지 진행기가 없으므로, 해당 항목은 보스의 약점/폭주/승리·패배 전환을 기준으로 검증했습니다.

### 성능

| 항목 | 관측 / 설정 |
|---|---|
| 초기 구간 scene object | 54개 표본 |
| mesh | 33개 표본, 탄 생성에 따라 증가 |
| 그림자 ON draw calls | 약 49회 표본, shadow pass 포함 |
| 그림자 OFF draw calls | 23회 표본, 탄 1개 포함 |
| geometry | 8개 표본 |
| renderer pixel ratio | 테스트 1.0 / 상한 1.5 |
| 내부 기본 렌더 크기 | 원본과 동일한 논리 1280×720, DPR 적용 |
| 실측 FPS | 소프트웨어 렌더링 약 11 FPS 표본 |

**60 FPS 합격으로 보고하지 않습니다.** 테스트 환경에서 낮은 FPS가 실제로 관측되었습니다. 이 결과만으로 일반 GPU에서의 성능이나 병목을 판정할 수 없으며, 사용자 PC에서 그림자 ON/OFF와 패널 FPS를 비교해야 합니다. 장시간 실제 GPU frame-time 측정은 미실시입니다.

## 6. 미해결 및 의도된 제한

1. **85°/80° 높이 시차:** 지면 좌표와 마우스 변환은 유지하지만, 높이 있는 포탑/포신과 지면 기준 Canvas 약점 사이에는 시차가 생깁니다. 정합성 기준은 90°입니다.
2. **Canvas 합성 순서:** 연막·경고·효과는 3D 전체 위에 합성됩니다. 원본의 일부 효과와 전차 사이의 앞뒤 순서를 픽셀 단위로 재현하지 않습니다.
3. **탄 가독성:** 원본의 차체 위 약점 접근 규칙을 유지하기 위해 탄 mesh는 depth test를 끄고 표시합니다. 물리적인 3D 높이/차폐 시뮬레이션이 아닙니다. 긴 원본 궤적은 작은 탄 primitive로 대체했습니다.
4. **Primitive:** 실제 차량 모델, 정확한 장갑 표면 및 콜라이더 실루엣과의 일치는 구현 범위 밖입니다. 파괴 표현도 잔해/Canvas 효과 수준입니다.
5. **성능:** 실제 GPU 60 FPS와 Firefox 등 다른 브라우저 실행은 미검증입니다.
6. **원본 제약 보존:** 화면 종횡비가 달라지면 원본과 같이 논리 1280×720이 CSS로 늘어납니다. 입력 이벤트의 원본 동작도 그대로입니다.
7. **폰트:** 검증용 Linux 환경에는 한글 폰트가 없어 캡처에서 일부 한글이 사각형으로 표시되었습니다. HTML 한글 데이터는 보존되어 있으며 폰트 파일은 추가하지 않았습니다.

## 7. GLB 투입 전 확인 사항 / 보정 제안

- 먼저 사용자 PC에서 **90°·그림자 ON으로 전투**, OFF와 성능 비교, 보스 격파 후 R 재시작을 확인하십시오.
- GLB의 전방 축·원점·단위·차체/포탑 피벗을 확정하십시오. 현재 어댑터의 +X 전방 및 독립 회전 계약을 유지하는 것이 우선입니다.
- 기존 2D 피격 영역과 모델 실루엣의 차이를 점검하십시오. 모델에 맞춰 전투 판정을 자동 변경하지 마십시오.
- 기울어진 시점을 채택하려면 약점·포구·조준 표시의 높이 정책을 먼저 결정하십시오. 90° 테스트 통과와 별도 단계로 취급하는 것이 적절합니다.
- 모델 material 수와 shadow 비용을 확인한 뒤 primitive만 교체하십시오. 이번 단계에서 새로운 전투·애셋 프레임워크를 추가할 필요는 없습니다.

API 참고: [Three.js 공식 문서](https://threejs.org/docs/). 결과물의 런타임 버전은 최신 버전 추종이 아닌 0.160.1 고정입니다.
