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
