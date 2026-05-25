document.addEventListener("DOMContentLoaded", () => {
  const app = window.SurveyorApp;
  const data = app.getExamData();
  const exams = data.exams;
  const questions = app.allQuestions(exams);
  const latest = exams[0];

  const metrics = document.querySelector("[data-dashboard-metrics]");
  if (metrics) {
    metrics.innerHTML = [
      [`${exams.length}`, "2015~2026 수집 회차"],
      [`${questions.length}`, "구조화 문항"],
      [`${latest?.round ?? "-"}`, "Q-net 최신 회차"],
      [`${data.topics?.length ?? 0}`, "학습 주제 축"],
    ]
      .map(([value, label]) => `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`)
      .join("");
  }

  const todayBoard = document.querySelector("[data-today-board]");
  if (todayBoard) {
    todayBoard.innerHTML = `
      <div class="section-head">
        <div>
          <h2>오늘의 학습 보드</h2>
          <p>2026.05.25</p>
        </div>
      </div>
      <div class="board-metrics">
        <div><span>기본 강의</span><strong>2강</strong><i></i></div>
        <div><span>기출 문제</span><strong>5문제</strong><i></i></div>
        <div><span>답안 첨삭</span><strong>1건</strong><i></i></div>
        <div><span>Q&A 답변</span><strong>3건</strong><i></i></div>
      </div>
      <div class="recent-solve">
        <b>최근 풀이</b>
        <span>공간정보 표준과 품질관리 · 답안 구조 보완 필요</span>
        <a class="status-pill waiting" href="solutions.html">피드백 대기</a>
      </div>
    `;
  }

  const quick = document.querySelector("[data-hub-quick]");
  if (quick) {
    const items = [
      ["01", "기본 강의 자료", "이론 PDF, 요약 노트, 연계 기출을 단원별로 제공", "curriculum.html"],
      ["02", "회차별 기술사 문제", "회차·교시·과목·키워드 필터로 빠른 검색", "exams.html"],
      ["03", "기술사 문제풀이", "모범답안, 채점 기준, 내 답안 비교 학습", "solutions.html"],
      ["04", "자료실 · Q&A", "법령자료 다운로드와 질문 답변 관리", "resources.html"],
    ];

    quick.innerHTML = items
      .map(
        ([no, title, text, href]) => `
          <a class="hub-quick-card" href="${href}">
            <span>${no}</span>
            <h3>${app.escapeHTML(title)}</h3>
            <p>${app.escapeHTML(text)}</p>
          </a>
        `,
      )
      .join("");
  }

  const latestBox = document.querySelector("[data-latest-exams]");
  if (latestBox) {
    latestBox.innerHTML = exams
      .slice(0, 4)
      .map(
        (exam) => `
          <article class="timeline-item">
            <div class="step">제${exam.round}회</div>
            <div>
              <strong>${app.escapeHTML(exam.year)}년 ${app.escapeHTML(exam.sourceType)}</strong>
              <p style="margin:6px 0 0;color:var(--muted)">${exam.totalQuestions}문항 · ${app.escapeHTML(exam.postedAt)} 게시</p>
            </div>
          </article>
        `,
      )
      .join("");
  }

  const bars = document.querySelector("[data-topic-bars]");
  if (bars) {
    const topicLabels = data.analysis.topicLabels ?? {};
    const rows = Object.entries(data.analysis.topicTotals ?? {})
      .map(([topic, value]) => ({ label: topicLabels[topic] ?? topic, value }))
      .sort((a, b) => b.value - a.value);
    app.renderBars(bars, rows);
  }

  const missionBox = document.querySelector("[data-daily-mission]");
  if (missionBox) {
    const missions = window.LIFE_MISSIONS ?? [];
    const mission = missions[new Date().getDate() % missions.length];
    const module = app.moduleById(mission.module);
    missionBox.innerHTML = `
      <div class="tag-row">${app.topicPill(mission.module, module?.title ?? mission.module)}</div>
      <h3 style="margin:14px 0 8px">${app.escapeHTML(mission.place)}</h3>
      <p>${app.escapeHTML(mission.task)}</p>
      <p style="margin-top:12px;color:var(--muted)">${app.escapeHTML(mission.proof)}</p>
    `;
  }
});
