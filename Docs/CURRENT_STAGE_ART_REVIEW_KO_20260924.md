# ThreeJSDEV Current Stage — BG/ENV 제작 검토

**TECHNICAL WORK COMPLETE / USER REVIEW REQUIRED**

현재 하나의 Stage에서 기존 블록아웃 구역을 다듬었습니다. 내부 ENV01 이름은 기존 경로와 버튼 이름이며 별도 Stage가 아닙니다.

## 실행 / 편집 / 반영
1. 저장소의 **Launch_ENV01_Review.bat**를 실행하십시오. 기존 Blender 원본과 ThreeJSDEV 화면을 엽니다.
2. 브라우저만 확인하려면 [현재 Stage](http://127.0.0.1:8766/dcc00/html/testbed.html?mode=env01)를 여십시오. 서버가 꺼져 있으면 먼저 위 실행 파일을 사용하십시오.
3. Blender 편집 대상은 **dcc00/workspace/env01/authoring.blend**의 **ENV01_STATIC** 컬렉션입니다. 벽·벙커·지면·도로와 ENV_ART_로 시작하는 추가 디테일을 직접 편집할 수 있습니다.
4. 기존 floating editor의 **Export ENV-01 geometry.glb**(환경 GLB 내보내기)를 누르고 Blender 파일도 저장하십시오.
5. ThreeJSDEV의 **Reload map + GLB**(현재 맵과 환경 다시 읽기)를 누르십시오. 이번 아트 검토에 H5E import나 Stage Map export는 필요하지 않습니다.
6. **Environment slice**에서 제작 구역을 보고, **75° review / 90° alignment**로 전환하십시오. **Semantic reference**를 끄면 아트가 잘 보이고 켜면 기존 배치 기준을 비교할 수 있습니다.

## 수정 내용
- 지면에 흙 패치와 낮은 둔덕, 도로 가장자리와 끊어진 바퀴 자국.
- 기존 벽에 상단 슬래브·이음새·받침, 벙커에 출입부·총안 표현·지붕 테두리·환기구.
- 기존 원형 엄폐물에 모래주머니, 상자 간격과 띠·판자 표현, 드럼통 테두리.
- 낮은 석재 잔해, 정적인 파손 수레, 작은 돌과 성긴 풀.
- 첫 75° 렌더 확인 후 두 번째 Blender 수정·재export·같은 브라우저 Reload를 완료했습니다.
- 현재 맵 JSON 및 기존 비환경 데이터는 그대로입니다.

## 검토 화면
- [전체 Stage와 제작 구역 위치](../dcc00/test-output/art-production-20260924/current-stage-overview.png)
- [75° 아트 화면](../dcc00/test-output/art-production-20260924/current-stage-75.png)
- [90° 배치 기준 화면](../dcc00/test-output/art-production-20260924/current-stage-90-reference.png)
- [벽·벙커·소품 상세](../dcc00/test-output/art-production-20260924/current-stage-art-close.png)

화면은 로컬 NAS에 보존되어 있습니다. 다음을 직접 판단해 주십시오: **도로 폭, 지면 구도, 벽 높이, 벙커 크기, 소품 간격, 75° 가독성, 전장 밀도, 아트 방향, Blender → ThreeJSDEV 작업 감각**.

## 제한과 다음 작업
- 전체 14W Stage 중 기존 1550 × 1200 구역만 제작했습니다. 나머지는 기존 배치 기준입니다.
- 낮은 폴리곤과 단색 재질의 초기 아트입니다. 최종 텍스처/완성 아트나 성능 최적화 승인이 아닙니다.
- 화면의 ENV01 영문 UI는 기존 그대로입니다. 상세 이미지는 같은 화면의 확대용 크롭입니다.
- 정적 시각 메시이며 충돌·스폰·피해·트리거 등의 게임플레이 권한은 없습니다.
- 원본 .blend와 GLB, 이미지 및 백업은 저장소 정책상 Git 제외 로컬 파일입니다. 소스 제작 기록과 검증 문서는 Git에 보존됩니다.
- H5E 기능은 KEEP / HOLD / NOT USED, H5E UX는 PENDING / HOLD입니다. Mainline 연동은 하지 않았습니다.
- 사용자 검토 후 같은 Current Stage에서 크기·간격·밀도·아트 방향을 조정하고 주변 구역을 점진적으로 제작합니다. 새 기능이나 새 Stage를 전제로 하지 않습니다.
