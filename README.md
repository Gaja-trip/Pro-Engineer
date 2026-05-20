# Pro-Engineer

측량 및 지형공간정보 기술사 대비용 다중 페이지 학습 포털입니다.

## Pages

- `index.html`: 학습 대시보드
- `curriculum.html`: 생활 관찰형 커리큘럼
- `exams.html`: Q-net 과년도 문제 텍스트 변환 및 출제 분석
- `solutions.html`: 과년도 문제 풀이과정 훈련
- `missions.html`: 생활 속 미션 카드

## Q-net Data Sync

```bash
npm install
npm run sync:qnet
```

`sync:qnet`은 Q-net 기출문제(기술사) 자료실에서 측량및지형공간정보기술사 게시글을 검색하고, 2015~2026년 원문 첨부를 내려받아 `assets/js/exams-data.js`와 `sources/qnet-exams.json`을 생성합니다.
