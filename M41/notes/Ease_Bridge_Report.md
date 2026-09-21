# Muzzle Bridge Micro Correction

1. 수정 파일: spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html. before_ease.html 백업 보존. GLB 및 게임 코드는 변경하지 않음.
2. Curve: ease-out cubic, eased = 1 - (1 - t)^3. Ease Bridge 기본 ON; OFF는 기존 Linear 비교.
3. Duration: 0.075초 유지. 방향별 예외 없음.
4. 비교: 동일 pose / 75° camera / 무산포 발사. 0, 16.67, 33.33, 50, 75, 100ms 표본. 시작점·75ms 종료점 동일. 33.33ms 잔여 위치 차이는 Linear 대비 약 69.1%, 50ms는 약 88.9% 감소.
5. CCW 85° / 90° / 95°: 중간 궤적 이탈 감소 확인. 90° 50ms: Linear 5.07px → Ease 0.56px.
6. CCW 265° / 275°: 동일한 잔여 이탈 감소 확인. 별도 각도 보정 없음.
7. 일반 0/45/135/180/225/315°: 시작·끝 일치, 유한 좌표, 보간 가중치의 overshoot 없음. 초기 접근 속도가 달라지는 것은 의도된 변화이며, 일반 플레이의 가속감에 대한 사용자 최종 시각 판단은 아직 미검증.
8. Deterministic regression: 동일 seed/input의 Linear/Ease 180프레임, 전체 gameplay snapshot 6개 모두 일치. 매 표본 render 전후 game JSON 동일. 기존 classic script 전체도 수정 전과 동일.
9. Collision / ricochet: 실제 10ms 장애물 충돌에서 HP 4→3, bridge 즉시 제거, hit 좌표 유지. 실제 도탄 count 1과 reflected shell visual 일치. Boss won, R, P, Shadow, 카메라 전환 회귀 통과. 80대 스트레스+발사 짧은 표본 60 FPS. pageerror 0.
10. 판단: KEEP — 기본 ease-out 유지, Linear 비교 옵션 보존. 수치적으로 보정 종료 근처 굴절 노출을 줄이며 gameplay 회귀 없음. 궤적 굴절 자체의 수학적 제거 또는 NORMAL PLAY 최종 시각 승인을 선언하지 않음.

카메라 각도는 확정하지 않았으며 기본 90°를 보존함.
측정 heading은 CCW이며 기존 clockwise gameplay angle에 음수로 변환함.
[곡선 비교 데이터](ease_curve_validation.json)
[충돌·스트레스 회귀](ease_regression.json)
